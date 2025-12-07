// File: /utils/RoomClass.js
// Centralized room factory to keep shape consistent across the app.
export const ROOM_PHASES = {
  SETUP: 'setup',
  OPENING: 'opening',
  REBUTTAL: 'rebuttal',
  ANALYSIS: 'analysis',
  VERDICT: 'verdict',
};

export function createRoom(overrides = {}) {
  const {
    id = Date.now(),
    topic = 'Untitled Room',
    status = 'Open',
    openingStatement = '',
    rebuttal = '',
    definitions = [{ term: '', definition: '' }],
    fallacies = [],
    analysisNotes = '',
    phase = ROOM_PHASES.SETUP,
    debateStarted = false,
    rebuttalSubmitted = false,
  } = overrides;

  return {
    id,
    topic,
    status,
    openingStatement,
    rebuttal,
    definitions,
    fallacies,
    analysisNotes,
    phase,
    debateStarted,
    rebuttalSubmitted,
  };
}
