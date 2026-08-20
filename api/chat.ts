import { GoogleGenAI } from '@google/genai';
import { retrieveGuidePassages } from '../server/guideSearch';

export const maxDuration = 60;

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

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json() as { message?: unknown };
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return json({ error: '질문을 입력해 주세요.' }, 400);
    if (message.length > 2000) return json({ error: '질문은 2,000자 이내로 입력해 주세요.' }, 413);

    const passages = retrieveGuidePassages(message);
    if (passages.length === 0) {
      return json({ reply: NOT_FOUND_REPLY, sources: [], suggestedQuestions: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return json({ error: 'Vercel 환경변수 GEMINI_API_KEY가 설정되지 않았습니다.' }, 503);
    }

    const context = passages
      .map((passage) => `[업무가이드 p.${passage.page}]\n${passage.text}`)
      .join('\n\n---\n\n');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
      contents: `사용자 질문:\n${message}\n\n검색된 업무가이드 문단:\n${context}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        topP: 0.9,
        maxOutputTokens: 900,
      },
    });
    const reply = response.text?.trim();
    if (!reply) return json({ reply: NOT_FOUND_REPLY, sources: [], suggestedQuestions: [] });

    return json({
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
    return json({ error: '답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, 500);
  }
}

export function GET() {
  return json({ status: 'ok', service: 'Guidebook PDF RAG chatbot' });
}
