// src/components/teacher/TeacherHistory.jsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const ResultCard = ({ poll, onReask }) => {
  // poll shape expected:
  // {
  //   id, question, timer,
  //   options: [{ text, correct: boolean }],
  //   counts: { 1: number, 2: number, ... }   // final counts keyed by 1-based index
  //   createdAt?: string
  // }
  const total = useMemo(
    () => Object.values(poll?.counts || {}).reduce((a, b) => a + b, 0),
    [poll]
  );

  return (
    <div className="w-full rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="bg-[#494949] text-white font-bold px-5 py-3">
        {poll?.question || 'Untitled question'}
      </div>
      <div className="p-5">
        {(poll?.options || []).map((opt, i) => {
          const idx = i + 1;
          const c = poll?.counts?.[idx] || 0;
          const pct = total > 0 ? Math.round((c / total) * 100) : 0;
          const correct = !!opt.correct;

          return (
            <div key={idx} className="flex items-center gap-3 my-3">
              <div className="w-7 h-7 rounded-full grid place-items-center bg-grayLight text-grayDark font-bold">
                {idx}
              </div>
              <div className="relative flex-1 h-11 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <div
                  className={`${correct ? 'bg-primary' : 'bg-primaryLight'} h-full`}
                  style={{ width: `${pct}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3 text-white font-bold">
                  {opt.text}
                </div>
              </div>
              <div className="w-12 text-right font-bold text-gray-800">{pct}%</div>
            </div>
          );
        })}

        <div className="mt-3 flex items-center justify-between text-sm text-grayMid">
          <span>Total votes: <span className="text-grayDark font-semibold">{total}</span></span>
          {poll?.createdAt && (
            <span>{new Date(poll.createdAt).toLocaleString()}</span>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onReask(poll)}
            className="px-4 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-secondary to-primary"
          >
            Re-ask this poll
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TeacherHistory() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]); // array of polls

  // Fetch history: choose either REST or socket pattern.
  useEffect(() => {
    let cancelled = false;

    // Option A: Socket-based
    const onHistory = (list) => {
      if (!cancelled) setHistory(Array.isArray(list) ? list : []);
    };
    socket.on('history_data', onHistory);
    socket.emit('teacher_request_history');

    // Option B: REST (uncomment if you add GET /history on server)
    // fetch(import.meta.env.VITE_API_URL + '/history')
    //   .then(r => r.json())
    //   .then(data => { if (!cancelled) setHistory(Array.isArray(data) ? data : []); })
    //   .catch(() => {});

    return () => {
      cancelled = true;
      socket.off('history_data', onHistory);
    };
  }, [socket]);

  const reask = (poll) => {
    // Create a new poll using the saved question/options/timer
    const payload = {
      question: poll.question,
      timer: poll.timer ?? 60,
      options: (poll.options || []).map(o => ({ text: o.text, correct: !!o.correct })),
    };
    socket.emit('teacher_create_poll', payload);
    // TeacherLive will navigate on poll_started; go there optimistically:
    navigate('/teacher/live');
  };

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <h1 className="text-5xl font-semibold">
        View <span className="text-grayDark">Poll History</span>
      </h1>

      <div className="mt-10 space-y-12 max-w-[760px]">
        {history.length === 0 && (
          <div className="text-grayMid">No polls yet. Create one from the teacher screen.</div>
        )}

        {history.map((poll, i) => (
          <div key={poll.id ?? i}>
            <div className="text-2xl font-semibold mb-3">Question {i + 1}</div>
            <ResultCard poll={poll} onReask={reask} />
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/teacher/create')}
        className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary"
        title="Create new poll"
      >
        +
      </button>
    </div>
  );
}
