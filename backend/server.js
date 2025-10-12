import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || [
  "http://localhost:3000",
  "https://interpoll-live.vercel.app/",
];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
});

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

let currentPoll = null;
let answers = {};
let totalStudents = 0;
let history = []; // Store past polls

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("teacher_create_poll", (pollData) => {
    currentPoll = pollData;
    answers = {};
    io.emit("poll_started", currentPoll);
  });

  socket.on("student_join", (name) => {
  socket.data.name = name;
  totalStudents++;

  // ✅ Notify others that a new student joined
  io.emit("participants_update", getAllParticipants());
});

// ✅ Helper function to list all connected students
function getAllParticipants() {
  return [...io.sockets.sockets.values()]
    .filter(s => s.data?.name) // only named users
    .map(s => s.data.name);
}


  socket.on("submit_answer", (option) => {
    const name = socket.data.name;
    if (!answers[name]) {
      answers[name] = option;

      // ✅ NEW: Live Poll Update Broadcast
      const resultCount = {};
      Object.values(answers).forEach(
        (opt) => (resultCount[opt] = (resultCount[opt] || 0) + 1)
      );
      io.emit("poll_update", resultCount);
    }
  });

  socket.on("teacher_show_results", () => {
  const finalResults = {};
  Object.values(answers).forEach(
    (opt) => (finalResults[opt] = (finalResults[opt] || 0) + 1)
  );

  if (currentPoll) {
    const snapshot = {
      id: Date.now().toString(),
      question: currentPoll.question,
      timer: currentPoll.timer,
      options: currentPoll.options,   // [{text, correct}]
      counts: finalResults,           // {1:n, 2:n, ...}
      createdAt: new Date().toISOString(),
    };
    history.unshift(snapshot);
  }

  io.emit("poll_results", finalResults);
});

  socket.on("teacher_request_history", () => {
  socket.emit("history_data", history);
});


  socket.on("disconnect", () => {
      io.emit("participants_update", getAllParticipants());
    console.log("User disconnected:", socket.id);
  });

   socket.on("send_chat", (payload) => {
    // payload expected: { text: "Hello class" }
    const sender = socket.data.name || "Anonymous";
    const message = {
      sender,
      text: payload?.text ?? "",
    };

    // broadcast to all connected clients
    io.emit("chat_message", message);
  });

    // ✅ Kick a specific student (teacher emits with student name or socket id)
  socket.on("kick_student", (studentName) => {
    // Find that student's socket (by name)
    for (const [id, s] of io.sockets.sockets) {
      if (s.data.name === studentName) {
        io.to(id).emit("kicked"); // Tell that student they were kicked
        s.disconnect(true); // Optionally force disconnect
        break;
      }
    }
  });

});

app.get("/", (req, res) => {
  res.send("✅ Live Polling Backend Running");
});

app.get("/history", (req, res) => {
  res.json(history);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));




