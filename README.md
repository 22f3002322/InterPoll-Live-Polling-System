# Live Polling System

A real‑time classroom polling app that lets teachers create time‑boxed multiple‑choice questions, collect student votes live, show results instantly, chat with the class, and manage participants. The stack is React + Tailwind on the frontend and Node/Express + Socket.IO on the backend. The app is deployment‑ready for Vercel (frontend) and Render (backend).

## Features

- Teacher workflow
    - Create a question with a timer and any number of options.
    - Mark correct options with a simple boolean flag per option.
    - Broadcast a new poll to all connected students instantly.
    - View live vote counts and lock final results at any time.
    - See a participant list and kick disruptive users.
    - Use a built‑in real‑time chat to message the class.
    - Browse poll history and re‑ask any previous poll.
- Student workflow
    - Join with a display name and wait for the teacher’s next question.
    - Answer multiple‑choice polls in real time.
    - Watch results bars update live when the teacher reveals them.
    - Receive chat messages and class updates, and see kick notifications.
- Real‑time engine
    - Socket.IO rooms over a single Express server port.
    - Broadcast events for poll lifecycle, results, chat, and participants.
- UI/UX
    - Clean, responsive screens based on the shared Figma.
    - Tailwind color palette:
        - primary, primaryLight, secondary, grayDark, grayMid, grayLight.
    - Dedicated student and teacher views with floating actions and slide‑over panels.


## Architecture

- Frontend
    - React, React Router, Tailwind CSS.
    - Vite (or CRA) build.
    - Contexts:
        - SocketContext: single Socket.IO client instance.
        - PollContext: holds the current poll on teacher screens.
- Backend
    - Node.js, Express, Socket.IO.
    - In‑memory state for currentPoll, answers, participants, and history.
    - Events:
        - teacher_create_poll → poll_started (to all).
        - student_join → participants_update (to all).
        - submit_answer → poll_update (to all).
        - teacher_show_results → poll_results (to all) + snapshot to history.
        - send_chat → chat_message (to all).
        - kick_student → kicked (to specific socket).
        - teacher_request_history → history_data (to requester).
- Deployments
    - Vercel for the SPA frontend.
    - Render Web Service for the Node/Socket.IO server.


## Project Structure

```
frontend/
  src/
    components/
      RoleSelection.jsx
      StudentStart.jsx
      WaitingScreen.jsx
      student/...
      teacher/
        TeacherCreate.jsx
        TeacherLive.jsx
        TeacherHistory.jsx
      UI/...
    context/
      SocketContext.js
      PollContext.js
    theme/ (optional)
  index.html
  package.json
backend/
  server.js
  package.json
```


## Local Development

- Backend
    - npm install
    - npm start
    - Server listens on process.env.PORT (default 5000). Endpoint GET / returns a health message.
- Frontend
    - npm install
    - Create .env with VITE_SOCKET_URL=http://localhost:5000
    - npm run dev
    - Visit http://localhost:5173 (Vite default)


## Socket Events

- teacher_create_poll
    - Payload: { question, timer, options: [{ text, correct }] }
    - Effect: resets answers, sets currentPoll, emits poll_started.
- poll_started
    - Broadcast to all clients with the new poll.
- student_join
    - Payload: studentName; adds to socket.data; emits participants_update.
- submit_answer
    - Payload: optionIndex (1‑based); tallies once per student; emits poll_update.
- teacher_show_results
    - Emits poll_results with final tallies and snapshots the poll into history.
- send_chat
    - Payload: { text }; emits chat_message with sender + text.
- kick_student
    - Payload: studentName; finds socket by name, emits kicked, disconnects.
- teacher_request_history → history_data
    - Sends an array of previous polls:
        - { id, question, timer, options, counts, createdAt }


## Environment Variables

- Frontend (Vite)
    - VITE_SOCKET_URL: the backend base URL, e.g., https://your-api.onrender.com
- Backend
    - PORT: provided by Render automatically.
    - CORS configured in Socket.IO to accept your Vercel domain(s).


## Deployment

- Vercel
    - Import the frontend repo/folder.
    - Root Directory: frontend/ (if monorepo).
    - Build Command: npm run build.
    - Output Directory: dist (Vite) or build (CRA).
    - Environment: VITE_SOCKET_URL set to Render URL.
    - SPA routing: Vercel handles React Router; add a rewrite if deep links 404.
- Render
    - New Web Service from the backend repo/folder.
    - Build Command: npm install.
    - Start Command: node server.js (or npm start).
    - WebSockets work on the same Express server port.
    - Socket.IO CORS: origin set to your Vercel domain(s).


## Common Pitfalls and Fixes

- No deploy triggers on Vercel
    - Ensure GitHub repo is linked and automatic deployments enabled for the branch.
- Socket not connecting in production
    - Check VITE_SOCKET_URL, ensure HTTPS, correct domain, and CORS on the server.
- “Ask Question” no‑ops in production
    - Console errors often indicate an env var or Socket.IO connection issue; verify socket emits and server logs.
- Options list not adding
    - Ensure setState uses functional updates and there’s no runtime exception earlier in render.


## Scripts

- Frontend
    - dev: Vite dev server
    - build: production build
    - preview: preview static build
- Backend
    - start: node server.js


## Roadmap

- Persist history to a database (e.g., Redis or Postgres).
- Authentication for teachers and named sessions/rooms.
- Pagination and export for poll history.
- Accessibility and keyboard navigation improvements.
- Better timer synchronization using server timestamps.


## Acknowledgements

Thanks to the open‑source React, Tailwind, Express, and Socket.IO communities, and to Vercel and Render for hosting support.

