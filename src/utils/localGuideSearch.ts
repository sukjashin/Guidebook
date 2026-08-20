import { SENSOR_STANDARDS_TABLE, STANDARD_GUIDE_TOPICS } from '../data/standardGuideData';

export interface GuideSearchResult {
  reply: string;
  sources: string[];
  suggestedQuestions: string[];
}

interface DocumentPage {
  page: number;
  text: string;
}

interface DocumentIndex {
  pages: DocumentPage[];
}

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

const SYNONYM_GROUPS = [
  ['풍속', '풍향', '바람', '10h', '장애물', '옥상'],
  ['온도', '기온', '습도', '온습도', '백엽상', '차광통'],
  ['강수', '우량', '비', '수수구', '전도'],
  ['검정', '유효기간', '수수료', '형식승인', '불합격'],
  ['품질', 'qc', '오류', '정상자료율', '물리한계', '지속성'],
  ['이전', '신규', '지점번호', '이격거리', '관측망'],
  ['유지보수', '점검', '고장', '복구', '청소'],
];

const normalize = (text: string) =>
  text.toLowerCase().replace(/[^0-9a-z가-힣]/g, '');

const getTerms = (query: string) => {
  const normalized = normalize(query);
  const terms = new Set<string>();

  for (let size = 2; size <= 4; size += 1) {
    for (let i = 0; i <= normalized.length - size; i += 1) {
      terms.add(normalized.slice(i, i + size));
    }
  }

  for (const group of SYNONYM_GROUPS) {
    if (group.some((word) => normalized.includes(normalize(word)))) {
      group.forEach((word) => terms.add(normalize(word)));
    }
  }

  return { normalized, terms: [...terms] };
};

const scoreText = (text: string, terms: string[]) => {
  const corpus = normalize(text);
  return terms.reduce((score, term) => {
    if (!term || !corpus.includes(term)) return score;
    return score + (term.length >= 4 ? 5 : term.length === 3 ? 3 : 1);
  }, 0);
};

const FILE_FORMAT_ANSWER: GuideSearchResult = {
  reply: `### 관측자료 표준 파일 형식

「2026 기상관측표준화 업무가이드」 Part 5(p.118~132)의 주요 기준은 다음과 같습니다.

- 파일명 예시: \`AWS_YYYYMMDDhhmm.txt\` 또는 \`STN_YYYYMMDD.dat\`
- 관측시각: \`YYYYMMDDhhmm\` 형식의 한국표준시(KST)
- 주요 항목: \`TM, STN, WD, WS, GST_WD, GST_WS, TA, HM, PA, PS, RN_15M, RN_60M, RN_DAY, SI_1M, SS_1M\`
- 결측값: 요소 형식에 따라 \`-99\`, \`-99.9\`, \`-999.0\` 등으로 표기
- 좌표: WGS84 좌표계를 사용하고 소수점 다섯째 자리까지 등록

\`\`\`text
#TM,STN,WD,WS,GST_WD,GST_WS,TA,HM,PA,PS,RN_15M,RN_60M,RN_DAY,SI_1M,SS_1M
202608182200,999,180,2.3,195,4.1,24.8,78.5,1008.3,1012.1,0.0,0.0,12.5,0,0
\`\`\`

■ 핵심 요약
1. 표준 시각과 표준지점번호를 필수로 수록합니다.
2. 항목 순서, 단위와 결측값 표기를 동일하게 유지해야 합니다.
3. 실제 연계 전 수신기관의 최신 전문 규격과 대조해야 합니다.`,
  sources: ['「2026 기상관측표준화 업무가이드」 Part 5 (p.118~132)'],
  suggestedQuestions: [
    '관측자료 5대 품질검사 기준은?',
    'WGS84 좌표 등록 방법은?',
    '1분 누적 일사량 단위 변환 방법은?',
  ],
};

const searchDocumentPages = async (query: string) => {
  const index = await loadDocumentIndex();
  if (!index) return [];
  const { terms } = getTerms(query);

  return index.pages
    .map((page) => ({ page, score: scoreText(page.text, terms) }))
    .filter(({ score, page }) => score >= 5 && page.text.length > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ page }) => ({
      page: page.page,
      excerpt: page.text.length > 900 ? `${page.text.slice(0, 900)}…` : page.text,
    }));
};

const appendDocumentEvidence = (
  result: GuideSearchResult,
  matches: Array<{ page: number; excerpt: string }>,
): GuideSearchResult => {
  if (matches.length === 0) return result;

  const evidence = matches
    .map(({ page, excerpt }) => `#### 원문 p.${page}\n\n> ${excerpt.replace(/\n/g, '\n> ')}`)
    .join('\n\n');

  return {
    ...result,
    reply: `${result.reply}\n\n### 구글 드라이브 원문 검색 결과\n\n${evidence}`,
    sources: [
      ...result.sources,
      ...matches.map(({ page }) => `「2026 기상관측표준화 업무가이드」 p.${page}`),
    ].filter((source, index, all) => all.indexOf(source) === index),
  };
};

export async function searchLocalGuide(query: string): Promise<GuideSearchResult> {
  const { normalized, terms } = getTerms(query);
  const documentMatches = await searchDocumentPages(query);

  if (
    ['파일', '포맷', '전문', 'csv', '데이터형식', '수록규격'].some((word) =>
      normalized.includes(normalize(word)),
    )
  ) {
    return appendDocumentEvidence(FILE_FORMAT_ANSWER, documentMatches);
  }

  const sensorMatches = SENSOR_STANDARDS_TABLE
    .map((sensor) => ({
      sensor,
      score: scoreText(
        [sensor.element, sensor.elementEn, sensor.height, sensor.range, sensor.installationRule, sensor.maintenanceNote].join(' '),
        terms,
      ),
    }))
    .filter(({ score }) => score >= 6)
    .sort((a, b) => b.score - a.score);

  const topicMatches = STANDARD_GUIDE_TOPICS
    .map((topic) => ({
      topic,
      score: scoreText(
        [topic.title, topic.categoryName, topic.summary, topic.keyStandards.join(' '), topic.details].join(' '),
        terms,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const bestTopic = topicMatches[0];
  const bestSensor = sensorMatches[0];

  if (!bestTopic || bestTopic.score < 5) {
    return appendDocumentEvidence({
      reply: `질문하신 **「${query.trim()}」**와 정확히 일치하는 조항을 현재 내장 자료에서 찾지 못했습니다.

검색 가능한 분야는 관측망 설치·이전, 관측환경, 측기 설치기준, 형식승인·검정, 품질관리(QC), 유지보수입니다. 측기명이나 업무 절차를 포함해 조금 더 구체적으로 질문해 주세요.

> 현재 저장소에는 원문 PDF 파일이 포함되어 있지 않아 내장된 업무가이드 요약 DB에서 검색했습니다.`,
      sources: ['내장 「2026 기상관측표준화 업무가이드」 요약 DB'],
      suggestedQuestions: STANDARD_GUIDE_TOPICS.slice(0, 4).map((topic) => topic.frequentlyAsked[0]),
    }, documentMatches);
  }

  const sensorSection = bestSensor
    ? `\n\n### 관련 측기 세부 기준: ${bestSensor.sensor.element}\n\n- 설치 높이: ${bestSensor.sensor.height}\n- 측정 범위: ${bestSensor.sensor.range}\n- 설치 기준: ${bestSensor.sensor.installationRule}\n- 유지관리: ${bestSensor.sensor.maintenanceNote}\n- 검정주기: ${bestSensor.sensor.calibrationPeriod}`
    : '';

  return appendDocumentEvidence({
    reply: `${bestTopic.topic.details}${sensorSection}\n\n### 핵심 기준\n\n${bestTopic.topic.keyStandards
      .map((standard) => `- ${standard}`)
      .join('\n')}\n\n---\n광주지방기상청 관측과(062-720-0553)`,
    sources: [bestTopic.topic.relatedArticles],
    suggestedQuestions: bestTopic.topic.frequentlyAsked,
  }, documentMatches);
}
