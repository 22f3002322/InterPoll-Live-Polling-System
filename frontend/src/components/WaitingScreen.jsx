import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

export default function WaitingScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);

  const studentName = location.state?.studentName || "Student";

  useEffect(() => {
    socket.on("kicked", () => {
      navigate("/kicked");
    });

    // ✅ Redirect when poll starts
    socket.on("poll_started", (poll) => {
      console.log("📩 Student received poll_started:", poll);
      navigate("/student/results", { state: { poll } });
    });

    return () => {
      socket.off("kicked");
      socket.off("poll_started");
    };
  }, [socket, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-grayDark px-4">
      <button className="bg-primaryLight text-white text-xs px-4 py-1 rounded-full mb-6">
        ✦ Intervue Poll
      </button>

      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-6"></div>

      <h2 className="text-xl font-semibold">Wait for the teacher to ask questions..</h2>
      <p className="text-grayMid mt-2">Hi {studentName}, get ready!</p>

      <button className="fixed bottom-6 right-6 bg-secondary text-white p-4 rounded-full shadow-lg">
        💬
      </button>
    </div>
  );
}
