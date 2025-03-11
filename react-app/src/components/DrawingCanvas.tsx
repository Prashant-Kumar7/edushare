import { useRef, useState, useEffect } from "react";
import { useWebSocket } from "./WebSocketProvider";
import { useParams } from "react-router-dom";



interface DrawingProps {
    host? : boolean
}

export function DrawingCanvas({host}: DrawingProps) {
    const { roomId } = useParams();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(5);
    const [isErasing, setIsErasing] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

    const { socket, sendMessage } = useWebSocket();


    if (socket){
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // if (!ctxRef.current) return;

            switch (data.type) {
                case "CLEAR_CANVAS":
                    if (ctxRef.current && canvasRef.current) {
                        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        ctxRef.current.beginPath();
                    }
                    break;

                case "START_DRAWING":
                    ctxRef.current?.beginPath();
                    ctxRef.current?.moveTo(data.x, data.y);
                    break;

                case "DRAW":
                    drawOnCanvas(data.x, data.y, data.color, data.size);
                    break;

                case "STOP_DRAWING":
                    ctxRef.current?.closePath();
                    break;
            }
        };
    }

    if(host){
        
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth * 0.8;
            canvas.height = window.innerHeight * 0.8;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineCap = "round";
                ctxRef.current = ctx;
            }
        }
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!ctxRef.current || !host) return;
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
        setDrawing(true);
        sendMessage(JSON.stringify({ type: "START_DRAWING", x, y, roomId : roomId }))
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawing || !ctxRef.current || !socket || !host) return;
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        const strokeColor = isErasing ? "#ffffff" : color;
        drawOnCanvas(x, y, strokeColor, size);
        sendMessage(JSON.stringify({ type: "DRAW", x, y, color: strokeColor, size, roomId : roomId }))
    };

    const stopDrawing = () => {
        if (ctxRef.current) {
            ctxRef.current.closePath();
        }
        setDrawing(false);
        sendMessage(JSON.stringify({ type: "STOP_DRAWING" , roomId : roomId}))
    };

    const drawOnCanvas = (x: number, y: number, strokeColor: string, strokeSize: number) => {
        if (!ctxRef.current) return;
        ctxRef.current.strokeStyle = strokeColor;
        ctxRef.current.lineWidth = strokeSize;
        ctxRef.current.lineTo(x, y);
        ctxRef.current.stroke();
    };

    const clearCanvas = () => {
        if (ctxRef.current && canvasRef.current) {
            ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctxRef.current.beginPath();
        }
        sendMessage(JSON.stringify({ type: "CLEAR_CANVAS" , roomId : roomId}))
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div className="flex text-white flex-col bg-zinc-900 items-center relative">
            
            <canvas 
                ref={canvasRef} 
                className="border-2  bg-white"
                
                onMouseDown={startDrawing} 
                onMouseMove={(e) => {
                    draw(e);
                    handleMouseMove(e);
                }} 
                onMouseUp={stopDrawing} 
                onMouseOut={stopDrawing} 
            />
            {host && <div className="mb-2">
                <label>Color: </label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={isErasing} />
                <label className="ml-4">Size: </label>
                <input type="number" value={size} min="1" max="50" onChange={(e) => setSize(Number(e.target.value))} />

                <button onClick={clearCanvas} className="ml-4 px-3 py-1 bg-red-500 text-white rounded">Clear</button>

                <button 
                    onClick={() => setIsErasing(!isErasing)} 
                    className={`ml-4 px-3 py-1 rounded ${isErasing ? "bg-gray-500" : "bg-yellow-500 text-black"}`}
                >
                    {isErasing ? "Drawing Mode" : "Eraser"}
                </button>
            </div>}
            
            {/* Eraser cursor preview */}
            {isErasing && (
                <div 
                    className="absolute rounded-full border border-gray-700 bg-gray-300 opacity-70 pointer-events-none" 
                    style={{
                        width: size,
                        height: size,
                        top: cursorPos.y - size / 2,
                        left: cursorPos.x - size / 2,
                    }}
                />
            )}
        </div>
    );
}
