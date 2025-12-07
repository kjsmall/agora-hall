// File: src/components/Rebuttal.jsx
// This component allows users to submit a rebuttal during a debate session.
// It includes a textarea for input and a button to submit the rebuttal.
// After submission, the rebuttal is displayed in a read-only format.

import React, { useEffect, useState } from 'react';

export default function RebuttalSection({ rebuttal, submitted, onSubmit }) {
  const [draft, setDraft] = useState(rebuttal || '');

  useEffect(() => {
    setDraft(rebuttal || '');
  }, [rebuttal]);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">4. Rebuttal</h3>

      {!submitted ? (
        <>
          <textarea
            className="w-full p-2 border border-gray-300 rounded mb-2"
            rows={4}
            placeholder="Enter your rebuttal here..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleSubmit}
          >
            Submit Rebuttal
          </button>
        </>
      ) : (
        <div className="bg-gray-100 p-4 rounded border border-gray-300">
          <p className="text-gray-700 whitespace-pre-wrap">{rebuttal}</p>
        </div>
      )}
    </div>
  );
}
