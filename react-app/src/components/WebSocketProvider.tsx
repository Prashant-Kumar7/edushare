import React, { createContext, useContext, useEffect, useState } from "react";

const WS_URL = "ws://localhost:8080"; // Replace with your WebSocket server URL

interface WebSocketContextType {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => console.log("WebSocket Connected");
    ws.onclose = () => console.log("WebSocket Disconnected");
    ws.onerror = (error) => console.error("WebSocket Error", error);
    ws.onmessage = (event) => console.log("Received Message:", event.data);

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = (message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      console.error("WebSocket is not connected");
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
