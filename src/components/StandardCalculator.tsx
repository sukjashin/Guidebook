import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  CloudSun,
  Copy,
  Download,
  FileCheck2,
  Gauge,
  Info,
  Plus,
  RotateCcw,
  Ruler,
  Trash2,
  TriangleAlert,
  Wind,
} from "lucide-react";
import { APPENDIX_SENSOR_SPECS } from "../data/appendixSensorSpecs";
import {
  createEmptyObstacle,
  diagnoseSite,
  EMPTY_SITE_FORM,
  INSTRUMENT_LABELS,
  InstrumentType,
  ObstacleInput,
  SiteForm,
} from "../utils/siteDiagnosis";

interface StandardCalculatorProps {
  onAskCompliance: (summaryText: string) => void;
}
type Mode = "home" | "grade" | "spec";
type SpecJudgement = "pass" | "fail" | "check";
interface SpecEntry {
  value: string;
  judgement: SpecJudgement;
}

const STORAGE_KEY = "kma_site_diagnosis_draft_v2";
const STEPS = ["측기 선택", "필수값 입력", "장애물 확인", "진단 결과"];
const instrumentIcons: Record<InstrumentType, React.ReactNode> = {
  tempHumidity: <CloudSun className="h-6 w-6" />,
  rain: <Gauge className="h-6 w-6" />,
  wind: <Wind className="h-6 w-6" />,
  globalSolar: <BarChart3 className="h-6 w-6" />,
  sunshine: <CloudSun className="h-6 w-6" />,
};
const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const cardClass =
  "rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6";

function Field({
  label,
  value,
  onChange,
  unit,
  type = "text",
  help,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  type?: string;
  help?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
      <span>
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <span className="relative block">
        <input
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} ${unit ? "pr-14" : ""}`}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
            {unit}
          </span>
        )}
      </span>
      {help && (
        <span className="flex items-start gap-1 text-xs font-normal leading-relaxed text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {help}
        </span>
      )}
    </label>
  );
}
function Toggle({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  help?: string;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-800">
          {label}
        </span>
        {help && (
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
            {help}
          </span>
        )}
      </span>
    </label>
  );
}
function SectionTitle({
  children,
  description,
}: {
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-slate-900">{children}</h3>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      )}
    </div>
  );
}

export const StandardCalculator: React.FC<StandardCalculatorProps> = () => {
  const saved = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }, []);
  const [mode, setMode] = useState<Mode>(saved.mode || "home");
  const [step, setStep] = useState(saved.step || 0);
  const [instrument, setInstrument] = useState<InstrumentType>(
    saved.instrument || "wind",
  );
  const [form, setForm] = useState<SiteForm>({
    ...EMPTY_SITE_FORM,
    ...(saved.form || {}),
  });
  const [obstacles, setObstacles] = useState<ObstacleInput[]>(
    saved.obstacles || [],
  );
  const [noObstacles, setNoObstacles] = useState(saved.noObstacles || false);
  const [copied, setCopied] = useState(false);
  const [selectedSensorId, setSelectedSensorId] = useState("temperature");
  const [selectedFormId, setSelectedFormId] = useState("metal");
  const [specEntries, setSpecEntries] = useState<Record<string, SpecEntry>>({});
  const [specChecked, setSpecChecked] = useState(false);
  const result = useMemo(
    () => diagnoseSite(instrument, form, obstacles, noObstacles),
    [instrument, form, obstacles, noObstacles],
  );
  const selectedSensor =
    APPENDIX_SENSOR_SPECS.find((sensor) => sensor.id === selectedSensorId) ||
    APPENDIX_SENSOR_SPECS[0];
  const selectedSensorForm =
    selectedSensor.forms.find((item) => item.id === selectedFormId) ||
    selectedSensor.forms[0];

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode, step, instrument, form, obstacles, noObstacles }),
    );
  }, [mode, step, instrument, form, obstacles, noObstacles]);
  useEffect(() => {
    if (!selectedSensor.forms.some((item) => item.id === selectedFormId))
      setSelectedFormId(selectedSensor.forms[0].id);
    setSpecEntries({});
    setSpecChecked(false);
  }, [selectedSensorId]);
  useEffect(() => {
    setSpecEntries({});
    setSpecChecked(false);
  }, [selectedFormId]);

  const updateForm = <K extends keyof SiteForm>(key: K, value: SiteForm[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const updateObstacle = (
    id: string,
    key: keyof ObstacleInput,
    value: string | boolean,
  ) =>
    setObstacles((previous) =>
      previous.map((obstacle) =>
        obstacle.id === id ? { ...obstacle, [key]: value } : obstacle,
      ),
    );
  const addObstacle = () => {
    setNoObstacles(false);
    setObstacles((previous) => [...previous, createEmptyObstacle()]);
  };
  const obstacleText = () =>
    noObstacles
      ? "주변 장애물 없음"
      : obstacles
          .map((obstacle, index) => {
            const assessment = result.obstacleAssessments.find(
              (item) => item.id === obstacle.id,
            );
            const calculation =
              assessment?.ratio !== undefined && assessment.ratio !== Infinity
                ? `거리 ${obstacle.distance}m ÷ 유효높이 ${assessment.effectiveHeight?.toFixed(1) ?? "-"}m = ${assessment.ratio.toFixed(1)}`
                : assessment?.note || "계산 결과 없음";
            return `${index + 1}. ${obstacle.name || "명칭 미입력"} / 거리 ${obstacle.distance || "-"}m / 높이 ${obstacle.height || "-"}m / ${calculation}`;
          })
          .join("\n");
  const resultText = () =>
    `[기상관측시설 현장 자가진단]\n기관: ${form.organization} / 시설: ${form.stationName} / 지점번호: ${form.stationNumber || "-"}\n점검자: ${form.inspector} / 점검일: ${form.inspectionDate}\n설치장소: ${form.locationType} / 주변환경: ${form.environmentDescription || "-"}\n측기: ${INSTRUMENT_LABELS[instrument]}\n특수환경: ${form.specialEnvironment ? `해당 (${form.specialReason})` : "해당 없음"}\n진단결과: ${result.displayGrade}\n\n[장애물별 계산]\n${obstacleText()}\n\n판정근거: ${result.pageReference}\n충족 기준: ${result.met.join(", ") || "-"}\n미충족 기준: ${result.unmet.join(", ") || "-"}\n누락항목: ${result.missing.join(", ") || "없음"}\n개선방법: ${result.improvements.join(", ") || "-"}\n진단일시: ${new Date().toLocaleString("ko-KR")}\n\n본 결과는 「2026 기상관측표준화 업무가이드」에 따른 사전 자가진단 결과이며, 공식 시설등급 확정 결과가 아닙니다.`;
  const copyResult = async () => {
    await navigator.clipboard.writeText(resultText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const downloadResult = () => {
    const blob = new Blob([resultText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `현장자가진단_${form.stationName || "결과"}_${form.inspectionDate}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const resetDraft = () => {
    if (!window.confirm("현재 입력한 내용을 모두 지울까요?")) return;
    setForm({
      ...EMPTY_SITE_FORM,
      inspectionDate: new Date().toISOString().slice(0, 10),
    });
    setObstacles([]);
    setNoObstacles(false);
    setStep(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const renderInstrumentFields = () => {
    if (instrument === "tempHumidity")
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="관측장소 경사도"
            value={form.slope}
            onChange={(v) => updateForm("slope", v)}
            type="number"
            unit="°"
            required
          />
          <Field
            label="자연식생 높이"
            value={form.vegetationHeight}
            onChange={(v) => updateForm("vegetationHeight", v)}
            type="number"
            unit="cm"
            required
          />
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            지표면 상태<span className="text-rose-500"> *</span>
            <select
              value={form.naturalSurface}
              onChange={(e) =>
                updateForm(
                  "naturalSurface",
                  e.target.value as SiteForm["naturalSurface"],
                )
              }
              className={inputClass}
            >
              <option value="">선택하세요</option>
              <option value="yes">자연식생</option>
              <option value="no">인공지표면/기타</option>
            </select>
          </label>
          <Field
            label="열원·수원 명칭"
            value={form.heatWaterName}
            onChange={(v) => updateForm("heatWaterName", v)}
            help="예: 주차장, 콘크리트 표면, 연못, 관개지역"
          />
          <Field
            label="열원·수원까지 거리"
            value={form.heatWaterDistance}
            onChange={(v) => updateForm("heatWaterDistance", v)}
            type="number"
            unit="m"
            required
          />
          {[100, 30, 10, 5, 3].map((radius) => (
            <Field
              key={radius}
              label={`반경 ${radius}m 이내 열원·수원 비율`}
              value={form[`ratio${radius}` as keyof SiteForm] as string}
              onChange={(v) =>
                setForm((p) => ({ ...p, [`ratio${radius}`]: v }))
              }
              type="number"
              unit="%"
              required
            />
          ))}
          <Field
            label="그늘이 생기지 않는 최소 태양고도각"
            value={form.shadeFreeAbove}
            onChange={(v) => updateForm("shadeFreeAbove", v)}
            type="number"
            unit="°"
            help="이 각도를 초과하면 그늘이 생기지 않는 값을 입력하세요."
            required
          />
          <Toggle
            checked={form.naturalTerrainShadow}
            onChange={(v) => updateForm("naturalTerrainShadow", v)}
            label="자연적 지형 기복으로 인한 그늘"
            help="자연적 지형 기복의 그늘은 장애물로 간주하지 않습니다."
          />
        </div>
      );
    if (instrument === "rain")
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="관측장소 경사도"
            value={form.slope}
            onChange={(v) => updateForm("slope", v)}
            type="number"
            unit="°"
            required
          />
          <Field
            label="강수량계 수수구 높이"
            value={form.gaugeHeight}
            onChange={(v) => updateForm("gaugeHeight", v)}
            type="number"
            unit="m"
            help="장애물 유효높이는 전체높이에서 수수구 높이를 빼서 계산합니다."
            required
          />
          <Toggle
            checked={form.windShield}
            onChange={(v) => updateForm("windShield", v)}
            label="바람막이 설치됨"
          />
          <Toggle
            checked={form.uniformObstacles}
            onChange={(v) => updateForm("uniformObstacles", v)}
            label="균일한 높이의 장애물로 둘러싸임"
          />
        </div>
      );
    if (instrument === "wind")
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="센서 설치 높이"
            value={form.sensorHeight}
            onChange={(v) => updateForm("sensorHeight", v)}
            type="number"
            unit="m"
            help="장애물 유효높이는 센서의 10m 아래를 기준으로 자동 계산합니다."
            required
          />
          <Field
            label="주변환경 거칠기 길이"
            value={form.roughnessLength}
            onChange={(v) => updateForm("roughnessLength", v)}
            type="number"
            unit="m"
            help="개활지 0.03, 키 작은 작물 0.10, 공원·관목 0.5, 도시외곽·산림 1.0, 도심 2.0 이상"
            required
          />
          <Toggle
            checked={form.belowTenMeters}
            onChange={(v) => updateForm("belowTenMeters", v)}
            label="10m보다 낮은 높이에서 관측"
            help="판정 시 4등급 또는 5등급에 S를 표시합니다."
          />
        </div>
      );
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="그늘이 생기지 않는 최소 태양고도각"
          value={form.shadeFreeAbove}
          onChange={(v) => updateForm("shadeFreeAbove", v)}
          type="number"
          unit="°"
          required
        />
        <Field
          label="연중 낮 시간 중 그늘 발생 비율"
          value={form.annualShadePercent}
          onChange={(v) => updateForm("annualShadePercent", v)}
          type="number"
          unit="%"
          required
        />
        <Toggle
          checked={form.naturalTerrainShadow}
          onChange={(v) => updateForm("naturalTerrainShadow", v)}
          label="자연적 지형 기복으로 인한 그늘"
          help="등급 부여 시 고려하지 않습니다."
        />
      </div>
    );
  };

  const renderHome = () => (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className={`${cardClass} bg-gradient-to-br from-white to-blue-50`}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-600 p-3 text-white">
            <ClipboardCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              기상관측시설 현장 자가진단
            </h1>
            <p className="mt-2 text-base text-slate-600">
              측기별 관측환경과 센서 규격을 업무가이드 기준으로 확인합니다.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={() => {
            setMode("grade");
            setStep(0);
          }}
          className="group min-h-48 rounded-2xl border-2 border-blue-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-lg"
        >
          <Ruler className="h-9 w-9 text-blue-600" />
          <h2 className="mt-5 text-xl font-bold text-slate-950">
            기상측기별 시설등급 진단
          </h2>
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            부록 1 기준으로 관측환경과 장애물을 분석하여 1~5등급 또는 4S·5S를
            판정합니다.
          </p>
          <span className="mt-5 flex items-center gap-1 font-semibold text-blue-700">
            진단 시작 <ArrowRight className="h-4 w-4" />
          </span>
        </button>
        <button
          onClick={() => setMode("spec")}
          className="group min-h-48 rounded-2xl border-2 border-cyan-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500 hover:shadow-lg"
        >
          <FileCheck2 className="h-9 w-9 text-cyan-600" />
          <h2 className="mt-5 text-xl font-bold text-slate-950">
            관측센서 표준규격 확인
          </h2>
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            부록 2 기준으로 측정범위, 정확도, 분해능, 운용환경 등의 적합 여부를
            확인합니다.
          </p>
          <span className="mt-5 flex items-center gap-1 font-semibold text-cyan-700">
            규격 확인 <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <strong>검토 안내:</strong> 시설등급과 센서 규격 적합 여부는 서로 다른
        기준이며 하나의 점수로 합산하지 않습니다. 입력자료는 현재 브라우저에만
        저장됩니다.
      </div>
    </div>
  );
  const renderProgress = () => (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[620px] items-center gap-2">
        {STEPS.map((label, index) => (
          <React.Fragment key={label}>
            <button
              onClick={() => index <= step && setStep(index)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold ${index === step ? "bg-blue-600 text-white" : index < step ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"}`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-xs text-blue-800">
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              {label}
            </button>
            {index < 4 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderGradeStep = () => {
    if (step === 0)
      return (
        <div className={cardClass}>
          <SectionTitle description="진단할 측기를 선택하면 필요한 현장 항목만 표시됩니다.">
            측기 선택
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(INSTRUMENT_LABELS) as InstrumentType[]).map((key) => (
              <button
                key={key}
                onClick={() => setInstrument(key)}
                className={`min-h-28 rounded-2xl border-2 p-4 text-left transition ${instrument === key ? "border-blue-600 bg-blue-50 text-blue-900 shadow-md" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"}`}
              >
                <span className="text-blue-600">{instrumentIcons[key]}</span>
                <span className="mt-3 block text-base font-bold">
                  {INSTRUMENT_LABELS[key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    if (step === 1)
      return (
        <div className="space-y-4">
          <details className={cardClass}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-900">
              <span>
                기록용 정보 <span className="ml-1 text-sm font-normal text-slate-500">(선택)</span>
              </span>
              <ChevronDown className="h-5 w-5 text-slate-500" />
            </summary>
            <p className="mb-4 mt-2 text-sm leading-relaxed text-slate-500">
              기관명·점검자 등은 결과 판정에 사용되지 않습니다. 보고서에 기록할 때만 입력하세요.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="기관명"
                value={form.organization}
                onChange={(v) => updateForm("organization", v)}
              />
              <Field
                label="관측시설명"
                value={form.stationName}
                onChange={(v) => updateForm("stationName", v)}
              />
              <Field
                label="지점번호"
                value={form.stationNumber}
                onChange={(v) => updateForm("stationNumber", v)}
              />
              <Field
                label="점검자"
                value={form.inspector}
                onChange={(v) => updateForm("inspector", v)}
              />
              <Field
                label="점검일"
                value={form.inspectionDate}
                onChange={(v) => updateForm("inspectionDate", v)}
                type="date"
              />
              <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                설치 장소
                <select
                  value={form.locationType}
                  onChange={(e) =>
                    updateForm(
                      "locationType",
                      e.target.value as SiteForm["locationType"],
                    )
                  }
                  className={inputClass}
                >
                  <option value="ground">지상</option>
                  <option value="rooftop">옥상</option>
                  <option value="other">기타</option>
                </select>
              </label>
              <label className="sm:col-span-2 space-y-1.5 text-sm font-semibold text-slate-700">
                주변 환경 설명
                <textarea
                  value={form.environmentDescription}
                  onChange={(e) =>
                    updateForm("environmentDescription", e.target.value)
                  }
                  rows={3}
                  className={inputClass}
                />
              </label>
              <Toggle
                checked={form.specialEnvironment}
                onChange={(v) => updateForm("specialEnvironment", v)}
                label="복잡한 지형 또는 도시지역 등 특수환경"
              />
              {form.specialEnvironment && (
                <Field
                  label="특수환경 사유"
                  value={form.specialReason}
                  onChange={(v) => updateForm("specialReason", v)}
                />
              )}
            </div>
          </details>
          <div className={cardClass}>
            <SectionTitle
              description={`별표(*)가 있는 ${INSTRUMENT_LABELS[instrument]} 판정값만 입력하면 됩니다.`}
            >
              진단에 필요한 값
            </SectionTitle>
            {renderInstrumentFields()}
          </div>
        </div>
      );
    if (step === 2)
      return (
        <div className="space-y-4">
          <div className={cardClass}>
            <SectionTitle description="먼저 주변 장애물 유무만 선택하세요. 장애물이 있을 때만 측정칸이 나타납니다.">
              주변에 영향을 줄 건물·나무·구조물이 있나요?
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setNoObstacles(false);
                  if (obstacles.length === 0) setObstacles([createEmptyObstacle()]);
                }}
                className={`min-h-14 rounded-xl border-2 px-4 font-bold ${!noObstacles && obstacles.length > 0 ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700"}`}
              >
                예, 장애물이 있어요
              </button>
              <button
                type="button"
                onClick={() => {
                  setNoObstacles(true);
                  setObstacles([]);
                }}
                className={`min-h-14 rounded-xl border-2 px-4 font-bold ${noObstacles ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700"}`}
              >
                아니요, 없어요
              </button>
            </div>
            {!noObstacles && (
              <button
                onClick={addObstacle}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 font-bold text-blue-700"
              >
                <Plus className="h-5 w-5" /> 장애물 추가
              </button>
            )}
          </div>
          {!noObstacles &&
            obstacles.map((obstacle, index) => (
              <details key={obstacle.id} open className={cardClass}>
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3">
                  <span>
                    <span className="block font-bold text-slate-900">
                      장애물 {index + 1}: {obstacle.name || "명칭 미입력"}
                    </span>
                    <span className="text-sm text-slate-500">
                      거리 {obstacle.distance || "-"}m · 높이{" "}
                      {obstacle.height || "-"}m
                    </span>
                  </span>
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                </summary>
                <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                  <Field
                    label="장애물 명칭 또는 종류"
                    value={obstacle.name}
                    onChange={(v) => updateObstacle(obstacle.id, "name", v)}
                    required
                  />
                  <Field
                    label="센서와 장애물 사이 거리"
                    value={obstacle.distance}
                    onChange={(v) => updateObstacle(obstacle.id, "distance", v)}
                    type="number"
                    unit="m"
                    required
                  />
                  <Field
                    label="장애물 전체 높이"
                    value={obstacle.height}
                    onChange={(v) => updateObstacle(obstacle.id, "height", v)}
                    type="number"
                    unit="m"
                    required
                  />
                  <Field
                    label="장애물 폭"
                    value={obstacle.width}
                    onChange={(v) => updateObstacle(obstacle.id, "width", v)}
                    type="number"
                    unit="m"
                    required={instrument === "wind"}
                  />
                  <Field
                    label="센서 설치 높이"
                    value={
                      instrument === "wind"
                        ? form.sensorHeight
                        : obstacle.sensorHeight
                    }
                    onChange={(v) =>
                      instrument === "wind"
                        ? updateForm("sensorHeight", v)
                        : updateObstacle(obstacle.id, "sensorHeight", v)
                    }
                    type="number"
                    unit="m"
                  />
                  <Field
                    label="각 너비"
                    value={obstacle.angularWidth}
                    onChange={(v) =>
                      updateObstacle(obstacle.id, "angularWidth", v)
                    }
                    type="number"
                    unit="°"
                    required={
                      instrument === "wind" ||
                      instrument === "rain" ||
                      instrument === "globalSolar"
                    }
                  />
                  <Field
                    label="고도각"
                    value={obstacle.angularHeight}
                    onChange={(v) =>
                      updateObstacle(obstacle.id, "angularHeight", v)
                    }
                    type="number"
                    unit="°"
                    required={instrument === "globalSolar"}
                  />
                  <Field
                    label="장애물 알베도"
                    value={obstacle.albedo}
                    onChange={(v) => updateObstacle(obstacle.id, "albedo", v)}
                    type="number"
                    help="0.5보다 크면 반사성 장애물로 자동 분류합니다."
                  />
                  <Toggle
                    checked={obstacle.single}
                    onChange={(v) => updateObstacle(obstacle.id, "single", v)}
                    label="단일 장애물"
                  />
                  <Toggle
                    checked={obstacle.reflective}
                    onChange={(v) =>
                      updateObstacle(obstacle.id, "reflective", v)
                    }
                    label="반사성 장애물"
                  />
                  <Toggle
                    checked={obstacle.terrainChange}
                    onChange={(v) =>
                      updateObstacle(obstacle.id, "terrainChange", v)
                    }
                    label="지형 대표성을 벗어난 지형 변화"
                  />
                  <label className="sm:col-span-2 space-y-1.5 text-sm font-semibold text-slate-700">
                    비고
                    <textarea
                      value={obstacle.note}
                      onChange={(e) =>
                        updateObstacle(obstacle.id, "note", e.target.value)
                      }
                      rows={2}
                      className={inputClass}
                    />
                  </label>
                  <button
                    onClick={() =>
                      setObstacles((previous) =>
                        previous.filter((item) => item.id !== obstacle.id),
                      )
                    }
                    className="sm:col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 font-semibold text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" /> 이 장애물 삭제
                  </button>
                </div>
              </details>
            ))}
        </div>
      );
    if (step === 30)
      return (
        <div className="space-y-4">
          <div className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <SectionTitle description="진단 전에 입력 내용을 검토하세요.">
                입력내용 확인
              </SectionTitle>
              <button
                onClick={() => setStep(1)}
                className="text-sm font-semibold text-blue-700"
              >
                수정
              </button>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">기관·시설</dt>
                <dd className="font-semibold text-slate-900">
                  {form.organization || "-"} · {form.stationName || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">측기</dt>
                <dd className="font-semibold text-slate-900">
                  {INSTRUMENT_LABELS[instrument]}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">점검자·점검일</dt>
                <dd className="font-semibold text-slate-900">
                  {form.inspector || "-"} · {form.inspectionDate || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">장애물</dt>
                <dd className="font-semibold text-slate-900">
                  {noObstacles
                    ? "주변 장애물 없음"
                    : `${obstacles.length}개 등록`}
                </dd>
              </div>
            </dl>
          </div>
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900">현장환경·측기별 입력</h3>
              <button
                onClick={() => setStep(1)}
                className="min-h-11 px-3 text-sm font-semibold text-blue-700"
              >
                수정
              </button>
            </div>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">설치 장소</dt>
                <dd className="font-semibold text-slate-900">
                  {
                    { ground: "지상", rooftop: "옥상", other: "기타" }[
                      form.locationType
                    ]
                  }
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">특수환경</dt>
                <dd className="font-semibold text-slate-900">
                  {form.specialEnvironment
                    ? `해당 (${form.specialReason || "사유 미입력"})`
                    : "해당 없음"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">주변 환경 설명</dt>
                <dd className="font-semibold text-slate-900">
                  {form.environmentDescription || "-"}
                </dd>
              </div>
            </dl>
          </div>
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900">등록된 장애물</h3>
              <button
                onClick={() => setStep(2)}
                className="min-h-11 px-3 text-sm font-semibold text-blue-700"
              >
                수정
              </button>
            </div>
            {noObstacles ? (
              <p className="mt-3 text-sm text-slate-700">주변 장애물 없음</p>
            ) : (
              <div className="mt-3 space-y-2">
                {obstacles.map((obstacle) => (
                  <div
                    key={obstacle.id}
                    className="rounded-xl bg-slate-50 p-3 text-sm"
                  >
                    <p className="font-semibold text-slate-900">
                      {obstacle.name || "명칭 미입력"}
                    </p>
                    <p className="mt-1 text-slate-600">
                      거리 {obstacle.distance || "-"}m · 높이{" "}
                      {obstacle.height || "-"}m · 각 너비{" "}
                      {obstacle.angularWidth || "-"}°
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={cardClass}>
            <h3 className="font-bold text-slate-900">필수 입력 확인</h3>
            {result.missing.length ? (
              <ul className="mt-3 space-y-2 text-sm text-rose-700">
                {result.missing.map((item) => (
                  <li key={item} className="flex gap-2">
                    <TriangleAlert className="h-4 w-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                필수 입력항목이 모두 확인되었습니다.
              </p>
            )}
          </div>
        </div>
      );
    return (
      <div className="space-y-4">
        <div className={`${cardClass} text-center`}>
          <p className="text-sm font-semibold text-blue-700">
            {INSTRUMENT_LABELS[instrument]}
          </p>
          <div
            className={`mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-full text-2xl font-black ${result.grade ? "bg-blue-600 text-white" : "bg-amber-100 text-amber-900"}`}
          >
            {result.displayGrade}
          </div>
          {result.grade === null && (
            <p className="mt-4 font-semibold text-amber-800">
              판정에 필요한 정보가 부족합니다.
            </p>
          )}
          <p className="mt-4 text-sm text-slate-600">
            근거: {result.pageReference}
          </p>
        </div>
        {result.decisiveObstacle && (
          <div className={cardClass}>
            <h3 className="font-bold text-slate-900">가장 불리한 장애물</h3>
            <p className="mt-2 text-slate-700">
              {result.decisiveObstacle.name} · {result.decisiveObstacle.note}
            </p>
            {result.decisiveObstacle.ratio !== undefined &&
              result.decisiveObstacle.ratio !== Infinity && (
                <p className="mt-2 rounded-lg bg-blue-50 p-3 font-mono text-sm text-blue-900">
                  거리 ÷ 유효높이 = {result.decisiveObstacle.ratio.toFixed(1)}
                </p>
              )}
          </div>
        )}
        {result.obstacleAssessments.length > 0 && (
          <div className={cardClass}>
            <h3 className="font-bold text-slate-900">장애물별 계산 결과</h3>
            <div className="mt-3 space-y-3">
              {result.obstacleAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="font-semibold text-slate-900">
                    {assessment.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {assessment.note}
                  </p>
                  {assessment.ratio !== undefined &&
                    assessment.ratio !== Infinity && (
                      <p className="mt-2 font-mono text-sm text-blue-800">
                        거리 ÷ 유효 장애물 높이 = {assessment.ratio.toFixed(1)}
                      </p>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className={cardClass}>
            <h3 className="font-bold text-emerald-800">충족한 기준</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {result.met.length ? (
                result.met.map((item) => <li key={item}>✓ {item}</li>)
              ) : (
                <li>-</li>
              )}
            </ul>
          </div>
          <div className={cardClass}>
            <h3 className="font-bold text-rose-800">미충족·누락 기준</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {[...result.unmet, ...result.missing].length ? (
                [...result.unmet, ...result.missing].map((item) => (
                  <li key={item}>• {item}</li>
                ))
              ) : (
                <li>없음</li>
              )}
            </ul>
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold text-slate-900">시설등급 개선 방법</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {result.improvements.length ? (
              result.improvements.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li>누락 항목을 먼저 입력해 주세요.</li>
            )}
          </ul>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={copyResult}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 font-semibold text-blue-800"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "복사됨" : "결과 복사"}
            </button>
            <button
              onClick={downloadResult}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white"
            >
              <Download className="h-4 w-4" />
              결과 파일 저장
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-relaxed text-amber-900">
          본 결과는 「2026 기상관측표준화 업무가이드」에 따른 사전 자가진단
          결과이며, 공식 시설등급 확정 결과가 아닙니다.
        </div>
      </div>
    );
  };

  const specStatus = () => {
    const entries = selectedSensorForm.criteria.map(
      (criterion) => specEntries[criterion.key],
    );
    if (entries.some((entry) => !entry?.value.trim())) return "입력정보 부족";
    if (entries.some((entry) => entry.judgement === "fail")) return "부적합";
    if (entries.some((entry) => entry.judgement === "check"))
      return "확인 필요";
    return "적합";
  };
  const specResultText = () => {
    const rows = selectedSensorForm.criteria.map((criterion) => {
      const entry = specEntries[criterion.key];
      const judgement = !entry?.value
        ? "입력정보 부족"
        : entry.judgement === "pass"
          ? "적합"
          : entry.judgement === "fail"
            ? "부적합"
            : "확인 필요";
      return `${criterion.label}\n- 기준값: ${criterion.standard}\n- 입력값: ${entry?.value || "-"}\n- 판정: ${judgement}`;
    });
    return `[관측센서 표준규격 확인]\n센서: ${selectedSensor.label}\n형식: ${selectedSensorForm.label}\n종합 결과: ${specStatus()}\n근거: ${selectedSensor.page}\n\n${rows.join("\n\n")}\n\n이 결과는 사양서 대조를 돕는 검토 결과이며 공식 적합성 판정을 대체하지 않습니다.`;
  };
  const copySpecResult = async () => {
    await navigator.clipboard.writeText(specResultText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const downloadSpecResult = () => {
    const blob = new Blob([specResultText()], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `센서표준규격_${selectedSensor.label}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const renderSpec = () => (
    <div className="mx-auto max-w-6xl space-y-5 p-4 pb-24 sm:p-6">
      <button
        onClick={() => setMode("home")}
        className="flex min-h-11 items-center gap-2 font-semibold text-blue-700"
      >
        <ArrowLeft className="h-5 w-5" />
        진단 메뉴로
      </button>
      <div className={cardClass}>
        <SectionTitle description="부록 2의 시설등급과 별개인 관측센서 표준규격을 확인합니다.">
          관측센서 표준규격 확인
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            센서 선택
            <select
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              className={inputClass}
            >
              {APPENDIX_SENSOR_SPECS.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            센서 형식
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className={inputClass}
            >
              {selectedSensor.forms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          근거: {selectedSensor.page} · 제조사 사양서와 기준을 대조한 후 각
          항목의 판정을 선택하세요.
        </p>
      </div>
      <div className="space-y-3">
        {selectedSensorForm.criteria.map((criterion) => {
          const entry = specEntries[criterion.key] || {
            value: "",
            judgement: "check" as SpecJudgement,
          };
          return (
            <div key={criterion.key} className={cardClass}>
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_180px]">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {criterion.label} 기준
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {criterion.standard}
                  </p>
                </div>
                <Field
                  label="제조사 사양서 입력값"
                  value={entry.value}
                  onChange={(value) =>
                    setSpecEntries((previous) => ({
                      ...previous,
                      [criterion.key]: { ...entry, value },
                    }))
                  }
                  required
                />
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  비교 판정
                  <select
                    value={entry.judgement}
                    onChange={(e) =>
                      setSpecEntries((previous) => ({
                        ...previous,
                        [criterion.key]: {
                          ...entry,
                          judgement: e.target.value as SpecJudgement,
                        },
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="check">확인 필요</option>
                    <option value="pass">기준 충족</option>
                    <option value="fail">기준 미충족</option>
                  </select>
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => setSpecChecked(true)}
        className="min-h-12 w-full rounded-xl bg-blue-600 px-5 font-bold text-white shadow-lg shadow-blue-200"
      >
        표준규격 확인 결과 보기
      </button>
      {specChecked && (
        <div className={cardClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {selectedSensor.label} · {selectedSensorForm.label}
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">
                {specStatus()}
              </h3>
            </div>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800">
              시설등급과 별도 판정
            </span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[680px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-3">항목</th>
                  <th className="p-3">기준값</th>
                  <th className="p-3">입력값</th>
                  <th className="p-3">판정</th>
                </tr>
              </thead>
              <tbody>
                {selectedSensorForm.criteria.map((criterion) => {
                  const entry = specEntries[criterion.key];
                  return (
                    <tr
                      key={criterion.key}
                      className="border-t border-slate-200"
                    >
                      <td className="p-3 font-semibold">{criterion.label}</td>
                      <td className="p-3">{criterion.standard}</td>
                      <td className="p-3">{entry?.value || "-"}</td>
                      <td className="p-3 font-semibold">
                        {!entry?.value
                          ? "입력정보 부족"
                          : entry.judgement === "pass"
                            ? "적합"
                            : entry.judgement === "fail"
                              ? "부적합"
                              : "확인 필요"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={copySpecResult}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 font-semibold text-blue-800"
            >
              <Copy className="h-4 w-4" />
              {copied ? "복사됨" : "결과 복사"}
            </button>
            <button
              onClick={downloadSpecResult}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white"
            >
              <Download className="h-4 w-4" />
              결과 파일 저장
            </button>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        이 기능은 사양서 대조를 돕는 검토 도구입니다. 형식승인·검정 또는 공식
        적합성 판정을 대체하지 않습니다.
      </div>
    </div>
  );

  if (mode === "home") return renderHome();
  if (mode === "spec") return renderSpec();
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 pb-28 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setMode("home")}
          className="flex min-h-11 items-center gap-2 font-semibold text-blue-700"
        >
          <ArrowLeft className="h-5 w-5" />
          진단 메뉴로
        </button>
        <button
          onClick={resetDraft}
          className="flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <RotateCcw className="h-4 w-4" />
          초기화
        </button>
      </div>
      {renderProgress()}
      <div>
        <h1 className="text-2xl font-black text-slate-950">
          기상측기별 시설등급 진단
        </h1>
        <p className="mt-1 text-base text-slate-600">
          {INSTRUMENT_LABELS[instrument]} · {STEPS[step]}
        </p>
      </div>
      {renderGradeStep()}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-100 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-3">
          <button
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40"
          >
            <ArrowLeft className="h-5 w-5" />
            이전
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((current) => Math.min(3, current + 1))}
              className="flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-200"
            >
              {step === 2 ? "진단 결과 보기" : "다음"}
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setStep(0)}
              className="flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white"
            >
              새 진단 시작
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
