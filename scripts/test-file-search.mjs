import { config as loadEnv } from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

loadEnv({ path: '.env.local', override: true, quiet: true });

const apiKey = process.env.GEMINI_API_KEY?.trim();
const storeName = process.env.GEMINI_FILE_SEARCH_STORE?.trim();
if (!apiKey || !storeName) throw new Error('GEMINI_API_KEY와 GEMINI_FILE_SEARCH_STORE가 필요합니다.');

const question = process.argv.slice(2).join(' ').trim()
  || '풍향·풍속계를 옥상에 설치할 때 표준 높이와 장애물 이격거리 기준은 무엇입니까?';
const ai = new GoogleGenAI({ apiKey });
const startedAt = Date.now();
const response = await ai.models.generateContent({
  model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
  contents: `반드시 File Search 도구를 사용하여 「2026 기상관측표준화 업무가이드」에서 관련 규정, 일정, 절차와 수치를 먼저 찾고 질문에 끝까지 답변하십시오.\n\n질문: ${question}`,
  config: {
    tools: [{ fileSearch: { fileSearchStoreNames: [storeName] } }],
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    maxOutputTokens: 2400,
  },
});

const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
console.log(JSON.stringify({
  elapsedMs: Date.now() - startedAt,
  reply: response.text,
  usage: response.usageMetadata,
  groundingCount: groundingChunks.length,
  pages: groundingChunks.map((chunk) => chunk.retrievedContext?.pageNumber).filter(Boolean),
}, null, 2));
