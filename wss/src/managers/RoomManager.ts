import { WebSocket } from 'ws';
import { RoomState, Users, Host, WebSocketMessage } from '../types';

export class RoomManager {
    private participants: Users;
    public roomId: string;
    private roomState: RoomState;
    public host: Host;
    private usernames: string[];
    private messages: string[];
    private newSlide : string

    constructor(roomId: string, hostName: string) {
        this.participants = {};
        this.newSlide = "https://csv-upload-22990.s3.ap-south-1.amazonaws.com/blank-white-7sn5o1woonmklx1h.jpg"
        this.roomId = roomId;
        this.usernames = [];
        this.host = {
            socket: null,
            username: hostName
        };
        this.roomState = {
            isPptActive: false,
            isWhiteBoardActive: false,
            whiteboardStrocks: "",
            currentPage: 0,
            listOfPages: [],
            pageStrocksState: {},
            isScreenShareActive: false
        };
        this.messages = [];
    }

    joinHttp(username: string): void {
        this.participants = {
            ...this.participants,
            [username]: null
        };

        const found = this.usernames.find((name)=>{
            return name === username
        })

        if(found){
            return;
        }
        this.usernames.push(username);
    }

    join(username: string, socket: WebSocket): void {
        if (this.host.username === username) {
            this.host.socket = socket;
        }

        socket.send(JSON.stringify({ type: "HOST", username: this.host.username }));
        this.participants[username] = socket;
        this.broadcastToAll({
            type: "ROOM_STATE",
            state: this.roomState,
            // username: username
        })
        this.broadcastToAll({
            type: "PARTICIPANTS",
            participants: this.usernames,
            username: username
        });
    }

    drawEvent(socket: WebSocket, message: WebSocketMessage): void {
        if(message.type === "CLEAR_CANVAS"){
            this.roomState.whiteboardStrocks = ""
        }
        this.broadcastToOthers(socket, message);
    }

    drawPageEvent(socket: WebSocket, message: any): void {
        if(message.type === "CHANGE_SLIDE_PAGE"){
            this.roomState.currentPage = message.page
        }
        if(message.type === "CLEAR_SLIDE"){
            this.roomState.pageStrocksState[this.roomState.currentPage] = ""
        }
        this.broadcastToOthers(socket, message);
    }

    getRoomState(socket: WebSocket): void {
        socket.send(JSON.stringify({
            type: "ROOM_STATE",
            state: this.roomState
        }));
    }

    message(socket: WebSocket, message: WebSocketMessage): void {
        if (!message.payload) return;
        
        this.messages.push(`${message.userId} : ${message.payload}`);
        this.broadcastToAll(message);
    }

    whiteboard(socket: WebSocket, message: WebSocketMessage): void {
        if (socket === this.host.socket && typeof message.payload?.active === 'boolean') {
            this.roomState.isWhiteBoardActive = message.payload.active;
            if (this.roomState.isWhiteBoardActive) {
                this.roomState.isPptActive = false;
                this.roomState.isScreenShareActive = false;
            }
            this.broadcastToAll({
                type: "WHITEBOARD_STATE",
                state: this.roomState
            });
        }
    }


    slides(socket: WebSocket, message: WebSocketMessage): void {
        if (socket === this.host.socket && typeof message.payload?.active === 'boolean') {
            this.roomState.isPptActive = message.payload.active;
            if (this.roomState.isPptActive) {
                this.roomState.isWhiteBoardActive = false;
                this.roomState.isScreenShareActive = false;
            }
            this.broadcastToAll({
                type: "SLIDES_STATE",
                state: this.roomState
            });
        }
    }

    whiteboardStrocksState(socket : WebSocket, message : WebSocketMessage) : void{
        if (socket === this.host.socket) {
            // console.log(message.payload.strocks)
            this.roomState.whiteboardStrocks = message.payload.strocks;
        }
    }


    PageStrocksState(socket : WebSocket, message : WebSocketMessage) : void{
        if (socket === this.host.socket) {
            // console.log(message.payload.strocks)
            this.roomState.pageStrocksState[message.payload.currentPage] = message.payload.strocks;
        }
    }

    reciveSlides(message : any){

        this.roomState.listOfPages = message.slides
        this.broadcastToAll({
            type : "RECIVE_SLIDES",
            slides : this.roomState.listOfPages
        })
    }


    addNewSlide(message : any){
        console.log(message)
        this.roomState.listOfPages.splice(this.roomState.currentPage+1 , 0 ,this.newSlide)
        
        var newStateOfPgaes : {[key : number] : string} = {};
        newStateOfPgaes = {
            ...this.roomState.pageStrocksState,
            [this.roomState.currentPage + 1] : "" 
        }
        for (let index = this.roomState.currentPage + 2; index < this.roomState.listOfPages.length; index++) {
            newStateOfPgaes = {
                ...newStateOfPgaes,
                [index] : this.roomState.pageStrocksState[index-1]
            }
        }

        
        
        this.roomState.pageStrocksState = {
            ...newStateOfPgaes
        }
        this.roomState.currentPage = this.roomState.currentPage + 1
        console.log(this.roomState)
        this.broadcastToAll({
            type : "NEW_PAGE_STATE",
            state : this.roomState
        })
    }


    leave (socket : WebSocket,message : any){
        if(socket === this.host.socket){
            this.broadcastToOthers(this.host.socket, {
                type : "ROOM_CLOSED"
            })
            this.participants = {};
            this.newSlide = "https://csv-upload-22990.s3.ap-south-1.amazonaws.com/blank-white-7sn5o1woonmklx1h.jpg"
            this.usernames = [];
            this.host.socket = null
            this.roomState = {
                isPptActive: false,
                isWhiteBoardActive: false,
                whiteboardStrocks: "",
                currentPage: 0,
                listOfPages: [],
                pageStrocksState: {},
                isScreenShareActive: false
            };
            this.messages = [];
        }else{
            delete this.participants[message.userId]
            const index = this.usernames.indexOf(message.userId);
            this.usernames.splice(index, 1);
        }
    }

    private broadcastToAll(message: any): void {
        const messageStr = JSON.stringify(message);
        this.usernames.forEach(user => {
            const socket = this.participants[user];
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(messageStr);
            }
        });
    }


    private broadcastToOthers(excludeSocket: WebSocket, message: any): void {
        const messageStr = JSON.stringify(message);
        this.usernames.forEach(user => {
            const socket = this.participants[user];
            if (socket?.readyState === WebSocket.OPEN && socket !== excludeSocket) {
                socket.send(messageStr);
            }
        });
    }
}