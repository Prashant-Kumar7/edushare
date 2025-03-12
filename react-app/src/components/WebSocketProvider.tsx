import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const WS_URL = "ws://localhost:8080"; // Replace with your WebSocket server URL

interface WebSocketContextType {
  sendMessage: (message: string) => void;
  addMessageListener: (type: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const messageListeners = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const [, forceRender] = useState({}); // To trigger re-renders when needed

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => console.log("WebSocket Connected");
    ws.onclose = () => console.log("WebSocket Disconnected");
    ws.onerror = (error) => console.error("WebSocket Error", error);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data.type;

        if (type && messageListeners.current.has(type)) {
          messageListeners.current.get(type)?.forEach(callback => callback(data));
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);

  const addMessageListener = useCallback((type: string, callback: (data: any) => void) => {
    if (!messageListeners.current.has(type)) {
      messageListeners.current.set(type, new Set());
    }
    messageListeners.current.get(type)?.add(callback);

    // Force re-render to ensure components are aware of the updated listeners
    forceRender({});

    return () => {
      messageListeners.current.get(type)?.delete(callback);
      if (messageListeners.current.get(type)?.size === 0) {
        messageListeners.current.delete(type);
      }
      forceRender({});
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ sendMessage, addMessageListener }}>
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
