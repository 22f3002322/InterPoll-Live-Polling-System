// src/components/UI/TimerDot.jsx
import React from 'react';

export default function TimerDot({ time = '00:15' }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-grayMid">
      <span>⏱</span>
      <span>{time}</span>
    </span>
  );
}
