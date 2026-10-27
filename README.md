# 기상관측표준화 업무가이드 챗봇

「2026 기상관측표준화 업무가이드」를 검색하고 Gemini로 답변하는 React/Vite 챗봇입니다.

## 배포 구조

GitHub Pages는 정적 파일만 제공하므로 `/api/chat`을 실행할 수 없습니다. 챗봇을 사용하려면 프런트는 GitHub Pages에, API는 Vercel에 배포한 뒤 두 주소를 연결해야 합니다.

### 1. Vercel API 배포

1. 이 저장소를 Vercel 프로젝트로 가져옵니다.
2. Environment Variables에 다음 값을 설정합니다.
   - `GEMINI_API_KEY`: Google AI Studio에서 발급한 API 키
   - `GEMINI_MODEL`: 사용할 모델(선택)
   - `CORS_ALLOWED_ORIGIN`: `https://sukjashin.github.io`
3. 배포 후 `https://<프로젝트>.vercel.app/api/chat`에 접속해 상태 JSON이 표시되는지 확인합니다.

### 2. GitHub Pages와 API 연결

GitHub 저장소의 **Settings > Secrets and variables > Actions > Variables**에서 다음 Repository variable을 추가합니다.

- 이름: `VITE_CHAT_API_URL`
- 값: `https://guidebook-sage.vercel.app/api/chat`

그 후 Actions의 **Deploy to GitHub Pages** 워크플로를 다시 실행합니다. 이 값은 공개 API 주소이며 Gemini API 키가 아닙니다. `GEMINI_API_KEY`는 Vercel에만 저장해야 합니다.

## 검색 인덱스 갱신

`public/data/guide-pages.json`은 저장소에 커밋된 파일을 GitHub Pages와 Vercel이 함께 사용합니다. 빌드 중에는 다시 생성하지 않습니다.

1. `npm run sync:guide`를 실행합니다. 본편 PDF가 없으면 Google Drive에서 내려받고, `guide-pages.json`에는 본편 업무가이드만 포함합니다.
2. 변경된 `guide-pages.json`을 커밋합니다.

## Gemini File Search 문서 등록

File Search 저장소에는 `tmp/pdfs/2026-weather-observation-guide.pdf` 한 파일만 등록합니다. 다른 PDF는 업로드하지 않습니다.

1. `npm run sync:guide`를 실행해 본편 PDF를 `tmp/pdfs/2026-weather-observation-guide.pdf`에 준비합니다.
2. `.env.local`에 `GEMINI_API_KEY`와 `GEMINI_MODEL`(선택)을 설정합니다.
3. `npm run setup:file-search -- --force`를 실행해 본편 PDF만 포함하는 새 저장소를 생성합니다.
4. 출력된 `GEMINI_FILE_SEARCH_STORE` 값을 Vercel 환경변수에 등록하고 API를 다시 배포합니다.

새 저장소를 만들면 챗봇은 그 저장소 하나만 사용합니다. 이전 저장소는 자동 삭제되지 않으므로, 더 이상 필요하지 않은 이전 저장소는 Google AI Studio에서 별도로 삭제해야 합니다.

## 로컬 실행

1. `npm install`
2. `.env.local`에 `GEMINI_API_KEY` 설정
3. `npm run dev`

Vercel 함수 환경까지 그대로 시험하려면 Vercel CLI의 `vercel dev`를 사용합니다.
