import React, { useEffect, useState, useContext } from "react";
import { SocketContext } from "../context/SocketContext";

const StudentDashboard = () => {
  const socket = useContext(SocketContext);
  const [name, setName] = useState("");
  const [poll, setPoll] = useState(null);
  const [selected, setSelected] = useState("");
  const [results, setResults] = useState(null);

  const join = () => socket.emit("student_join", name);

  useEffect(() => {
    socket.on("poll_started", (data) => setPoll(data));
    socket.on("poll_results", (data) => setResults(data));
  }, [socket]);

  const submitAnswer = () => {
    socket.emit("submit_answer", selected);
  };

  if (!name)
    return (
      <div>
        <h2>Enter your name</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={join}>Join</button>
      </div>
    );

  return (
    <div className="student">
      <h2>Student: {name}</h2>
      {poll && !results && (
        <div>
          <h3>{poll.question}</h3>
          {poll.options.map((opt, i) => (
            <div key={i}>
              <input
                type="radio"
                name="opt"
                value={opt}
                onChange={() => setSelected(opt)}
              />{" "}
              {opt}
            </div>
          ))}
          <button onClick={submitAnswer}>Submit</button>
        </div>
      )}
      {results && (
        <div>
          <h3>Results</h3>
          {Object.entries(results).map(([k, v]) => (
            <p key={k}>{k}: {v}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
