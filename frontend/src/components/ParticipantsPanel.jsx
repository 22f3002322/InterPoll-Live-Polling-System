// src/components/ParticipantsPanel.jsx
import React from 'react';
import { colors } from '../theme/colors';

export default function ParticipantsPanel({ open = true, onClose }) {
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
      <div style={{ display:'flex', gap:24, padding:'12px 16px', borderBottom:'1px solid #EFEFEF' }}>
        <div style={{ color: colors.grayMid, cursor:'pointer' }}>Chat</div>
        <div style={{ color: colors.grayDark, fontWeight:700 }}>Participants</div>
      </div>
      <div style={{ padding:12 }}>
        {['Rahul Arora','Pushpender Rautela','Rijul Zalpuri','Nadeem N','Ashwin Sharma'].map(name => (
          <div key={name} style={{ padding:'10px 8px', borderBottom:'1px solid #F2F2F2', color: colors.grayDark }}>
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
