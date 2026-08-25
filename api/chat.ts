export const maxDuration = 60;

const DRIVE_FILE_ID = '1mKGsdUcqDWuKhhFvduSwy9RAy46G36Ns';
const DRIVE_DOWNLOAD_URL = `https://drive.usercontent.google.com/download?id=${DRIVE_FILE_ID}&export=download&confirm=t`;
const GUIDE_DISPLAY_NAME = '2026 기상관측표준화 업무가이드.pdf';
const DEFAULT_GUIDE_FILE_NAME = 'files/z36jgfed8tbx';
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
interface ReusableGuideFile { name: string; uri: string; mimeType: string; }

let guideFilePromise: Promise<ReusableGuideFile> | undefined;

async function findOrUploadGuideFile(ai: any): Promise<ReusableGuideFile> {
  const savedFileName = process.env.GEMINI_GUIDE_FILE || DEFAULT_GUIDE_FILE_NAME;
  try {
    const file = await ai.files.get({ name: savedFileName });
    const expiresAt = file.expirationTime ? Date.parse(file.expirationTime) : 0;
    if (file.state === 'ACTIVE' && file.name && file.uri && expiresAt > Date.now() + 300_000) {
      return { name: file.name, uri: file.uri, mimeType: file.mimeType || 'application/pdf' };
    }
  } catch (error) {
    console.warn('저장된 Gemini PDF를 재사용할 수 없어 다시 업로드합니다.', error);
  }

  const driveResponse = await fetch(DRIVE_DOWNLOAD_URL);
  if (!driveResponse.ok) throw new Error(`Google Drive PDF 다운로드 실패 (HTTP ${driveResponse.status})`);
  const pdfBytes = await driveResponse.arrayBuffer();
  if (new TextDecoder('ascii').decode(pdfBytes.slice(0, 5)) !== '%PDF-') {
    throw new Error('Google Drive에서 PDF 형식이 아닌 응답을 받았습니다.');
  }

  let uploaded = await ai.files.upload({
    file: new Blob([pdfBytes], { type: 'application/pdf' }),
    config: { mimeType: 'application/pdf', displayName: GUIDE_DISPLAY_NAME },
  });
  for (let attempt = 0; uploaded.state === 'PROCESSING' && attempt < 22; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    uploaded = await ai.files.get({ name: uploaded.name });
  }
  if (uploaded.state !== 'ACTIVE' || !uploaded.name || !uploaded.uri) {
    throw new Error(`Gemini PDF 준비 실패 (상태: ${uploaded.state || '알 수 없음'})`);
  }
  return { name: uploaded.name, uri: uploaded.uri, mimeType: uploaded.mimeType || 'application/pdf' };
}

function getGuideFile(ai: any) {
  if (!guideFilePromise) {
    guideFilePromise = findOrUploadGuideFile(ai).catch((error) => {
      guideFilePromise = undefined;
      throw error;
    });
  }
  return guideFilePromise;
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

async function readFullGuide(ai: any, message: string) {
  const { ThinkingLevel, createPartFromUri } = await import('@google/genai');
  const guideFile = await getGuideFile(ai);
  return ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    contents: [{ role: 'user', parts: [
      createPartFromUri(guideFile.uri, guideFile.mimeType),
      { text: `첨부된 업무가이드 PDF 전체를 확인하여 다음 질문에 답변하십시오.\n\n질문: ${message}` },
    ] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
    let answerMode = 'file-search';
    try {
      searchResponse = await searchGuide(ai, message);
      const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const searchReply = searchResponse.text?.trim() || '';
      if (groundingChunks.length > 0 && searchReply && searchReply !== NOT_FOUND_REPLY) {
        aiResponse = searchResponse;
      }
    } catch (error) {
      console.warn('Gemini File Search 실패, 원본 PDF 전체 확인으로 전환합니다.', error);
    }
    if (!aiResponse) {
      answerMode = 'full-pdf-fallback';
      const fullResponse = await readFullGuide(ai, message);
      fullResponse.usageMetadata = mergeUsageMetadata(searchResponse?.usageMetadata, fullResponse.usageMetadata);
      aiResponse = fullResponse;
    }

    return response.status(200).json({
      reply: aiResponse.text?.trim() || NOT_FOUND_REPLY,
      sources: ['「2026 기상관측표준화 업무가이드」 원본 PDF 전체(156쪽)'],
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
