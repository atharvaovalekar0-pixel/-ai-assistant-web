"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

type Session = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
};

const STORAGE_KEY = "ai-assistant-sessions";

function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage can fail (private browsing, quota) - fail silently,
    // the chat still works for the current page load.
  }
}

function newSession(): Session {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    createdAt: Date.now(),
  };
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadSessions();
    if (loaded.length === 0) {
      const s = newSession();
      setSessions([s]);
      setActiveId(s.id);
    } else {
      setSessions(loaded);
      setActiveId(loaded[0].id);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [sessions, activeId, loading]);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  function handleNewChat() {
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setError(null);
  }

  function updateActiveMessages(updater: (msgs: ChatMessage[]) => ChatMessage[]) {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeId ? { ...s, messages: updater(s.messages) } : s))
    );
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !active || loading) return;

    setError(null);
    setInput("");

    const history = active.messages;
    updateActiveMessages((msgs) => [...msgs, { role: "user", text }]);

    if (active.messages.length === 0) {
      const title = text.slice(0, 40) + (text.length > 40 ? "..." : "");
      setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, title } : s)));
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Request failed.");
      }
      updateActiveMessages((msgs) => [...msgs, { role: "model", text: data.text }]);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">Assistant</div>
        <button className="new-chat-btn" onClick={handleNewChat}>
          + New chat
        </button>
        <div className="session-list">
          {sessions
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((s) => (
              <button
                key={s.id}
                className={`session-item ${s.id === activeId ? "active" : ""}`}
                onClick={() => setActiveId(s.id)}
              >
                {s.title}
              </button>
            ))}
        </div>
      </aside>

      <main className="main">
        <div className="chat-scroll" ref={scrollRef}>
          <div className="chat-inner">
            {active && active.messages.length === 0 && (
              <div className="empty-state">
                <h1>Ask me anything</h1>
                <p>
                  I can answer general questions and look things up on the web when it
                  helps — current events, recent facts, anything beyond what I already know.
                </p>
              </div>
            )}

            {active?.messages.map((m, i) => (
              <div key={i} className={`message-row ${m.role}`}>
                <div className={m.role === "user" ? "bubble-user" : "bubble-model"}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && <div className="thinking">Thinking…</div>}
          </div>
        </div>

        <div className="input-bar">
          {error && <div className="error-banner">{error}</div>}
          <div className="input-form">
            <textarea
              rows={1}
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
