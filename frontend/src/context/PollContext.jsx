// src/context/PollContext.jsx
import React, { createContext, useState } from 'react';

export const PollContext = createContext({
  poll: null,
  setPoll: () => {},
});

export const PollProvider = ({ children }) => {
  const [poll, setPoll] = useState(null);
  return (
    <PollContext.Provider value={{ poll, setPoll }}>
      {children}
    </PollContext.Provider>
  );
};
