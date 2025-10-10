// src/components/ResultsWithChat.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

useEffect(() => {
  socket.on("kicked", () => {
    navigate("/kicked");
  });

  return () => {
    socket.off("kicked");
  };
}, [socket]);


const Bar = ({ idx, pct, active, label }) => (
  <div className="flex items-center gap-3 my-3">
    <div className="w-7 h-7 rounded-full grid place-items-center bg-grayLight text-grayDark font-bold">
      {idx}
    </div>

    <div className="relative flex-1 h-11 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
      <div
        className={`h-full ${active ? "bg-primary" : "bg-primaryLight"} transition-all duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
      {label ? (
        <div className="absolute inset-0 flex items-center px-3 text-white font-bold pointer-events-none">
          {label}
        </div>
      ) : null}
    </div>

    <div className="w-12 text-right font-bold text-gray-800">{pct}%</div>
  </div>
);

export default function ResultsWithChat() {
  const socket = useContext(SocketContext);

  // results state
  const [questionText, setQuestionText] = useState("Awaiting question...");
  const [timerText, setTimerText] = useState("00:00");
  const [results, setResults] = useState([]); // [{ idx, pct, active, label }]
  // chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]); // [{ sender, text }]
  const [draft, setDraft] = useState("");
  const chatListRef = useRef(null);
  const inputRef = useRef(null);

  // helper: map raw counts -> array with percentages
  const mapResultsToBars = (resultCount) => {
    // resultCount example: { Mars: 3, Earth: 1 }
    const total = Object.values(resultCount).reduce((s, n) => s + n, 0);
    return Object.entries(resultCount).map(([label, count], idx) => ({
      idx: idx + 1,
      label,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
      active: count > 0,
    }));
  };

  useEffect(() => {
    // poll started => update question
    const onStarted = (poll) => {
      setQuestionText(poll?.question ?? "New Question");
      setResults([]); // reset
      setTimerText(poll?.timer ?? "00:00");
    };

    const onUpdate = (data) => {
      setResults(mapResultsToBars(data));
    };

    const onFinal = (data) => {
      setResults(mapResultsToBars(data));
    };

    const onChatMessage = (payload) => {
      // payload: { sender: "Name", text: "Hello" }
      setMessages((m) => [...m, payload]);
    };

    socket.on("poll_started", onStarted);
    socket.on("poll_update", onUpdate);
    socket.on("poll_results", onFinal);
    socket.on("chat_message", onChatMessage);

    return () => {
      socket.off("poll_started", onStarted);
      socket.off("poll_update", onUpdate);
      socket.off("poll_results", onFinal);
      socket.off("chat_message", onChatMessage);
    };
  }, [socket]);

  // autoscroll chat to bottom when messages change
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages, chatOpen]);

  // toggle chat popup; focus input when opened
  const toggleChat = () => {
    setChatOpen((s) => {
      const next = !s;
      // focus input a tick after open
      if (next) setTimeout(() => inputRef.current?.focus(), 100);
      return next;
    });
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    // Emit minimal payload - backend will attach socket.data.name
    socket.emit("send_chat", { text });
    setDraft("");
    // Optionally, optimistically add (frontend only) - but we rely on server broadcast
    // setMessages(m => [...m, { sender: "You", text }]);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-[720px] max-w-[92vw] rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-[#494949] text-white font-bold px-5 py-3">
          {questionText}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 text-gray-700 font-semibold">
            <span>Question</span>
            <span className="text-grayMid">⏱ {timerText}</span>
          </div>

          <div className="mt-3">
            {results.length > 0 ? (
              results.map((r) => (
                <Bar key={r.idx} idx={r.idx} pct={r.pct} active={r.active} label={r.label} />
              ))
            ) : (
              <p className="text-grayMid mt-4">Waiting for responses...</p>
            )}
          </div>

          <div className="mt-2 text-grayMid font-semibold">
            Wait for the teacher to ask a new question..
          </div>

          {/* Floating chat button */}
          <button
            onClick={toggleChat}
            className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary grid place-items-center"
            title="Open chat"
          >
            💬
          </button>

          {/* Chat popup (renders above UI when chatOpen) */}
          {chatOpen && (
            <div className="fixed bottom-20 right-6 w-[320px] max-w-[92vw] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-primary text-white flex items-center justify-between">
                <div className="font-semibold">Class Chat</div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white opacity-90 hover:opacity-100"
                  title="Close chat"
                >
                  ✕
                </button>
              </div>

              {/* Message list */}
              <div
                ref={chatListRef}
                className="h-[240px] overflow-auto px-3 py-3 space-y-3 bg-gray-50"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-grayMid">No messages yet — say hi 👋</div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 grid place-items-center text-sm font-semibold text-grayDark">
                        {m.sender?.[0] ?? "U"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-grayDark">{m.sender}</div>
                        <div className="text-sm text-gray-700">{m.text}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-gray-100 bg-white">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type your message and press Enter"
                  className="w-full border border-gray-200 rounded-md p-2 text-sm resize-none focus:outline-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={sendMessage}
                    className="bg-primary px-4 py-1 rounded-md text-white text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
