import React, { useState } from 'react';
import { 
  History, 
  Download, 
  Trash2, 
  X, 
  Search, 
  FileText, 
  Clock, 
  ChevronRight,
  AlertTriangle,
  Check
} from 'lucide-react';
import { ChatSession } from '../types';
import { exportSession, exportAllSessions } from '../utils/historyExport';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId?: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAllSessions: () => void;
  onNewSession: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAllSessions,
  onNewSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'md' | 'txt' | 'json'>('md');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [deletedToast, setDeletedToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = s.title.toLowerCase().includes(q);
    const matchesMessages = s.messages.some((m) => m.content.toLowerCase().includes(q));
    return matchesTitle || matchesMessages;
  });

  const handleConfirmDelete = (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onDeleteSession(sessionId);
    setDeletingSessionId(null);
    setDeletedToast('해당 질의 히스토리가 삭제되었습니다.');
    setTimeout(() => setDeletedToast(null), 2500);
  };

  const handleConfirmClearAll = () => {
    onClearAllSessions();
    setShowClearAllModal(false);
    setDeletedToast('전체 질의 히스토리가 삭제되었습니다.');
    setTimeout(() => setDeletedToast(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          setDeletingSessionId(null);
          setShowClearAllModal(false);
          onClose();
        }}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl relative">
          
          {/* Toast Notification */}
          {deletedToast && (
            <div className="absolute top-16 left-4 right-4 z-20 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-3 py-2 rounded-lg text-xs flex items-center justify-between shadow-lg backdrop-blur-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{deletedToast}</span>
              </div>
              <button 
                onClick={() => setDeletedToast(null)}
                className="text-emerald-400 hover:text-emerald-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Clear All Confirmation Modal */}
          {showClearAllModal && (
            <div className="absolute inset-0 bg-slate-950/90 z-30 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-slate-900 border border-red-500/40 rounded-xl p-5 max-w-sm w-full shadow-2xl text-center space-y-3">
                <div className="w-10 h-10 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">전체 질의 히스토리 삭제</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  보관된 <strong className="text-red-300 font-semibold">{sessions.length}개의 모든 질의 기록</strong>을 완전히 삭제하시겠습니까?<br />
                  이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex items-center justify-center space-x-2 pt-2">
                  <button
                    onClick={() => setShowClearAllModal(false)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmClearAll}
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    전체 삭제
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-100">질의 히스토리 보관함</h2>
                <p className="text-xs text-slate-400">총 {sessions.length}개의 질의 기록 보관 중</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Bar & Export Format */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onNewSession();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
              >
                <span>+ 새 질의 에디터 열기</span>
              </button>

              {sessions.length > 0 && (
                <div className="flex items-center space-x-1">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                    title="저장 파일 형식"
                  >
                    <option value="md">Markdown (.md)</option>
                    <option value="txt">텍스트 (.txt)</option>
                    <option value="json">JSON (.json)</option>
                  </select>

                  <button
                    onClick={() => exportAllSessions(sessions, exportFormat)}
                    className="flex items-center space-x-1 py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                    title="전체 히스토리 파일 다운로드"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>전체저장</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="과거 질문 및 답변 내용 검색..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">
                  {searchQuery ? '검색 결과와 일치하는 히스토리가 없습니다.' : '보관된 질의 히스토리가 없습니다.'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  질문창에서 질문을 전송하면 자동으로 히스토리 파일로 안전하게 기록됩니다.
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = currentSessionId === session.id;
                const isDeleting = deletingSessionId === session.id;
                const firstUserMsg = session.messages.find((m) => m.role === 'user')?.content || session.title;
                const firstAiMsg = session.messages.find((m) => m.role === 'assistant')?.content;
                const formattedDate = new Date(session.createdAt).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={session.id}
                    className={`group relative rounded-xl border p-3 transition-all duration-200 ${
                      isDeleting
                        ? 'bg-red-950/40 border-red-500/60 ring-1 ring-red-500/40'
                        : isSelected
                        ? 'bg-blue-950/40 border-blue-500/50 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {/* Inline Delete Confirmation Bar */}
                    {isDeleting ? (
                      <div className="p-1 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center space-x-1.5 text-xs text-red-300 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>이 질의 기록을 삭제하시겠습니까?</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            id={`btn-confirm-delete-${session.id}`}
                            onClick={(e) => handleConfirmDelete(session.id, e)}
                            className="flex-1 py-1 px-2.5 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold transition-colors flex items-center justify-center space-x-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>삭제 확인</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSessionId(null);
                            }}
                            className="flex-1 py-1 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px] transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Header info */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <button
                            onClick={() => {
                              onSelectSession(session);
                              onClose();
                            }}
                            className="text-left flex-1"
                          >
                            <h3 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-blue-300 transition-colors">
                              {session.title || firstUserMsg}
                            </h3>
                          </button>
                          <div className="flex items-center space-x-1 shrink-0">
                            {/* Download session button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportSession(session, exportFormat);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-300 hover:bg-slate-700 rounded transition-colors"
                              title={`이 질의를 ${exportFormat.toUpperCase()} 파일로 다운로드`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete session button (triggers inline confirmation) */}
                            <button
                              id={`btn-delete-session-${session.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingSessionId(session.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/50 rounded transition-colors"
                              title="질의 기록 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Preview snippet */}
                        {firstAiMsg && (
                          <p 
                            onClick={() => {
                              onSelectSession(session);
                              onClose();
                            }}
                            className="text-[11px] text-slate-400 line-clamp-2 mb-2 cursor-pointer hover:text-slate-300"
                          >
                            {firstAiMsg.replace(/[#*`_]/g, '')}
                          </p>
                        )}

                        {/* Footer tags & metadata */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-700/40">
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {formattedDate}
                            </span>
                            <span>•</span>
                            <span>질의 {session.messages.filter((m) => m.role === 'user').length}건</span>
                          </div>

                          <button
                            onClick={() => {
                              onSelectSession(session);
                              onClose();
                            }}
                            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
                          >
                            <span>창에 불러오기</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          {sessions.length > 0 && (
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
              <button
                id="btn-clear-all-sessions"
                onClick={() => setShowClearAllModal(true)}
                className="flex items-center space-x-1 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>전체 기록 비우기</span>
              </button>

              <span className="text-[11px] text-slate-500">
                근거: 2026 업무가이드(156p)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
