// src/components/teacher/TeacherLive.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import { PollContext } from "../../context/PollContext";

/**
 * Visual constants (tailwind-friendly classes)
 * Adjust these if your theme tokens differ.
 */
const PRIMARY_BG = "bg-primary"; // purple fill pre-results
const PRIMARY_TEXT = "text-primary";
const CORRECT_BG = "bg-green-500"; // green post-results
const CORRECT_TEXT = "text-green-600";
const MUTED_BG = "bg-gray-200"; // muted post-results
const MUTED_TEXT = "text-gray-600";

/* ChoiceRow — full-width outer pill with inner fill */
const ChoiceRow = ({ idx, label, percent, finalized, isCorrect }) => {
  // decide inner fill color after finalization
  const innerColorClass = finalized
    ? isCorrect
      ? CORRECT_BG
      : MUTED_BG
    : PRIMARY_BG;

  // label color after finalization
  const labelColorClass = finalized ? (isCorrect ? CORRECT_TEXT : MUTED_TEXT) : "text-grayDark";

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white overflow-hidden py-3 px-4">
      {/* outer visual left circle + text on top of full width background */}
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-8 h-8 rounded-full grid place-items-center ${finalized && isCorrect ? "bg-green-600 text-white" : "bg-gray-200 text-grayDark"}`}>
          {idx}
        </div>
        <div className={`flex-1 font-medium ${labelColorClass}`}>
          {label}
        </div>
        <div className="w-16 text-right font-semibold text-gray-800">
          {percent}%
        </div>
      </div>

      {/* inner fill — absolutely positioned, sits behind the top row */}
      <div
        aria-hidden
        className={`absolute inset-y-0 left-0 rounded-l-md ${innerColorClass} opacity-90`}
        style={{
          width: `${percent}%`,
          zIndex: 1,
          transition: finalized ? "width 600ms ease-out, background-color 300ms" : "width 600ms cubic-bezier(.2,.8,.2,1)",
          borderTopRightRadius: "8px",
          borderBottomRightRadius: "8px",
        }}
      />
      {/* subtle overlay to keep text readable on top of fill */}
      <div className="absolute inset-0 z-20 pointer-events-none" />
    </div>
  );
};

/* SlidePanel — chat / participants */
const SlidePanel = ({ tab, setTab, children, open }) => {
  if (!open) return null;
  return (
    <div className="fixed right-10 top-24 w-[420px] rounded-lg shadow-2xl border bg-white overflow-hidden z-50">
      <div className="flex border-b">
        {["Chat", "Participants"].map((t) => (
          <button
            key={t}
            className={`flex-1 px-4 py-3 font-semibold ${tab === t ? "text-primary border-b-2 border-primary" : "text-grayMid"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-4 max-h-[420px] overflow-auto">{children}</div>
    </div>
  );
};

export default function TeacherLive() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const { currentPoll, setCurrentPoll } = useContext(PollContext);

  // UI state
  const [panelTab, setPanelTab] = useState("Chat");
  const [panelOpen, setPanelOpen] = useState(false); // closed by default per your request

  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [liveCounts, setLiveCounts] = useState({}); // live updates
  const [finalCounts, setFinalCounts] = useState(null); // final/frozen results

  const inputRef = useRef(null);
  const chatListRef = useRef(null);
  
  // Request history if we arrived here with no currentPoll (reconnect / hard refresh)
  useEffect(() => {
    if (!socket) return;
    if (!currentPoll) socket.emit("teacher_request_history");
  }, [socket, currentPoll]);

  // Listen for poll started and history fallback
  useEffect(() => {
    if (!socket) return;

    const onPollStarted = (poll) => {
      setCurrentPoll?.(poll);
      setLiveCounts({});
      setFinalCounts(null);
    };

    const onHistory = (history) => {
      if (!currentPoll && Array.isArray(history) && history.length > 0) {
        const snap = history[0];
        const pollFromSnap = {
          question: snap.question,
          timer: snap.timer,
          options: snap.options,
        };
        setCurrentPoll?.(pollFromSnap);
        if (snap.counts) setFinalCounts(snap.counts);
      }
    };

    socket.on("poll_started", onPollStarted);
    socket.on("history_data", onHistory);
    return () => {
      socket.off("poll_started", onPollStarted);
      socket.off("history_data", onHistory);
    };
  }, [socket, currentPoll, setCurrentPoll]);

  // Live updates: poll_update, poll_results, participants_update, chat_message
  useEffect(() => {
    if (!socket) return;

    const onUpdate = (counts) => {
      if (!finalCounts) setLiveCounts(counts || {});
    };

    const onResults = (counts) => {
      setFinalCounts(counts || {});
    };

    const onParticipants = (list) => setParticipants(Array.isArray(list) ? list : []);
    const onChat = (msg) => setMessages((prev) => [...prev, msg]);

    socket.on("poll_update", onUpdate);
    socket.on("poll_results", onResults);
    socket.on("participants_update", onParticipants);
    socket.on("chat_message", onChat);

    return () => {
      socket.off("poll_update", onUpdate);
      socket.off("poll_results", onResults);
      socket.off("participants_update", onParticipants);
      socket.off("chat_message", onChat);
    };
  }, [socket, finalCounts]);

  // Build bars from either liveCounts or finalCounts (finalCounts wins)
  const totalVotes = useMemo(() => {
    const src = finalCounts ?? liveCounts;
    return Object.values(src || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  }, [liveCounts, finalCounts]);

  const bars = useMemo(() => {
    const opts = currentPoll?.options ?? [];
    const src = finalCounts ?? liveCounts;
    return opts.map((opt, i) => {
      const key = String(i + 1);
      const count = Number(src?.[key] ?? 0);
      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        idx: i + 1,
        label: opt?.text ?? `Option ${i + 1}`,
        percent: pct,
        isCorrect: Boolean(opt?.correct),
      };
    });
  }, [currentPoll, liveCounts, finalCounts, totalVotes]);

  // Actions
  const showResults = () => {
    if (!socket || finalCounts) return;
    socket.emit("teacher_show_results");
  };

  const sendChat = () => {
    const text = inputRef.current?.value?.trim();
    if (!text || !socket) return;
    socket.emit("send_chat", { text });
    if (inputRef.current) inputRef.current.value = "";
  };

  const kickStudent = (name) => {
    if (!socket) return;
    socket.emit("kick_student", name);
  };

  const goAskNew = () => {
    navigate("/teacher/create");
  };

  // Auto-scroll chat when messages change
  useEffect(() => {
    if (chatListRef.current) chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [messages, panelOpen, panelTab]);

  // Auto-focus chat input when panel opens on chat tab
  useEffect(() => {
    if (panelOpen && panelTab === "Chat") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [panelOpen, panelTab]);

  // Chat bubble helpers (left = other, right = teacher messages - we treat all as "other" here)
  const renderChatMessage = (m, i) => {
    // simple styling — teacher messages are not distinguished server-side; you can add sender checks if you like
    return (
      <div key={i} className="mb-3">
        <div className="text-xs text-grayMid mb-1">{m.sender || "User"}</div>
        <div className={`inline-block px-3 py-2 rounded-lg ${m.sender ? "bg-gray-800 text-white" : "bg-primaryLight text-white"}`}>
          {m.text}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white px-6 py-12 relative">
      <div className="max-w-[960px] mx-auto">
        <div className="text-2xl font-semibold mb-4">Question</div>

        <div className="w-full rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-[#494949] text-white font-bold px-5 py-3">
            {currentPoll?.question ?? "Waiting for a poll to start..."}
          </div>

          <div className="p-6">
            {/* Outer container matches your screenshot: full-width card with inner rows */}
            <div className="rounded-lg border border-gray-200 p-4 bg-white space-y-4">
              {bars.length === 0 ? (
                <div className="text-grayMid">No options yet.</div>
              ) : (
                bars.map((r) => (
                  <ChoiceRow
                    key={r.idx}
                    idx={r.idx}
                    label={r.label}
                    percent={r.percent}
                    finalized={Boolean(finalCounts)}
                    isCorrect={r.isCorrect}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 text-grayMid">
          <div>
            Total votes: <span className="font-semibold text-grayDark">{totalVotes}</span>
          </div>

          {finalCounts ? (
            <span className="text-primary font-semibold">Results locked</span>
          ) : (
            <button onClick={showResults} className="text-primary underline underline-offset-2">
              Show results
            </button>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={goAskNew}
            className="px-8 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-primary to-secondary"
          >
            + Ask a new question
          </button>
        </div>
      </div>

      {/* Floating panel toggle */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary"
        title="Toggle panel"
      >
        💬
      </button>

      {/* Slide-over panel */}
      <SlidePanel tab={panelTab} setTab={setPanelTab} open={panelOpen}>
        {panelTab === "Chat" ? (
          <div className="flex flex-col h-full">
            <div ref={chatListRef} className="flex-1 space-y-3 overflow-auto pr-1">
              {messages.length === 0 ? <div className="text-center text-grayMid">No messages yet — say hi 👋</div> : messages.map(renderChatMessage)}
            </div>

            <div className="mt-3 flex gap-2">
              <input ref={inputRef} placeholder="Type a message" className="flex-1 h-11 border rounded-lg px-3" />
              <button onClick={sendChat} className="px-4 h-11 rounded-lg bg-primary text-white font-semibold">
                Send
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_auto] font-semibold text-grayMid pb-2 border-b">
              <span>Name</span>
              <span>Action</span>
            </div>

            <div className="divide-y">
              {participants.length === 0 && <div className="py-4 text-grayMid">No participants yet.</div>}
              {participants.map((p) => (
                <div key={p} className="grid grid-cols-[1fr_auto] items-center py-3">
                  <span className="font-semibold text-grayDark">{p}</span>
                  <button onClick={() => kickStudent(p)} className="text-blue-700 underline underline-offset-2">
                    Kick out
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </SlidePanel>

      {/* History button */}
      <button
        onClick={() => navigate("/teacher/history")}
        className="fixed top-8 right-8 bg-primaryLight text-white px-5 py-2 rounded-full shadow"
      >
        👁 View Poll history
      </button>
    </div>
  );
}


