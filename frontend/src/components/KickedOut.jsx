// src/components/KickedOut.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function KickedOut() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-grayDark px-4">
      <div className="text-center">
        <button className="bg-primaryLight text-white text-xs px-4 py-1 rounded-full mb-6">
          ✦ Intervue Poll
        </button>
        <h1 className="text-3xl font-extrabold mb-2">You’ve been Kicked out !</h1>
        <p className="text-grayMid mb-6">
          Looks like the teacher had removed you from the poll system .Please Try again sometime.
        </p>
        <Link
          to="/"
          className="px-6 py-2 rounded-full border border-primary text-primary font-semibold"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
