// src/components/UI/ChoiceBar.jsx
import React from 'react';

export default function ChoiceBar({ index, label, percent, active }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="w-7 h-7 rounded-full grid place-items-center bg-grayLight text-grayDark font-bold">{index}</div>
      <div className="relative flex-1 h-11 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
        <div className={`${active ? 'bg-primary' : 'bg-primaryLight'} h-full`} style={{ width: `${percent}%` }} />
        {label ? <div className="absolute inset-0 flex items-center px-3 text-white font-bold">{label}</div> : null}
      </div>
      <div className="w-12 text-right font-bold text-gray-800">{percent}%</div>
    </div>
  );
}
