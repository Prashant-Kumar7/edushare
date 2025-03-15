import { useRef, useState, useEffect } from "react";
import { useWebSocket } from "./WebSocketProvider";
import { useParams } from "react-router-dom";

interface SlidePresentationProps {
    host?: boolean;
    currentSlide : number;
    currentSlideState : string
    slides : string[]
}

export function SlidePresentation({ host, currentSlide, currentSlideState, slides }: SlidePresentationProps) {
    const { roomId } = useParams();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(5);
    // const [isErasing, setIsErasing] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [currentPage, setCurrentPage] = useState(0);
    // const [pageStrokes, setPageStrokes] = useState<{ [key: number]: string }>({});

    const { sendMessage, addMessageListener } = useWebSocket();

    // Example slides - in production these would come from your backend
    

    useEffect(() => {
        const unsubscribeClear = addMessageListener("CLEAR_SLIDE", () => {
            if (ctxRef.current && canvasRef.current) {
                ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctxRef.current.beginPath();
                
            }
        });

        const unsubscribeStart = addMessageListener("START_SLIDE_DRAWING", (data) => {
            ctxRef.current?.beginPath();
            ctxRef.current?.moveTo(data.x, data.y);
        });

        const unsubscribeDraw = addMessageListener("DRAW_SLIDE", (data) => {
            drawOnCanvas(data.x, data.y, data.color, data.size);
            saveCanvasState();
        });

        const unsubscribeStop = addMessageListener("STOP_SLIDE_DRAWING", () => {
            ctxRef.current?.closePath();
            saveCanvasState();
        });

        const unsubscribeChangePage = addMessageListener("CHANGE_SLIDE_PAGE", (data) => {
            setCurrentPage(data.page);
            // loadPageStrokes(data.page);
        });

        return () => {
            unsubscribeClear();
            unsubscribeStart();
            unsubscribeDraw();
            unsubscribeStop();
            unsubscribeChangePage();
        };
    }, [addMessageListener]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth * 0.8;
            canvas.height = window.innerHeight * 0.8;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineCap = "round";
                ctxRef.current = ctx;
                // loadPageStrokes(currentPage);
            }
        }
    }, []);

    useEffect(()=>{
        setCurrentPage(currentSlide)
    },[currentSlide])


    useEffect(()=>{
        loadPageStrokes(currentSlideState)
    },[currentSlideState])

    const saveCanvasState = () => {
        if (canvasRef.current) {
            const imageData = canvasRef.current.toDataURL();
            sendMessage(JSON.stringify({ type: "PAGE_STROCKS_STATE", roomId , payload : {strocks : imageData, currentPage }}));
        }
    };

    const loadPageStrokes = (strocks : string) => {
        if (ctxRef.current && canvasRef.current) {
            ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            const img = new Image();
            img.src = strocks;
            img.onload = () => {
                ctxRef.current?.drawImage(img, 0, 0);
            };
            
        }
    };

    // const loadPageStrokes = (page: number) => {
    //     if (ctxRef.current && canvasRef.current) {
    //         ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    //         if (pageStrokes[page]) {
    //             const img = new Image();
    //             img.src = pageStrokes[page];
    //             img.onload = () => {
    //                 ctxRef.current?.drawImage(img, 0, 0);
    //             };
    //         }
    //     }
    // };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!ctxRef.current || !host) return;
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
        setDrawing(true);
        sendMessage(JSON.stringify({ 
            type: "START_SLIDE_DRAWING", 
            x, 
            y, 
            roomId,
            page: currentPage 
        }));
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawing || !ctxRef.current || !host) return;
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        const strokeColor = color;
        drawOnCanvas(x, y, strokeColor, size);
        sendMessage(JSON.stringify({ 
            type: "DRAW_SLIDE", 
            x, 
            y, 
            color: strokeColor, 
            size, 
            roomId,
            page: currentPage 
        }));
    };

    const stopDrawing = () => {
        if (ctxRef.current) {
            ctxRef.current.closePath();
            saveCanvasState();
        }
        setDrawing(false);
        sendMessage(JSON.stringify({ 
            type: "STOP_SLIDE_DRAWING", 
            roomId,
            page: currentPage 
        }));
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
        sendMessage(JSON.stringify({ 
            type: "CLEAR_SLIDE", 
            roomId,
            page: currentPage 
        }));
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const changePage = (newPage: number) => {
        if (newPage >= 0 && newPage < slides.length && host) {
            setCurrentPage(newPage);
            if(ctxRef.current && canvasRef.current){

                ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctxRef.current.beginPath();
            }
            sendMessage(JSON.stringify({ 
                type: "CHANGE_SLIDE_PAGE", 
                roomId,
                page: newPage 
            }));
            // loadPageStrokes(newPage);
        }
    };

    const handleAddingNewPages = ()=>{
        console.log("new page button clicked")
        sendMessage(JSON.stringify({ 
            type: "ADD_NEW_SLIDE", 
            roomId,
            currentPage  
        }));
    }


    

    return (
        <div className="flex text-white flex-col bg-zinc-900 items-center relative">
            <div className="relative">
                <img 
                    src={slides[currentPage]} 
                    alt={`Slide ${currentPage + 1}`}
                    className="absolute top-0 left-0 w-full h-full object-contain"
                    style={{ 
                        width: canvasRef.current?.width,
                        height: canvasRef.current?.height 
                    }}
                    // loading={}
                    onLoad={()=>console.log("image loaded")}
                    onLoadStart={()=>console.log("loading image")}
                />
                <canvas 
                    ref={canvasRef} 
                    className="relative z-10"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseDown={startDrawing} 
                    onMouseMove={(e) => {
                        draw(e);
                        handleMouseMove(e);
                    }} 
                    onMouseUp={stopDrawing} 
                    onMouseOut={stopDrawing} 
                />
            </div>
            
            {host && (
                <div className="mb-2 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => changePage(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-500"
                        >
                            Previous
                        </button>
                        <span>{currentPage + 1} / {slides.length}</span>
                        <button 
                            onClick={() => changePage(currentPage + 1)}
                            disabled={currentPage === slides.length - 1}
                            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-500"
                        >
                            Next
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <label>Color: </label>
                        <input 
                            type="color" 
                            value={color} 
                            onChange={(e) => setColor(e.target.value)} 
                            // disabled={isErasing} 
                        />
                        <label className="ml-4">Size: </label>
                        <input 
                            type="number" 
                            value={size} 
                            min="1" 
                            max="50" 
                            onChange={(e) => setSize(Number(e.target.value))} 
                        />
                    </div>

                    <button 
                        onClick={clearCanvas} 
                        className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                        Clear
                    </button>

                    {/* <button 
                        onClick={() => setIsErasing(!isErasing)} 
                        className={`px-3 py-1 rounded ${isErasing ? "bg-gray-500" : "bg-yellow-500 text-black"}`}
                    >
                        {isErasing ? "Drawing Mode" : "Eraser"}
                    </button> */}

                    {/* <button 
                        onClick={handleAddingNewPages} 
                        className={`px-3 py-1 rounded bg-green-600 text-black`}
                    >
                        Add Slide
                    </button> */}
                </div>
            )}
        </div>
    );
}