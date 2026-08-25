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

## 로컬 실행

1. `npm install`
2. `.env.local`에 `GEMINI_API_KEY` 설정
3. `npm run dev`

Vercel 함수 환경까지 그대로 시험하려면 Vercel CLI의 `vercel dev`를 사용합니다.
