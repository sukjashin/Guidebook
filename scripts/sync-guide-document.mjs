import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { PDFParse } from 'pdf-parse';

const DRIVE_FILE_ID = '1mKGsdUcqDWuKhhFvduSwy9RAy46G36Ns';
const DRIVE_DOWNLOAD_URL = `https://drive.usercontent.google.com/download?id=${DRIVE_FILE_ID}&export=download&confirm=t`;
const pdfPath = new URL('../tmp/pdfs/2026-weather-observation-guide.pdf', import.meta.url);
const indexPath = new URL('../public/data/guide-pages.json', import.meta.url);

await mkdir(new URL('../tmp/pdfs/', import.meta.url), { recursive: true });
await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });

if (!existsSync(pdfPath)) {
  console.log('Google Drive에서 업무가이드 PDF를 내려받는 중입니다...');
  const response = await fetch(DRIVE_DOWNLOAD_URL);
  if (!response.ok) {
    throw new Error(`Drive PDF 다운로드 실패: HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new TextDecoder('ascii').decode(bytes.slice(0, 5)) !== '%PDF-') {
    throw new Error('다운로드한 파일이 PDF 형식이 아닙니다. Drive 공유 권한을 확인하세요.');
  }
  await writeFile(pdfPath, bytes);
}

const pdfBytes = await readFile(pdfPath);
const parser = new PDFParse({ data: pdfBytes });
const result = await parser.getText();
await parser.destroy();

const pages = result.pages.map((page) => ({
  page: page.num,
  text: page.text.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
}));

await writeFile(
  indexPath,
  JSON.stringify(
    {
      title: '2026 기상관측표준화 업무가이드',
      publicationNumber: '11-1360000-100230-14',
      sourceFileId: DRIVE_FILE_ID,
      sourceUrl: `https://drive.google.com/file/d/${DRIVE_FILE_ID}/view`,
      pageCount: pages.length,
      generatedAt: new Date().toISOString(),
      pages,
    },
    null,
    2,
  ),
  'utf8',
);

console.log(`업무가이드 검색 색인 생성 완료: ${pages.length}페이지`);
