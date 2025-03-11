import { useState } from "react";
import { useWebSocket } from "./WebSocketProvider";
import { useParams } from "react-router-dom";

export function ChatRoom(){

    const [messageArray, setMessageArray] = useState<string[]>([])
    const [message, setMessage] = useState<string>("")
    const { socket,sendMessage } = useWebSocket();
    const { roomId } = useParams();
    
    if(socket){
        socket.onmessage = (event)=>{
            const data = JSON.parse(event.data);
            switch (data.type){
                case "CHAT_MESSAGE":
                    console.log(data)
                    setMessageArray((prev)=>{
                        return [...prev, `${data.userId} : ${data.payload}`]
                    })
                    break;
            }
        }
    }

    const sendChat = ()=>{
        // setMessageArray((prev)=>{
        //     return [...prev, message]
        // })
        // socket?.send(JSON.stringify({type : "CHAT_MESSAGE", payload : message, roomId : roomId}))
        sendMessage(JSON.stringify({type : "CHAT_MESSAGE", payload : message, roomId : roomId, userId:localStorage.getItem("user-token-id")}))

        setMessage("")
    }

    const handleKeyDown = (e : any)=>{
        if(e.key === "Enter"){
            sendChat()
        }
    }

    return (
        <div className="grid text-white grid-rows-12 p-1 bg-zinc-700 h-full w-80 ">
            <div className="flex bg-zinc-800 row-span-11 flex-col">
                {messageArray.map((msg, index)=>{
                    return <span key={index}>{msg}</span>
                })}
            </div>
            <div className="row-span-1 flex items-center">
                <input value={message} onKeyUp={handleKeyDown} onChange={(e)=>setMessage(e.target.value)} className="py-1 rounded-l-md border-0 focus:outline-none bg-zinc-800 px-2 w-full" type="text" placeholder="Enter Message"/>
                <button onClick={sendChat} className="p-1 hover:cursor-pointer py-1 px-2 rounded-r-md bg-blue-600">send</button>
            </div>
        </div>
    )
}