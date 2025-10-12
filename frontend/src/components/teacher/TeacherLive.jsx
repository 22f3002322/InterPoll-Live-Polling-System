// src/components/StudentResults.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

/**
 * StudentResults (single screen):
 * - Shows question + options while timer runs
 * - Student selects one option and submits
 * - After submit, student sees live results (poll_update / poll_results)
 * - Also supports chat & participants popup (same UI as ResultsWithChat)
 */

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
        <div className="absolute inset-0 flex items-center px-3 text-white font-bold pointer-events-none">
          {label}
        </div>
      ) : null}
    </div>
    <div className="w-12 text-right font-bold text-gray-800">{percent}%</div>
  </div>
);

export default function StudentResults() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  // Poll state
  const [currentPoll, setCurrentPoll] = useState(null); // { question, timer, options: [{text,correct}] }
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Student state
  const [selected, setSelected] = useState(null); // option index (1-based)
  const [submitted, setSubmitted] = useState(false);

  // Results state (array mapped to options)
  const [results, setResults] = useState([]); // [{ index, label, percent, active }]

  // Chat / participants popup
  const [popupOpen, setPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [draft, setDraft] = useState("");
  const chatListRef = useRef(null);
  const inputRef = useRef(null);

  // keep latest poll ref (avoid stale closures)
  const pollRef = useRef(null);
  useEffect(() => {
    pollRef.current = currentPoll;
  }, [currentPoll]);

  // Kick detection
  useEffect(() => {
    if (!socket) return;
    const onKicked = () => navigate("/kicked");
    socket.on("kicked", onKicked);
    return () => {
      socket.off("kicked", onKicked);
    };
  }, [socket, navigate]);

  // Utilities: map server result counts (keyed by 1-based index) to bar items using currentPoll options
  const mapCountsToBars = (countsObj) => {
    // countsObj might be { "1": 5, "2": 2, ... }
    const opts = pollRef.current?.options ?? [];
    const total = Object.values(countsObj || {}).reduce((s, n) => s + (Number(n) || 0), 0);
    // If backend keys are indices (1,2,3), map to option text
    return opts.map((opt, i) => {
      const key = String(i + 1);
      const count = Number(countsObj?.[key] ?? 0);
      return {
        index: i + 1,
        label: opt.text,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        active: count > 0,
      };
    });
  };

  // Socket listeners for poll lifecycle, chat, participants, and results
  useEffect(() => {
    if (!socket) return;

    const onPollStarted = (poll) => {
      // expected poll: { question, timer, options: [{text, correct}, ...] }
      console.log("Student: poll_started", poll);
      setCurrentPoll(poll);
      setSelected(null);
      setSubmitted(false);
      setResults([]); // reset any old results
      const secs = Number(poll?.timer ?? 0);
      setSecondsLeft(secs);
    };

    const onPollUpdate = (counts) => {
      // counts: { "1": n, "2": m, ... }
      setResults(mapCountsToBars(counts));
    };

    const onPollResults = (finalCounts) => {
      setResults(mapCountsToBars(finalCounts));
    };

    const onChat = (payload) => setMessages((m) => [...m, payload]);
    const onParticipants = (list) => setParticipants(Array.isArray(list) ? list : []);

    socket.on("poll_started", onPollStarted);
    socket.on("poll_update", onPollUpdate);
    socket.on("poll_results", onPollResults);
    socket.on("chat_message", onChat);
    socket.on("participants_update", onParticipants);

    return () => {
      socket.off("poll_started", onPollStarted);
      socket.off("poll_update", onPollUpdate);
      socket.off("poll_results", onPollResults);
      socket.off("chat_message", onChat);
      socket.off("participants_update", onParticipants);
    };
  }, [socket]);

  // Countdown timer effect
  useEffect(() => {
    if (!currentPoll) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [currentPoll, secondsLeft]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages, popupOpen, activeTab]);

  // Toggle popup
  const togglePopup = () => {
    setPopupOpen((o) => {
      const next = !o;
      if (next) setTimeout(() => inputRef.current?.focus(), 100);
      return next;
    });
  };

  // Send chat
  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !socket) return;
    socket.emit("send_chat", { text });
    setDraft("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Student selects option (before submit)
  const choose = (idx) => {
    if (submitted) return;
    setSelected(idx);
  };

  // Submit selected answer
  const submitAnswer = () => {
    if (!socket || submitted) return;
    if (!selected) return; // require choice
    // emit 1-based index as option key - backend aggregates by this key
    socket.emit("submit_answer", String(selected));
    setSubmitted(true);

    // Immediately switch to results view by leaving question UI but showing live bars
    // The server will broadcast poll_update which we already listen to
  };

  // Helper formatting for timer mm:ss
  const formatSecs = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // If no current poll, show awaiting messaging
  const noPoll = !currentPoll;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-[780px] max-w-[96vw] rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-[#494949] text-white font-bold px-5 py-3">
          {currentPoll?.question ?? "Awaiting question..."}
        </div>

        <div className="p-8 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-gray-700 font-semibold">
              <span>Question {currentPoll ? "1" : ""}</span>
              <span className="text-grayMid">⏱ {currentPoll ? formatSecs(secondsLeft) : "00:00"}</span>
            </div>
          </div>

          {/* Card containing options or results */}
          <div className="rounded-lg border border-gray-200 p-4 bg-white">
            {/* If there is no poll yet */}
            {noPoll && (
              <div className="py-10 text-center text-grayMid">
                Waiting for the teacher to ask a question...
              </div>
            )}

            {/* If poll exists and student hasn't submitted, show selectable options */}
            {currentPoll && !submitted && (
              <div className="space-y-4">
                {currentPoll.options.map((opt, i) => {
                  const idx = i + 1;
                  const isSelected = selected === idx;
                  return (
                    <button
                      key={opt.text + idx}
                      onClick={() => choose(idx)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-lg border ${
                        isSelected ? "border-primary bg-primary/10" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full grid place-items-center ${isSelected ? "bg-primary text-white" : "bg-gray-200 text-grayDark"}`}>
                        {idx}
                      </div>
                      <div className="flex-1 text-grayDark">{opt.text}</div>
                    </button>
                  );
                })}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={submitAnswer}
                    disabled={!selected}
                    className="px-8 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-secondary to-primary disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {/* After submit OR if server already has counts, show live results bars */}
            {currentPoll && (submitted || results.length > 0) && (
              <div>
                <div className="space-y-2">
                  { (results.length > 0 ? results : currentPoll.options.map((o, i) => ({ index: i+1, label: o.text, percent: 0, active: false }))))
                    .map((r) => (
                      <ResultBar key={r.index} index={r.index} percent={r.percent} active={r.active} label={r.label} />
                    ))
                  }
                </div>

                <div className="mt-4 text-grayMid font-semibold">
                  {finalText(currentPoll, results, submitted)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating chat button */}
      <button
        onClick={togglePopup}
        className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary"
        title="Open chat"
      >
        💬
      </button>

      {/* Chat / Participants popup */}
      {popupOpen && (
        <div className="fixed bottom-20 right-6 w-[320px] max-w-[92vw] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 bg-primary text-white flex items-center justify-between">
            <div className="font-semibold">{activeTab === "chat" ? "Class Chat" : "Participants"}</div>
            <button onClick={() => setPopupOpen(false)}>✕</button>
          </div>

          <div className="flex border-b border-gray-100">
            <div
              className={`flex-1 text-center py-2 cursor-pointer ${activeTab === "chat" ? "font-semibold text-grayDark" : "text-grayMid"}`}
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </div>
            <div
              className={`flex-1 text-center py-2 cursor-pointer ${activeTab === "participants" ? "font-semibold text-grayDark" : "text-grayMid"}`}
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
                      <div className="w-8 h-8 rounded-full bg-gray-200 grid place-items-center text-sm font-semibold text-grayDark">{m.sender?.[0] ?? "U"}</div>
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
                  <div key={i} className="py-2 border-b border-gray-200 text-grayDark">{name}</div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Helper to show footer text under results */
function finalText(poll, results, submitted) {
  if (!poll) return "";
  if (!submitted && (!results || results.length === 0)) return "Waiting for responses...";
  if (results && results.length > 0) return "Live results — waiting for the teacher to finalize.";
  return "Wait for the teacher to ask a new question..";
}
