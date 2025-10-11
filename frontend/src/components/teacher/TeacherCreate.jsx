// src/components/teacher/TeacherCreate.jsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import { PollContext } from '../../context/PollContext';

const emptyOptions = [
  { id: 1, text: '' , correct: false },
  { id: 2, text: '' , correct: false },
];

export default function TeacherCreate() {
  const [question, setQuestion] = useState('');
  const [timer, setTimer] = useState(60);
  const [options, setOptions] = useState(emptyOptions);

  const socket = useContext(SocketContext);
  const { setPoll } = useContext(PollContext);
  const navigate = useNavigate();

  const waitingRedirect = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const onPollStarted = (serverPoll) => {
      // Save canonical poll from server and go live once
      if (waitingRedirect.current) {
        setPoll(serverPoll);
        navigate('/teacher/live');
        waitingRedirect.current = false;
      }
    };

    socket.on('poll_started', onPollStarted);
    return () => {
      socket.off('poll_started', onPollStarted);
    };
  }, [socket, setPoll, navigate]);

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: prev.length + 1, text: '', correct: false },
    ]);
  };

  const setOpt = (id, patch) => {
    setOptions((prev) => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  };

  const isValid = () =>
    question.trim().length > 0 &&
    options.length >= 2 &&
    options.every(o => o.text.trim().length > 0);

  const askQuestion = () => {
    if (!isValid() || !socket) return;

    const payload = {
      question: question.trim(),
      timer,
      options: options.map(({ text, correct }) => ({
        text: text.trim(),
        correct: Boolean(correct),
      })),
    };

    // Mark awaiting server ack; redirect on poll_started
    waitingRedirect.current = true;
    socket.emit('teacher_create_poll', payload);
  };

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <button className="bg-primaryLight text-white text-xs px-4 py-1 rounded-full mb-6">
        ✦ Intervue Poll
      </button>

      <h1 className="text-5xl font-semibold">
        Let’s <span className="text-grayDark">Get Started</span>
      </h1>
      <p className="text-grayMid mt-2 max-w-2xl">
        you’ll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 max-w-4xl">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold">Enter your question</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
            >
              {[30, 45, 60, 90].map(s => (
                <option key={s} value={s}>{s} seconds</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="Type your question here..."
              className="w-full border rounded-lg bg-grayLight p-4 outline-none"
              maxLength={100}
            />
            <span className="absolute right-3 bottom-2 text-grayMid text-sm">
              {question.length}/100
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr,220px] gap-6">
          <div>
            <div className="font-semibold mb-2">Edit Options</div>
            <div className="space-y-4">
              {options.map((o, i) => (
                <div key={o.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full grid place-items-center bg-primary text-white font-bold">{i + 1}</div>
                  <input
                    value={o.text}
                    onChange={(e) => setOpt(o.id, { text: e.target.value })}
                    className="flex-1 border rounded-lg bg-grayLight px-3 py-3"
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
              ))}
            </div>
            <button onClick={addOption} className="mt-4 text-primary border border-primary px-4 py-2 rounded-lg">
              + Add More option
            </button>
          </div>

          <div>
            <div className="font-semibold mb-2">Is it Correct?</div>
            <div className="space-y-6">
              {options.map((o) => (
                <div key={o.id} className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${o.id}`}
                      checked={o.correct === true}
                      onChange={() => setOpt(o.id, { correct: true })}
                      className="accent-primary"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${o.id}`}
                      checked={o.correct === false}
                      onChange={() => setOpt(o.id, { correct: false })}
                      className="accent-primary"
                    />
                    No
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <button
          onClick={askQuestion}
          className="px-8 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-secondary to-primary shadow disabled:opacity-50"
          disabled={!isValid()}
        >
          Ask Question
        </button>
      </div>
    </div>
  );
}
