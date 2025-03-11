import { useState, useEffect } from "react";
import { useWebSocket } from "./WebSocketProvider";
import { useParams } from "react-router-dom";

export function ChatRoom() {
    const [messageArray, setMessageArray] = useState<string[]>([]);
    const [message, setMessage] = useState<string>("");
    const { sendMessage, addMessageListener } = useWebSocket();
    const { roomId } = useParams();

    useEffect(() => {
        const unsubscribe = addMessageListener("CHAT_MESSAGE", (data) => {
            setMessageArray((prev) => [...prev, `${data.userId} : ${data.payload}`]);
        });

        return () => unsubscribe();
    }, [addMessageListener]);

    const sendChat = () => {
        sendMessage(JSON.stringify({
            type: "CHAT_MESSAGE",
            payload: message,
            roomId: roomId,
            userId: localStorage.getItem("user-token-id")
        }));
        setMessage("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            sendChat();
        }
    };

    return (
        <div className="grid text-white grid-rows-12 p-1 bg-zinc-700 h-full w-80">
            <div className="flex bg-zinc-800 row-span-11 flex-col">
                {messageArray.map((msg, index) => (
                    <span key={index}>{msg}</span>
                ))}
            </div>
            <div className="row-span-1 flex items-center">
                <input
                    value={message}
                    onKeyUp={handleKeyDown}
                    onChange={(e) => setMessage(e.target.value)}
                    className="py-1 rounded-l-md border-0 focus:outline-none bg-zinc-800 px-2 w-full"
                    type="text"
                    placeholder="Enter Message"
                />
                <button
                    onClick={sendChat}
                    className="p-1 hover:cursor-pointer py-1 px-2 rounded-r-md bg-blue-600"
                >
                    send
                </button>
            </div>
        </div>
    );
}