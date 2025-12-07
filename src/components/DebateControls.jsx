// File: DebateControls.jsx
import React from 'react';

export default function DebateControls({ debateStarted, startDebate, timer, leaveDebate }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Controls</h3>
      <div className="flex items-center gap-4 mb-2">
        {!debateStarted && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={startDebate}
          >
            Start Debate
          </button>
        )}
        <span className="text-sm text-gray-700">Timer: {timer}</span>
      </div>
      <button
        className="bg-red-600 text-white px-4 py-1 rounded"
        onClick={leaveDebate}
      >
        Leave Debate
      </button>
    </div>
  );
}
