import { SENSOR_STANDARDS_TABLE, STANDARD_GUIDE_TOPICS } from '../data/standardGuideData';

export interface GuideSearchResult {
  reply: string;
  sources: string[];
  suggestedQuestions: string[];
}

interface DocumentIndex {
  pages: Array<{ page: number; text: string }>;
}

const INTENTS = [
  { topicId: 'law-overview', keywords: ['관측망', '지점번호', '신규', '이전', '폐지', '관리계획', '1km', '중복설치'] },
  { topicId: 'observation-field-standards', keywords: ['관측환경', '노장', '잔디', '35㎡', '35제곱', '울타리', '관측장소'] },
  { topicId: 'sensor-technical-specs', keywords: ['설치높이', '설치기준', '풍향', '풍속', '온습도', '온도계', '습도계', '강수량계', '일사계', '일조계', '적설계', '10h', '차광통', '백엽상', '수수구'] },
  { topicId: 'calibration-verification', keywords: ['검정', '형식승인', '유효기간', '수수료', '면제', '불합격', '재검정'] },
  { topicId: 'quality-control-qc', keywords: ['품질', 'qc', '물리한계', '단계검사', '지속성', '내적일치', '정상자료율', '품질등급'] },
  { topicId: 'inspection-maintenance', keywords: ['유지보수', '간이점검', '500ml', '생수병', '장애복구', '베어링', '필터', '청소', '점검방법'] },
];

const DOMAIN_TERMS = [...new Set(INTENTS.flatMap((intent) => intent.keywords))];
const STOP_WORDS = new Set(['알려줘', '알려주세요', '무엇인가요', '어떻게', '기준은', '방법은', '대한', '관련', '질문', '업무가이드']);
const normalize = (text: string) => text.toLowerCase().replace(/[^0-9a-z가-힣]/g, '');

let documentIndexPromise: Promise<DocumentIndex | null> | null = null;
const loadDocumentIndex = () => {
  if (!documentIndexPromise) {
    documentIndexPromise = fetch(`${import.meta.env.BASE_URL}data/guide-pages.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`문서 색인 응답 오류: ${response.status}`);
        return response.json() as Promise<DocumentIndex>;
      })
      .catch((error) => {
        console.error('업무가이드 원문 색인을 불러오지 못했습니다.', error);
        return null;
      });
  }
  return documentIndexPromise;
};

const getTerms = (query: string) => {
  const normalized = normalize(query);
  const terms = new Set<string>();
  query
    .toLowerCase()
    .split(/[^0-9a-z가-힣]+/)
    .map(normalize)
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word))
    .forEach((word) => terms.add(word));
  DOMAIN_TERMS.forEach((word) => {
    const term = normalize(word);
    if (normalized.includes(term)) terms.add(term);
  });
  return { normalized, terms: [...terms] };
};

const scoreText = (text: string, terms: string[]) => {
  const corpus = normalize(text);
  return terms.reduce((score, term) => {
    if (!term || !corpus.includes(term)) return score;
    return score + (term.length >= 5 ? 10 : term.length === 4 ? 7 : term.length === 3 ? 4 : 2);
  }, 0);
};

const selectIntent = (normalizedQuery: string) => INTENTS
  .map((intent) => ({
    ...intent,
    score: intent.keywords.reduce((score, keyword) =>
      normalizedQuery.includes(normalize(keyword)) ? score + Math.max(2, normalize(keyword).length) : score, 0),
  }))
  .sort((a, b) => b.score - a.score)[0];

const searchDocument = async (query: string) => {
  const index = await loadDocumentIndex();
  if (!index) return [];
  const { terms } = getTerms(query);
  const chunks = index.pages.flatMap((page) => {
    const text = page.text.replace(/\n{2,}/g, '\n').trim();
    const result: Array<{ page: number; excerpt: string; score: number }> = [];
    for (let start = 0; start < text.length; start += 400) {
      const excerpt = text.slice(start, start + 700);
      if (excerpt.length < 40) continue;
      const matched = terms.filter((term) => normalize(excerpt).includes(term));
      const coverageBonus = matched.length === terms.length && terms.length > 1 ? 15 : matched.length * 2;
      result.push({
        page: page.page,
        excerpt,
        score: scoreText(excerpt, terms) + coverageBonus - (page.page <= 10 ? 12 : 0),
      });
    }
    return result;
  });

  const seenPages = new Set<number>();
  return chunks
    .filter(({ score }) => score >= 8)
    .sort((a, b) => b.score - a.score)
    .filter(({ page }) => {
      if (seenPages.has(page)) return false;
      seenPages.add(page);
      return true;
    })
    .slice(0, 3);
};

const withEvidence = (
  result: GuideSearchResult,
  matches: Array<{ page: number; excerpt: string }>,
): GuideSearchResult => {
  if (matches.length === 0) return result;
  const evidence = matches
    .map(({ page, excerpt }) => `#### 원문 p.${page}\n\n> ${excerpt.replace(/\n/g, '\n> ')}`)
    .join('\n\n');
  return {
    ...result,
    reply: `${result.reply}\n\n### 원문에서 찾은 관련 문단\n\n${evidence}`,
    sources: [...new Set([...result.sources, ...matches.map(({ page }) => `「2026 기상관측표준화 업무가이드」 p.${page}`)])],
  };
};

export async function searchLocalGuide(query: string): Promise<GuideSearchResult> {
  const { normalized, terms } = getTerms(query);
  const documentMatches = await searchDocument(query);
  const intent = selectIntent(normalized);
  const topic = intent?.score > 0 ? STANDARD_GUIDE_TOPICS.find((item) => item.id === intent.topicId) : undefined;

  if (!topic) {
    const result: GuideSearchResult = {
      reply: documentMatches.length > 0
        ? `질문하신 **「${query.trim()}」**와 관련된 원문 문단을 찾았습니다. 확실하지 않은 분야의 요약 답변은 표시하지 않고 원문 검색 결과만 제공합니다.`
        : `질문하신 **「${query.trim()}」**와 직접 일치하는 내용을 찾지 못했습니다. 측기명, 업무명 또는 찾으려는 수치를 포함해 조금 더 구체적으로 질문해 주세요.`,
      sources: [],
      suggestedQuestions: STANDARD_GUIDE_TOPICS.slice(0, 4).map((item) => item.frequentlyAsked[0]),
    };
    return withEvidence(result, documentMatches);
  }

  const relevantStandards = topic.keyStandards
    .map((standard) => ({ standard, score: scoreText(standard, terms) }))
    .sort((a, b) => b.score - a.score)
    .filter(({ score }, index) => score > 0 || index === 0)
    .slice(0, 3)
    .map(({ standard }) => standard);

  const sensor = SENSOR_STANDARDS_TABLE
    .map((item) => ({
      item,
      score: scoreText([item.element, item.height, item.installationRule, item.maintenanceNote].join(' '), terms),
    }))
    .filter(({ score }) => score >= 8)
    .sort((a, b) => b.score - a.score)[0]?.item;

  const sensorDetails = sensor
    ? `\n\n### 관련 측기: ${sensor.element}\n\n- 설치 높이: ${sensor.height}\n- 설치 기준: ${sensor.installationRule}\n- 유지관리: ${sensor.maintenanceNote}\n- 검정주기: ${sensor.calibrationPeriod}`
    : '';

  const result: GuideSearchResult = {
    reply: `### ${topic.title}\n\n질문과 직접 관련된 기준입니다.\n\n${relevantStandards.map((standard) => `- ${standard}`).join('\n')}${sensorDetails}\n\n---\n광주지방기상청 관측과(062-720-0553)`,
    sources: [topic.relatedArticles],
    suggestedQuestions: topic.frequentlyAsked,
  };
  return withEvidence(result, documentMatches);
}
