import { useEffect, useState } from 'react';
import { Plus, Users, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Room {
  id: string;
  name: string;
  description: string;
  members: number;
}

const Dashboard = () => {
  // const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomId, setRoomId] = useState("")
  const navigate = useNavigate();
  const [rooms] = useState<Room[]>([
    {
      id: '1',
      name: 'Mathematics 101',
      description: 'Introduction to Calculus',
      members: 25,
    },
    {
      id: '2',
      name: 'Physics Lab',
      description: 'Advanced Physics Experiments',
      members: 18,
    },
  ]);

  useEffect(()=>{
    const token = localStorage.getItem("token")
    axios.get("http://localhost:3000/api/v1/auth/user", {
      headers : {
        Authorization  : `baerer ${token}`
      }
    }).then((res)=>{
      if(res.status !== 200){
        navigate("/error/"+res.data)
      }
    }).catch((err)=>{
      console.log(err)
    })
  },[])

  const createRoom = ()=>{
    const token = localStorage.getItem("token")
    axios.post("http://localhost:3000/api/v1/room/create-room", {} ,{
      headers : {
        Authorization  : `baerer ${token}`
      }
    }).then((res)=>{
      if(res.status !== 200){
        navigate("/error/"+res.data)
      }else{
        localStorage.setItem("room-token", res.data.roomToken)
        localStorage.setItem("user-token-id", res.data.userId)
        navigate("/room/"+res.data.roomId)
      }
    }).catch((err)=>{
      console.log(err)
    })
  }

  const joinRoom = ()=>{
    const token = localStorage.getItem("token")
    axios.post("http://localhost:3000/api/v1/room/join-room",{roomId},{
      headers : {
        authorization : `baerer ${token}`
      }
    }).then((res)=>{
      localStorage.setItem("room-token", res.data.roomToken)
      localStorage.setItem("user-token-id", res.data.userId)
      navigate("/room/"+res.data.roomId)
    }).catch((err)=>{
      console.log(err)
    })
    setRoomId("")
    setShowJoinModal(false)
  }

  const handleLogout = ()=>{
    localStorage.removeItem("token")
    navigate("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Dashboard</span>
            </div>
            <Link onClick={handleLogout} to="/auth/signin" className="flex items-center text-gray-600 hover:text-gray-900">
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Classrooms</h1>
          <div className="flex space-x-4">
            <button
              onClick={()=>setShowJoinModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Join Room
            </button>
            <button
              onClick={createRoom}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Room
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">{room.name}</h3>
                    <p className="text-sm text-gray-500">{room.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {room.members} members
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Enter Classroom
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Create Room Modal */}
      {false && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Classroom</h3>
                <div className="mt-2">
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="room-name" className="block text-sm font-medium text-gray-700">
                        Room Name
                      </label>
                      <input
                        required
                        type="text"
                        value={roomId}
                        onChange={(e)=>setRoomId(e.target.value)}
                        name="room-name"
                        id="room-name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </form>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2"
                  // onClick={() => setShowCreateModal(false)}
                >
                  Create
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1"
                  // onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Join Classroom</h3>
                <div className="mt-2">
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="room-code" className="block text-sm font-medium text-gray-700">
                        Room Code
                      </label>
                      <input
                        type="text"
                        name="room-code"
                        id="room-code"
                        value={roomId}
                        onChange={(e)=>setRoomId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter room code"
                      />
                    </div>
                  </form>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2"
                  onClick={joinRoom}
                >
                  Join
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;