import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const WS_URL = "ws://localhost:8080"; // Replace with your WebSocket server URL

interface WebSocketContextType {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  addMessageListener: (type: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messageListeners, setMessageListeners] = useState<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => console.log("WebSocket Connected");
    ws.onclose = () => console.log("WebSocket Disconnected");
    ws.onerror = (error) => console.error("WebSocket Error", error);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data.type;
        
        if (type && messageListeners.has(type)) {
          messageListeners.get(type)?.forEach(callback => callback(data));
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [messageListeners]);

  const sendMessage = useCallback((message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      console.error("WebSocket is not connected");
    }
  }, [socket]);

  const addMessageListener = useCallback((type: string, callback: (data: any) => void) => {
    setMessageListeners(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(type)) {
        newMap.set(type, new Set());
      }
      newMap.get(type)?.add(callback);
      return newMap;
    });

    // Return cleanup function
    return () => {
      setMessageListeners(prev => {
        const newMap = new Map(prev);
        newMap.get(type)?.delete(callback);
        if (newMap.get(type)?.size === 0) {
          newMap.delete(type);
        }
        return newMap;
      });
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, sendMessage, addMessageListener }}>
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