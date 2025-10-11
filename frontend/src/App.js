import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import RoleSelection from "./components/RoleSelection";
import StudentStart from "./components/StudentStart";
import WaitingScreen from "./components/WaitingScreen";
import StudentResults from "./components/StudentResults";
import ResultsWithChat from "./components/ResultsWithChat";
import KickedOut from "./components/KickedOut";

import TeacherCreate from './components/teacher/TeacherCreate';
import TeacherLive from './components/teacher/TeacherLive';
import TeacherHistory from './components/teacher/TeacherHistory';


import { SocketContext, socket } from "./context/SocketContext";

import { PollProvider } from './context/PollContext';

function App() {
  return (
    <SocketContext.Provider value={socket}>
      <PollProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/student/start" element={<StudentStart />} />
            <Route path="/student/wait" element={<WaitingScreen />} />
            <Route path="/student/results" element={<StudentResults />} />
            <Route path="/student results-chat" element={<ResultsWithChat />} />
            <Route path="/kicked" element={<KickedOut />} />

            <Route path="/teacher" element={<RoleSelection />} />
            <Route path="/teacher/create" element={<TeacherCreate />} />
            <Route path="/teacher/live" element={<TeacherLive />} />
            <Route path="/teacher/history" element={<TeacherHistory />} />
          </Routes>
        </BrowserRouter>
      </PollProvider>
    </SocketContext.Provider>
  );
}

export default App;
