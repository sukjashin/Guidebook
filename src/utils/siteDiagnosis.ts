export type InstrumentType =
  | "tempHumidity"
  | "rain"
  | "wind"
  | "globalSolar"
  | "sunshine";

export interface ObstacleInput {
  id: string;
  name: string;
  distance: string;
  height: string;
  width: string;
  sensorHeight: string;
  angularWidth: string;
  angularHeight: string;
  single: boolean;
  reflective: boolean;
  albedo: string;
  terrainChange: boolean;
  note: string;
}

export interface SiteForm {
  organization: string;
  stationName: string;
  stationNumber: string;
  inspector: string;
  inspectionDate: string;
  locationType: "ground" | "rooftop" | "other";
  environmentDescription: string;
  specialEnvironment: boolean;
  specialReason: string;
  slope: string;
  vegetationHeight: string;
  naturalSurface: "" | "yes" | "no";
  heatWaterName: string;
  heatWaterDistance: string;
  ratio100: string;
  ratio30: string;
  ratio10: string;
  ratio5: string;
  ratio3: string;
  shadeFreeAbove: string;
  naturalTerrainShadow: boolean;
  gaugeHeight: string;
  windShield: boolean;
  uniformObstacles: boolean;
  sensorHeight: string;
  roughnessLength: string;
  belowTenMeters: boolean;
  annualShadePercent: string;
}

export interface ObstacleAssessment {
  id: string;
  name: string;
  effectiveHeight?: number;
  ratio?: number;
  grade?: number;
  note: string;
}

export interface DiagnosisResult {
  grade: number | null;
  displayGrade: string;
  missing: string[];
  met: string[];
  unmet: string[];
  improvements: string[];
  obstacleAssessments: ObstacleAssessment[];
  decisiveObstacle?: ObstacleAssessment;
  pageReference: string;
}

export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  tempHumidity: "온도계·습도계",
  rain: "강수량계",
  wind: "풍향계·풍속계",
  globalSolar: "일사계(전천)",
  sunshine: "일조계·일사계(직달)",
};

const pageReference: Record<InstrumentType, string> = {
  tempHumidity: "부록 1, p.114~116",
  rain: "부록 1, p.117~118",
  wind: "부록 1, p.119~121",
  globalSolar: "부록 1, p.121~122",
  sunshine: "부록 1, p.123",
};

const num = (value: string) => (value.trim() === "" ? null : Number(value));
const isNumber = (value: number | null): value is number =>
  value !== null && Number.isFinite(value);

function missingFields(
  form: SiteForm,
  instrument: InstrumentType,
  obstacles: ObstacleInput[],
  noObstacles: boolean,
) {
  const missing: string[] = [];
  const requiredCommon: Array<[keyof SiteForm, string]> = [
    ["organization", "기관명"],
    ["stationName", "관측시설명"],
    ["inspector", "점검자"],
    ["inspectionDate", "점검일"],
  ];
  requiredCommon.forEach(([key, label]) => {
    if (!String(form[key]).trim()) missing.push(label);
  });

  const requiredByInstrument: Record<
    InstrumentType,
    Array<[keyof SiteForm, string]>
  > = {
    tempHumidity: [
      ["slope", "관측장소 경사도"],
      ["vegetationHeight", "자연식생 높이"],
      ["naturalSurface", "지표면 상태"],
      ["heatWaterDistance", "열원·수원 거리"],
      ["ratio100", "반경 100m 면적 비율"],
      ["ratio30", "반경 30m 면적 비율"],
      ["ratio10", "반경 10m 면적 비율"],
      ["ratio5", "반경 5m 면적 비율"],
      ["ratio3", "반경 3m 면적 비율"],
      ["shadeFreeAbove", "그늘이 생기지 않는 태양고도각"],
    ],
    rain: [
      ["slope", "관측장소 경사도"],
      ["gaugeHeight", "수수구 높이"],
    ],
    wind: [
      ["sensorHeight", "센서 설치 높이"],
      ["roughnessLength", "거칠기 길이"],
    ],
    globalSolar: [
      ["shadeFreeAbove", "그늘이 생기지 않는 태양고도각"],
      ["annualShadePercent", "연중 낮 시간 그늘 비율"],
    ],
    sunshine: [
      ["shadeFreeAbove", "그늘이 생기지 않는 태양고도각"],
      ["annualShadePercent", "연중 낮 시간 그늘 비율"],
    ],
  };
  requiredByInstrument[instrument].forEach(([key, label]) => {
    if (!String(form[key]).trim()) missing.push(label);
  });

  if (!noObstacles && obstacles.length === 0)
    missing.push("장애물 또는 주변 장애물 없음 선택");
  if (!noObstacles) {
    obstacles.forEach((obstacle, index) => {
      if (!obstacle.name.trim()) missing.push(`장애물 ${index + 1} 명칭`);
      if (!obstacle.distance.trim()) missing.push(`장애물 ${index + 1} 거리`);
      if (!obstacle.height.trim()) missing.push(`장애물 ${index + 1} 높이`);
      if (instrument === "wind" && !obstacle.angularWidth.trim())
        missing.push(`장애물 ${index + 1} 각 너비`);
      if (instrument === "wind" && !obstacle.width.trim())
        missing.push(`장애물 ${index + 1} 폭`);
      if (instrument === "rain" && !obstacle.angularWidth.trim())
        missing.push(`장애물 ${index + 1} 유효 각 너비`);
      if (
        instrument === "globalSolar" &&
        (!obstacle.angularWidth.trim() || !obstacle.angularHeight.trim())
      ) {
        missing.push(`장애물 ${index + 1} 각 너비·고도각`);
      }
    });
  }
  if (form.specialEnvironment && !form.specialReason.trim())
    missing.push("특수환경 사유");
  return [...new Set(missing)];
}

function finalResult(
  instrument: InstrumentType,
  form: SiteForm,
  grade: number,
  met: string[],
  unmet: string[],
  improvements: string[],
  obstacleAssessments: ObstacleAssessment[],
): DiagnosisResult {
  const special =
    (form.specialEnvironment ||
      (instrument === "wind" && form.belowTenMeters)) &&
    grade >= 4;
  const sorted = [...obstacleAssessments]
    .filter((item) => item.ratio !== undefined)
    .sort((a, b) => (a.ratio ?? Infinity) - (b.ratio ?? Infinity));
  return {
    grade,
    displayGrade: special ? `${grade}S` : `${grade}등급`,
    missing: [],
    met,
    unmet,
    improvements,
    obstacleAssessments,
    decisiveObstacle: sorted[0],
    pageReference: pageReference[instrument],
  };
}

function diagnoseTempHumidity(form: SiteForm): DiagnosisResult {
  const slope = num(form.slope)!;
  const veg = num(form.vegetationHeight)!;
  const distance = num(form.heatWaterDistance)!;
  const r100 = num(form.ratio100)!;
  const r30 = num(form.ratio30)!;
  const r10 = num(form.ratio10)!;
  const r5 = num(form.ratio5)!;
  const r3 = num(form.ratio3)!;
  const shade = num(form.shadeFreeAbove)!;
  const natural = form.naturalSurface === "yes";
  const levels = [
    {
      grade: 1,
      ok:
        slope <= 19 &&
        veg < 10 &&
        natural &&
        distance >= 100 &&
        r100 <= 10 &&
        r30 <= 5 &&
        r10 <= 1 &&
        shade <= 5,
      text: "평지·10cm 미만 자연식생·열원/수원 및 태양고도각 5° 기준 충족",
    },
    {
      grade: 2,
      ok:
        slope <= 19 &&
        veg < 10 &&
        natural &&
        distance >= 30 &&
        r30 <= 10 &&
        r10 <= 5 &&
        r5 <= 1 &&
        shade <= 7,
      text: "평지·10cm 미만 자연식생·열원/수원 및 태양고도각 7° 기준 충족",
    },
    {
      grade: 3,
      ok: veg < 25 && distance >= 10 && r10 <= 10 && r5 <= 5 && shade <= 7,
      text: "25cm 미만 식생·열원/수원 및 태양고도각 7° 기준 충족",
    },
    {
      grade: 4,
      ok: r10 <= 50 && r3 <= 30 && shade <= 20,
      text: "열원/수원 면적 비율과 태양고도각 20° 기준 충족",
    },
  ];
  const found = levels.find((level) => level.ok);
  const grade = found?.grade ?? 5;
  return finalResult(
    "tempHumidity",
    form,
    grade,
    found ? [found.text] : [],
    levels
      .filter((level) => level.grade < grade)
      .map((level) => `${level.grade}등급 조건 미충족`),
    [
      "식생 높이와 열원·수원 영향을 줄이고 그늘이 생기지 않도록 위치를 개선하세요.",
    ],
    [],
  );
}

function rainAssessments(form: SiteForm, obstacles: ObstacleInput[]) {
  const gaugeHeight = num(form.gaugeHeight) ?? 0;
  return obstacles.map((obstacle) => {
    const height = num(obstacle.height) ?? 0;
    const distance = num(obstacle.distance) ?? 0;
    const effectiveHeight = Math.max(0, height - gaugeHeight);
    const angularWidth = num(obstacle.angularWidth) ?? 0;
    const ratio =
      effectiveHeight > 0 && angularWidth >= 10
        ? distance / effectiveHeight
        : Infinity;
    return {
      id: obstacle.id,
      name: obstacle.name,
      effectiveHeight,
      ratio,
      note:
        angularWidth < 10
          ? "유효 각 너비 10° 미만으로 장애물에서 제외"
          : `수수구 기준 유효높이 ${effectiveHeight.toFixed(1)}m`,
    };
  });
}

function diagnoseRain(
  form: SiteForm,
  obstacles: ObstacleInput[],
): DiagnosisResult {
  const slope = num(form.slope)!;
  const assessed = rainAssessments(form, obstacles);
  const ratios = assessed.map((item) => item.ratio ?? Infinity);
  const minRatio = ratios.length ? Math.min(...ratios) : Infinity;
  let grade = 5;
  const met: string[] = [];
  if (
    slope <= 19 &&
    ((form.windShield && minRatio >= 4) ||
      (!form.windShield &&
        form.uniformObstacles &&
        minRatio >= 2 &&
        Math.max(...ratios) <= 4))
  ) {
    grade = 1;
    met.push("경사도 19° 이하 및 바람막이/균일 장애물 1등급 조건 충족");
  } else if (slope <= 19 && minRatio >= 2) {
    grade = 2;
    met.push("경사도 19° 이하, 장애물 높이의 2배 이상 이격");
  } else if (slope <= 30 && minRatio >= 1) {
    grade = 3;
    met.push("경사도 30° 이하, 장애물 높이의 1배 이상 이격");
  } else if (minRatio >= 0.5) {
    grade = 4;
    met.push("장애물 높이의 0.5배 이상 이격");
  }
  return finalResult(
    "rain",
    form,
    grade,
    met,
    grade > 1 ? [`${grade - 1}등급 이상 조건 미충족`] : [],
    [
      "장애물과 거리를 늘리고 수평한 개활지를 확보하거나 바람막이를 설치하세요.",
    ],
    assessed,
  );
}

function windAssessmentForGrade(
  obstacle: ObstacleInput,
  sensorHeight: number,
  grade: number,
) {
  const height = num(obstacle.height) ?? 0;
  const distance = num(obstacle.distance) ?? 0;
  const width = num(obstacle.width) ?? 0;
  const angle = num(obstacle.angularWidth) ?? 0;
  const effectiveHeight = Math.max(0, height - (sensorHeight - 10));
  const ignoredSingleHeight = grade <= 2 ? 4 : grade === 3 ? 5 : 6;
  if (obstacle.single && height < ignoredSingleHeight)
    return {
      ok: true,
      effectiveHeight,
      ratio: Infinity,
      note: `${ignoredSingleHeight}m 미만 단일 물체 예외`,
    };
  if (angle < 10 && height > 8 && grade <= 3) {
    const widthRatio = width > 0 ? distance / width : 0;
    const required = grade <= 2 ? 15 : 10;
    return {
      ok: widthRatio >= required,
      effectiveHeight,
      ratio: widthRatio,
      note: `좁고 높은 장애물: 거리/폭 ${widthRatio.toFixed(1)} (기준 ${required})`,
    };
  }
  const required = grade === 1 ? 30 : grade === 2 ? 10 : grade === 3 ? 5 : 2.5;
  const ratio = effectiveHeight > 0 ? distance / effectiveHeight : Infinity;
  const wideHighFail =
    grade === 4 && height > 10 && angle > 60 && distance < 40;
  return {
    ok: ratio >= required && !wideHighFail,
    effectiveHeight,
    ratio,
    note: wideHighFail
      ? "10m 초과·60° 초과 장애물이 40m 이내"
      : `거리/유효높이 ${ratio === Infinity ? "∞" : ratio.toFixed(1)} (기준 ${required})`,
  };
}

function diagnoseWind(
  form: SiteForm,
  obstacles: ObstacleInput[],
): DiagnosisResult {
  const sensorHeight = num(form.sensorHeight)!;
  const roughness = num(form.roughnessLength)!;
  const levels = [1, 2, 3, 4];
  let chosen = 5;
  let chosenAssessments: ObstacleAssessment[] = [];
  for (const grade of levels) {
    const assessments = obstacles.map((obstacle) => ({
      id: obstacle.id,
      name: obstacle.name,
      ...windAssessmentForGrade(obstacle, sensorHeight, grade),
      grade,
    }));
    const roughnessOk =
      grade === 1 ? roughness <= 0.1 : grade === 2 ? roughness <= 0.25 : true;
    if (roughnessOk && assessments.every((item) => item.ok)) {
      chosen = grade;
      chosenAssessments = assessments;
      break;
    }
  }
  if (chosen === 5)
    chosenAssessments = obstacles.map((obstacle) => ({
      id: obstacle.id,
      name: obstacle.name,
      ...windAssessmentForGrade(obstacle, sensorHeight, 4),
      grade: 5,
    }));
  if (sensorHeight < 10 && chosen < 4) chosen = 4;
  return finalResult(
    "wind",
    form,
    chosen,
    [`거칠기 길이 ${roughness}m`, `센서 높이 ${sensorHeight}m 조건 반영`],
    chosen > 1 ? [`${chosen - 1}등급 이상 조건 미충족`] : [],
    ["장애물과 거리를 늘리거나 센서 높이를 조정하고 주변 거칠기를 개선하세요."],
    chosenAssessments,
  );
}

function diagnoseSolar(
  form: SiteForm,
  obstacles: ObstacleInput[],
  direct: boolean,
): DiagnosisResult {
  const shade = num(form.shadeFreeAbove)!;
  const annual = num(form.annualShadePercent)!;
  if (direct) {
    const grade =
      shade <= 3 ? 1 : shade <= 5 ? 2 : shade <= 7 ? 3 : annual <= 30 ? 4 : 5;
    return finalResult(
      "sunshine",
      form,
      grade,
      [`태양고도각 ${shade}° 초과 시 무그늘`, `연중 낮시간 그늘 ${annual}%`],
      grade > 1 ? [`${grade - 1}등급 이상 무그늘 조건 미충족`] : [],
      ["센서의 태양 시야를 확보하고 그늘 발생 시간을 줄이세요."],
      [],
    );
  }
  const reflective = obstacles.filter(
    (obstacle) => obstacle.reflective || (num(obstacle.albedo) ?? 0) > 0.5,
  );
  const noReflective = (width: number, height: number) =>
    reflective.every(
      (obstacle) =>
        (num(obstacle.angularWidth) ?? 0) <= width ||
        (num(obstacle.angularHeight) ?? 0) <= height,
    );
  const grade =
    shade <= 5 && noReflective(10, 5)
      ? 1
      : shade <= 7 && noReflective(20, 7)
        ? 2
        : shade <= 10 && noReflective(45, 15)
          ? 3
          : annual <= 30
            ? 4
            : 5;
  const assessed = obstacles.map((obstacle) => ({
    id: obstacle.id,
    name: obstacle.name,
    note:
      obstacle.reflective || (num(obstacle.albedo) ?? 0) > 0.5
        ? "반사성 장애물"
        : "무반사성 장애물",
  }));
  return finalResult(
    "globalSolar",
    form,
    grade,
    [`태양고도각 ${shade}° 초과 시 무그늘`, `연중 낮시간 그늘 ${annual}%`],
    grade > 1 ? [`${grade - 1}등급 이상 시야·반사 조건 미충족`] : [],
    ["반사성 장애물을 제거하거나 태양 시야와 무그늘 시간을 확보하세요."],
    assessed,
  );
}

export function diagnoseSite(
  instrument: InstrumentType,
  form: SiteForm,
  obstacles: ObstacleInput[],
  noObstacles: boolean,
): DiagnosisResult {
  const missing = missingFields(form, instrument, obstacles, noObstacles);
  if (missing.length)
    return {
      grade: null,
      displayGrade: "판정 보류",
      missing,
      met: [],
      unmet: [],
      improvements: [],
      obstacleAssessments: [],
      pageReference: pageReference[instrument],
    };
  const activeObstacles = noObstacles ? [] : obstacles;
  if (instrument === "tempHumidity") return diagnoseTempHumidity(form);
  if (instrument === "rain") return diagnoseRain(form, activeObstacles);
  if (instrument === "wind") return diagnoseWind(form, activeObstacles);
  if (instrument === "globalSolar")
    return diagnoseSolar(form, activeObstacles, false);
  return diagnoseSolar(form, activeObstacles, true);
}

export function createEmptyObstacle(): ObstacleInput {
  return {
    id: crypto.randomUUID(),
    name: "",
    distance: "",
    height: "",
    width: "",
    sensorHeight: "",
    angularWidth: "",
    angularHeight: "",
    single: false,
    reflective: false,
    albedo: "",
    terrainChange: false,
    note: "",
  };
}

export const EMPTY_SITE_FORM: SiteForm = {
  organization: "",
  stationName: "",
  stationNumber: "",
  inspector: "",
  inspectionDate: new Date().toISOString().slice(0, 10),
  locationType: "ground",
  environmentDescription: "",
  specialEnvironment: false,
  specialReason: "",
  slope: "",
  vegetationHeight: "",
  naturalSurface: "",
  heatWaterName: "",
  heatWaterDistance: "",
  ratio100: "",
  ratio30: "",
  ratio10: "",
  ratio5: "",
  ratio3: "",
  shadeFreeAbove: "",
  naturalTerrainShadow: false,
  gaugeHeight: "",
  windShield: false,
  uniformObstacles: false,
  sensorHeight: "",
  roughnessLength: "",
  belowTenMeters: false,
  annualShadePercent: "",
};
