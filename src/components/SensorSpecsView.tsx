import React, { useState } from 'react';
import { Cpu, Search, Calendar, ShieldCheck, Wrench, MessageSquare } from 'lucide-react';
import { SENSOR_STANDARDS_TABLE } from '../data/standardGuideData';
import { SensorStandard } from '../types';

interface SensorSpecsViewProps {
  onAskSensor: (sensorName: string) => void;
}

export const SensorSpecsView: React.FC<SensorSpecsViewProps> = ({ onAskSensor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const filteredSensors = SENSOR_STANDARDS_TABLE.filter(
    (sensor) =>
      sensor.element.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.elementEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.installationRule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-slate-100">관측요소별 표준 기술규격 및 검정주기</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              기상관측표준화법령에 따른 요소별 표준 설치높이, 정밀도, 검정 유효기간을 한눈에 확인하세요.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="센서명 또는 규격 검색..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Toggle view mode */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-1 flex">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                카드형
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                표형
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSensors.map((sensor) => (
            <div
              key={sensor.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                {/* Top header */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-100 text-base">{sensor.element}</h3>
                  <span className="flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Calendar className="w-3 h-3" />
                    <span>검정 {sensor.calibrationPeriod}</span>
                  </span>
                </div>

                {/* Specs list */}
                <div className="space-y-2.5 text-xs text-slate-300 mt-3">
                  <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded-lg">
                    <span className="text-slate-400">표준 설치높이</span>
                    <span className="font-semibold text-blue-300">{sensor.height}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded-lg">
                    <span className="text-slate-400">정밀도 (허용오차)</span>
                    <span className="font-semibold text-slate-200 text-right">{sensor.accuracy}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded-lg">
                    <span className="text-slate-400">측정 단위 / 범위</span>
                    <span className="font-semibold text-slate-200">{sensor.range}</span>
                  </div>

                  <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      설치 지침
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{sensor.installationRule}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      점검 및 유지보수
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{sensor.maintenanceNote}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onAskSensor(`${sensor.element}의 기상관측표준화 설치기준과 검정 절차를 자세히 알려줘.`)}
                className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>이 센서 표준 질문하기</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-950 text-blue-300 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">관측 요소</th>
                  <th className="p-3.5">표준 설치높이</th>
                  <th className="p-3.5">정밀도 / 허용오차</th>
                  <th className="p-3.5">측정범위 및 단위</th>
                  <th className="p-3.5">법정 검정주기</th>
                  <th className="p-3.5">핵심 설치·점검 규칙</th>
                  <th className="p-3.5 text-center">질의</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredSensors.map((sensor) => (
                  <tr key={sensor.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-100 whitespace-nowrap">{sensor.element}</td>
                    <td className="p-3.5 text-blue-300 font-medium whitespace-nowrap">{sensor.height}</td>
                    <td className="p-3.5">{sensor.accuracy}</td>
                    <td className="p-3.5 font-mono">{sensor.range}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        {sensor.calibrationPeriod}
                      </span>
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-400 max-w-xs">{sensor.installationRule}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onAskSensor(`${sensor.element}의 상세 표준 규격과 검정 기준은?`)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-medium transition-colors"
                      >
                        질의
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
