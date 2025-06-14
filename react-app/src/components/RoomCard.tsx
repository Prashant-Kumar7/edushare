import axios from "axios";
import { Edit, Trash2Icon, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { EditRoomModal } from "./modals/EditRoomModal";
import { DeleteRoomModal } from "./modals/DeleteRoomModal";
import { RemoveRoomModal } from "./modals/RemoveRoomModal";

interface RoomCardProps {
    id: string;
    name: string;
    description: string;
    key: number;
    role: boolean;
    roomClosed : boolean
    onRoomUpdate: (id: string, name: string, description: string) => void;
    onRoomDelete: (id: string) => void;
    onRoomRemove: (id: string) => void;
}

export const RoomCard = ({ 
    id, 
    key, 
    name, 
    description, 
    role,
    roomClosed,
    onRoomUpdate,
    onRoomDelete
}: RoomCardProps) => {
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    const enterClassroom = () => {
        const token = localStorage.getItem("token");
        axios.post("https://edushare-backend-1qcc.onrender.com/api/v1/room/enter-classroom", 
            { roomId: id }, 
            {
                headers: {
                    authorization: `bearer ${token}`
                }
            }
        ).then((res) => {
            if (res.data.err) {
                alert(res.data.err);
            } else {
                localStorage.setItem("room-token", res.data.roomToken);
                localStorage.setItem("user-token-id", res.data.userId);
                navigate("/room/" + res.data.roomId);
            }
        }).catch((err) => {
            console.log(err);
        });
    };

    const handleEditRoom = async (newName: string, newDescription: string) => {
        const token = localStorage.getItem("token");
        
        try {
            const response = await axios.put(
                `https://edushare-backend-1qcc.onrender.com/api/v1/room/${id}`,
                { 
                    name: newName, 
                    description: newDescription 
                },
                {
                    headers: {
                        authorization: `bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                onRoomUpdate(id, newName, newDescription);
            } else {
                throw new Error(response.data.message || 'Failed to update room');
            }
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    };

    const handleDeleteRoom = async () => {
        const token = localStorage.getItem("token");
        
        try {
            const response = await axios.delete(
                `https://edushare-backend-1qcc.onrender.com/api/v1/room/${id}`,
                {
                    headers: {
                        authorization: `bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                onRoomDelete(id);
            } else {
                throw new Error(response.data.message || 'Failed to delete room');
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            throw error;
        }
    };


    const handleRemoveRoom = async() => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.delete(
                `https://edushare-backend-1qcc.onrender.com/api/v1/room/remove/${id}`,
                {
                    headers: {
                        authorization: `bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                onRoomDelete(id);
            } else {
                throw new Error(response.data.message || 'Failed to delete room');
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            throw error;
        }
    }

    return (
        <>
            <div key={key} className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="px-6 py-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="bg-blue-100 rounded-xl p-3">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-6 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                            <h4 className={`font-semibold text-sm  ${roomClosed? "text-red-600" : "text-green-600"}`}>{roomClosed? "Closed" : "Open"}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                    <button 
                        disabled = {roomClosed || role }
                        onClick={enterClassroom} 
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Enter Classroom
                    </button>
                    
                    {role?
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            title="Edit room"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button  
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            title="Delete room"
                        >
                            <Trash2Icon className="h-4 w-4" />
                        </button>
                    </div> : <div className="flex items-center space-x-2">
                        <button  
                            onClick={() => setIsRemoveModalOpen(true)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            title="Remove room"
                        >
                            <Trash2Icon className="h-4 w-4" />
                        </button>
                    </div>
                    }
                </div>
            </div>

            <EditRoomModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEditRoom}
                initialName={name}
                initialDescription={description}
            />

            <DeleteRoomModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteRoom}
                roomName={name}
            />

            <RemoveRoomModal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                onRemove={handleRemoveRoom}
                roomName={name}
            />
            
        </>
    );
};