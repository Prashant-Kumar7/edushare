import {
  ControlBar,
  DisconnectButton,
  LeaveIcon,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { ChatRoom } from '../components/chatRoom';
import { useWebSocket } from '../components/WebSocketProvider';
import { SlidePresentation } from '../components/SlidePresentation';
import axios from 'axios';
import { Upload } from 'lucide-react';
import "../App.css"

const serverUrl = 'wss://live-stream-j0ngkwts.livekit.cloud';

export default function ClassRoom() {
  const { roomId } = useParams();
  const [token, setToken] = useState("");
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showSlides, setShowSlides] = useState(false);
  const [host, setHost] = useState(false);
  const [whiteboardState, setWhiteboardState] = useState("")
  const [currentPageState, setCurrentPageState] = useState("")
  const { sendMessage, addMessageListener } = useWebSocket();
  const [currentPage, setCurrentPage] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [slidesUrl,setSlidesUrl] = useState<string[]>([])
  const navigate = useNavigate();

  useEffect(() => {
    const roomToken = localStorage.getItem("room-token");
    if (roomToken) {
      setToken(roomToken);
    }

    const username = localStorage.getItem("user-token-id");
    
    const unsubscribeHost = addMessageListener("HOST", (data) => {
      if (data.username === username) {
        setHost(true);
      }
    });


    const unsubscribeRoomState = addMessageListener("ROOM_STATE", (data) => {
      setShowWhiteboard(data.state.isWhiteBoardActive)
      setWhiteboardState(data.state.whiteboardStrocks)
      setCurrentPage(data.state.currentPage)
      setShowSlides(data.state.isPptActive)
      setSlidesUrl(data.state.listOfPages)
      // const pageState = data.state.pageStrocksState[data.state.currentPage]
      setCurrentPageState(data.state.pageStrocksState[data.state.currentPage] || "")
      console.log(data)
    });

    const unsubscribeWhiteboard = addMessageListener("WHITEBOARD_STATE", (data) => {
      setShowWhiteboard(data.state.isWhiteBoardActive)
      setShowSlides(data.state.isPptActive)
      sendMessage(JSON.stringify({
        type: "GET_ROOM_STATE",
        roomId: roomId
      }));
    });


    const unsubscribeReciveSlides = addMessageListener("RECIVE_SLIDES", (data) => {
      setSlidesUrl(data.slides)
      console.log("uploaded")
      // setShowWhiteboard(data.state.isWhiteBoardActive)
      // setShowSlides(data.state.isPptActive)
      
    });


    const unsubscribenewSlide = addMessageListener("NEW_PAGE_STATE", (data) => {      
      setCurrentPage(data.state.currentPage)
      setSlidesUrl(data.state.listOfPages)
      // const pageState = data.state.pageStrocksState[data.state.currentPage]
      setCurrentPageState(data.state.pageStrocksState[data.state.currentPage] || "")
    });

    const unsubscribeSlides = addMessageListener("SLIDES_STATE", (data) => {
      setShowSlides(data.state.isPptActive)
      setShowWhiteboard(data.state.isWhiteBoardActive)
      sendMessage(JSON.stringify({
        type: "GET_ROOM_STATE",
        roomId: roomId
      }));
    });

    const unsubscribeCloseRoom = addMessageListener("ROOM_CLOSED", () => {
      navigate("/dashboard")
    });

    return () => {
      unsubscribeCloseRoom()
      unsubscribeHost();
      unsubscribeWhiteboard()
      unsubscribeRoomState()
      unsubscribeSlides()
      unsubscribeReciveSlides()
      unsubscribenewSlide()
    };
  }, [addMessageListener]);

  const sendEvent = () => {
    sendMessage(JSON.stringify({
      type: "JOIN_ROOM",
      roomId: roomId,
      userId: localStorage.getItem("user-token-id")
    }));
  };

  const leaveClassRoom = () => {
    // console.log("you left the room");
    if(host){
      sendMessage(JSON.stringify({
        type: "HOST_LEAVE_ROOM",
        roomId: roomId,
        userId: localStorage.getItem("user-token-id")
      }));
    }else{

      sendMessage(JSON.stringify({
        type: "PARTICIPANT_LEAVE_ROOM",
        roomId: roomId,
        userId: localStorage.getItem("user-token-id")
      }));
    }

    navigate("/dashboard", {})
  };


  const slides = ()=>{
    sendMessage(JSON.stringify({
      type: "SLIDES",
      roomId: roomId,
      payload : {
        active : !showSlides
      }
    }));
    setShowSlides(!showSlides)
  }

  const Whiteboard = ()=>{
    setShowWhiteboard(!showWhiteboard)
    sendMessage(JSON.stringify({
      type: "WHITEBOARD",
      roomId: roomId,
      payload : {
        active : !showWhiteboard
      }
    }));
  }

  
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
        const formData = new FormData();
        formData.append("file", file);
        axios.post("https://edushare-backend-1qcc.onrender.com/api/v1/file/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        }).then((res)=>{
          // setSlidesUrl(res.data.images)
          sendMessage(JSON.stringify({
            type: "SEND_SLIDES",
            roomId: roomId,
            slides : res.data.images
          }));
          console.log(res.data.images)
        }).catch((err)=>{
          console.log(err)
        }).finally(()=>{
          slides()
        })
      
    }
  }

  return (
    <div className='w-full h-screen'>
      <LiveKitRoom
        video={true}
        audio={false}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        style={{ height: '100vh' }}
        onLoad={sendEvent}
        onConnected={sendEvent}
      >
        <div className="flex h-full w-full bg-zinc-900">
          <div className="flex-1 w-full flex flex-col">
            <div className="flex-1  w-full relative">
              {showWhiteboard ? (
                <DrawingCanvas host={host} whiteboardState={whiteboardState} />
              ) : showSlides ? (
                <SlidePresentation slides={slidesUrl} host={host} currentSlide={currentPage} currentSlideState={currentPageState}/>
              ) : (
                <ScreenShareView />
              )}
            </div>

            <div className="h-16 bg-zinc-800 flex items-center px-4 gap-4">
              {host && <button
                onClick={Whiteboard}
                className={`px-4 py-2 rounded ${
                  showWhiteboard ? 'bg-blue-600' : 'bg-zinc-700'
                } text-white`}
              >
                Whiteboard
              </button>}
              {host && <button
                onClick={slides}
                className={`px-4 py-2 rounded ${
                  showSlides ? 'bg-blue-600' : 'bg-zinc-700'
                } text-white`}
              >
                Slides
              </button>}
              {host && <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf, .ppt, .pptx, .doc, .docx"
                    // accept=".pdf"
                    className="hidden"
                />

                <button
                    onClick={handleClick}
                    className={`px-4 py-2 flex items-center rounded ${
                      true ? 'bg-blue-600' : 'bg-zinc-700'
                    } text-white`}
                >
                    <Upload className="mr-2 h-4 w-4" /> Upload Slides
                </button>
              </div>}
              <div className={`flex ${host? "" : "w-full"} justify-center items-center`}>
                {host && 
                <ControlBar controls={{microphone : true, camera : true, screenShare : true, leave : false, settings : false, chat : false}} />
                }
                <DisconnectButton onClick={leaveClassRoom}>
                  {<LeaveIcon />}
                  {'Leave'}
                </DisconnectButton>
              </div>
            </div>
          </div>

          {true && (
            <div className="w-80 flex flex-col">
              <div className="w-full h-48">
                <CameraView />
              </div>
              <div className="flex-1">
                <ChatRoom />
              </div>
            </div>
          )}
          <RoomAudioRenderer />
        </div>
      </LiveKitRoom>
    </div>
  );
}

function CameraView() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="h-full">
      {tracks.map((track, index) => {
        if (track.participant.isCameraEnabled) {
          return (
            <ParticipantTile
              key={index}
              trackRef={track}
              style={{ width: '100%', height: '100%' }}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

function ScreenShareView() {
  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="h-full bg-black">
      {tracks.map((track, index) => (
        <ParticipantTile
          key={index}
          trackRef={track}
          style={{ width: '100%', height: '100%' }}
        />
      ))}
    </div>
  );
}