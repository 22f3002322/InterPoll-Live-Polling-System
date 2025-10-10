import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentStart() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (name.trim() === "") return;
    navigate("/student/wait", { state: { studentName: name } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-grayDark px-4">
      <button className="bg-primaryLight text-white text-xs px-4 py-1 rounded-full mb-6">
        ✦ Intervue Poll
      </button>

      <h1 className="text-4xl font-semibold text-center">
        Let’s <span className="text-primary">Get Started</span>
      </h1>
      <p className="text-grayMid text-center mt-2 max-w-lg">
        If you’re a student, you’ll be able to <span className="font-semibold">submit your answers</span>, 
        participate in live polls, and see how your responses compare with your classmates
      </p>

      <div className="mt-10 w-full max-w-md text-left">
        <label className="block text-sm mb-1">Enter your Name</label>
        <input
          type="text"
          placeholder="Rahul Bajaj"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-grayLight p-3 rounded-lg bg-grayLight"
        />
      </div>

      <button
        onClick={handleContinue}
        className="mt-10 bg-gradient-to-r from-primary to-secondary text-white px-10 py-3 rounded-full disabled:opacity-50"
        disabled={!name.trim()}
      >
        Continue
      </button>
    </div>
  );
}
