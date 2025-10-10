// src/components/UI/PrimaryButton.jsx
import React from 'react';

export default function PrimaryButton({ children, className = '', ...rest }) {
  return (
    <button
      {...rest}
      className={`text-white font-bold rounded-full shadow px-6 py-3 bg-gradient-to-r from-secondary to-primary ${className}`}
    >
      {children}
    </button>
  );
}
