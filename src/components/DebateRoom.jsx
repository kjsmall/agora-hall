// File: /components/DebateRoom.jsx
import React, { useEffect, useMemo, useState } from 'react';
import RebuttalSection from './Rebuttal';
import { ROOM_PHASES } from '../utils/RoomClass';

const FALLACY_OPTIONS = [
  'Strawman',
  'Ad hominem',
  'Slippery slope',
  'Appeal to authority',
  'Appeal to emotion',
  'Non sequitur',
];

const PHASE_ORDER = [
  ROOM_PHASES.SETUP,
  ROOM_PHASES.OPENING,
  ROOM_PHASES.REBUTTAL,
  ROOM_PHASES.ANALYSIS,
  ROOM_PHASES.VERDICT,
];

export default function DebateRoom({ room, username, exitRoom, updateRoom }) {
  const [definitions, setDefinitions] = useState(
    room.definitions && room.definitions.length ? room.definitions : [{ term: '', definition: '' }]
  );
  const [openingStatement, setOpeningStatement] = useState(room.openingStatement || '');
  const [analysisNotes, setAnalysisNotes] = useState(room.analysisNotes || '');

  useEffect(() => {
    setDefinitions(room.definitions && room.definitions.length ? room.definitions : [{ term: '', definition: '' }]);
    setOpeningStatement(room.openingStatement || '');
    setAnalysisNotes(room.analysisNotes || '');
  }, [room.id, room.definitions, room.openingStatement, room.analysisNotes]);

  const currentPhaseIndex = useMemo(
    () => PHASE_ORDER.indexOf(room.phase || ROOM_PHASES.SETUP),
    [room.phase]
  );

  const canShowPhase = (phase) => currentPhaseIndex >= PHASE_ORDER.indexOf(phase);

  const handleStartDebate = () => {
    updateRoom(room.id, () => ({
      definitions,
      openingStatement,
      debateStarted: true,
      phase: ROOM_PHASES.OPENING,
    }));
  };

  const updateDefinition = (index, key, value) => {
    const updated = [...definitions];
    updated[index][key] = value;
    setDefinitions(updated);
  };

  const addDefinition = () => {
    setDefinitions([...definitions, { term: '', definition: '' }]);
  };

  const moveToRebuttal = () => {
    updateRoom(room.id, { phase: ROOM_PHASES.REBUTTAL });
  };

  const handleSubmitRebuttal = (text) => {
    updateRoom(room.id, {
      rebuttal: text,
      rebuttalSubmitted: true,
      phase: ROOM_PHASES.ANALYSIS,
    });
  };

  const toggleFallacy = (tag) => {
    updateRoom(room.id, (current) => {
      const fallacies = current.fallacies || [];
      const exists = fallacies.includes(tag);
      return { fallacies: exists ? fallacies.filter((f) => f !== tag) : [...fallacies, tag] };
    });
  };

  const handleAnalysisNotes = (value) => {
    setAnalysisNotes(value);
    updateRoom(room.id, { analysisNotes: value });
  };

  const moveToVerdict = () => {
    updateRoom(room.id, { phase: ROOM_PHASES.VERDICT });
  };

  return (
    <div className="p-4 font-sans space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">User: {username || 'Guest'}</p>
          <h2 className="text-2xl font-bold">{room.topic}</h2>
          <p className="text-sm text-gray-600">Status: {room.status}</p>
          <p className="text-sm text-gray-600">Phase: {room.phase}</p>
        </div>
        <button className="text-blue-600" onClick={exitRoom}>⬅ Back to rooms</button>
      </div>

      {!room.debateStarted && (
        <div className="border rounded p-4 space-y-4 bg-white shadow-sm">
          <h3 className="text-xl font-semibold">Setup</h3>
          <div>
            <h4 className="font-semibold mb-2">1. Define Your Terms</h4>
            {definitions.map((def, idx) => (
              <div key={idx} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Term"
                  className="border p-2 rounded w-1/3"
                  value={def.term}
                  onChange={(e) => updateDefinition(idx, 'term', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Definition"
                  className="border p-2 rounded w-2/3"
                  value={def.definition}
                  onChange={(e) => updateDefinition(idx, 'definition', e.target.value)}
                />
              </div>
            ))}
            <button className="mt-2 text-sm text-blue-600" onClick={addDefinition}>+ Add Definition</button>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Opening Statement</h4>
            <textarea
              className="border p-2 rounded w-full h-28"
              value={openingStatement}
              onChange={(e) => setOpeningStatement(e.target.value)}
              placeholder="Lay out your position with clarity and conviction."
            ></textarea>
          </div>

          <button
            className="bg-green-700 text-white px-4 py-2 rounded"
            onClick={handleStartDebate}
          >
            Start Debate
          </button>
        </div>
      )}

      {canShowPhase(ROOM_PHASES.OPENING) && (
        <div className="border rounded p-4 bg-white shadow-sm space-y-4">
          <h3 className="text-xl font-semibold">Foundations</h3>
          <div>
            <h4 className="font-semibold">📜 Definitions</h4>
            <ul className="mb-2 list-disc list-inside">
              {definitions.map((def, idx) => (
                <li key={idx}><strong>{def.term || '—'}:</strong> {def.definition || 'No definition provided'}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">🎤 Opening Statement</h4>
            <p className="border p-4 rounded bg-gray-100 whitespace-pre-line">{openingStatement || 'No opening provided.'}</p>
          </div>
          {!canShowPhase(ROOM_PHASES.REBUTTAL) && (
            <button className="bg-blue-700 text-white px-4 py-2 rounded" onClick={moveToRebuttal}>
              Move to Rebuttal
            </button>
          )}
        </div>
      )}

      {canShowPhase(ROOM_PHASES.REBUTTAL) && (
        <div className="border rounded p-4 bg-white shadow-sm">
          <RebuttalSection
            rebuttal={room.rebuttal}
            submitted={room.rebuttalSubmitted}
            onSubmit={handleSubmitRebuttal}
          />
        </div>
      )}

      {canShowPhase(ROOM_PHASES.ANALYSIS) && (
        <div className="border rounded p-4 bg-white shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">5. Analysis & Fallacies</h3>
            <p className="text-sm text-gray-600 mb-2">
              Mark any fallacies you see and capture rationale for moderators.
            </p>
            <div className="flex flex-wrap gap-2">
              {FALLACY_OPTIONS.map((option) => {
                const active = room.fallacies?.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleFallacy(option)}
                    className={`px-3 py-1 rounded border ${active ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <textarea
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Notes on reasoning, structure, evidence..."
              value={analysisNotes}
              onChange={(e) => handleAnalysisNotes(e.target.value)}
            />
          </div>
          {!canShowPhase(ROOM_PHASES.VERDICT) && (
            <button className="bg-purple-700 text-white px-4 py-2 rounded" onClick={moveToVerdict}>
              Move to Verdict
            </button>
          )}
        </div>
      )}

      {canShowPhase(ROOM_PHASES.VERDICT) && (
        <div className="border rounded p-4 bg-white shadow-sm space-y-2">
          <h3 className="text-lg font-semibold">6. Verdict (coming soon)</h3>
          <p className="text-sm text-gray-700">
            Moderators and the crowd will score rounds here. For now, the debate is locked in analysis state.
          </p>
          <div>
            <p className="font-semibold">Tagged fallacies:</p>
            <ul className="list-disc list-inside">
              {(room.fallacies || []).length
                ? room.fallacies.map((f) => <li key={f}>{f}</li>)
                : <li>None recorded.</li>}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Notes:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisNotes || 'No notes yet.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
