import React, { useState, useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const TeacherDashboard = () => {
  const socket = useContext(SocketContext);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [results, setResults] = useState(null);

  const startPoll = () => {
    socket.emit("teacher_create_poll", { question, options });
  };

  socket.on("poll_results", (data) => setResults(data));

  return (
    <div className="teacher">
      <h2>Teacher Dashboard</h2>
      <input
        type="text"
        placeholder="Enter question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      {options.map((opt, i) => (
        <input
          key={i}
          value={opt}
          placeholder={`Option ${i + 1}`}
          onChange={(e) => {
            const newOpts = [...options];
            newOpts[i] = e.target.value;
            setOptions(newOpts);
          }}
        />
      ))}
      <button onClick={startPoll}>Start Poll</button>
      <button onClick={() => socket.emit("teacher_show_results")}>
        Show Results
      </button>

      {results && (
        <div>
          <h3>Results:</h3>
          {Object.entries(results).map(([k, v]) => (
            <p key={k}>{k}: {v}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
