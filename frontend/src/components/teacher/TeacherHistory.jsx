// src/components/teacher/TeacherHistory.jsx
import React from 'react';

const ResultCard = ({ title }) => (
  <div className="w-full rounded-xl border border-gray-200 shadow-lg overflow-hidden">
    <div className="bg-[#494949] text-white font-bold px-5 py-3">
      Which planet is known as the Red Planet?"
    </div>
    <div className="p-5">
      {[
        { idx: 1, label: 'Mars', pct: 75, active: true },
        { idx: 2, label: 'Venus', pct: 5 },
        { idx: 3, label: 'Jupiter', pct: 5 },
        { idx: 4, label: 'Saturn', pct: 15 },
      ].map((r) => (
        <div key={r.idx} className="flex items-center gap-3 my-3">
          <div className="w-7 h-7 rounded-full grid place-items-center bg-grayLight text-grayDark font-bold">{r.idx}</div>
          <div className="relative flex-1 h-11 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
            <div className={`${r.active ? 'bg-primary' : 'bg-primaryLight'} h-full`} style={{ width: `${r.pct}%` }} />
            {r.label && <div className="absolute inset-0 flex items-center px-3 text-white font-bold">{r.label}</div>}
          </div>
          <div className="w-12 text-right font-bold text-gray-800">{r.pct}%</div>
        </div>
      ))}
    </div>
  </div>
);

export default function TeacherHistory() {
  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <h1 className="text-5xl font-semibold">
        View <span className="text-grayDark">Poll History</span>
      </h1>

      <div className="mt-10 space-y-12 max-w-[760px]">
        <div>
          <div className="text-2xl font-semibold mb-3">Question 1</div>
          <ResultCard />
        </div>
        <div>
          <div className="text-2xl font-semibold mb-3">Question 2</div>
          <ResultCard />
        </div>
      </div>

      <button
        className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary"
        title="Chat"
      >
        💬
      </button>
    </div>
  );
}
