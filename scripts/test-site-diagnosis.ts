import assert from "node:assert/strict";
import {
  diagnoseSite,
  EMPTY_SITE_FORM,
  type ObstacleInput,
  type SiteForm,
} from "../src/utils/siteDiagnosis";
import { APPENDIX_SENSOR_SPECS } from "../src/data/appendixSensorSpecs";

const baseForm = (changes: Partial<SiteForm> = {}): SiteForm => ({
  ...EMPTY_SITE_FORM,
  organization: "테스트기관",
  stationName: "테스트관측소",
  inspector: "점검자",
  inspectionDate: "2026-08-21",
  ...changes,
});

const obstacle = (
  id: string,
  changes: Partial<ObstacleInput> = {},
): ObstacleInput => ({
  id,
  name: `장애물-${id}`,
  distance: "100",
  height: "10",
  width: "10",
  sensorHeight: "10",
  angularWidth: "20",
  angularHeight: "10",
  single: false,
  reflective: false,
  albedo: "0.2",
  terrainChange: false,
  note: "",
  ...changes,
});

const missing = diagnoseSite("wind", EMPTY_SITE_FORM, [], false);
assert.equal(missing.grade, null);
assert.ok(missing.missing.includes("기관명"));
assert.ok(missing.missing.includes("장애물 또는 주변 장애물 없음 선택"));

const wind = baseForm({ sensorHeight: "10", roughnessLength: "0.03" });
assert.equal(
  diagnoseSite(
    "wind",
    wind,
    [obstacle("a", { distance: "300" }), obstacle("b", { distance: "60" })],
    false,
  ).grade,
  3,
);
assert.equal(
  diagnoseSite(
    "wind",
    { ...wind, specialEnvironment: true, specialReason: "도시지역" },
    [obstacle("c", { distance: "26" })],
    false,
  ).displayGrade,
  "4S",
);

const rain = baseForm({ slope: "5", gaugeHeight: "1", windShield: true });
assert.equal(
  diagnoseSite(
    "rain",
    rain,
    [obstacle("r", { height: "5", distance: "16", angularWidth: "20" })],
    false,
  ).grade,
  1,
);

const temp = baseForm({
  slope: "5",
  vegetationHeight: "5",
  naturalSurface: "yes",
  heatWaterDistance: "100",
  ratio100: "10",
  ratio30: "5",
  ratio10: "1",
  ratio5: "1",
  ratio3: "1",
  shadeFreeAbove: "5",
});
assert.equal(diagnoseSite("tempHumidity", temp, [], true).grade, 1);

const solar = baseForm({ shadeFreeAbove: "5", annualShadePercent: "0" });
assert.equal(
  diagnoseSite(
    "globalSolar",
    solar,
    [
      obstacle("s", {
        reflective: true,
        angularWidth: "15",
        angularHeight: "6",
      }),
    ],
    false,
  ).grade,
  2,
);
assert.equal(
  diagnoseSite(
    "sunshine",
    baseForm({ shadeFreeAbove: "3", annualShadePercent: "0" }),
    [],
    true,
  ).grade,
  1,
);

assert.equal(APPENDIX_SENSOR_SPECS.length, 12);
assert.deepEqual(
  APPENDIX_SENSOR_SPECS.map((sensor) => sensor.label),
  [
    "온도센서",
    "습도센서",
    "풍향센서",
    "풍속센서",
    "강수량센서",
    "강수유무센서",
    "기압센서",
    "일사센서",
    "일조센서",
    "시정센서",
    "운고센서",
    "적설센서",
  ],
);
assert.ok(
  APPENDIX_SENSOR_SPECS.every(
    (sensor) =>
      sensor.forms.length > 0 &&
      sensor.forms.every((form) => form.criteria.length > 0),
  ),
);

console.log("현장 판정 7건 및 부록 2 센서 12종 데이터 검증 통과");
