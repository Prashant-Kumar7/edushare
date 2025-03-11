import { WebSocket } from "ws";


interface RoomState {
    isWhiteBoardActive : boolean,
    isPptActive : boolean,
    whiteboardStrocks : string,
    currentPage : number,
    listOfPages : string[],
    pageStrocksState : {
        [key : number] : string
    },
    isScreenShareSctive : boolean
}


interface Users {
    [key : string] : WebSocket | null
}


interface Host {
    socket : WebSocket | null
    username : string
}




export class RoomManager{
    private participants : Users
    public roomId : string
    private roomState : RoomState
    private host : Host
    private usernames : string[]
    private messages : string[]
     

    constructor(roomId : string, hostName : string){
        this.participants = {},
        this.roomId = roomId,
        this.usernames = []
        this.host = {
            socket : null,
            username : hostName
        },
        this.roomState = {
            isPptActive : false,
            isWhiteBoardActive : false,
            whiteboardStrocks : "",
            currentPage : 0,
            listOfPages :[],
            pageStrocksState : [],
            isScreenShareSctive : false
        },
        this.messages = []
    }

    joinHttp(username : string){
        this.participants = {
            ...this.participants,
            [username] : null
        }
        this.usernames.push(username)
    }

    join( username : string, socket : WebSocket){
        if(this.host.username === username){
            this.host.socket = socket
        }

        socket.send(JSON.stringify({type : "HOST", username : this.host.username}))        
        this.participants[username] = socket

        this.usernames.forEach((user)=>{
            this.participants[user]?.send(JSON.stringify({type : "PARTICIPANTS", participants : this.usernames, username : username}))
        })
    }




    drawEvent(socket: WebSocket, parsedMessage : any){
        this.usernames.forEach((user)=>{
            if(socket !== this.participants[user]){
                this.participants[user]?.send(JSON.stringify(parsedMessage))
            }
        })
    }

    getRoomState(socket: WebSocket){
        
    }

    message(socket : WebSocket, parsedMessage : any){

        this.messages.push(`${parsedMessage.userId} : ${parsedMessage.payload}`)
        this.usernames.forEach((user)=>{
            this.participants[user]?.send(JSON.stringify(parsedMessage))
        })
    }

    whiteboard(socket : WebSocket, parsedMessage : any){
        // if(socket === this.host.socket){
        //     this.roomState.isWhiteBoardActive = parsedMessage.active
        //     if(this.roomState.isWhiteBoardActive){
        //         this.roomState.isPptActive = false;
        //         this.roomState.isPptActive = false;

        //     }
        // }
    }

}