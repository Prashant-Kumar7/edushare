import  { useState } from 'react';
import { Modal } from './Modal';
import { Trash2, AlertTriangle, Loader } from 'lucide-react';

interface DeleteRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  roomName: string;
}

export const DeleteRoomModal = ({ 
  isOpen, 
  onClose, 
  onDelete, 
  roomName 
}: DeleteRoomModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Room">
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-shrink-0">
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              Delete "{roomName}"?
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              This action cannot be undone. All data associated with this room will be permanently deleted.
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-red-800">
                Warning
              </h5>
              <p className="text-sm text-red-700 mt-1">
                Deleting this room will remove all associated content, participants, and history. 
                Make sure you have backed up any important data before proceeding.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Deleting...' : 'Delete Room'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};