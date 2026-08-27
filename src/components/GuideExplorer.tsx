import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, BookOpen, ChevronRight, MessageSquare, Tag, Shield, Compass, Sliders, CheckCircle2 } from 'lucide-react';
import { STANDARD_GUIDE_TOPICS } from '../data/standardGuideData';
import { GuideTopic } from '../types';

interface GuideExplorerProps {
  onAskTopic: (question: string) => void;
}

export const GuideExplorer: React.FC<GuideExplorerProps> = ({ onAskTopic }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<GuideTopic>(STANDARD_GUIDE_TOPICS[0]);

  const categories = [
    { id: 'all', label: '전체 주제', icon: BookOpen },
    { id: 'legal', label: '법령·기본방침', icon: Shield },
    { id: 'environment', label: '관측환경·노장', icon: Compass },
    { id: 'sensor', label: '센서 기술규격', icon: Sliders },
    { id: 'calibration', label: '측기검정', icon: CheckCircle2 },
    { id: 'qc', label: '품질관리(QC)', icon: Tag },
    { id: 'maintenance', label: '점검·유지관리', icon: CheckCircle2 },
  ];

  const filteredTopics = useMemo(() => {
    return STANDARD_GUIDE_TOPICS.filter((topic) => {
      const matchCategory = selectedCategory === 'all' || topic.category === selectedCategory;
      const matchSearch =
        searchTerm === '' ||
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.keyStandards.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              기상관측표준화 업무가이드 핸드북
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              기상관측표준화법 및 기상청 공식 지침에 수록된 핵심 장별 규격과 해설을 열람하세요.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="guide-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="표준 규격, 10H, 검정주기 검색..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topic List Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            주요 표준화 규정 목록 ({filteredTopics.length})
          </div>

          {filteredTopics.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm">
              검색 조건에 일치하는 표준화 규정이 없습니다.
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {filteredTopics.map((topic) => {
                const isCurrent = selectedTopic?.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    id={`topic-item-${topic.id}`}
                    onClick={() => setSelectedTopic(topic)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-slate-800/90 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {topic.categoryName}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-500 ${isCurrent ? 'text-blue-400 translate-x-0.5' : ''} transition-transform`} />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-100 mb-1">{topic.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{topic.summary}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Topic Detail View */}
        <div className="lg:col-span-8">
          {selectedTopic ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
              {/* Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {selectedTopic.categoryName}
                  </span>
                  {selectedTopic.relatedArticles && (
                    <span className="text-xs text-slate-400">
                      근거 조항: <strong className="text-slate-300">{selectedTopic.relatedArticles}</strong>
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-100">{selectedTopic.title}</h2>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{selectedTopic.summary}</p>
              </div>

              {/* Key Standard Points (Highlights) */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  핵심 표준 준수 기준
                </h4>
                <ul className="space-y-2">
                  {selectedTopic.keyStandards.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detailed Markdown Content */}
              <div className="prose prose-invert prose-sm max-w-none text-slate-200 bg-slate-950/40 p-5 rounded-xl border border-slate-800/80">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    del: ({ node, ...props }) => <span {...props} />,
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-3 border border-slate-700 rounded-lg">
                        <table className="w-full text-xs text-left border-collapse" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead className="bg-slate-900 text-blue-300 font-semibold border-b border-slate-700" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className="p-2.5 border-r border-slate-700 last:border-r-0" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="p-2.5 border-t border-r border-slate-700/60 last:border-r-0" {...props} />
                    ),
                  }}
                >
                  {selectedTopic.details.replace(/~~/g, '~')}
                </ReactMarkdown>
              </div>

              {/* Frequently Asked Section with Quick AI consultation button */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  이 규정과 관련된 질문을 AI에게 바로 물어보기:
                </h4>
                <div className="space-y-2">
                  {selectedTopic.frequentlyAsked.map((faq, i) => (
                    <button
                      key={i}
                      onClick={() => onAskTopic(faq)}
                      className="w-full flex items-center justify-between p-3 bg-slate-800/60 hover:bg-blue-600/20 hover:border-blue-500/50 border border-slate-700 rounded-xl text-left text-sm text-slate-200 transition-colors group"
                    >
                      <span className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span>{faq}</span>
                      </span>
                      <span className="text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        챗봇 질의 ➔
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              왼쪽 목록에서 규정을 선택해 주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
