import express from "express"
import { WebSocketServer, WebSocket } from "ws";
import { createClient } from 'redis';
import dotenv from "dotenv"
import { UserManager } from "./managers/UserManager";

dotenv.config();

const app = express()

const httpServer = app.listen(8080)

const wss = new WebSocketServer({ server: httpServer });

const users = new UserManager()

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: 13642
    }
});


wss.on("connection", (ws) => {
    users.addUser(ws)
    setInterval(()=>{
        wss.clients.forEach((socket: WebSocket)=>{
            socket.send(JSON.stringify({type : "ping"}))
        })
    },30000)
});


async function StartQueue(){
    try {
        await client.connect();
        console.log("ws connected to Redis.");
  
        // Main loop
        while (true) {
            try {
                const submission = await client.brPop("room", 0);
                if(submission){
  
                    const parsedMessage = JSON.parse(submission.element.toString())
                    if(parsedMessage.type === "JOIN"){
                        users.joinRoom(submission.element)
                    }
                  
                    if(parsedMessage.type === "CREATE"){
                        users.createRoom(submission.element)
                    }
  
                }
  
            } catch (error) {
                console.error("Error processing submission:", error);
            }
        }
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }
}
  
StartQueue()




