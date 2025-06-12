import { useState } from 'react';
import { X, UserMinus } from 'lucide-react';

interface RemoveRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRemove: () => Promise<void>;
    roomName: string;
}

export const RemoveRoomModal = ({ 
    isOpen, 
    onClose, 
    onRemove, 
    roomName 
}: RemoveRoomModalProps) => {
    const [isRemoving, setIsRemoving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleRemove = async () => {
        setIsRemoving(true);
        setError(null);
        
        try {
            await onRemove();
            onClose();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to remove from room');
        } finally {
            setIsRemoving(false);
        }
    };

    const handleClose = () => {
        if (!isRemoving) {
            setError(null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="bg-orange-100 rounded-lg p-2">
                            <UserMinus className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Remove from Room</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isRemoving}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        Are you sure you want to remove yourself from <span className="font-semibold text-gray-900">"{roomName}"</span>? 
                        You'll need to be re-invited to access this room again.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end space-x-3 p-6 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={handleClose}
                        disabled={isRemoving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRemove}
                        disabled={isRemoving}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        {isRemoving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Removing...</span>
                            </>
                        ) : (
                            <>
                                <UserMinus className="h-4 w-4" />
                                <span>Remove from Room</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};