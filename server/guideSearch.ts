import { readFile } from 'node:fs/promises';
import path from 'node:path';

interface GuidePage {
  page: number;
  text: string;
}

export interface GuidePassage {
  page: number;
  text: string;
  score: number;
}

let guidePagesPromise: Promise<GuidePage[]> | undefined;

const loadGuidePages = () => {
  if (!guidePagesPromise) {
    const guidePath = path.join(process.cwd(), 'public', 'data', 'guide-pages.json');
    guidePagesPromise = readFile(guidePath, 'utf8').then((contents) => {
      const guideIndex = JSON.parse(contents) as { pages?: GuidePage[] };
      if (!Array.isArray(guideIndex.pages) || guideIndex.pages.length !== 156) {
        throw new Error('업무가이드 156페이지 검색 데이터가 올바르지 않습니다.');
      }
      return guideIndex.pages;
    });
  }
  return guidePagesPromise;
};
const normalize = (text: string) => text.toLowerCase().replace(/[^0-9a-z가-힣]/g, '');
const STOP_WORDS = new Set([
  '알려줘', '알려주세요', '보여줘', '보여주세요', '무엇인가요', '어떻게', '기준은', '방법은',
  '대한', '관련', '질문', '업무가이드', '기상관측표준화', '해줘', '해주세요', '인가요',
]);
const TERM_GROUPS = [
  ['풍향풍속계', '풍향계', '풍속계', '풍향', '풍속'],
  ['온습도계', '온도계', '습도계', '기온', '습도', '온도'],
  ['강수량계', '우량계', '강수', '수수구'],
  ['자료입력', '입력예시', '엑셀자료', '엑셀작성', '업로드', '제외기간'],
  ['검정', '재검정', '검정수수료', '유효기간', '형식승인'],
  ['품질검사', '품질관리', '정상자료율', '물리한계', '단계검사', '지속성', '내적일치'],
  ['관측망', '중복설치', '중복성', '지점번호', '신규설치', '이전설치'],
  ['유지보수', '간이점검', '장애복구', '점검방법'],
  ['관측자료', '기상자료', '자료전송', '자료구조', '표준화연계시스템'],
];

const stripEnding = (word: string) => word.replace(
  /(해주세요|보여주세요|알려주세요|인가요|하는|에서|으로|에는|은|는|이|가|을|를|의|에|로|와|과)$/g,
  '',
);

const getWeightedTerms = (query: string) => {
  const normalizedQuery = normalize(query);
  const terms = new Map<string, number>();
  const add = (term: string, weight: number) => {
    const normalized = normalize(term);
    if (normalized.length >= 2) terms.set(normalized, Math.max(weight, terms.get(normalized) || 0));
  };

  query
    .toLowerCase()
    .split(/[^0-9a-z가-힣]+/)
    .map((word) => stripEnding(normalize(word)))
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word))
    .forEach((word) => {
      add(word, Math.min(18, word.length * 3));
      if (word.length >= 4) {
        for (let i = 0; i <= word.length - 2; i += 1) add(word.slice(i, i + 2), 1);
        for (let i = 0; i <= word.length - 3; i += 1) add(word.slice(i, i + 3), 2);
      }
    });

  TERM_GROUPS.forEach((group) => {
    if (group.some((term) => normalizedQuery.includes(normalize(term)))) {
      group.forEach((term) => add(term, 5));
    }
  });

  return terms;
};

export async function retrieveGuidePassages(query: string, limit = 8): Promise<GuidePassage[]> {
  const pages = await loadGuidePages();
  const terms = getWeightedTerms(query);
  if (terms.size === 0) return [];

  return pages
    .map((page) => {
      const corpus = normalize(page.text);
      let score = 0;
      let strongMatches = 0;
      for (const [term, weight] of terms) {
        if (!corpus.includes(term)) continue;
        score += weight;
        if (weight >= 5) strongMatches += 1;
      }
      score += strongMatches * 4;
      if (page.page <= 10) score -= 12;
      return { page: page.page, text: page.text, score };
    })
    .filter((passage) => passage.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
