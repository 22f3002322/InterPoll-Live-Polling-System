// src/context/SocketContext.js
import { createContext } from "react";
import { io } from "socket.io-client";

// Automatically switch between localhost (development) and Render (production)
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://interpoll-live-polling-system.onrender.com");

export const socket = io(BACKEND_URL, {
  withCredentials: true,
});

export const SocketContext = createContext(socket);
