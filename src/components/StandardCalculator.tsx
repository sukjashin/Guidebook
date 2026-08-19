import React, { useState } from 'react';
import { Calculator, CheckCircle, AlertTriangle, XCircle, ShieldCheck, Copy, Check, Sparkles, Sliders } from 'lucide-react';
import { STANDARDIZATION_CHECKLIST } from '../data/standardGuideData';
import { ChecklistItem } from '../types';

interface StandardCalculatorProps {
  onAskCompliance: (summaryText: string) => void;
}

export const StandardCalculator: React.FC<StandardCalculatorProps> = ({ onAskCompliance }) => {
  // 10H Calculator state
  const [obstacleHeight, setObstacleHeight] = useState<number>(10);
  const [actualDistance, setActualDistance] = useState<number>(105);
  const [obstacleType, setObstacleType] = useState<string>('building');

  // Sensor Height check state
  const [windHeight, setWindHeight] = useState<number>(10.0);
  const [tempHeight, setTempHeight] = useState<number>(1.5);
  const [rainHeight, setRainHeight] = useState<number>(0.6);
  const [obsArea, setObsArea] = useState<number>(36);
  const [groundCover, setGroundCover] = useState<'grass' | 'bare' | 'paved'>('grass');

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>(STANDARDIZATION_CHECKLIST);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // 10H calculation (Guide Part 2 p.30 & Appendix 1)
  const requiredDistance = obstacleHeight * 10;
  const currentRatio = actualDistance > 0 && obstacleHeight > 0 ? (actualDistance / obstacleHeight).toFixed(1) : '0';
  const ratioNum = parseFloat(currentRatio);

  let environmentGrade: { grade: string; level: 'pass' | 'warning' | 'fail'; desc: string } = {
    grade: '1등급 (표준 완전 적합)',
    level: 'pass',
    desc: '장애물 높이의 10배(10h) 이상 거리를 확보하여 기류 왜곡 없는 최적의 관측환경입니다.'
  };

  if (ratioNum >= 10) {
    environmentGrade = {
      grade: '표준 적합 (10h 이상 충족)',
      level: 'pass',
      desc: `장애물 높이의 ${currentRatio}배 이격으로 2026 기상관측표준화 업무가이드 10h 원칙을 완벽히 충족합니다.`
    };
  } else if (ratioNum >= 2.5) {
    environmentGrade = {
      grade: '조건부 충족 (최소 2.5h 이상)',
      level: 'warning',
      desc: `장애물 높이의 ${currentRatio}배 이격(2.5h~10h 구간). 최소 설치기준은 충족하나 관측환경 평가에서 등급 조정이 발생할 수 있습니다.`
    };
  } else {
    environmentGrade = {
      grade: '기준 미달 (2.5h 미만 부적합)',
      level: 'fail',
      desc: `장애물 높이의 ${currentRatio}배 이격으로 2.5h 미만입니다. 기류 차폐로 인해 기상관측시설 설치가 부적합합니다.`
    };
  }

  // Sensor height assessments (Guide Part 2 p.29~30)
  const isWindOk = windHeight >= 9.5 && windHeight <= 10.5;
  const isTempOk = tempHeight >= 1.2 && tempHeight <= 2.0;
  const isRainOk = rainHeight >= 0.3; // 지면/옥상 30cm 이상
  const isAreaOk = obsArea >= 35; // 35㎡ 이상
  const isGroundOk = groundCover === 'grass';

  // Toggle checklist item
  const toggleItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const checkedCount = checklist.filter(c => c.checked).length;
  const complianceScore = Math.round((checkedCount / checklist.length) * 100);

  const generateReportSummary = () => {
    return `[2026 기상관측표준화 업무가이드 기반 현장 적합성 진단 결과]
1. 관측환경 및 노장 조건:
   - 장애물 높이 ${obstacleHeight}m 대비 실측거리 ${actualDistance}m (비율: ${currentRatio}h)
     ➔ 판정: ${environmentGrade.grade} (${environmentGrade.desc})
   - 관측장소 면적: ${obsArea}㎡ (${isAreaOk ? '적합 - 35㎡ 이상' : '부적합 - 35㎡ 미만'})
   - 지표면 피복: ${groundCover === 'grass' ? '자연 잔디(적합)' : '비잔디/포장(부적합)'}
2. 센서별 표준 설치높이 검증:
   - 풍향·풍속계: ${windHeight}m (${isWindOk ? '표준 적합(10.0m)' : '부적합 - 표준: 지면 10m'})
   - 온·습도 차광통: ${tempHeight}m (${isTempOk ? '표준 적합(1.2~2.0m)' : '부적합 - 표준: 1.2~2.0m'})
   - 강수량계 수수구: ${rainHeight}m (${isRainOk ? '표준 적합(30cm 이상)' : '부적합 - 표준: 30cm 이상'})
3. 9대 필수 체크리스트 준수율: ${checkedCount}/${checklist.length}개 항목 충족 (${complianceScore}%)

위 현장 진단 결과를 2026 기상관측표준화 업무가이드 규정에 맞춰 분석하고 미충족 항목에 대한 구체적인 개선 절차를 안내해 주세요.`;
  };

  const copyReport = () => {
    navigator.clipboard.writeText(generateReportSummary());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleAskAI = () => {
    onAskCompliance(generateReportSummary());
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-slate-100">현장 관측환경 적합성 계산기 및 점검표</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              2026 기상관측표준화 업무가이드에 수록된 10h 이격거리, 면적 35㎡, 센서 표준높이 기준을 자가진단하세요.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyReport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSummary ? '복사됨' : '진단결과 복사'}</span>
            </button>
            <button
              onClick={handleAskAI}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI 비서에게 자문 요청</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 10H & Sensor Height Calculators */}
        <div className="lg:col-span-6 space-y-6">
          {/* 10H Obstacle Distance Calculator Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                1. 노장 주변 장애물 이격거리(10h) 판정
              </h3>
              <span className="text-xs text-slate-400 font-mono">가이드 p.30</span>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">장애물 종류</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'building', label: '건물·구조물' },
                    { id: 'tree', label: '수목·숲' },
                    { id: 'fence', label: '옹벽·기타' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setObstacleType(t.id)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        obstacleType === t.id
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    장애물 높이 (h, 단위: m)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={obstacleHeight}
                    onChange={(e) => setObstacleHeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">지면/옥상 기준 장애물 최고점 높이</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    실측 이격거리 (D, 단위: m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="1"
                    value={actualDistance}
                    onChange={(e) => setActualDistance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">풍향·풍속 센서에서 장애물까지의 거리</span>
                </div>
              </div>

              {/* 10H Result Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  environmentGrade.level === 'pass'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : environmentGrade.level === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {environmentGrade.level === 'pass' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : environmentGrade.level === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm">{environmentGrade.grade}</span>
                    <span className="text-xs opacity-80 font-mono">
                      (현재: {currentRatio}h / 권장: {requiredDistance}m 이상)
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">{environmentGrade.desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sensor Height Validator Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                2. 노장 면적 및 센서별 표준 설치높이 검증
              </h3>
              <span className="text-xs text-slate-400 font-mono">가이드 p.29~30</span>
            </div>

            <div className="space-y-4">
              {/* Observation Area */}
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div>
                  <div className="text-xs font-semibold text-slate-200">관측장소 면적</div>
                  <div className="text-[11px] text-slate-400">표준: 35㎡ 이상 (원형 또는 정사각형)</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={obsArea}
                      onChange={(e) => setObsArea(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-slate-100"
                    />
                    <span className="text-xs text-slate-400">㎡</span>
                  </div>
                  {isAreaOk ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> 적합
                    </span>
                  ) : (
                    <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> 부적합
                    </span>
                  )}
                </div>
              </div>

              {/* Wind */}
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div>
                  <div className="text-xs font-semibold text-slate-200">풍향·풍속계 높이</div>
                  <div className="text-[11px] text-slate-400">표준: 지면 10.0m (허용 9.5~10.5m)</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={windHeight}
                      onChange={(e) => setWindHeight(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-slate-100"
                    />
                    <span className="text-xs text-slate-400">m</span>
                  </div>
                  {isWindOk ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> 적합
                    </span>
                  ) : (
                    <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> 부적합
                    </span>
                  )}
                </div>
              </div>

              {/* Temp / Humidity */}
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div>
                  <div className="text-xs font-semibold text-slate-200">온·습도 차광통 높이</div>
                  <div className="text-[11px] text-slate-400">표준: 차광통 지면·옥상 1.2m ~ 2.0m</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={tempHeight}
                      onChange={(e) => setTempHeight(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-slate-100"
                    />
                    <span className="text-xs text-slate-400">m</span>
                  </div>
                  {isTempOk ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> 적합
                    </span>
                  ) : (
                    <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> 부적합
                    </span>
                  )}
                </div>
              </div>

              {/* Rain */}
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div>
                  <div className="text-xs font-semibold text-slate-200">강수량계 수수구 높이</div>
                  <div className="text-[11px] text-slate-400">표준: 지면/옥상 30cm(0.3m) 이상</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.05"
                      value={rainHeight}
                      onChange={(e) => setRainHeight(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-slate-100"
                    />
                    <span className="text-xs text-slate-400">m</span>
                  </div>
                  {isRainOk ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> 적합
                    </span>
                  ) : (
                    <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> 부적합
                    </span>
                  )}
                </div>
              </div>

              {/* Ground Cover */}
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div>
                  <div className="text-xs font-semibold text-slate-200">지표면 자연 잔디 피복</div>
                  <div className="text-[11px] text-slate-400">표준: 자연 잔디 (아스팔트/콘크리트 금지)</div>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={groundCover}
                    onChange={(e) => setGroundCover(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="grass">자연 잔디 (표준)</option>
                    <option value="bare">맨땅·자연토양</option>
                    <option value="paved">아스팔트·콘크리트</option>
                  </select>
                  {isGroundOk ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> 적합
                    </span>
                  ) : (
                    <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> 부적합
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 9-Point Standardization Checklist */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 h-full flex flex-col justify-between">
            <div>
              {/* Checklist Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    기상관측표준화 9대 필수 체크리스트
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    2026 업무가이드 현장 실사 및 점검 기준표입니다.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400 font-mono">{complianceScore}%</div>
                  <div className="text-[11px] text-slate-500">
                    {checkedCount} / {checklist.length} 충족
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-3">
                <div
                  className={`h-full transition-all duration-300 ${
                    complianceScore === 100
                      ? 'bg-emerald-500'
                      : complianceScore >= 70
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${complianceScore}%` }}
                />
              </div>

              {/* Checklist Items */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      item.checked
                        ? 'bg-blue-950/30 border-blue-500/50 text-slate-200'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0 mt-0.5"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{item.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">{item.description}</p>
                      <div className="text-blue-300/80 text-[10px] mt-1 font-mono">
                        기준: {item.standardRule}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {complianceScore === 100
                  ? '🎉 모든 표준화 요건을 충족합니다!'
                  : '⚠️ 미충족 항목에 대한 보완이 필요합니다.'}
              </span>
              <button
                onClick={handleAskAI}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>체크리스트 기반 AI 질의</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
