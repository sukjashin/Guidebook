# 기상관측표준화 업무가이드 챗봇

구글 드라이브의 「2026 기상관측표준화 업무가이드」 156페이지 검색 색인과 Gemini를 연결한 문서 기반 챗봇입니다.

## Vercel 배포

1. Vercel에서 GitHub 저장소를 가져옵니다.
2. Framework Preset은 `Vite`를 선택합니다.
3. Vercel 프로젝트의 **Settings > Environment Variables**에 다음 값을 추가합니다.
   - `GEMINI_API_KEY`: Google AI Studio에서 발급한 API 키
   - `GEMINI_MODEL`: `gemini-3.7-flash` (선택 사항)
4. **Deploy**를 실행합니다. `vercel.json`에 빌드 명령과 출력 폴더가 설정되어 있습니다.

API 키는 `.env` 파일이나 GitHub 저장소에 커밋하지 마세요.

## 로컬 실행

1. `npm install`
2. `.env.local`에 `GEMINI_API_KEY` 설정
3. 화면과 기존 Express 서버 실행: `npm run dev`

Vercel API 함수까지 로컬에서 시험하려면 Vercel CLI로 `vercel dev`를 실행합니다.
