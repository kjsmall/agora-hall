// File: /components/RoomList.jsx
import React from 'react';
import RoomCard from './RoomCard';

export default function RoomList({ rooms, startDebate, handleLogout }) {
  return (
    <div className="p-4 font-sans">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Available Debate Rooms</h2>
        <button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={handleLogout}>Logout</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            startDebate={() => startDebate(room.id)}
          />
        ))}
      </div>
    </div>
  );
}
