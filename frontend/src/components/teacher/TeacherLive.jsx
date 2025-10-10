// src/components/teacher/TeacherLive.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

const Panel = ({ activeTab, setActiveTab, children }) => (
  <div className="fixed right-10 top-24 w-[420px] rounded-lg shadow-2xl border bg-white overflow-hidden">
    <div className="flex border-b">
      {['Chat', 'Participants'].map((t) => (
        <button
          key={t}
          className={`flex-1 px-4 py-3 font-semibold ${activeTab === t ? 'text-primary border-b-2 border-primary' : 'text-grayMid'}`}
          onClick={() => setActiveTab(t)}
        >
          {t}
        </button>
      ))}
    </div>
    <div className="p-4 max-h-[420px] overflow-auto">{children}</div>
  </div>
);

export default function TeacherLive() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('Chat');

  // Mock results
  const results = [
    { idx: 1, label: 'Mars', percent: 75, active: true },
    { idx: 2, label: 'Venus', percent: 5 },
    { idx: 3, label: 'Jupiter', percent: 5 },
    { idx: 4, label: 'Saturn', percent: 15 },
  ];

  const participants = ['Rahul Arora','Pushpender Rautela','Rijul Zalpuri','Nadeem N','Ashwin Sharma'];

  return (
    <div className="min-h-screen bg-white px-6 py-12 relative">
      <div className="max-w-[760px]">
        <div className="text-2xl font-semibold mb-4">Question</div>

        <div className="w-full rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-[#494949] text-white font-bold px-5 py-3">
            {state?.question || 'Which planet is known as the Red Planet?'}
          </div>
          <div className="p-5">
            {results.map(r => (
              <ChoiceRow key={r.idx} {...r} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/teacher/create')}
            className="px-8 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-primary to-secondary"
          >
            + Ask a new question
          </button>
        </div>
      </div>

      {/* Floating chat button */}
      <button
        onClick={() => setPanel(panel === 'Chat' ? 'Participants' : 'Chat')}
        className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary"
        title="Toggle panel"
      >
        💬
      </button>

      {/* Slide-over panel */}
      <Panel activeTab={panel} setActiveTab={setPanel}>
        {panel === 'Chat' ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-grayMid mb-1">User 1</div>
              <div className="inline-block bg-gray-800 text-white px-3 py-2 rounded-lg">
                Hey There , how can I help?
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-grayMid mb-1">User 2</div>
              <div className="inline-block bg-primaryLight text-white px-3 py-2 rounded-lg">
                Nothing bro..just chill!!!
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            <div className="grid grid-cols-[1fr_auto] font-semibold text-grayMid pb-2">
              <span>Name</span><span>Action</span>
            </div>
            {participants.map((p) => (
              <div key={p} className="grid grid-cols-[1fr_auto] items-center py-3">
                <span className="font-semibold text-grayDark">{p}</span>
                <button className="text-blue-700 underline underline-offset-2">Kick out</button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* View history */}
      <button
        onClick={() => navigate('/teacher/history')}
        className="fixed top-8 right-8 bg-primaryLight text-white px-5 py-2 rounded-full shadow"
      >
        👁 View Poll history
      </button>
    </div>
  );
}
