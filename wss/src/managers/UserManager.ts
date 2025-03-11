import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";

export class UserManager {

    private rooms : RoomManager[]

    constructor (){
        this.rooms = []
    }


    joinRoom(message: string) {
        const parsedMessage = JSON.parse(message);
        const userId : string = parsedMessage.userId
        const room = this.rooms.find((rm) => rm.roomId === parsedMessage.roomId);
        room?.joinHttp(userId)
    }

    createRoom(message: string) {
        const parsedMessage = JSON.parse(message);        
        const userId : string = parsedMessage.userId
        const room = new RoomManager(parsedMessage.roomId, userId);
        this.rooms.push(room);
        room.joinHttp(userId)

    }


    addUser(socket : WebSocket){
        this.addHandler(socket)
    }

    private addHandler(socket : WebSocket){
        socket.on("message", async(message) => {
            const parsedMessage = await JSON.parse(message.toString());
            const username = parsedMessage.userId
            const room = this.rooms.find((rm) => rm.roomId === parsedMessage.roomId);
            switch (parsedMessage.type) {
                case "JOIN_ROOM":
                    room?.join(username, socket);
                    break;
                case "GET_ROOM_STATE":
                    room?.getRoomState(socket);
                    break;
                case "CHAT_MESSAGE" : 
                    room?.message(socket, parsedMessage)
                    break;
                case "START_DRAWING" : 
                    room?.drawEvent(socket, parsedMessage)
                    break;
                case "STOP_DRAWING" :
                    room?.drawEvent(socket, parsedMessage)
                    break;
                case "DRAW":
                    room?.drawEvent(socket, parsedMessage)
                    break;
                case  "CLEAR_CANVAS" : 
                    room?.drawEvent(socket, parsedMessage)
                    break;
                case  "WHITEBOARD" : 
                    room?.whiteboard(socket, parsedMessage)
                    break;
                default:
                    console.warn("Unhandled message type:", parsedMessage.type);
                    break;
            }
            
        });
    }
}