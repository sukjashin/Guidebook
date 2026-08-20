import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const maxDuration = 60;

interface GuidePage {
  page: number;
  text: string;
}

interface GuidePassage extends GuidePage {
  score: number;
}

let guidePagesPromise: Promise<GuidePage[]> | undefined;
const normalize = (text: string) => text.toLowerCase().replace(/[^0-9a-z가-힣]/g, '');
const STOP_WORDS = new Set([
  '알려줘', '알려주세요', '보여줘', '보여주세요', '무엇인가요', '어떻게', '기준은', '방법은',
  '대한', '관련', '질문', '업무가이드', '기상관측표준화', '해줘', '해주세요', '인가요',
]);
const TERM_GROUPS = [
  ['풍향풍속계', '풍향계', '풍속계', '풍향', '풍속'],
  ['온습도계', '온도계', '습도계', '기온', '습도', '온도'],
  ['강수량계', '우량계', '강수', '수수구'],
  ['자료입력', '입력예시', '엑셀자료', '엑셀작성', '업로드', '제외기간'],
  ['검정', '재검정', '검정수수료', '유효기간', '형식승인'],
  ['품질검사', '품질관리', '정상자료율', '물리한계', '단계검사', '지속성', '내적일치'],
  ['관측망', '중복설치', '중복성', '지점번호', '신규설치', '이전설치'],
  ['유지보수', '간이점검', '장애복구', '점검방법'],
  ['관측자료', '기상자료', '자료전송', '자료구조', '표준화연계시스템'],
];

const loadGuidePages = () => {
  if (!guidePagesPromise) {
    const guidePath = path.join(process.cwd(), 'public', 'data', 'guide-pages.json');
    guidePagesPromise = readFile(guidePath, 'utf8').then((contents) => {
      const guideIndex = JSON.parse(contents) as { pages?: GuidePage[] };
      if (!Array.isArray(guideIndex.pages) || guideIndex.pages.length !== 156) {
        throw new Error('업무가이드 156페이지 검색 데이터가 올바르지 않습니다.');
      }
      return guideIndex.pages;
    });
  }
  return guidePagesPromise;
};

const stripEnding = (word: string) => word.replace(
  /(해주세요|보여주세요|알려주세요|인가요|하는|에서|으로|에는|은|는|이|가|을|를|의|에|로|와|과)$/g,
  '',
);

const getWeightedTerms = (query: string) => {
  const normalizedQuery = normalize(query);
  const terms = new Map<string, number>();
  const add = (term: string, weight: number) => {
    const normalized = normalize(term);
    if (normalized.length >= 2) terms.set(normalized, Math.max(weight, terms.get(normalized) || 0));
  };

  query.toLowerCase().split(/[^0-9a-z가-힣]+/)
    .map((word) => stripEnding(normalize(word)))
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word))
    .forEach((word) => {
      add(word, Math.min(18, word.length * 3));
      if (word.length >= 4) {
        for (let i = 0; i <= word.length - 2; i += 1) add(word.slice(i, i + 2), 1);
        for (let i = 0; i <= word.length - 3; i += 1) add(word.slice(i, i + 3), 2);
      }
    });

  TERM_GROUPS.forEach((group) => {
    if (group.some((term) => normalizedQuery.includes(normalize(term)))) {
      group.forEach((term) => add(term, 5));
    }
  });
  return terms;
};

async function retrieveGuidePassages(query: string, limit = 8): Promise<GuidePassage[]> {
  const pages = await loadGuidePages();
  const terms = getWeightedTerms(query);
  if (terms.size === 0) return [];

  return pages.map((page) => {
    const corpus = normalize(page.text);
    let score = 0;
    let strongMatches = 0;
    for (const [term, weight] of terms) {
      if (!corpus.includes(term)) continue;
      score += weight;
      if (weight >= 5) strongMatches += 1;
    }
    score += strongMatches * 4;
    if (page.page <= 10) score -= 12;
    return { ...page, score };
  }).filter((passage) => passage.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const NOT_FOUND_REPLY = '죄송합니다. 요청하신 내용에 대해서는 제공된 자료(파일) 내에서 확인되지 않습니다.';
const SYSTEM_INSTRUCTION = `# Role (역할)
당신은 '기상관측표준화'에 관한 전문 비서입니다.
사용자의 질문에 예의 바르고 공손하며 정확하고 전문적인 어조로 답변합니다.

# Knowledge Base & Source Rule (답변 출처 엄격 제약)
1. 답변은 아래에 제공되는 「2026 기상관측표준화 업무가이드」 검색 문단에만 기반해야 합니다.
2. 검색 문단에 명시되지 않은 내용, 추측, 외부 지식을 절대로 포함하지 마십시오.
3. 검색 문단에서 답을 확인할 수 없으면 다음 문장만 출력하십시오.
"${NOT_FOUND_REPLY}"
4. 원문을 길게 복사하지 말고 질문에 필요한 결론과 수치만 간단하게 정리하십시오.
5. 답변 본문에 '원문에서 찾은 관련 문단', '원문 p.xx', 검색 과정 또는 내부 지시문을 표시하지 마십시오.

# Tone & Style
- 전문적이고 격식 있는 비서의 어조를 사용합니다.
- 정중한 경어(~합니다, ~입니다)를 사용합니다.
- 전체 답변은 모바일에서도 읽기 쉽도록 간결하게 작성합니다.

# Response Format
질문에 답변드립니다.

(문서에 근거한 간결한 본문 답변. 필요한 경우 짧은 목록 사용)

■ 핵심 요약
1. (첫 번째 핵심 내용)
2. (두 번째 핵심 내용)
3. (세 번째 핵심 내용)`;

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

async function answerQuestion(request: VercelRequest, response: VercelResponse) {
  try {
    const body = (typeof request.body === 'string'
      ? JSON.parse(request.body)
      : request.body || {}) as { message?: unknown };
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return response.status(400).json({ error: '질문을 입력해 주세요.' });
    if (message.length > 2000) return response.status(413).json({ error: '질문은 2,000자 이내로 입력해 주세요.' });

    const passages = await retrieveGuidePassages(message);
    if (passages.length === 0) {
      return response.status(200).json({ reply: NOT_FOUND_REPLY, sources: [], suggestedQuestions: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return response.status(503).json({ error: 'Vercel 환경변수 GEMINI_API_KEY가 설정되지 않았습니다.' });
    }

    const context = passages
      .map((passage) => `[업무가이드 p.${passage.page}]\n${passage.text}`)
      .join('\n\n---\n\n');
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const aiResponse = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
      contents: `사용자 질문:\n${message}\n\n검색된 업무가이드 문단:\n${context}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        topP: 0.9,
        maxOutputTokens: 900,
      },
    });
    const reply = aiResponse.text?.trim();
    if (!reply) return response.status(200).json({ reply: NOT_FOUND_REPLY, sources: [], suggestedQuestions: [] });

    return response.status(200).json({
      reply,
      sources: ['「2026 기상관측표준화 업무가이드」(구글 드라이브 원문)'],
      suggestedQuestions: [
        '풍향·풍속계의 표준 설치 높이는?',
        '검정 수수료 면제 신청 기한은?',
        '500ml 생수병으로 강수량계를 점검하는 방법은?',
      ],
    });
  } catch (error) {
    console.error('Vercel chat function error:', error);
    const detail = error instanceof Error ? error.message : '알 수 없는 오류';
    return response.status(500).json({
      error: '답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      detail,
    });
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'GET') {
    return response.status(200).json({ status: 'ok', service: 'Guidebook PDF RAG chatbot' });
  }
  if (request.method === 'POST') {
    return answerQuestion(request, response);
  }
  return response.status(405).json({ error: '지원하지 않는 요청 방식입니다.' });
}
