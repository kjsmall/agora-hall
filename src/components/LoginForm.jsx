// File: /components/LoginForm.jsx
import React from 'react';

export default function LoginForm({ username, setUsername, role, setRole, handleLogin }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-xl font-bold mb-4">Log In to Agora</h2>
      <input
        type="text"
        placeholder="Enter your name"
        className="mb-2 p-2 border rounded w-full"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <select
        className="mb-4 p-2 border rounded w-full"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="debater">Debater</option>
        <option value="moderator">Moderator</option>
        <option value="admin">Admin</option>
      </select>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleLogin}>
        Enter
      </button>
    </div>
  );
}