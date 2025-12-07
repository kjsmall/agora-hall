import React, { useMemo, useState } from 'react';
import LoginForm from './components/LoginForm';
import RoomList from './components/RoomList';
import AdminPortal from './components/AdminPortal';
import DebateRoom from './components/DebateRoom';
import { createRoom } from './utils/RoomClass';

export default function App() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('debater');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [rooms, setRooms] = useState([
    createRoom({ id: 1, topic: 'Truth vs. Relativism', status: 'Open' }),
    createRoom({ id: 2, topic: 'Duty vs. Liberty', status: 'Open' }),
    createRoom({ id: 3, topic: 'Order vs. Chaos', status: 'Scheduled' }),
  ]);
  const currentRoom = useMemo(
    () => rooms.find((room) => room.id === currentRoomId) || null,
    [rooms, currentRoomId]
  );

  const handleLogin = () => {
    if (username) setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUsername('');
    setRole('debater');
    setIsLoggedIn(false);
    setCurrentRoomId(null);
  };

  const startDebate = (roomId) => {
    setCurrentRoomId(roomId);
  };

  const closeRoom = (roomId) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, status: 'Closed' } : room
      )
    );
  };

  const deleteRoom = (roomId) => {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
    if (roomId === currentRoomId) setCurrentRoomId(null);
  };

  const addRoom = (topic) => {
    const newId = rooms.length ? Math.max(...rooms.map((r) => r.id)) + 1 : 1;
    setRooms((prev) => [...prev, createRoom({ id: newId, topic, status: 'Open' })]);
  };

  const updateRoom = (roomId, updates) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, ...(typeof updates === 'function' ? updates(room) : updates) }
          : room
      )
    );
  };

  // Route control
  if (!isLoggedIn) {
    return (
      <LoginForm
        username={username}
        setUsername={setUsername}
        role={role}
        setRole={setRole}
        handleLogin={handleLogin}
      />
    );
  }

  if (role === 'admin') {
    return (
      <AdminPortal
        rooms={rooms}
        addRoom={addRoom}
        closeRoom={closeRoom}
        deleteRoom={deleteRoom}
        handleLogout={handleLogout}
        updateRoom={updateRoom}
      />
    );
  }

  if (currentRoom) {
    return (
      <DebateRoom
        username={username}
        room={currentRoom}
        handleLogout={handleLogout}
        exitRoom={() => setCurrentRoomId(null)}
        updateRoom={updateRoom}
      />
    );
  }

  return (
    <RoomList
      username={username}
      rooms={rooms}
      startDebate={startDebate}
      handleLogout={handleLogout}
    />
  );
}
