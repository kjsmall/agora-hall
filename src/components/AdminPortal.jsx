// File: /components/AdminPortal.jsx
import React, { useState } from 'react';

export default function AdminPortal({ rooms, updateRoom, handleLogout, addRoom, deleteRoom, closeRoom }) {
  const [newTopic, setNewTopic] = useState('');

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'Closed' && closeRoom) {
      closeRoom(id);
    } else {
      updateRoom(id, { status: newStatus });
    }
  };

  const handleEditTitle = (id, newTitle) => {
    updateRoom(id, { topic: newTitle });
  };

  const handleAddRoom = () => {
    if (!newTopic.trim()) return;
    addRoom(newTopic.trim());
    setNewTopic('');
  };

  return (
    <div className="p-6 font-sans max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Portal</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Add New Debate Room</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Debate Topic Title"
            className="p-2 border rounded w-full"
          />
          <button
            onClick={handleAddRoom}
            className="bg-blue-700 text-white px-4 py-2 rounded"
          >
            Add Room
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Manage Rooms</h2>
        <div className="space-y-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="border rounded p-4 bg-gray-50 shadow-sm"
            >
              <input
                type="text"
                value={room.topic}
                onChange={(e) => handleEditTitle(room.id, e.target.value)}
                className="text-lg font-semibold w-full mb-2 p-1 border-b"
              />
              <div className="flex justify-between items-center">
                <select
                  value={room.status}
                  onChange={(e) =>
                    handleStatusChange(room.id, e.target.value)
                  }
                  className="p-2 border rounded"
                >
                  <option value="Open">Open</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Closed">Closed</option>
                </select>
                <button
                  onClick={() => deleteRoom(room.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
