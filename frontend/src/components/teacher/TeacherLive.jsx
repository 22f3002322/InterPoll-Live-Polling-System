// src/components/teacher/TeacherLive.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import { PollContext } from "../../context/PollContext";

/* Option Row with Correct Answer Highlight */
const ChoiceRow = ({ idx, label, percent, active, isCorrect }) => (
  <div className="flex items-center gap-3 my-3">
    <div className="w-7 h-7 rounded-full grid place-items-center bg-grayLight text-grayDark font-bold">
      {idx}
    </div>
    <div className={`relative flex-1 h-11 rounded-lg border overflow-hidden ${
      isCorrect ? "border-green-500" : "border-gray-200"
    } bg-gray-50`}>
      <div
        className={`${active ? "bg-primary" : "bg-primaryLight"} h-full transition-all duration-500`}
        style={{ width: `${percent}%` }}
      />
      {label && (
        <div className="absolute inset-0 flex items-center px-3 text-white font-bold pointer-events-none">
          {label} {isCorrect && " ✅"}
        </div>
      )}
    </div>
    <div className="w-12 text-right font-bold text-gray-800">{percent}%</div>
  </div>
);

/* Side Panel Wrapper (Chat / Participants) */
const SlidePanel = ({ tab, setTab, children, open }) => {
  if (!open) return null;
  return (
    <div className="fixed right-10 top-24 w-[420px] rounded-lg shadow-2xl border bg-white overflow-hidden z-50">
      <div className="flex border-b">
        {["Chat", "Participants"].map((t) => (
          <button
            key={t}
            className={`flex-1 px-4 py-3 font-semibold ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-grayMid"
            }`}
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

  const [panelTab, setPanelTab] = useState("Chat");
  const [panelOpen, setPanelOpen] = useState(true);

  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [liveCounts, setLiveCounts] = useState({});
  const [finalCounts, setFinalCounts] = useState(null);

  const inputRef = useRef(null);
  const chatListRef = useRef(null);

  // On mount, ensure we have the poll (context holds it if redirected from create)
  useEffect(() => {
    if (!currentPoll && socket) socket.emit("teacher_request_history");
  }, [socket, currentPoll]);

  // Handle poll events
  useEffect(() => {
    if (!socket) return;

    const onPollStarted = (poll) => {
      setCurrentPoll(poll);
      setLiveCounts({});
      setFinalCounts(null);
    };

    const onHistory = (history) => {
      if (!currentPoll && Array.isArray(history) && history.length > 0) {
        const snap = history[0];
        setCurrentPoll({ question: snap.question, timer: snap.timer, options: snap.options });
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

  // Other listeners
  useEffect(() => {
    if (!socket) return;

    const onUpdate = (counts) => {
      if (!finalCounts) setLiveCounts(counts || {});
    };
    const onResults = (counts) => setFinalCounts(counts || {});
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

  const totalVotes = useMemo(() => {
    const src = finalCounts ?? liveCounts;
    return Object.values(src || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  }, [liveCounts, finalCounts]);

  const bars = useMemo(() => {
    const opts = currentPoll?.options ?? [];
    const src = finalCounts ?? liveCounts;
    return opts.map((opt, i) => {
      const k = String(i + 1);
      const count = Number(src?.[k] ?? 0);
      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        idx: i + 1,
        label: opt?.text ?? "",
        percent: pct,
        active: count > 0,
        isCorrect: !!opt.correct,
      };
    });
  }, [currentPoll, liveCounts, finalCounts, totalVotes]);

  const showResults = () => socket?.emit("teacher_show_results");
  const sendChat = () => {
    const text = inputRef.current?.value?.trim();
    if (!text) return;
    socket.emit("send_chat", { text });
    inputRef.current.value = "";
  };
  const kick = (name) => socket.emit("kick_student", name);
  const goAsk = () => navigate("/teacher/create");

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages, panelOpen, panelTab]);

  return (
    <div className="min-h-screen bg-white px-6 py-12 relative">
      <div className="max-w-[760px] mx-auto">

        <div className="text-2xl font-semibold mb-4">Question</div>

        <div className="w-full rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-[#494949] text-white font-bold px-5 py-3">
            {currentPoll?.question ?? "Waiting for a poll to start..."}
          </div>

          <div className="p-5">
            {bars.length === 0 ? (
              <div className="text-grayMid">No options yet.</div>
            ) : (
              bars.map((r) => <ChoiceRow key={r.idx} {...r} />)
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-grayMid">
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
            onClick={goAsk}
            className="px-8 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-primary to-secondary"
          >
            + Ask a new question
          </button>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary"
      >
        💬
      </button>

      <SlidePanel tab={panelTab} setTab={setPanelTab} open={panelOpen}>
        {panelTab === "Chat" ? (
          <div className="flex flex-col h-full">
            <div ref={chatListRef} className="flex-1 space-y-3 overflow-auto pr-1">
              {messages.map((m, i) => (
                <div key={i}>
                  <div className="text-xs text-grayMid mb-1">{m.sender || "User"}</div>
                  <div className="inline-block px-3 py-2 rounded-lg bg-primaryLight text-white">
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input ref={inputRef} className="flex-1 h-11 border rounded-lg px-3" />
              <button onClick={sendChat} className="px-4 h-11 rounded-lg bg-primary text-white font-semibold">
                Send
              </button>
            </div>
          </div>
        ) : (
          <div>
            {participants.map((p) => (
              <div key={p} className="flex justify-between py-2">
                <span className="text-grayDark font-semibold">{p}</span>
                <button onClick={() => kick(p)} className="text-red-600 underline">Kick</button>
              </div>
            ))}
          </div>
        )}
      </SlidePanel>

      <button
        onClick={() => navigate("/teacher/history")}
        className="fixed top-8 right-8 bg-primaryLight text-white px-5 py-2 rounded-full shadow"
      >
        👁 View Poll history
      </button>
    </div>
  );
}
