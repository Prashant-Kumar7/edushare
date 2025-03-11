import { WebSocket } from 'ws';
import { RoomManager } from './RoomManager';
import { WebSocketMessage, MessageHandler } from '../types';

export class UserManager {
    private rooms: RoomManager[];
    private messageHandlers: Map<string, MessageHandler>;

    constructor() {
        this.rooms = [];
        this.messageHandlers = new Map();
        this.initializeMessageHandlers();
    }

    private initializeMessageHandlers() {
        this.messageHandlers.set("JOIN_ROOM", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.join(message.userId, socket);
        });

        this.messageHandlers.set("GET_ROOM_STATE", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.getRoomState(socket);
        });

        this.messageHandlers.set("CHAT_MESSAGE", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.message(socket, message);
        });

        this.messageHandlers.set("START_DRAWING", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.drawEvent(socket, message);
        });

        this.messageHandlers.set("STOP_DRAWING", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.drawEvent(socket, message);
        });

        this.messageHandlers.set("DRAW", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.drawEvent(socket, message);
        });

        this.messageHandlers.set("CLEAR_CANVAS", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.drawEvent(socket, message);
        });

        this.messageHandlers.set("WHITEBOARD", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.whiteboard(socket, message);
        });
    }

    joinRoom(message: string): void {
        const parsedMessage = JSON.parse(message);
        const userId: string = parsedMessage.userId;
        const room = this.getRoom(parsedMessage.roomId);
        room?.joinHttp(userId);
    }

    createRoom(message: string): void {
        const parsedMessage = JSON.parse(message);
        const userId: string = parsedMessage.userId;
        const room = new RoomManager(parsedMessage.roomId, userId);
        this.rooms.push(room);
        room.joinHttp(userId);
    }

    addUser(socket: WebSocket): void {
        this.setupMessageHandler(socket);
    }

    private getRoom(roomId: string): RoomManager | undefined {
        return this.rooms.find(room => room.roomId === roomId);
    }

    private setupMessageHandler(socket: WebSocket): void {
        socket.on("message", async (message: string) => {
            try {
                const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
                const handler = this.messageHandlers.get(parsedMessage.type);
                
                if (handler) {
                    handler(socket, parsedMessage);
                } else {
                    console.warn("Unhandled message type:", parsedMessage.type);
                }
            } catch (error) {
                console.error("Error processing message:", error);
            }
        });
    }
}