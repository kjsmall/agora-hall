import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DEBATE_STATUS } from '../utils/domainModels';

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

export default function DebateScreen({
  debates,
  positions,
  turns,
  users,
  currentUser,
  onAddTurn,
  getDisplayName,
  onAcceptChallenge,
  onRejectChallenge,
  onSubmitClosing,
  onVote,
  onForfeit,
}) {
  const { debateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const debate = debates.find((d) => d.id === debateId);
  const position = debate ? positions.find((p) => p.id === debate.positionId) : null;

  const debateTurns = useMemo(
    () =>
      turns
        .filter((turn) => turn.debateId === debateId)
        .sort((a, b) => a.turnNumber - b.turnNumber),
    [debateId, turns]
  );
  const sortedTurns = useMemo(() => {
    const openings = debateTurns
      .filter((t) => t.kind === 'opening')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const rounds = debateTurns
      .filter((t) => t.kind === 'round')
      .sort((a, b) => (a.roundNumber || a.turnNumber) - (b.roundNumber || b.turnNumber));
    const closings = debateTurns
      .filter((t) => t.kind === 'closing')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return [...openings, ...rounds, ...closings];
  }, [debateTurns]);

  const [draft, setDraft] = useState('');
  const [challengeeOpening, setChallengeeOpening] = useState('');
  const [closingDraft, setClosingDraft] = useState('');

  if (!debate) {
    return (
      <div className="text-slate-200">
        <p className="text-slate-400">Debate not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-cyan-300 hover:text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  const challengerId = debate.affirmativeUserId;
  const challengeeId = debate.negativeUserId;
  const isParticipant = currentUser?.id === challengerId || currentUser?.id === challengeeId;
  const challengerOpeningTurn = debateTurns.find(
    (t) => t.kind === 'opening' && t.authorId === challengerId
  );
  const challengeeOpeningTurn = debateTurns.find(
    (t) => t.kind === 'opening' && t.authorId === challengeeId
  );
  const roundTurns = debateTurns.filter((t) => t.kind === 'round');
  const currentRound = debate.currentRound || 0;
  const nextRoundNumber = currentRound + 1;
  const userIsNext = debate.status === DEBATE_STATUS.ACTIVE && currentUser?.id === debate.currentTurnProfileId;
  const inClosingPhase = debate.status === DEBATE_STATUS.ACTIVE && currentRound >= (debate.maxRounds || 10);
  const canForfeit = isParticipant && debate.status !== DEBATE_STATUS.RESOLVED && debate.status !== 'pending';

  const handleSubmitTurn = () => {
    if (!userIsNext || inClosingPhase) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAddTurn(debate.id, currentUser.id, trimmed);
    setDraft('');
  };

  const handleAcceptChallenge = () => {
    if (wordCount(challengeeOpening) > 2500 || !challengeeOpening.trim()) return;
    onAcceptChallenge(debate.id, challengeeOpening.trim());
    setChallengeeOpening('');
  };

  const handleSubmitClosing = () => {
    if (!closingDraft.trim()) return;
    const role = currentUser.id === challengerId ? 'challenger' : 'challengee';
    onSubmitClosing(debate.id, role, closingDraft.trim());
    setClosingDraft('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          className="text-cyan-300 text-sm hover:text-white"
          onClick={() => {
            if (position) {
              navigate(`/positions/${position.id}`, { state: location.state });
            } else {
              const target = location.state?.fromExplore ? '/explore' : '/';
              navigate(target);
            }
          }}
        >
          ⬅ Return to {location.state?.fromExplore ? 'Explore' : position ? 'Position' : 'Home'}
        </button>
        {debate.status === DEBATE_STATUS.RESOLVED && debate.winnerUserId && (
          <span className="text-xs text-slate-400">
            Winner: {getDisplayName(debate.winnerUserId)}
          </span>
        )}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-900/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">
              Debate · {new Date(debate.createdAt).toLocaleString()}
            </p>
            <h1 className="text-2xl font-semibold text-slate-50 mt-2">
              {position?.thesis || 'Position'}
            </h1>
            <p className="text-sm text-slate-300 mt-2">
              Status:{' '}
              {debate.status === DEBATE_STATUS.ACTIVE
                ? 'Active'
                : debate.status === DEBATE_STATUS.RESOLVED
                ? 'Resolved'
                : 'Pending'}
              {debate.resolvedAt ? ` · Resolved ${new Date(debate.resolvedAt).toLocaleString()}` : ''}
            </p>
          </div>
          <Link to={`/positions/${debate.positionId}`} className="text-cyan-300 text-sm hover:text-white">
            View Position
          </Link>
        </div>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <Meta label="Challenger" value={getDisplayName(debate.affirmativeUserId)} />
          <Meta label="Challengee" value={getDisplayName(debate.negativeUserId)} />
        </div>
      </div>

          {debate.challengeStatus === 'pending' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md shadow-slate-900/40 space-y-3">
          <h2 className="text-lg font-semibold text-slate-50">Challenge</h2>
          <p className="text-sm text-slate-300">Opposing position: {debate.opposingPosition}</p>
          <div>
            <p className="text-xs text-slate-400 uppercase mb-1">Challenger Opening</p>
            <p className="text-slate-100 whitespace-pre-wrap">{debate.challengerOpening}</p>
          </div>
          {currentUser?.id === challengeeId ? (
            <>
              <label className="text-xs text-slate-400 uppercase">Your opening (max 2500 words)</label>
              <textarea
                rows={4}
                value={challengeeOpening}
                onChange={(e) => setChallengeeOpening(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <p className="text-[11px] text-slate-500">
                {wordCount(challengeeOpening)} / 2500 words
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleAcceptChallenge}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors disabled:opacity-40"
                  disabled={!challengeeOpening.trim() || wordCount(challengeeOpening) > 2500}
                >
                  Accept
                </button>
                <button
                  onClick={() => onRejectChallenge(debate.id)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
                >
                  Reject
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Awaiting challengee response.</p>
          )}
        </div>
      )}

      {debate.challengeStatus === 'accepted' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md shadow-slate-900/40 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase mb-1">Challenger Opening</p>
              <p className="text-slate-100 whitespace-pre-wrap">
                {challengerOpeningTurn?.content ||
                  debate.challengerOpening ||
                  'Not provided.'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase mb-1">Challengee Opening</p>
              <p className="text-slate-100 whitespace-pre-wrap">
                {challengeeOpeningTurn?.content ||
                  debate.challengeeOpening ||
                  'Not provided.'}
              </p>
            </div>
          </div>
          {debate.challengeDefinitions?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase mb-1">Definitions</p>
              <ul className="list-disc list-inside text-slate-200">
                {debate.challengeDefinitions.map((def, idx) => (
                  <li key={idx}>{def.term}: {def.definition}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md shadow-slate-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-50">Turn Log (max 10)</h2>
          <p className="text-xs text-slate-400">Linear only · no subrooms</p>
        </div>
        <div className="space-y-3">
          {sortedTurns.map((turn) => {
            const label =
              turn.kind === 'opening'
                ? `Opening · ${getDisplayName(turn.authorId)}`
                : turn.kind === 'closing'
                ? `Closing · ${getDisplayName(turn.authorId)}`
                : `Round ${turn.roundNumber || turn.turnNumber} · ${getDisplayName(turn.authorId)}`;
            return (
              <div
                key={turn.id}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-[11px] text-slate-500">{new Date(turn.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-slate-100 mt-2 whitespace-pre-wrap">{turn.content}</p>
              </div>
            );
          })}
          {sortedTurns.length === 0 && (
            <p className="text-slate-400 text-sm">No turns yet. Affirmative opens.</p>
          )}
        </div>

          {debate.status === DEBATE_STATUS.ACTIVE && !inClosingPhase ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-200">
                Next turn: Round {nextRoundNumber} · {getDisplayName(debate.currentTurnProfileId)}
              </p>
              {!userIsNext && (
                <p className="text-xs text-slate-500">
                  Waiting for {getDisplayName(debate.currentTurnProfileId)}
                </p>
              )}
            </div>
            {isParticipant ? (
              <>
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
                  rows={3}
                  placeholder="Add your turn with clarity and concision."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={!userIsNext}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSubmitTurn}
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40"
                    disabled={!userIsNext}
                  >
                    Submit Turn
                  </button>
                  {canForfeit && (
                    <button
                      onClick={() => onForfeit?.(debate.id, currentUser.id)}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-40"
                      type="button"
                    >
                      Forfeit
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Only debaters can add turns.</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            {debate.status === DEBATE_STATUS.ACTIVE && inClosingPhase ? (
              <>
                <p className="text-sm text-slate-300">Closing Statements</p>
                {isParticipant ? (
                  <>
                    <p className="text-xs text-slate-500">
                      {userIsNext
                        ? 'Your closing is due now.'
                        : `Waiting for ${getDisplayName(debate.currentTurnProfileId)} to submit closing.`}
                    </p>
                    {userIsNext ? (
                      <>
                        <textarea
                          rows={3}
                          value={closingDraft}
                          onChange={(e) => setClosingDraft(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          placeholder="Add your closing statement."
                        />
                        <button
                          onClick={handleSubmitClosing}
                          className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40"
                          disabled={!closingDraft.trim()}
                        >
                          Submit Closing
                        </button>
                        {canForfeit && (
                          <button
                            onClick={() => onForfeit?.(debate.id, currentUser.id)}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-40"
                            type="button"
                          >
                            Forfeit
                          </button>
                        )}
                      </>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Only debaters may submit closings.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-300">
                Debate closed or turn limit reached. Archive outcomes with moderation + community.
              </p>
            )}
          </div>
        )}

        {debate.status === DEBATE_STATUS.RESOLVED && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <p className="text-sm text-slate-200">Vote the outcome</p>
            <div className="flex gap-3">
              <button
                onClick={() => onVote(debate.id, 'challenger')}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 hover:border-cyan-400"
              >
                Challenger ({debate.votes?.challenger || 0})
              </button>
              <button
                onClick={() => onVote(debate.id, 'challengee')}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 hover:border-cyan-400"
              >
                Challengee ({debate.votes?.challengee || 0})
              </button>
              <button
                onClick={() => onVote(debate.id, 'neither')}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 hover:border-cyan-400"
              >
                Both wrong ({debate.votes?.neither || 0})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-xs text-slate-400 uppercase font-semibold">{label}</p>
      <p className="text-slate-100">{value}</p>
    </div>
  );
}
