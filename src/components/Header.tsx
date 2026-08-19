import React from 'react';
import { CloudSun, BookOpen, CheckSquare, MessageSquare, Cpu, FileText, History } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'handbook' | 'calculator' | 'specs';
  setActiveTab: (tab: 'chat' | 'handbook' | 'calculator' | 'specs') => void;
  hasApiKey?: boolean;
  historyCount?: number;
  onOpenHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  historyCount = 0,
  onOpenHistory,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight">
                  기상관측표준화 업무가이드
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  AI 챗봇 & 업무지원
                </span>
                <span className="hidden lg:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>근거: 2026 업무가이드(156p)</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                기상청 기상관측표준화법 · 관측환경 10H 기준 · 센서 규격 · 측기검정 · 5대 QC 가이드
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                id="tab-chat"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>AI 챗봇 질의</span>
              </button>

              <button
                id="tab-handbook"
                onClick={() => setActiveTab('handbook')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'handbook'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>업무가이드북</span>
              </button>

              <button
                id="tab-calculator"
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'calculator'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span className="hidden md:inline">현장 적합성 진단기</span>
                <span className="md:hidden">적합성 진단</span>
              </button>

              <button
                id="tab-specs"
                onClick={() => setActiveTab('specs')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'specs'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span className="hidden md:inline">센서 표준 규격표</span>
                <span className="md:hidden">센서 규격</span>
              </button>
            </nav>

            {/* History drawer button */}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors ml-1"
                title="질의 히스토리 파일 보관함 열기"
              >
                <History className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">히스토리</span>
                {historyCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                    {historyCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
