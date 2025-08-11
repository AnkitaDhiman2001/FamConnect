'use client';
import React, { useState, createContext, useContext } from "react";

const Context = createContext<any>(undefined);

function ContextProvider({ children }: {
    children: React.ReactNode;
  }) {
  const [loggedUser, setLoggedUser] = useState<any>(null);

  return (
    <Context.Provider value={{ loggedUser, setLoggedUser }}>
      {children}
    </Context.Provider>
  );
}

// Create a custom hook to access the context
export default function useNewContext() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useNewContext must be used within a ContextProvider');
  }
  return context;
}

// export default Context;
export { ContextProvider };