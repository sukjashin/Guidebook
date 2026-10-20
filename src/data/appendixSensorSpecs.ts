export interface SensorCriterion {
  key: string;
  label: string;
  standard: string;
}

export interface AppendixSensorSpec {
  id: string;
  label: string;
  forms: Array<{ id: string; label: string; criteria: SensorCriterion[] }>;
  page: string;
}

const c = (key: string, label: string, standard: string): SensorCriterion => ({
  key,
  label,
  standard,
});

export const APPENDIX_SENSOR_SPECS: AppendixSensorSpec[] = [
  {
    id: "temperature",
    label: "온도센서",
    page: "부록 2, p.124",
    forms: [
      {
        id: "metal",
        label: "금속형",
        criteria: [
          c("range", "측정범위", "-40~+60℃ (초상·지면·지중 -40~+100℃)"),
          c("accuracy", "정확도", "±0.3℃ 이내"),
          c("resolution", "분해능", "0.1℃"),
          c("environment", "운용환경", "-40~+60℃"),
          c("other", "기타", "100Ω 백금 4선식"),
        ],
      },
      {
        id: "film",
        label: "박막형",
        criteria: [
          c("range", "측정범위", "-40~+60℃"),
          c("accuracy", "정확도", "±0.3℃ 이내"),
          c("resolution", "분해능", "0.1℃"),
          c("environment", "운용환경", "-40~+60℃"),
          c("other", "기타", "100Ω 백금, 유리코팅 또는 보호통"),
        ],
      },
    ],
  },
  {
    id: "humidity",
    label: "습도센서",
    page: "부록 2, p.124",
    forms: [
      {
        id: "capacitive",
        label: "정전용량식",
        criteria: [
          c("range", "측정범위", "0~100% R.H"),
          c("accuracy", "정확도", "±3% R.H(0~90), ±5% R.H(91~100)"),
          c("environment", "운용환경", "-40~+60℃"),
          c("other", "기타", "방진필터 부착"),
        ],
      },
    ],
  },
  {
    id: "windDirection",
    label: "풍향센서",
    page: "부록 2, p.124",
    forms: [
      {
        id: "gray",
        label: "그레이코드식",
        criteria: [
          c("range", "측정범위", "0~360°"),
          c("accuracy", "정확도", "5° 이내"),
          c("startup", "기동풍속", "0.5m/s 이하"),
          c("resolution", "분해능", "3°"),
          c("environment", "운용환경", "-40~+60℃, 순간풍속 75m/s 이내"),
        ],
      },
      {
        id: "potentiometer",
        label: "전위차계식",
        criteria: [
          c("range", "측정범위", "0~360°"),
          c("accuracy", "정확도", "5° 이내"),
          c("startup", "기동풍속", "1.1m/s 이하"),
          c("resolution", "분해능", "1°"),
          c("environment", "운용환경", "-50~+50℃, 순간풍속 75m/s 이내"),
        ],
      },
      {
        id: "ultrasonic",
        label: "초음파식",
        criteria: [
          c("range", "측정범위", "0~360°"),
          c("accuracy", "정확도", "2° 이내"),
          c("resolution", "분해능", "1°"),
          c("environment", "운용환경", "-40~+60℃, 순간풍속 75m/s 이내"),
        ],
      },
    ],
  },
  {
    id: "windSpeed",
    label: "풍속센서",
    page: "부록 2, p.125",
    forms: [
      {
        id: "optical",
        label: "광초퍼식",
        criteria: [
          c("range", "측정범위", "0~75m/s"),
          c("accuracy", "정확도", "0.5m/s 이내(<10m/s), 5% 이내(≥10m/s)"),
          c("startup", "기동풍속", "0.5m/s 이하"),
          c("resolution", "분해능", "0.1m/s"),
          c("environment", "운용환경", "-40~+60℃, 순간풍속 75m/s 이내"),
        ],
      },
      {
        id: "magnetic",
        label: "자기유도식",
        criteria: [
          c("range", "측정범위", "0~75m/s"),
          c("accuracy", "정확도", "0.5m/s 이내(<10m/s), 5% 이내(≥10m/s)"),
          c("startup", "기동풍속", "1.1m/s 이하"),
          c("resolution", "분해능", "0.1m/s"),
          c("environment", "운용환경", "-50~+50℃, 순간풍속 75m/s 이내"),
        ],
      },
      {
        id: "ultrasonic",
        label: "초음파식",
        criteria: [
          c("range", "측정범위", "0~70m/s"),
          c("accuracy", "정확도", "0.5m/s 이내(<10m/s), 5% 이내(≥10m/s)"),
          c("resolution", "분해능", "0.1m/s"),
          c("environment", "운용환경", "-40~+60℃, 순간풍속 75m/s 이내"),
          c("other", "기타", "히터 내장"),
        ],
      },
    ],
  },
  {
    id: "rain",
    label: "강수량센서",
    page: "부록 2, p.125",
    forms: [
      {
        id: "tipping",
        label: "전도형",
        criteria: [
          c("range", "측정범위", "1전도당 0.5mm 또는 1.0mm"),
          c("accuracy", "정확도", "3% 이내(20~50mm/h)"),
          c("resolution", "분해능", "0.5mm 또는 1.0mm"),
          c("environment", "운용환경", "-40~+60℃"),
          c(
            "other",
            "기타",
            "수수구 지름 200mm, 스테인리스, 4±2℃ ON·15±2℃ OFF 히터, 5mm 이내 그물망, 바람막이",
          ),
        ],
      },
      {
        id: "weighing",
        label: "무게식",
        criteria: [
          c("range", "측정범위", "1000mm 이상"),
          c("accuracy", "정확도", "±0.1mm(<10mm), ±1%(≥10mm)"),
          c("resolution", "분해능", "0.1mm"),
          c("environment", "운용환경", "-40~+60℃"),
          c("other", "기타", "바람막이 및 수수구부 히팅 기능"),
        ],
      },
    ],
  },
  {
    id: "rainPresence",
    label: "강수유무센서",
    page: "부록 2, p.125",
    forms: [
      {
        id: "detection",
        label: "임피던스/정전용량 검출형",
        criteria: [
          c("range", "측정범위", "비·눈 등 강수현상"),
          c("response", "반응시간", "1분 이내, 종료 후 물기 제거 2분 이내"),
          c("environment", "운용환경", "-40~+60℃"),
          c("other", "기타", "금박격자 5mm 이내, 15~30° 경사, 감지면 항온유지"),
        ],
      },
    ],
  },
  {
    id: "pressure",
    label: "기압센서",
    page: "부록 2, p.126",
    forms: [
      {
        id: "capacitive",
        label: "정전용량식",
        criteria: [
          c("range", "측정범위", "500~1080hPa"),
          c("accuracy", "정확도", "±0.5hPa(750~1080hPa)"),
          c("resolution", "분해능", "0.1hPa"),
          c("response", "반응시간", "1초 이내"),
          c("environment", "운용환경", "-40~+60℃"),
        ],
      },
    ],
  },
  {
    id: "solar",
    label: "일사센서",
    page: "부록 2, p.126",
    forms: [
      {
        id: "thermocouple",
        label: "열전대식",
        criteria: [
          c("range", "측정범위", "0~1500W/m²"),
          c("accuracy", "정확도", "2%(일 변화), 3%(시 변화)"),
          c("resolution", "분해능", "1W/m²"),
          c("environment", "운용환경", "-40~+60℃"),
          c("sensitivity", "민감도", "7~17μV/(W/m²)"),
          c("temperature", "온도특성", "±2% / -20~+50℃"),
          c("nonlinearity", "비선형성", "±0.5%"),
          c("stability", "안정도", "±0.8%/년"),
          c("fieldOfView", "시야각", "0~360°"),
        ],
      },
    ],
  },
  {
    id: "sunshine",
    label: "일조센서",
    page: "부록 2, p.126",
    forms: [
      {
        id: "optical",
        label: "회전거울식/광다이오드식",
        criteria: [
          c("range", "측정범위", "0~24시"),
          c("accuracy", "정확도", "±5%(120W/m²), 일 10분 이내"),
          c("resolution", "분해능", "0.1시"),
          c("environment", "운용환경", "-40~+45℃"),
          c("other", "기타", "입사각 특성 ±5%, 시초값 120W/m²"),
        ],
      },
    ],
  },
  {
    id: "visibility",
    label: "시정센서",
    page: "부록 2, p.126",
    forms: [
      {
        id: "scattering",
        label: "산란식",
        criteria: [
          c("range", "측정범위", "10~25000m 이상"),
          c("accuracy", "정확도", "±10%(<10000m), ±20%(≥10000m)"),
          c("resolution", "분해능", "10m"),
          c("environment", "운용환경", "-40~+60℃"),
          c("other", "기타", "샘플링 10~15초"),
        ],
      },
    ],
  },
  {
    id: "cloud",
    label: "운고센서",
    page: "부록 2, p.126",
    forms: [
      {
        id: "laser",
        label: "레이저식",
        criteria: [
          c("range", "측정범위", "10~7500m 이상"),
          c("accuracy", "정확도", "±10m(<1000m), ±30m(≥1000m)"),
          c("resolution", "분해능", "10m"),
          c("environment", "운용환경", "-40~+60℃"),
          c("other", "기타", "샘플링 15~60초"),
        ],
      },
    ],
  },
  {
    id: "snow",
    label: "적설센서",
    page: "부록 2, p.126",
    forms: [
      {
        id: "laser",
        label: "레이저식",
        criteria: [
          c("range", "측정범위", "0~300m"),
          c("accuracy", "정확도", "±0.5cm"),
          c("resolution", "분해능", "0.1cm"),
          c("environment", "운용환경", "-40~+50℃"),
          c("other", "기타", "3지점 이상 관측 포인트 산술평균, 샘플링 15~60초"),
        ],
      },
    ],
  },
];
