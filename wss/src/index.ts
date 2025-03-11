import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createClient } from 'redis';
import dotenv from "dotenv";
import { UserManager } from "./managers/UserManager";

dotenv.config();

const app = express();
const httpServer = app.listen(8080);
const wss = new WebSocketServer({ server: httpServer });
const users = new UserManager();

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 13642
    }
});

// Keep-alive ping
const pingInterval = 30000; // 30 seconds
const pingAllClients = () => {
    wss.clients.forEach((socket: WebSocket) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
        }
    });
};

wss.on("connection", (ws) => {
    users.addUser(ws);
});

setInterval(pingAllClients, pingInterval);

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
                            users.joinRoom(submission.element);
                            break;
                        case "CREATE":
                            users.createRoom(submission.element);
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
    console.error("Fatal error in queue processing:", error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    httpServer.close(() => {
        console.log('HTTP server closed');
        client.quit();
        process.exit(0);
    });
});