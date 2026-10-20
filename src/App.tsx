import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ChatInterface } from "./components/ChatInterface";
import { GuideExplorer } from "./components/GuideExplorer";
import { StandardCalculator } from "./components/StandardCalculator";
import { SensorSpecsView } from "./components/SensorSpecsView";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { Message, ChatSession } from "./types";

const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL?.trim() ||
  (window.location.hostname.endsWith("github.io")
    ? "https://guidebook-sage.vercel.app/api/chat"
    : "/api/chat");

const INITIAL_MESSAGE: Message = {
  id: "welcome-1",
  role: "assistant",
  content: `안녕하십니까? 광주지방기상청 관측과 기상관측표준화 전문 AI 비서입니다.

기상청 공식 근거 문서인 **「2026 기상관측표준화 업무가이드」** (발간등록번호: 11-1360000-100230-14, 1~156쪽 전권)를 바탕으로 관측 표준화 관련 모든 질문에 정확하고 명쾌하게 답변해 드립니다.

■ 주요 안내 분야
1. **기상관측망 계획 및 지점 관리**: 지자체 구축·관리계획(정기 1월 31일 / 변경 7월 31일), 1km 최소이격거리, 500m/5m 이전 기준
2. **관측환경 및 노장 기준**: 35㎡ 잔디밭 부지, 풍향·풍속계 지상 10m 및 옥상 설치 높이 산정, 장애물 10h 이격
3. **기상측기 법정 관리**: 10종 측기 형식승인 및 검정 유효기간(3년/5년), 만료 10일 전 수수료 전액 면제 신청
4. **자료 연계 및 품질관리(QC)**: WGS84 좌표 등록, 5대 QC 조건 판정 및 1분 누적 일사량 단위 변환
5. **공문 및 안내 메일 작성**: "지자체 안내 메일 작성해줘" 등 요청 시 지자체 발송용 표준 공문서 초안 작성

궁금하신 점을 질문해 주시면 근거 문서의 원문 규정(p.XX)을 바탕으로 신속하고 친절하게 답변해 드리겠습니다.`,
  timestamp: Date.now(),
  sources: [
    "「2026 기상관측표준화 업무가이드」 (발간등록번호: 11-1360000-100230-14)",
  ],
  suggestedQuestions: [
    "풍향·풍속계를 옥상에 설치할 때 표준 높이 및 장애물 이격거리 기준은?",
    "기상측기 검정 유효기간과 수수료 면제 신청 기한을 알려줘",
    "광주광역시 일사관측 자료의 기상청 전송 단위 변환 규정은?",
    "지자체에 기상관측망 구축 및 관리계획 변경계획을 7월 31일까지 제출하라는 안내 메일 작성해줘",
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "chat" | "handbook" | "calculator" | "specs"
  >("chat");
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] =
    useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Sessions list (saved in localStorage)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("kma_std_chat_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse saved sessions", e);
      }
    }
    return [];
  });

  // Current active messages in the editor
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("kma_std_current_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse current messages", e);
      }
    }
    return [INITIAL_MESSAGE];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem("kma_std_chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Save current messages to localStorage
  useEffect(() => {
    localStorage.setItem("kma_std_current_messages", JSON.stringify(messages));
  }, [messages]);

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || null;

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [
      ...messages.filter((message) => message.id !== INITIAL_MESSAGE.id),
      userMsg,
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      if (window.location.hostname.endsWith("github.io") && CHAT_API_URL.startsWith("/")) {
        throw new Error(
          "GitHub Pages에는 챗봇 서버가 없습니다. 저장소의 VITE_CHAT_API_URL을 Vercel API 주소로 설정해 주세요.",
        );
      }

      const response = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: newMessages,
        }),
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`챗봇 서버 응답 오류 (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || `서버 응답 오류 (${response.status})`);
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "답변을 불러오지 못했습니다.",
        timestamp: Date.now(),
        sources: data.sources || ["「2026 기상관측표준화 업무가이드」"],
        suggestedQuestions: data.suggestedQuestions || [],
        usage: data.usage,
      };

      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);
      saveAnsweredSession(text, updatedMessages);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `⚠️ 오류가 발생했습니다: ${err.message || "서버와의 통신에 실패했습니다."}\n\n잠시 후 다시 시도해 주세요.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnsweredSession = (text: string, answeredMessages: Message[]) => {
    const sessionTitle = text.length > 35 ? text.slice(0, 35) + "..." : text;
    const targetSessionId = currentSessionId || `session-${Date.now()}`;

    setSessions((prev) => {
      const existingIndex = prev.findIndex(
        (session) => session.id === targetSessionId,
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          updatedAt: Date.now(),
          messages: answeredMessages,
        };
        return updated;
      }

      return [
        {
          id: targetSessionId,
          title: sessionTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: answeredMessages,
        },
        ...prev,
      ];
    });

    if (!currentSessionId) setCurrentSessionId(targetSessionId);
  };

  // Reset to a clean, pristine editor workspace
  const handleNewCleanSession = () => {
    setMessages([INITIAL_MESSAGE]);
    setCurrentSessionId(null);
    localStorage.removeItem("kma_std_current_messages");
  };

  const handleClearHistory = () => {
    handleNewCleanSession();
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setActiveTab("chat");
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      handleNewCleanSession();
    }
  };

  const handleDeleteSessions = (sessionIds: string[]) => {
    const deletingIds = new Set(sessionIds);
    setSessions((prev) => prev.filter((session) => !deletingIds.has(session.id)));
    if (currentSessionId && deletingIds.has(currentSessionId)) handleNewCleanSession();
  };

  const handleClearAllSessions = () => {
    setSessions([]);
    localStorage.removeItem("kma_std_chat_sessions");
    handleNewCleanSession();
  };

  const handleAskFromOtherTab = (questionText: string) => {
    setActiveTab("chat");
    handleSendMessage(questionText);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={sessions.length}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
      />

      <main className="flex-1 overflow-x-hidden">
        {activeTab === "chat" && (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onClearHistory={handleClearHistory}
            onSelectPrompt={(prompt) => handleSendMessage(prompt)}
            currentSession={currentSession}
            onNewCleanSession={handleNewCleanSession}
          />
        )}

        {activeTab === "handbook" && (
          <GuideExplorer onAskTopic={handleAskFromOtherTab} />
        )}

        {activeTab === "calculator" && (
          <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-sky-50 via-white to-blue-50 text-slate-900">
            <StandardCalculator onAskCompliance={handleAskFromOtherTab} />
          </div>
        )}

        {activeTab === "specs" && (
          <SensorSpecsView onAskSensor={handleAskFromOtherTab} />
        )}
      </main>

      {/* History File Drawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onDeleteSessions={handleDeleteSessions}
        onClearAllSessions={handleClearAllSessions}
        onNewSession={handleNewCleanSession}
      />

      {/* Footer */}
      <footer
        id="app-footer"
        className="hidden md:block bg-slate-900/90 border-t border-slate-800 py-3 px-4 text-center text-xs text-slate-400"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-200">
              광주지방기상청 관측과(062-720-0553)
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-slate-400">
              근거: 「2026 기상관측표준화 업무가이드」 핵심 기준 DB
            </span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
            <span>관측자료 연계 · 5대 QC · 측기검정 · 메타정보 등록</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
