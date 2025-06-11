import axios from "axios"
import { Users } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface RoomCardProp {
    id: string
    name: string
    description: string
    key: number
}


export const RoomCard = ({ id, key, name, description }: RoomCardProp) => {

    const navigate = useNavigate();


    const enterClassroom = () => {
        const token = localStorage.getItem("token")
        axios.post("http://localhost:3000/api/v1/room/enter-classroom", {roomId : id}, {
            headers: {
                authorization: `baerer ${token}`
            }
        }).then((res) => {
            if(res.data.err){
                alert(res.data.err)
            }else{
                localStorage.setItem("room-token", res.data.roomToken)
                localStorage.setItem("user-token-id", res.data.userId)
                navigate("/room/" + res.data.roomId)
            }
        }).catch((err) => {
            console.log(err)
        })
    }


    return (
        <div key={key} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5">
                        <h3 className="text-lg font-medium text-gray-900">{name}</h3>
                        <p className="text-sm text-gray-500">{description}</p>
                    </div>
                </div>
                {/* <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {room.members} members
                  </div>
                </div> */}
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <button onClick={enterClassroom} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Enter Classroom
                </button>
            </div>
        </div>
    )
}