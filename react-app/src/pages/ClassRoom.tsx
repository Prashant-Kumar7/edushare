import {
  ControlBar,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { ChatRoom } from '../components/chatRoom';
import { useWebSocket } from '../components/WebSocketProvider';

const serverUrl = 'wss://live-stream-j0ngkwts.livekit.cloud';

export default function ClassRoom() {
  const { roomId } = useParams();
  const [token, setToken] = useState("");
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [host, setHost] = useState(false);
  const [whiteboardState, setWhiteboardState] = useState("")
  const { sendMessage, addMessageListener } = useWebSocket();

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
      console.log(data)
    });

    const unsubscribeWhiteboard = addMessageListener("WHITEBOARD_STATE", (data) => {
      setShowWhiteboard(data.state.isWhiteBoardActive)
      sendMessage(JSON.stringify({
        type: "GET_ROOM_STATE",
        roomId: roomId
      }));
    });

    return () => {
      unsubscribeHost();
      unsubscribeWhiteboard()
      unsubscribeRoomState()
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
    console.log("you left the room");
  };

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

  

  return (
    <div className='w-full'>
      <LiveKitRoom
        video={true}
        audio={false}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={leaveClassRoom}
        data-lk-theme="default"
        style={{ height: '100vh' }}
        onLoad={sendEvent}
        onConnected={sendEvent}
      >
        <div className="flex h-screen bg-zinc-900">
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              {showWhiteboard ? (
                <DrawingCanvas host={host} whiteboardState={whiteboardState} />
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
              
              <div className="flex-1">
                <ControlBar/>
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
    <div className="h-[44rem] bg-black">
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