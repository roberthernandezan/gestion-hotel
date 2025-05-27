import React, { createContext, useState } from "react";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [bar, setBar] = useState(null);
  const [empleado, setEmpleado] = useState(null);

  const resetGlobalState = () => {
    setBar(null);
    setEmpleado(null);
    console.log("Estado global reiniciado.");
  };

  return (
    <GlobalContext.Provider value={{ bar, setBar, empleado, setEmpleado, resetGlobalState }}>
      {children}
    </GlobalContext.Provider>
  );
};
