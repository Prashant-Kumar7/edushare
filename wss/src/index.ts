import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createClient } from 'redis';
import dotenv from "dotenv";
import { UserManager } from "./managers/UserManager";

dotenv.config();

const app = express();
app.get("/",(_,res)=>{
    res.json("hello from edushare websocket server")
})
const httpServer = app.listen(8080);
const wss = new WebSocketServer({ server: httpServer });
const users = new UserManager();


export const client = createClient({
  url: process.env.REDIS_URL
});

// Keep-alive ping
const pingInterval = 5000;
const pingAllClients = () => {
    const dataset = users.rooms.reduce((acc, room) => {
        acc[room.roomId] = room.roomClosed;
        return acc;
    }, {} as Record<string, boolean>);
    wss.clients.forEach((socket: WebSocket) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping"}));
            socket.send(JSON.stringify({ type: "ROOM_DATA" , roomData : dataset}));
        }
    });
};

users.sendRooms(wss)

wss.on("connection", (ws) => {
    users.addUser(ws);
});

const timer = setInterval(pingAllClients, pingInterval);

async function startQueue() {
    try {
        await client.connect();
        console.log("WebSocket server connected to Redis");

        while (true) {
            try {
                const submission = await client.brPop("room", 0);
                if (submission) {
                    const parsedMessage = JSON.parse(submission.element);
                    
                    switch (parsedMessage.type) {
                        case "JOIN":
                            await users.joinRoom(submission.element);
                            break;
                        case "CREATE":
                            await users.createRoom(submission.element);
                            break;
                        case "ENTER_CLASSROOM":
                            await users.joinRoom(submission.element);
                            break;
                        case "DELETE_CLASSROOM":
                            await users.deleteRoom(submission.element);
                            break;
                        default:
                            console.warn("Unhandled Redis message type:", parsedMessage.type);
                    }
                }
            } catch (error) {
                console.error("Error processing Redis message:", error);
            }
        }
    } catch (error) {
        console.error("Failed to connect to Redis:", error);
        process.exit(1);
    }
}

startQueue().catch(error => {
    clearInterval(timer)
    console.error("Fatal error in queue processing:", error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    httpServer.close(() => {
        clearInterval(timer)
        console.log('HTTP server closed');
        client.quit();
        process.exit(0);
    });
});