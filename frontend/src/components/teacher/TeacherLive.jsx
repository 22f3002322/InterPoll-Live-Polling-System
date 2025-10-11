// src/components/teacher/TeacherLive.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import { PollContext } from '../../context/PollContext';

const ChoiceRow = ({ idx, label, percent, active }) => (
  <div className="flex items-center gap-3 my-3">
    <div className="w-7 h-7 rounded-full grid place-items-center bg-grayLight text-grayDark font-bold">{idx}</div>
    <div className="relative flex-1 h-11 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
      <div className={`${active ? 'bg-primary' : 'bg-primaryLight'} h-full`} style={{ width: `${percent}%` }} />
      {label ? <div className="absolute inset-0 flex items-center px-3 text-white font-bold">{label}</div> : null}
    </div>
    <div className="w-12 text-right font-bold text-gray-800">{percent}%</div>
  </div>
);

const SlidePanel = ({ tab, setTab, children }) => (
  <div className="fixed right-10 top-24 w-[420px] rounded-lg shadow-2xl border bg-white overflow-hidden">
    <div className="flex border-b">
      {['Chat', 'Participants'].map((t) => (
        <button
          key={t}
          className={`flex-1 px-4 py-3 font-semibold ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-grayMid'}`}
          onClick={() => setTab(t)}
        >
          {t}
        </button>
      ))}
    </div>
    <div className="p-4 max-h-[420px] overflow-auto">{children}</div>
  </div>
);

export default function TeacherLive() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const { currentPoll, setCurrentPoll } = useContext(PollContext);

  const [panelTab, setPanelTab] = useState('Chat');
  const [panelOpen, setPanelOpen] = useState(true);

  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState({}); // { optionIndex: count }
  const [finalCounts, setFinalCounts] = useState(null); // freeze when results shown
  const inputRef = useRef(null);

  useEffect(() => {
    if (!currentPoll) {
      console.log("⚠️ No currentPoll found — sending history request as fallback.");
      socket.emit("teacher_request_history");
    }
  }, [currentPoll, socket]);
  
  useEffect(() => {
    socket.on("poll_started", (poll) => {
      console.log("📩 TeacherLive received poll_started:", poll);
      setCurrentPoll(poll);
    });
  
    socket.on("history_data", (history) => {
      if (!currentPoll && history && history[0]) {
        console.log("⚙️ Fallback to latest history record:", history[0]);
        setCurrentPoll(history[0]);
      }
    });
  
    return () => {
      socket.off("poll_started");
      socket.off("history_data");
    };
  }, [socket, setCurrentPoll, currentPoll]);

  
  // If this screen is loaded directly, rely on the server to have broadcast poll_started recently;
  // also keep a listener to refresh currentPoll in case of reconnect.
  useEffect(() => {
    const onPollStarted = (poll) => {
      setCurrentPoll(poll);
      setCounts({});
      setFinalCounts(null);
    };
    socket.on('poll_started', onPollStarted);
    return () => socket.off('poll_started', onPollStarted);
  }, [socket, setCurrentPoll]);

  // Live updates
  useEffect(() => {
    const onUpdate = (resultCount) => setCounts(resultCount || {});
    const onResults = (final) => {
      setFinalCounts(final || {});
    };
    const onParticipants = (list) => setParticipants(Array.isArray(list) ? list : []);
    const onChat = (msg) => setMessages((prev) => [...prev, msg]);

    socket.on('poll_update', onUpdate);
    socket.on('poll_results', onResults);
    socket.on('participants_update', onParticipants);
    socket.on('chat_message', onChat);

    return () => {
      socket.off('poll_update', onUpdate);
      socket.off('poll_results', onResults);
      socket.off('participants_update', onParticipants);
      socket.off('chat_message', onChat);
    };
  }, [socket]);

  const totalVotes = useMemo(() => {
    const src = finalCounts ?? counts;
    return Object.values(src || {}).reduce((a, b) => a + b, 0);
  }, [counts, finalCounts]);

  const bars = useMemo(() => {
    if (!currentPoll?.options) return [];
    const src = finalCounts ?? counts; // when finalCounts exists, freeze bars
    // Students send option index (1-based or 0-based). server.js shows submit_answer(option) and tallies by the same key.
    // Assume 1-based indices to match UI labels 1..n.
    return currentPoll.options.map((opt, i) => {
      const key = i + 1;
      const c = src?.[key] || 0;
      const pct = totalVotes > 0 ? Math.round((c / totalVotes) * 100) : 0;
      return {
        idx: key,
        label: opt.text,
        percent: pct,
        active: true,
      };
    });
  }, [currentPoll, counts, finalCounts, totalVotes]);

  const showResults = () => socket.emit('teacher_show_results');

  const sendChat = () => {
    const text = inputRef.current?.value?.trim();
    if (!text) return;
    socket.emit('send_chat', { text });
    if (inputRef.current) inputRef.current.value = '';
  };

  const kickStudent = (name) => socket.emit('kick_student', name);

  const goAskNew = () => navigate('/teacher/create');

  return (
    <div className="min-h-screen bg-white px-6 py-12 relative">
      <div className="max-w-[760px]">
        <div className="text-2xl font-semibold mb-4">Question</div>

        <div className="w-full rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-[#494949] text-white font-bold px-5 py-3">
            {currentPoll?.question || 'Waiting for a poll to start...'}
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
          <div>Total votes: <span className="font-semibold text-grayDark">{totalVotes}</span></div>
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

      {/* Floating chat button */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary"
        title="Toggle panel"
      >
        💬
      </button>

      {/* Slide-over panel */}
      {panelOpen && (
        <SlidePanel tab={panelTab} setTab={setPanelTab}>
          {panelTab === 'Chat' ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-3 overflow-auto pr-1">
                {messages.map((m, i) => (
                  <div key={i} className={m.sender === 'Anonymous' ? '' : ''}>
                    <div className="text-xs text-grayMid mb-1">{m.sender || 'User'}</div>
                    <div className={`inline-block px-3 py-2 rounded-lg ${m.sender ? 'bg-gray-800 text-white' : 'bg-primaryLight text-white'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  ref={inputRef}
                  placeholder="Type a message"
                  className="flex-1 h-11 border rounded-lg px-3"
                />
                <button onClick={sendChat} className="px-4 h-11 rounded-lg bg-primary text-white font-semibold">
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_auto] font-semibold text-grayMid pb-2 border-b">
                <span>Name</span><span>Action</span>
              </div>
              <div className="divide-y">
                {participants.map((p) => (
                  <div key={p} className="grid grid-cols-[1fr_auto] items-center py-3">
                    <span className="font-semibold text-grayDark">{p}</span>
                    <button onClick={() => kickStudent(p)} className="text-blue-700 underline underline-offset-2">
                      Kick out
                    </button>
                  </div>
                ))}
                {participants.length === 0 && (
                  <div className="py-4 text-grayMid">No participants yet.</div>
                )}
              </div>
            </div>
          )}
        </SlidePanel>
      )}

      {/* History button */}
      <button
        onClick={() => navigate('/teacher/history')}
        className="fixed top-8 right-8 bg-primaryLight text-white px-5 py-2 rounded-full shadow"
      >
        👁 View Poll history
      </button>
    </div>
  );
}

