import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFParse } from 'pdf-parse';

const DRIVE_FILE_ID = '1mKGsdUcqDWuKhhFvduSwy9RAy46G36Ns';
const DRIVE_DOWNLOAD_URL = `https://drive.usercontent.google.com/download?id=${DRIVE_FILE_ID}&export=download&confirm=t`;
const MAIN_GUIDE_FILE_NAME = '2026-weather-observation-guide.pdf';
const MAIN_GUIDE_TITLE = '2026 기상관측표준화 업무가이드';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const pdfDirectory = fileURLToPath(new URL('../tmp/pdfs/', import.meta.url));
const indexPath = fileURLToPath(new URL('../public/data/guide-pages.json', import.meta.url));

const DOC_CATEGORY_HINTS = {
  검정: '검정·교정',
  검사: '검정·교정',
  센서: '센서·설치',
  설치: '센서·설치',
  메타: '메타데이터',
  관측: '관측운영',
  전문: '기상전문기관',
  기타: '기타',
};

async function collectPdfFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectPdfFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b, 'ko'));
}

function inferCategory(filePath) {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  for (const [keyword, category] of Object.entries(DOC_CATEGORY_HINTS)) {
    if (normalized.includes(keyword.toLowerCase())) return category;
  }
  const parent = path.basename(path.dirname(filePath));
  return parent || '기타';
}

function inferTitle(filePath) {
  const fileName = path.basename(filePath, '.pdf');
  return fileName.replace(/[_-]+/g, ' ').trim() || '기타 문서';
}

await mkdir(pdfDirectory, { recursive: true });
await mkdir(path.dirname(indexPath), { recursive: true });

const mainGuidePath = path.join(pdfDirectory, MAIN_GUIDE_FILE_NAME);
if (!existsSync(mainGuidePath) && existsSync(indexPath)) {
  const existingIndex = JSON.parse(await readFile(indexPath, 'utf8'));
  const mainPages = (existingIndex.pages || []).filter((page) => page.primary === true || page.sourceFile === 'tmp/pdfs/2026-weather-observation-guide.pdf');
  const cleanedIndex = {
    ...existingIndex,
    sourceFiles: [...new Map(mainPages.map(({ sourceFile, docCategory, title }) => [sourceFile, { sourceFile, docCategory, title }])).values()],
    pageCount: mainPages.length,
    generatedAt: new Date().toISOString(),
    pages: mainPages,
  };
  await writeFile(indexPath, JSON.stringify(cleanedIndex, null, 2), 'utf8');
  console.log('기존 인덱스에서 추가 문서들을 제거하고 본편 업무가이드만 유지했습니다.');
  process.exit(0);
}

// 본편 업무가이드만 색인에 포함한다.
if (!existsSync(mainGuidePath)) {
  console.log('Google Drive에서 업무가이드 PDF를 내려받는 중입니다...');
  const response = await fetch(DRIVE_DOWNLOAD_URL);
  if (!response.ok) {
    throw new Error(`Drive PDF 다운로드 실패: HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new TextDecoder('ascii').decode(bytes.slice(0, 5)) !== '%PDF-') {
    throw new Error('다운로드한 파일이 PDF 형식이 아닙니다. Drive 공유 권한을 확인하세요.');
  }
  await writeFile(mainGuidePath, bytes);
}

const pdfFiles = [mainGuidePath];

const allPages = [];
for (const absolutePath of pdfFiles) {
  const pdfPath = absolutePath;
  if (!existsSync(pdfPath)) continue;

  const pdfBytes = await readFile(pdfPath);
  const parser = new PDFParse({ data: pdfBytes });
  const result = await parser.getText();
  await parser.destroy();

  const sourceFile = path.relative(process.cwd(), pdfPath).replace(/\\/g, '/');
  const primary = path.resolve(pdfPath) === path.resolve(mainGuidePath);
  const docCategory = primary ? '업무가이드' : inferCategory(pdfPath);
  const title = primary ? MAIN_GUIDE_TITLE : inferTitle(pdfPath);

  const filePages = (result.pages || []).map((page) => ({
    sourceFile,
    docCategory,
    title,
    ...(primary ? { primary: true } : {}),
    page: page.num,
    text: page.text.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
  }));

  allPages.push(...filePages);
}

await writeFile(
  indexPath,
  JSON.stringify(
    {
      title: MAIN_GUIDE_TITLE,
      publicationNumber: '11-1360000-100230-14',
      sourceFileId: DRIVE_FILE_ID,
      sourceUrl: `https://drive.google.com/file/d/${DRIVE_FILE_ID}/view`,
      sourceFiles: [...new Map(allPages.map(({ sourceFile, docCategory, title }) => [sourceFile, { sourceFile, docCategory, title }])).values()],
      pageCount: allPages.length,
      generatedAt: new Date().toISOString(),
      pages: allPages,
    },
    null,
    2,
  ),
  'utf8',
);

console.log(`업무가이드 검색 인덱스 생성 완료: ${allPages.length}페이지 / ${new Set(allPages.map((page) => page.sourceFile)).size}개 파일`);
