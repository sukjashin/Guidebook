import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  HelpCircle, 
  ArrowRight, 
  BookOpen, 
  FileText, 
  History, 
  Download, 
  PlusCircle, 
  Compass, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2, 
  Layers,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { Message, ChatSession } from '../types';
import { QUICK_PROMPTS } from '../data/standardGuideData';
import { exportSession } from '../utils/historyExport';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClearHistory: () => void;
  onSelectPrompt: (prompt: string) => void;
  onOpenHistoryDrawer: () => void;
  historyCount: number;
  currentSession?: ChatSession | null;
  onNewCleanSession: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearHistory,
  onSelectPrompt,
  onOpenHistoryDrawer,
  historyCount,
  currentSession,
  onNewCleanSession,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if we are in a clean editor state (no user question yet)
  const isCleanEditor = messages.length <= 1;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadCurrent = () => {
    if (currentSession) {
      exportSession(currentSession, 'md');
    } else {
      const tempSession: ChatSession = {
        id: `temp-${Date.now()}`,
        title: messages.find((m) => m.role === 'user')?.content.slice(0, 30) || '기상관측표준화 질의',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages,
      };
      exportSession(tempSession, 'md');
    }
  };

  const CATEGORY_PROMPTS = [
    {
      id: 'env',
      label: '관측환경 & 10H',
      icon: Compass,
      prompts: [
        '풍향·풍속계를 옥상에 설치할 때 표준 높이 및 장애물 이격거리(10h) 기준은?',
        '기상관측소 표준 노장 부지(35㎡ 잔디밭)와 지표면 설치 조건은?',
        '관측지점 위치 이전(500m 또는 5m 초과) 시 승인 절차는?',
      ],
    },
    {
      id: 'sensor',
      label: '센서 규격 & 설치',
      icon: Sliders,
      prompts: [
        '온도·습도 센서 차광통 설치 높이(1.5m) 및 방열판 기준은?',
        '전도형 강수량계(수구 20cm, 0.5mm/0.1mm) 분해능 및 설치 높이 규격은?',
        '일사계·일조계 수평 유지 및 차폐각 허용 기준은?',
      ],
    },
    {
      id: 'calib',
      label: '측기검정 & 유효기간',
      icon: ShieldCheck,
      prompts: [
        '기상측기 10종 형식승인 및 검정 주기(유효기간 3년/5년) 정리해줘',
        '검정 유효기간 만료 10일 전 신청 시 수수료 전액 면제 조건은?',
        '검정 불합격 측기의 재검정 및 교체 규정은?',
      ],
    },
    {
      id: 'qc',
      label: '자료연계 & 5대 QC',
      icon: Layers,
      prompts: [
        '기상관측자료 유통 표준 파일 포맷(AWS 1분/10분)과 실제 데이터 레코드 예시 보여줘',
        '기상청 5대 실시간 품질검사(물리한계, 단계, 지속성, 내적일치성, 기후) 판정식은?',
        '광주광역시 1분 누적 일사량(W/㎡ → MJ/㎡) 기상청 전송 단위 변환 규정은?',
      ],
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100vh-4.5rem)] max-w-6xl mx-auto p-2 sm:p-4">
      {/* Top Workspace Header */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-2 py-2.5 px-3.5 bg-slate-900/90 border border-slate-800 rounded-xl mb-3 shadow-xs">
        <div className="flex items-center space-x-2.5 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>근거 문서</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="font-medium text-slate-200 flex items-center gap-1.5 truncate max-w-[260px] sm:max-w-none">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>「2026 기상관측표준화 업무가이드」 핵심 기준 DB</span>
          </span>
        </div>

        {/* Right Actions: History drawer, New clean session, Export */}
        <div className="flex items-center space-x-1.5">
          {/* History Drawer Trigger */}
          <button
            id="btn-open-history"
            onClick={onOpenHistoryDrawer}
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="질의 히스토리 보관함 열기"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>히스토리</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* New Clean Question / Editor Button */}
          {!isCleanEditor && (
            <button
              id="btn-new-clean-chat"
              onClick={onNewCleanSession}
              className="flex items-center space-x-1.5 text-xs font-medium text-white px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs"
              title="이전 대화를 히스토리에 보관하고 깨끗한 새 에디터 창으로 전환"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>새 질문 작성</span>
            </button>
          )}

          {/* Download Current Session File */}
          {!isCleanEditor && (
            <button
              id="btn-export-current"
              onClick={handleDownloadCurrent}
              className="flex items-center space-x-1 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="현재 질문·답변을 Markdown 파일로 저장"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">파일저장</span>
            </button>
          )}

          {/* Clear screen if needed */}
          {!isCleanEditor && (
            <button
              id="btn-clear-chat"
              onClick={onClearHistory}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
              title="화면 비우기"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isCleanEditor ? (
        /* ================= CLEAN EDITOR VIEW (깨끗한 에디터 창) ================= */
        <div className="flex-1 overflow-y-auto flex flex-col justify-between p-2 sm:p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <div className="max-w-3xl mx-auto w-full py-2 sm:py-4 space-y-4 sm:space-y-6">
            
            {/* Minimalist Hero Badge & Title */}
            <div className="text-center space-y-2 px-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] sm:text-xs font-medium">
                <FileText className="w-3.5 h-3.5" />
                <span className="sm:hidden">2026 업무가이드 기반 AI 비서</span>
                <span className="hidden sm:inline">기상관측표준화법 전문 근거 업무지원 에디터</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-100 tracking-tight">
                <span className="sm:hidden">무엇을 도와드릴까요?</span>
                <span className="hidden sm:inline">무엇이든 질문하시면 명쾌하고 정확하게 답변합니다</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto hidden sm:block">
                모든 답변은 **「2026 기상관측표준화 업무가이드」 핵심 기준 DB**의 법정 조항 및 수치 기준을 
                바탕으로 제공되며, 질의 완료 후 자동으로 **히스토리 파일**에 기록됩니다.
              </p>
              <p className="text-xs text-slate-400 sm:hidden">
                업무 분야를 선택하거나 아래에 바로 질문하세요.
              </p>
              <button
                type="button"
                onClick={() => setShowMobileGuide((open) => !open)}
                className="sm:hidden inline-flex items-center gap-1 text-xs text-blue-400 py-1"
                aria-expanded={showMobileGuide}
              >
                업무가이드 안내 {showMobileGuide ? '접기' : '자세히 보기'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMobileGuide ? 'rotate-180' : ''}`} />
              </button>
              {showMobileGuide && (
                <div className="sm:hidden text-left text-xs leading-relaxed text-slate-300 bg-slate-800/70 border border-slate-700 rounded-xl p-3">
                  관측환경, 센서 설치, 측기검정, 자료연계·품질관리 기준을 2026 업무가이드의 근거 조항과 함께 안내합니다.
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex overflow-x-auto sm:flex-wrap sm:items-center sm:justify-center gap-1.5 pt-1 sm:pt-2 pb-1 snap-x">
              <button
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
                }`}
              >
                전체 질문 예시
              </button>
              {CATEGORY_PROMPTS.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 flex items-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Prompt Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {(activeCategory === 'all'
                ? QUICK_PROMPTS
                : CATEGORY_PROMPTS.find((c) => c.id === activeCategory)?.prompts || QUICK_PROMPTS
              ).slice(0, 6).map((prompt, i) => (
                <button
                  key={i}
                  id={`clean-prompt-${i}`}
                  onClick={() => onSelectPrompt(prompt)}
                  className={`${i > 3 ? 'hidden sm:flex' : 'flex'} items-start justify-between text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-blue-500/50 transition-all group min-h-14`}
                >
                  <span className="text-xs text-slate-200 group-hover:text-blue-300 leading-snug">
                    {prompt}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 ml-2 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>

            {/* History info banner */}
            {historyCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <span>이전에 질문한 {historyCount}건의 내용이 **히스토리 보관함**에 안전하게 저장되어 있습니다.</span>
                </div>
                <button
                  onClick={onOpenHistoryDrawer}
                  className="text-blue-400 hover:text-blue-300 font-medium hover:underline shrink-0"
                >
                  히스토리 열기 →
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= ACTIVE CHAT / Q&A VIEW ================= */
        <div className="flex-1 overflow-y-auto space-y-4 px-1 sm:px-2 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              id={`message-${msg.id}`}
              className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white ${
                  msg.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-blue-500/20'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-none'
                }`}
              >
                {/* Message Content */}
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none space-y-2 text-slate-200">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 border border-slate-700 rounded-lg">
                            <table className="w-full text-xs text-left border-collapse" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-slate-900/80 text-blue-300 font-semibold border-b border-slate-700" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="p-2 border-r border-slate-700 last:border-r-0" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="p-2 border-t border-r border-slate-700/60 last:border-r-0" {...props} />
                        ),
                        code: ({ node, ...props }) => (
                          <code className="bg-slate-900/90 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-5 space-y-1 my-2" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-base font-bold text-blue-300 mt-4 mb-2" {...props} />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4 className="text-sm font-semibold text-slate-100 mt-3 mb-1" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-blue-500 pl-3 py-1 my-2 bg-slate-900/50 rounded-r text-slate-300 italic" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {/* Basis Document (근거 문서) tag if provided */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-400" />
                          근거 문서:
                        </span>
                        {msg.sources.map((src, i) => (
                          <span
                            key={i}
                            className="bg-slate-900/90 text-blue-300 font-medium px-2 py-0.5 rounded border border-blue-500/30 text-[11px]"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suggested Follow-up Questions */}
                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="mt-3 pt-2">
                        <p className="text-xs text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          추천 후속 질문:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => onSelectPrompt(q)}
                              className="text-xs bg-slate-900/70 hover:bg-slate-900 text-slate-300 hover:text-blue-300 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-blue-500/40 transition-colors text-left"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Copy Button & Action row */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/40">
                      <button
                        onClick={onNewCleanSession}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-slate-700/40 transition-colors font-medium"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>다음 질문 작성 (창 정리)</span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-slate-700/50 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">복사 완료</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>답변 복사</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-none text-slate-300 text-sm flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <span className="text-xs text-slate-400 ml-2">「2026 기상관측표준화 업무가이드」 근거 조항을 검색 및 분석 중입니다...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Form (Editor Box) */}
      <form onSubmit={handleSubmit} className="mt-2 sm:mt-3 relative shrink-0">
        <div className="relative flex items-end bg-slate-900 border border-slate-700/80 rounded-2xl p-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all shadow-md">
          <textarea
            ref={inputRef}
            id="chat-input-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="궁금한 업무 기준을 입력하세요"
            className="w-full bg-transparent text-slate-100 text-sm placeholder-slate-500 focus:outline-none resize-none max-h-36 min-h-[42px] sm:min-h-[48px] py-1.5 px-2 sm:px-3 leading-relaxed"
            rows={1}
          />
          <div className="flex items-center space-x-1.5 pl-2 pb-0.5">
            <button
              id="btn-send-message"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-sm flex-shrink-0"
              title="질의 전송"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
