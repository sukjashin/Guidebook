import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import chatHandler from './api/chat';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json({ limit: '64kb' }));

// 로컬에서도 Vercel과 동일한 검색·시간 제한·답변 처리를 사용한다.
app.all('/api/chat', async (req, res) => {
  await chatHandler(req, res);
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: '기상관측표준화 업무가이드 전문 AI 비서',
    referenceDocument: {
      title: '2026 기상관측표준화 업무가이드',
      fileName: '2026 기상관측표준화 업무가이드.pdf',
      pubNo: '11-1360000-100230-14',
      totalPages: 156,
      publisher: '기상청 관측정책과 / 광주지방기상청 관측과',
    },
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`기상관측표준화 업무가이드 AI 비서 서버 실행 중: http://localhost:${PORT}`);
  });
}

startServer();
