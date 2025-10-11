// src/context/SocketContext.js
import { createContext } from "react";
import { io } from "socket.io-client";

// For CRA: REACT_APP_BACKEND_URL; if using Vite, use VITE_BACKEND_URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export const socket = io(BACKEND_URL, {
  // optional options if you need them
  // transports: ["websocket"],
});

export const SocketContext = createContext(socket);
