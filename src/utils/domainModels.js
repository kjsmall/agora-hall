const safeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(16).slice(2)}`;
};

export const DEBATE_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  SCHEDULED: 'scheduled',
};

export const CATEGORY_OPTIONS = [
  'Philosophy & Ethics',
  'Politics & Governance',
  'Economics & Finance',
  'Science & Technology',
  'Society & Culture',
  'Law & Justice',
  'Health, Medicine & Bioethics',
  'Environment & Sustainability',
  'Religion, Theology & Spirituality',
  'Miscellaneous',
];

export function createThought({
  id = safeId(),
  authorId,
  content,
  createdAt = new Date().toISOString(),
  linkedPositionId = null,
  replyToThoughtId = null,
  category = 'Miscellaneous',
}) {
  return { id, authorId, content, createdAt, linkedPositionId, replyToThoughtId, category };
}

export function createPosition({
  id = safeId(),
  authorId,
  thesis,
  definitions = [],
  sources = [],
  createdAt = new Date().toISOString(),
  fromThoughtId = null,
  category = 'Miscellaneous',
}) {
  return { id, authorId, thesis, definitions, sources, createdAt, fromThoughtId, category };
}

export function createDebate({
  id = safeId(),
  positionId,
  affirmativeUserId,
  negativeUserId,
  status = DEBATE_STATUS.SCHEDULED,
  createdAt = new Date().toISOString(),
  resolvedAt = null,
  challengeStatus = 'pending', // pending, accepted, rejected
  challengerOpening = '',
  challengeeOpening = '',
  opposingPosition = '',
  challengeDefinitions = [],
  closingChallenger = '',
  closingOpponent = '',
  votes = { challenger: 0, challengee: 0, neither: 0 },
}) {
  return {
    id,
    positionId,
    affirmativeUserId,
    negativeUserId,
    status,
    createdAt,
    resolvedAt,
    challengeStatus,
    challengerOpening,
    challengeeOpening,
    opposingPosition,
    challengeDefinitions,
    closingChallenger,
    closingOpponent,
    votes,
  };
}

export function createDebateTurn({
  id = safeId(),
  debateId,
  turnNumber,
  authorId,
  content,
  createdAt = new Date().toISOString(),
}) {
  return { id, debateId, turnNumber, authorId, content, createdAt };
}
