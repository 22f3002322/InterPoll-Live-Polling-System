// src/components/StudentResults.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

export default function StudentResults() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [questionText, setQuestionText] = useState("Awaiting question...");
  const [timer, setTimer] = useState("00:00");
  const [results, setResults] = useState([]);

  const [popupOpen, setPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [draft, setDraft] = useState("");

  const chatListRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    socket.on("kicked", () => navigate("/kicked"));
    return () => socket.off("kicked");
  }, [socket, navigate]);

  const mapResultsToBars = (resultCount) => {
    const totalVotes = Object.values(resultCount).reduce((sum, n) => sum + n, 0);
    return Object.entries(resultCount).map(([label, count], idx) => ({
      index: idx + 1,
      label,
      percent: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      active: count > 0,
    }));
  };

  useEffect(() => {
    socket.on("poll_started", (poll) => {
      setQuestionText(poll.question || "New Question");
      setResults([]);
    });

    socket.on("poll_update", (data) => setResults(mapResultsToBars(data)));
    socket.on("poll_results", (data) => setResults(mapResultsToBars(data)));

    socket.on("chat_message", (payload) => setMessages((m) => [...m, payload]));
    socket.on("participants_update", (list) => setParticipants(list));

    return () => {
      socket.off("poll_started");
      socket.off("poll_update");
      socket.off("poll_results");
      socket.off("chat_message");
      socket.off("participants_update");
    };
  }, [socket]);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages, popupOpen, activeTab]);

  const togglePopup = () => {
    setPopupOpen((open) => {
      const next = !open;
      if (next) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      return next;
    });
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    socket.emit("send_chat", { text });
    setDraft("");
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

        <div className="p-5 relative">
          <div className="flex items-center gap-3 text-gray-700 font-semibold">
            <span>Results</span>
            <span className="text-grayMid">⏱ {timer}</span>
          </div>

          <div className="mt-3">
            {results.length > 0 ? (
              results.map((r) => <ResultBar key={r.index} {...r} />)
            ) : (
              <p className="text-grayMid mt-4">Waiting for responses...</p>
            )}
          </div>

          <div className="mt-2 text-grayMid font-semibold">
            Wait for the teacher to ask a new question..
          </div>

          <button
            onClick={togglePopup}
            className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary"
          >
            💬
          </button>

          {popupOpen && (
            <div className="fixed bottom-20 right-6 w-[320px] max-w-[92vw] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 bg-primary text-white flex items-center justify-between">
                <div className="font-semibold">
                  {activeTab === "chat" ? "Class Chat" : "Participants"}
                </div>
                <button onClick={() => setPopupOpen(false)}>✕</button>
              </div>

              <div className="flex border-b border-gray-100">
                <div
                  className={`flex-1 text-center py-2 cursor-pointer ${
                    activeTab === "chat" ? "font-semibold text-grayDark" : "text-grayMid"
                  }`}
                  onClick={() => setActiveTab("chat")}
                >
                  Chat
                </div>
                <div
                  className={`flex-1 text-center py-2 cursor-pointer ${
                    activeTab === "participants" ? "font-semibold text-grayDark" : "text-grayMid"
                  }`}
                  onClick={() => setActiveTab("participants")}
                >
                  Participants
                </div>
              </div>

              {activeTab === "chat" && (
                <>
                  <div ref={chatListRef} className="h-[240px] overflow-auto px-3 py-3 space-y-3 bg-gray-50">
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
                      <button onClick={sendMessage} className="bg-primary px-4 py-1 rounded-md text-white text-sm">
                        Send
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "participants" && (
                <div className="h-[300px] overflow-auto px-3 py-3 bg-gray-50">
                  {participants.length === 0 ? (
                    <div className="text-center text-grayMid">No participants yet...</div>
                  ) : (
                    participants.map((name, i) => (
                      <div key={i} className="py-2 border-b border-gray-200 text-grayDark">
                        {name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ResultBar = ({ index, percent, active, label }) => (
  <div className="flex items-center gap-3 my-3">
    <div className="w-7 h-7 rounded-full grid place-items-center bg-grayLight text-grayDark font-bold">
      {index}
    </div>
    <div className="relative flex-1 h-11 rounded-lg border border-gray-200 overflow-hidden bg-grayLight">
      <div
        className={`h-full ${active ? "bg-primary" : "bg-primaryLight"} transition-all duration-500 ease-out`}
        style={{ width: `${percent}%` }}
      />
      {label ? (
        <div className="absolute inset-0 flex items-center px-3 text-white font-bold">
          {label}
        </div>
      ) : null}
    </div>
    <div className="w-12 text-right font-bold text-gray-800">{percent}%</div>
  </div>
);
