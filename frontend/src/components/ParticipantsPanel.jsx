// src/components/ParticipantsPanel.jsx
import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';
import { colors } from '../theme/colors';

export default function ParticipantsPanel({ open = true, onClose, activeTab = "participants", onTabChange }) {
  const socket = useContext(SocketContext);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    // Listen for participants update from server
    socket.on("participants_update", (list) => {
      setParticipants(list);
    });

    return () => {
      socket.off("participants_update");
    };
  }, [socket]);

  if (!open) return null;

  return (
    <div style={{
      position:'fixed',
      right:24,
      bottom:24,
      width:360,
      borderRadius:10,
      background:'#fff',
      border:'1px solid #E6E6E6',
      boxShadow:'0 12px 24px rgba(0,0,0,0.08)'
    }}>
      {/* Header Tabs */}
      <div style={{ display:'flex', gap:24, padding:'12px 16px', borderBottom:'1px solid #EFEFEF' }}>
        <div 
          style={{ color: activeTab === "chat" ? colors.grayDark : colors.grayMid, fontWeight: activeTab === "chat" ? 700 : 400, cursor:'pointer' }} 
          onClick={() => onTabChange?.("chat")}
        >
          Chat
        </div>
        <div 
          style={{ color: activeTab === "participants" ? colors.grayDark : colors.grayMid, fontWeight: activeTab === "participants" ? 700 : 400, cursor:'pointer' }} 
          onClick={() => onTabChange?.("participants")}
        >
          Participants
        </div>
      </div>

      {/* Participants List */}
      <div style={{ padding:12, maxHeight:260, overflowY:'auto' }}>
        {participants.length === 0 ? (
          <div style={{ color: colors.grayMid, padding: '10px 8px' }}>No participants yet...</div>
        ) : (
          participants.map(name => (
            <div key={name} style={{ padding:'10px 8px', borderBottom:'1px solid #F2F2F2', color: colors.grayDark }}>
              {name}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
