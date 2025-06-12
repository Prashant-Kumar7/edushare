import { WebSocket } from 'ws';
import { RoomManager } from './RoomManager';
import { WebSocketMessage, MessageHandler } from '../types';
import {client} from "../index"

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

        this.messageHandlers.set("SLIDES", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.slides(socket, message);
        });

        this.messageHandlers.set("WHITEBOARD_STROCKS_STATE" , (socket, message)=>{
            const room = this.getRoom(message.roomId);
            room?.whiteboardStrocksState(socket,message)
        })

        this.messageHandlers.set("PAGE_STROCKS_STATE" , (socket, message)=>{
            const room = this.getRoom(message.roomId);
            room?.PageStrocksState(socket,message)
        })


        this.messageHandlers.set("SEND_SLIDES" , (socket, message)=>{
            const room = this.getRoom(message.roomId);
            room?.reciveSlides(message)
        })

        this.messageHandlers.set("ADD_NEW_SLIDE" , (socket, message)=>{
            const room = this.getRoom(message.roomId);
            room?.addNewSlide(message)
        })

        this.messageHandlers.set("CHANGE_SLIDE_PAGE", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.drawPageEvent(socket, message);
        });


        this.messageHandlers.set("CLEAR_SLIDE", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.drawPageEvent(socket, message);
        });


        this.messageHandlers.set("STOP_SLIDE_DRAWING", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.drawPageEvent(socket, message);
        });


        this.messageHandlers.set("DRAW_SLIDE", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.drawPageEvent(socket, message);
        });


        this.messageHandlers.set("START_SLIDE_DRAWING", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.drawPageEvent(socket, message);
        });

        this.messageHandlers.set("PARTICIPANT_LEAVE_ROOM", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.leave(socket, message);
        });

        this.messageHandlers.set("HOST_LEAVE_ROOM", (socket, message) => {
            const room = this.getRoom(message.roomId);
            room?.leave(socket, message);
        });
    }

    async joinRoom(message: string):Promise<void> {
        const parsedMessage = JSON.parse(message);
        const userId: string = parsedMessage.userId;
        const room = this.getRoom(parsedMessage.roomId);
        if(room?.host.username === userId || room?.host.socket){
            room?.joinHttp(userId);
            await client.lPush(parsedMessage.processId, "JOINED");
        }else {
            await client.lPush(parsedMessage.processId, "ROOM_CLOSE");
        }
    }

    async createRoom(message: string):Promise<void> {
        const parsedMessage = JSON.parse(message);
        const userId: string = parsedMessage.userId;
        const room = new RoomManager(parsedMessage.roomId, userId);
        this.rooms.push(room);
        room.joinHttp(userId);
    }

    async deleteRoom(message : string) : Promise<void> {
        const parsedMessage = JSON.parse(message);
        const room = this.getRoom(parsedMessage.roomId);
        if(room){
            this.rooms = this.rooms.filter((rm)=>{
                return rm.roomId !== room.roomId
            })
            await client.lPush(parsedMessage.processId, "ROOM_DELETED");
        }else {
            await client.lPush(parsedMessage.processId, "ROOM_DOESNOT_EXISTS");
        }
        
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