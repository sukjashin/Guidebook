import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

loadEnv({ path: '.env.local', override: true, quiet: true });

const API_ROOT = 'https://generativelanguage.googleapis.com';
const pdfPath = new URL('../tmp/pdfs/2026-weather-observation-guide.pdf', import.meta.url);
const envPath = new URL('../.env.local', import.meta.url);
const apiKey = process.env.GEMINI_API_KEY?.trim();

if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.includes('여기에_')) {
  throw new Error('프로젝트의 .env.local 파일에 GEMINI_API_KEY를 먼저 입력해 주세요.');
}
if (!existsSync(pdfPath)) {
  throw new Error('원본 PDF가 없습니다. 먼저 npm run sync:guide를 실행해 주세요.');
}
if (process.env.GEMINI_FILE_SEARCH_STORE?.trim()) {
  console.log('이미 File Search 저장소가 등록되어 있습니다.');
  console.log(`GEMINI_FILE_SEARCH_STORE=${process.env.GEMINI_FILE_SEARCH_STORE.trim()}`);
  process.exit(0);
}

const parseResponse = async (response, label) => {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${label} 실패: JSON이 아닌 응답을 받았습니다. (HTTP ${response.status})`);
  }
  if (!response.ok) {
    const message = data?.error?.message || JSON.stringify(data);
    throw new Error(`${label} 실패: ${message} (HTTP ${response.status})`);
  }
  return data;
};

console.log('1/4 File Search 저장소를 생성합니다...');
const createResponse = await fetch(`${API_ROOT}/v1beta/fileSearchStores?key=${encodeURIComponent(apiKey)}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    displayName: '2026-weather-observation-standardization-guide',
    embeddingModel: 'models/gemini-embedding-2',
  }),
});
const store = await parseResponse(createResponse, '저장소 생성');
if (!store.name?.startsWith('fileSearchStores/')) {
  throw new Error('생성된 File Search 저장소 이름을 확인할 수 없습니다.');
}

console.log('2/4 PDF 업로드를 준비합니다...');
const fileInfo = await stat(pdfPath);
const startResponse = await fetch(
  `${API_ROOT}/upload/v1beta/${store.name}:uploadToFileSearchStore?key=${encodeURIComponent(apiKey)}`,
  {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(fileInfo.size),
      'X-Goog-Upload-Header-Content-Type': 'application/pdf',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      displayName: '2026 기상관측표준화 업무가이드.pdf',
      chunkingConfig: {
        whiteSpaceConfig: {
          maxTokensPerChunk: 500,
          maxOverlapTokens: 80,
        },
      },
    }),
  },
);
if (!startResponse.ok) await parseResponse(startResponse, '업로드 준비');
const uploadUrl = startResponse.headers.get('x-goog-upload-url');
if (!uploadUrl) throw new Error('Google에서 PDF 업로드 주소를 받지 못했습니다.');

console.log(`3/4 PDF를 업로드합니다... (${(fileInfo.size / 1024 / 1024).toFixed(1)}MB)`);
const pdfBytes = await readFile(pdfPath);
const uploadResponse = await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    'Content-Length': String(fileInfo.size),
    'X-Goog-Upload-Offset': '0',
    'X-Goog-Upload-Command': 'upload, finalize',
    'Content-Type': 'application/pdf',
  },
  body: pdfBytes,
  duplex: 'half',
});
let operation = await parseResponse(uploadResponse, 'PDF 업로드');
if (!operation.name) throw new Error('PDF 색인 작업 번호를 받지 못했습니다.');

console.log('4/4 PDF를 분석하고 검색 색인을 생성합니다...');
while (!operation.done) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const operationResponse = await fetch(
    `${API_ROOT}/v1beta/${operation.name}?key=${encodeURIComponent(apiKey)}`,
  );
  operation = await parseResponse(operationResponse, '색인 상태 확인');
}
if (operation.error) {
  throw new Error(`검색 색인 생성 실패: ${operation.error.message || JSON.stringify(operation.error)}`);
}

const existingEnv = existsSync(envPath) ? await readFile(envPath, 'utf8') : '';
const cleanEnv = existingEnv
  .split(/\r?\n/)
  .filter((line) => !line.startsWith('GEMINI_FILE_SEARCH_STORE='))
  .join('\n')
  .replace(/\n*$/, '\n');
await writeFile(envPath, `${cleanEnv}GEMINI_FILE_SEARCH_STORE=${store.name}\n`, 'utf8');

console.log('\nFile Search 등록이 완료되었습니다.');
console.log(`GEMINI_FILE_SEARCH_STORE=${store.name}`);
console.log('위 값을 Vercel 환경변수에도 동일하게 등록해 주세요.');
