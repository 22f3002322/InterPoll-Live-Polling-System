import { useState } from "react";
import { Link } from "react-router-dom";

export default function RoleSelection() {
  const [selected, setSelected] = useState("student");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-grayDark px-4">
      <button className="bg-primaryLight text-white text-xs px-4 py-1 rounded-full mb-6">
        ✦ Intervue Poll
      </button>

      <h1 className="text-4xl font-semibold text-center">
        Welcome to the <span className="text-grayDark">Live Polling System</span>
      </h1>
      <p className="text-grayMid text-center mt-2">
        Please select the role that best describes you to begin using the live polling system
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <div
          className={`p-6 border rounded-xl cursor-pointer ${
            selected === "student" ? "border-primary" : "border-grayLight"
          }`}
          onClick={() => setSelected("student")}
        >
          <h2 className="font-semibold text-xl">I’m a Student</h2>
          <p className="text-grayMid text-sm mt-2">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry
          </p>
        </div>

        <div
          className={`p-6 border rounded-xl cursor-pointer ${
            selected === "teacher" ? "border-primary" : "border-grayLight"
          }`}
          onClick={() => setSelected("teacher")}
        >
          <h2 className="font-semibold text-xl">I’m a Teacher</h2>
          <p className="text-grayMid text-sm mt-2">
            Submit answers and view live poll results in real-time.
          </p>
        </div>
      </div>

      <Link
        to={selected === "student" ? "/student/start" : "/teacher/create"}
        className="mt-8 bg-gradient-to-r from-primary to-secondary text-white px-10 py-3 rounded-full"
      >
        Continue
      </Link>
    </div>
  );
}
