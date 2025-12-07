// File: /components/RoomCard.jsx
import React from 'react';

export default function RoomCard({ room, startDebate }) {
  return (
    <div
      key={room.id}
      className="bg-white rounded shadow hover:shadow-lg transition-shadow p-4 border border-gray-200 cursor-pointer"
      onClick={startDebate}
    >
      <h3 className="text-lg font-semibold mb-2">{room.topic}</h3>
      <p className="text-sm text-gray-600">Status: {room.status}</p>
      <button className="mt-3 bg-blue-600 text-white px-4 py-1 rounded">Join Room</button>
    </div>
  );
}
