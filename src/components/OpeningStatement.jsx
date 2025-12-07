// File: OpeningStatement.jsx
import React from 'react';

export default function OpeningStatement({ statement, setStatement, debateStarted }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Opening Statement</h3>
      {debateStarted ? (
        <p className="p-2 border bg-gray-100 rounded">{statement}</p>
      ) : (
        <textarea
          className="w-full p-2 border rounded"
          rows="4"
          placeholder="Enter your opening statement here..."
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
        />
      )}
    </div>
  );
}