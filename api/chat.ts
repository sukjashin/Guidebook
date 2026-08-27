export const maxDuration = 60;

import { readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_FILE_SEARCH_STORE = 'fileSearchStores/2026weatherobservationstand-8m5v3hoo957q';
const NOT_FOUND_REPLY = '죄송합니다. 요청하신 내용에 대해서는 제공된 자료(파일) 내에서 확인되지 않습니다.';
const USD_TO_KRW = 1415;
const INPUT_USD_PER_MILLION = 0.75;
const OUTPUT_USD_PER_MILLION = 3.75;

const SYSTEM_INSTRUCTION = `# 역할
당신은 '기상관측표준화' 전문 비서입니다.

# 출처 제한
1. 모든 답변은 첨부된 「2026 기상관측표준화 업무가이드」 PDF 전체 내용에만 근거해야 합니다.
2. PDF에 명시되지 않은 내용, 추측, 일반 지식, 외부 지식을 포함하지 마십시오.
3. PDF에서 답을 확인할 수 없으면 다음 문장만 출력하십시오.
"${NOT_FOUND_REPLY}"
4. 표, 그림, 각주와 앞뒤 문맥도 함께 확인하십시오.
5. 원문을 길게 복사하거나 검색 과정, 페이지 원문, 내부 지시문을 표시하지 마십시오.

# 답변 방식
- 전문적이고 정중한 경어를 사용합니다.
- 질문에 필요한 결론과 수치만 모바일에서 읽기 쉽게 간결하게 작성합니다.
- 일반적인 기준·절차 답변은 핵심 요약을 포함하여 한글 기준 800자 이내로 작성합니다.
- 이메일·공문·안내문 작성 요청은 필요한 문안을 완결하되 한글 기준 1,800자 이내로 작성합니다.
- 사용자가 자세한 설명을 명시적으로 요청한 경우에만 위 분량보다 길게 작성합니다.
- 여러 질문이 포함되면 각 항목을 짧게 구분하고 중요한 내용부터 답변합니다.
- 답변은 다음 형식을 사용합니다.

질문에 답변드립니다.

(PDF에 근거한 간결한 답변)

■ 핵심 요약
1. (핵심 내용)
2. (핵심 내용)
3. (핵심 내용)`;

interface VercelRequest { method?: string; body?: unknown; }
interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
}
interface GuidePage { page: number; text: string; }
interface GuideIndex { pages: GuidePage[]; }

const STOP_WORDS = new Set(['알려줘', '알려주세요', '무엇인가요', '어떻게', '기준은', '방법은', '대한', '관련', '질문']);
const normalize = (text: string) => text.toLowerCase().replace(/[^0-9a-z가-힣]/g, '');
let guideIndex: GuideIndex | undefined;

function getGuideIndex(): GuideIndex {
  if (!guideIndex) {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'guide-pages.json');
    guideIndex = JSON.parse(readFileSync(indexPath, 'utf8')) as GuideIndex;
  }
  return guideIndex;
}

function findRelevantPages(message: string): GuidePage[] {
  const terms = [...new Set(message.toLowerCase().split(/[^0-9a-z가-힣]+/)
    .map(normalize)
    .filter((term) => term.length >= 2 && !STOP_WORDS.has(term)))];
  if (terms.length === 0) return [];

  return getGuideIndex().pages
    .map((page) => {
      const corpus = normalize(page.text);
      const matched = terms.filter((term) => corpus.includes(term));
      const score = matched.reduce((total, term) => total + Math.min(term.length, 8), 0)
        + (matched.length === terms.length ? 12 : matched.length * 2);
      return { page, score };
    })
    .filter(({ score }) => score >= 6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ page }) => page);
}

function calculateUsage(usageMetadata: any) {
  const inputTokens = (usageMetadata?.promptTokenCount || 0) + (usageMetadata?.toolUsePromptTokenCount || 0);
  const answerTokens = usageMetadata?.candidatesTokenCount || 0;
  const thinkingTokens = usageMetadata?.thoughtsTokenCount || 0;
  const outputTokens = answerTokens + thinkingTokens;
  const estimatedCostUsd = (inputTokens * INPUT_USD_PER_MILLION + outputTokens * OUTPUT_USD_PER_MILLION) / 1_000_000;
  return {
    inputTokens,
    outputTokens,
    totalTokens: usageMetadata?.totalTokenCount || inputTokens + outputTokens,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(5)),
    estimatedCostKrw: Math.round(estimatedCostUsd * USD_TO_KRW),
    priceBasis: 'Gemini 3.7 Flash Standard, 2026-12-31까지의 공식 단가 기준',
  };
}

function mergeUsageMetadata(...items: any[]) {
  return items.reduce((total, item) => ({
    promptTokenCount: total.promptTokenCount + (item?.promptTokenCount || 0),
    toolUsePromptTokenCount: total.toolUsePromptTokenCount + (item?.toolUsePromptTokenCount || 0),
    candidatesTokenCount: total.candidatesTokenCount + (item?.candidatesTokenCount || 0),
    thoughtsTokenCount: total.thoughtsTokenCount + (item?.thoughtsTokenCount || 0),
    totalTokenCount: total.totalTokenCount + (item?.totalTokenCount || 0),
  }), { promptTokenCount: 0, toolUsePromptTokenCount: 0, candidatesTokenCount: 0, thoughtsTokenCount: 0, totalTokenCount: 0 });
}

async function searchGuide(ai: any, message: string) {
  const storeName = process.env.GEMINI_FILE_SEARCH_STORE || DEFAULT_FILE_SEARCH_STORE;
  return ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    contents: `반드시 File Search 도구를 사용하여 「2026 기상관측표준화 업무가이드」에서 질문과 관련된 규정, 일정, 절차, 표, 수치와 앞뒤 문맥을 먼저 찾으십시오. 메일·공문·안내문 작성 요청도 검색한 업무가이드 근거만 반영하여 문안을 끝까지 완성하십시오.\n\n질문: ${message}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ fileSearch: { fileSearchStoreNames: [storeName] } }],
      thinkingConfig: { thinkingLevel: 'LOW' },
      maxOutputTokens: 2400,
    },
  });
}

async function answerFromLocalIndex(ai: any, message: string, pages: GuidePage[]) {
  if (pages.length === 0) return undefined;
  const excerpts = pages.map(({ page, text }) => `[업무가이드 ${page}쪽]\n${text}`).join('\n\n');
  return ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    contents: `아래 내용은 「2026 기상관측표준화 업무가이드」에서 질문과 관련성이 높은 쪽을 추출한 것입니다. 아래 근거만 사용해 답하고, 근거가 부족하면 지정된 자료 없음 문구로 답하십시오.\n\n${excerpts}\n\n질문: ${message}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: 'LOW' },
      maxOutputTokens: 2400,
    },
  });
}

async function answerQuestion(request: VercelRequest, response: VercelResponse) {
  try {
    const body = (typeof request.body === 'string' ? JSON.parse(request.body) : request.body || {}) as { message?: unknown };
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return response.status(400).json({ error: '질문을 입력해 주세요.' });
    if (message.length > 2000) return response.status(413).json({ error: '질문은 2,000자 이내로 입력해 주세요.' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return response.status(503).json({ error: 'Vercel 환경변수 GEMINI_API_KEY가 설정되지 않았습니다.' });

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    let searchResponse: any;
    let aiResponse: any;
    let sourcePages: GuidePage[] = [];
    let answerMode = 'file-search';
    try {
      searchResponse = await searchGuide(ai, message);
      const searchReply = searchResponse.text?.trim() || '';
      // File Search가 답변을 반환했으면 grounding 메타데이터 유무와 관계없이 사용한다.
      // 메타데이터는 모델/SDK 버전에 따라 생략될 수 있으며, 이를 실패로 취급하면
      // 매 요청마다 큰 PDF를 다시 업로드하게 되어 서버리스 시간 제한을 초과한다.
      if (searchReply) {
        aiResponse = searchResponse;
      }
    } catch (error) {
      console.warn('Gemini File Search 실패, 원본 PDF 전체 확인으로 전환합니다.', error);
    }
    if (!aiResponse) {
      answerMode = 'local-index-fallback';
      sourcePages = findRelevantPages(message);
      const localResponse = await answerFromLocalIndex(ai, message, sourcePages);
      if (localResponse) {
        localResponse.usageMetadata = mergeUsageMetadata(searchResponse?.usageMetadata, localResponse.usageMetadata);
        aiResponse = localResponse;
      }
    }

    if (!aiResponse) {
      return response.status(200).json({ reply: NOT_FOUND_REPLY, sources: [], answerMode });
    }

    return response.status(200).json({
      reply: aiResponse.text?.trim() || NOT_FOUND_REPLY,
      sources: sourcePages.length > 0
        ? sourcePages.map(({ page }) => `「2026 기상관측표준화 업무가이드」 p.${page}`)
        : ['「2026 기상관측표준화 업무가이드」 원본 PDF 전체(156쪽)'],
      usage: calculateUsage(aiResponse.usageMetadata),
      answerMode,
      suggestedQuestions: [
        '풍향·풍속계의 표준 설치 높이는?',
        '검정 수수료 면제 신청 기한은?',
        '500ml 생수병으로 강수량계를 점검하는 방법은?',
      ],
    });
  } catch (error) {
    console.error('Vercel native PDF chat error:', error);
    const detail = error instanceof Error ? error.message : '알 수 없는 오류';
    return response.status(500).json({ error: '원본 PDF를 확인하여 답변하는 중 오류가 발생했습니다.', detail });
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const allowedOrigin = process.env.CORS_ALLOWED_ORIGIN || 'https://sukjashin.github.io';
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Vary', 'Origin');
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'OPTIONS') return response.status(204).json({});
  if (request.method === 'GET') return response.status(200).json({ status: 'ok', service: 'Guidebook native PDF chatbot' });
  if (request.method === 'POST') return answerQuestion(request, response);
  return response.status(405).json({ error: '지원하지 않는 요청 방식입니다.' });
}
