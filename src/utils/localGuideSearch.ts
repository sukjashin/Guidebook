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

const NOT_FOUND_REPLY = '죄송합니다. 요청하신 내용에 대해서는 제공된 자료(파일) 내에서 확인되지 않습니다.';

const formatAnswer = (title: string, facts: string[]) => {
  const uniqueFacts = [...new Set(facts.filter(Boolean))];
  const bodyFacts = uniqueFacts.slice(0, 3);
  const summaryFacts = uniqueFacts.slice(0, 3);

  return `질문에 답변드립니다.\n\n### ${title}\n\n${bodyFacts.map((fact) => `- ${fact}`).join('\n')}\n\n■ 핵심 요약\n1. ${summaryFacts[0]}\n2. ${summaryFacts[1]}\n3. ${summaryFacts[2]}`;
};

const SPECIAL_ANSWERS = [
  {
    keywords: ['자료입력', '입력예시', '엑셀작성', '엑셀자료', '제외기간', '업로드예시'],
    title: '관측자료 엑셀 입력 예시',
    bullets: [
      '자료는 엑셀 3번 행부터 입력하고 1·2번 행은 삭제하지 않습니다.',
      '기관코드·구분코드·지점번호·지점명이 등록정보와 일치해야 업로드됩니다.',
      '제외기간은 8자리 숫자로 입력하고 셀 서식은 텍스트로 지정합니다.',
      '상세사유는 장비교체, 통신불량, 장비이전처럼 구체적으로 작성합니다.',
    ],
    source: '「2026 기상관측표준화 업무가이드」 p.100',
  },
  {
    keywords: ['자료구조', '파일포맷', '전문포맷', '전송형식', '수록규격', '관측자료예시'],
    title: '관측자료 전송 형식',
    bullets: [
      '관측자료는 업무가이드 부록의 자료구조·자료내용·요소별 구조에 맞춰 전송합니다.',
      '관측시각, 지점번호와 관측요소별 값의 순서·단위·결측값 표기를 동일하게 유지합니다.',
      '실제 연계 전에는 수신기관의 최신 표준 전문 규격과 대조합니다.',
    ],
    source: '「2026 기상관측표준화 업무가이드」 Part 5 및 부록 5',
  },
];

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
  return {
    ...result,
    sources: [...new Set([...result.sources, ...matches.map(({ page }) => `「2026 기상관측표준화 업무가이드」 p.${page}`)])],
  };
};

export async function searchLocalGuide(query: string): Promise<GuideSearchResult> {
  const { normalized, terms } = getTerms(query);
  const documentMatches = await searchDocument(query);
  const specialAnswer = SPECIAL_ANSWERS.find((answer) =>
    answer.keywords.some((keyword) => normalized.includes(normalize(keyword))),
  );

  if (specialAnswer) {
    return {
      reply: formatAnswer(specialAnswer.title, specialAnswer.bullets),
      sources: [specialAnswer.source],
      suggestedQuestions: ['엑셀 업로드 실패 원인은?', '관측자료 품질검사 기준은?', '관측자료 연계 절차는?'],
    };
  }

  const intent = selectIntent(normalized);
  const topic = intent?.score > 0 ? STANDARD_GUIDE_TOPICS.find((item) => item.id === intent.topicId) : undefined;

  if (!topic) {
    return {
      reply: NOT_FOUND_REPLY,
      sources: [],
      suggestedQuestions: STANDARD_GUIDE_TOPICS.slice(0, 4).map((item) => item.frequentlyAsked[0]),
    };
  }

  const relevantStandards = topic.keyStandards
    .map((standard) => ({ standard, score: scoreText(standard, terms) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ standard }) => standard);

  const sensor = SENSOR_STANDARDS_TABLE
    .map((item) => ({
      item,
      score: scoreText([item.element, item.height, item.installationRule, item.maintenanceNote].join(' '), terms),
    }))
    .filter(({ score }) => score >= 8)
    .sort((a, b) => b.score - a.score)[0]?.item;

  const sensorFacts = sensor ? [`설치 높이: ${sensor.height}`, `설치 기준: ${sensor.installationRule}`] : [];
  const answerFacts = [...relevantStandards, ...sensorFacts].slice(0, 3);

  const result: GuideSearchResult = {
    reply: formatAnswer(topic.title, answerFacts),
    sources: [topic.relatedArticles],
    suggestedQuestions: topic.frequentlyAsked,
  };
  return withEvidence(result, documentMatches);
}
