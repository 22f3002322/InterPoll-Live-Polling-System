// src/components/StudentResults.jsx
import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

useEffect(() => {
  socket.on("kicked", () => {
    navigate("/kicked");
  });

  return () => {
    socket.off("kicked");
  };
}, [socket]);


const ResultBar = ({ index, percent, active, label }) => (
  <div className="flex items-center gap-3 my-3">
    <div className="w-7 h-7 rounded-full grid place-items-center bg-grayLight text-grayDark font-bold">
      {index}
    </div>
    <div className="relative flex-1 h-11 rounded-lg border border-gray-200 overflow-hidden bg-grayLight">
      <div
        className={`h-full ${active ? "bg-primary" : "bg-primaryLight"} transition-all duration-500 ease-out`}
        style={{ width: `${percent}%` }} // ✅ Smooth animation
      />
      {label ? (
        <div className="absolute inset-0 flex items-center px-3 text-white font-bold">
          {label}
        </div>
      ) : null}
    </div>
    <div className="w-12 text-right font-bold text-gray-800">{percent}%</div>
  </div>
);

export default function StudentResults() {
  const socket = useContext(SocketContext);

  const [questionText, setQuestionText] = useState("Awaiting question...");
  const [timer, setTimer] = useState("00:00");
  const [results, setResults] = useState([]);

  // ✅ Helper to convert raw result counts to percentages
  const mapResultsToBars = (resultCount) => {
    const totalVotes = Object.values(resultCount).reduce((sum, n) => sum + n, 0);
    return Object.entries(resultCount).map(([label, count], idx) => ({
      index: idx + 1,
      label,
      percent: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      active: count > 0,
    }));
  };

  useEffect(() => {
    // When teacher starts poll → update question
    socket.on("poll_started", (poll) => {
      setQuestionText(poll.question || "New Question");
      setResults([]); // Reset previous results
    });

    // ✅ Live updates while voting
    socket.on("poll_update", (data) => {
      setResults(mapResultsToBars(data));
    });

    // ✅ Final results
    socket.on("poll_results", (data) => {
      setResults(mapResultsToBars(data));
    });

    return () => {
      socket.off("poll_started");
      socket.off("poll_update");
      socket.off("poll_results");
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-[720px] max-w-[92vw] rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-[#494949] text-white font-bold px-5 py-3">
          {questionText}
        </div>

        <div className="p-5 relative">
          <div className="flex items-center gap-3 text-gray-700 font-semibold">
            <span>Results</span>
            <span className="text-grayMid">⏱ {timer}</span>
          </div>

          <div className="mt-3">
            {results.length > 0 ? (
              results.map((r) => <ResultBar key={r.index} {...r} />)
            ) : (
              <p className="text-grayMid mt-4">Waiting for responses...</p>
            )}
          </div>

          <div className="mt-2 text-grayMid font-semibold">
            Wait for the teacher to ask a new question..
          </div>

          <button className="fixed bottom-7 right-7 w-[60px] h-[60px] rounded-full text-white shadow-xl bg-primary">
            💬
          </button>
        </div>
      </div>
    </div>
  );
}
// ✅ Added ResultBar component for cleaner code and animations