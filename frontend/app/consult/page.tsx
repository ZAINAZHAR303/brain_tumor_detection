"use client";

import { useEffect, useRef, useState } from "react";
import "./ConsultPage.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const QUICK_SUGGESTIONS = [
  "What are the types of brain tumors?",
  "Symptoms of a brain tumor",
  "How are brain tumors diagnosed?",
  "Treatment options for glioma",
  "What does an MRI scan show?",
  "What is a meningioma?",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your AI medical assistant. I specialize in brain tumors, neurology, and general medical topics. Feel free to ask me anything — from understanding MRI results to learning about treatment options.\n\nYou can type your question below or click one of the suggested topics to get started.",
};

export default function ConsultPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function generateId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setError(null);

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;
        throw new Error(
          payload?.detail ?? "Failed to get a response. Please try again."
        );
      }

      const data = (await response.json()) as { reply: string };

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleSuggestionClick(suggestion: string) {
    sendMessage(suggestion);
  }

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <main className="page-shell consult-page">
      <section className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-avatar-header">
              <span className="avatar-pulse"></span>
              <span className="avatar-icon">🧠</span>
            </div>
            <div>
              <h1>Medical AI Assistant</h1>
              <p className="chat-status">
                <span className="status-dot"></span>
                Online — Ready to help
              </p>
            </div>
          </div>
          <div className="chat-header-badge">
            <span>AI-Powered</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="medical-disclaimer">
          <span className="disclaimer-icon">⚕️</span>
          <p>
            This AI provides general medical information only. It is not a
            substitute for professional medical advice, diagnosis, or treatment.
            Always consult a qualified healthcare provider.
          </p>
        </div>

        {/* Messages area */}
        <div className="chat-messages" id="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble-wrapper ${msg.role === "user" ? "user-wrapper" : "assistant-wrapper"}`}
            >
              {msg.role === "assistant" && (
                <div className="bubble-avatar">🧠</div>
              )}
              <div
                className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "assistant-bubble"}`}
              >
                <div className="bubble-content">
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i}>{line || "\u00A0"}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="chat-bubble-wrapper assistant-wrapper">
              <div className="bubble-avatar">🧠</div>
              <div className="chat-bubble assistant-bubble typing-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="chat-error">
              <span>⚠️</span>
              <p>{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  const lastUserMsg = [...messages]
                    .reverse()
                    .find((m) => m.role === "user");
                  if (lastUserMsg) sendMessage(lastUserMsg.content);
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {showSuggestions && (
          <div className="suggestions-area">
            <p className="suggestions-label">Suggested topics</p>
            <div className="suggestions-grid">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="chat-input-bar">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask a medical question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              id="chat-input-field"
            />
            <button
              className="send-button"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              id="chat-send-button"
              aria-label="Send message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="input-hint">
            Press <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for new
            line
          </p>
        </div>
      </section>
    </main>
  );
}
