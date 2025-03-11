import { WebSocket } from 'ws';

export interface RoomState {
    isWhiteBoardActive: boolean;
    isPptActive: boolean;
    whiteboardStrocks: string;
    currentPage: number;
    listOfPages: string[];
    pageStrocksState: {
        [key: number]: string;
    };
    isScreenShareActive: boolean;
}

export interface Users {
    [key: string]: WebSocket | null;
}

export interface Host {
    socket: WebSocket | null;
    username: string;
}

export interface WebSocketMessage {
    type: string;
    userId: string;
    roomId: string;
    payload?: any;
}

export type MessageHandler = (socket: WebSocket, message: WebSocketMessage) => void;