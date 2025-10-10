import { createContext } from "react";
import { io } from "socket.io-client";

export const socket = io("http://localhost:5000"); // change after deploy
export const SocketContext = createContext(socket);
