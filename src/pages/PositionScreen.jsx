import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DEBATE_STATUS } from '../utils/domainModels';

export default function PositionScreen({
  positions,
  debates,
  users,
  onStartDebate,
  onChallenge,
  getDisplayName,
  categories = [],
}) {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const position = positions.find((item) => item.id === positionId);
  const relatedDebates = debates.filter((debate) => debate.positionId === positionId);
  const fromExplore = location.state?.fromExplore;
  const [showChallenge, setShowChallenge] = useState(false);
  const [opposingPosition, setOpposingPosition] = useState('');
  const [opening, setOpening] = useState('');
  const [definitionDraft, setDefinitionDraft] = useState('');
  const [definitions, setDefinitions] = useState([]);
  const [category, setCategory] = useState(categories[0] || '');

  useEffect(() => {
    if (showChallenge && position) {
      setCategory(position.category || '');
    }
  }, [showChallenge, position]);

  if (!position) {
    return (
      <div className="text-slate-200">
        <p className="text-slate-400">Position not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-cyan-300 hover:text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-900/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">
              {getDisplayName(position.authorId)} · {new Date(position.createdAt).toLocaleString()}
            </p>
            <h1 className="text-2xl font-semibold text-slate-50 mt-2">{position.thesis}</h1>
          </div>
          <button
            onClick={() => setShowChallenge(true)}
            className="self-start md:self-center px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors"
          >
            Challenge
          </button>
        </div>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm text-cyan-200 uppercase font-semibold mb-2">Definitions</h3>
            <ul className="space-y-2">
              {position.definitions.map((def, idx) => (
                <li key={idx} className="text-slate-200">
                  <span className="font-semibold text-slate-100">{def.term}:</span> {def.definition}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm text-cyan-200 uppercase font-semibold mb-2">Sources</h3>
            <ul className="space-y-1 text-slate-200">
              {position.sources.map((src, idx) => (
                <li key={idx} className="text-sm">• {src}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showChallenge && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-50">Issue a Challenge</h3>
              <button
                onClick={() => setShowChallenge(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close challenge modal"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 uppercase">Opposing Position</label>
                <textarea
                  rows={2}
                  value={opposingPosition}
                  onChange={(e) => setOpposingPosition(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="State the stance you will challenge."
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase">Opening Statement (max 2500 words)</label>
                <textarea
                  rows={5}
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Lay out your opening argument."
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {opening.trim().split(/\s+/).filter(Boolean).length} / 2500 words
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase">Optional Definition</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={definitionDraft}
                    onChange={(e) => setDefinitionDraft(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Add a key term definition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!definitionDraft.trim()) return;
                      setDefinitions((prev) => [...prev, { term: definitionDraft.trim(), definition: definitionDraft.trim() }]);
                      setDefinitionDraft('');
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-cyan-200 border border-slate-700 hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>
                {definitions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {definitions.map((def, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-200">
                        {def.term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase">Category (locked to position)</label>
                <input
                  value={category}
                  disabled
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowChallenge(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const wordCount = opening.trim().split(/\s+/).filter(Boolean).length;
                    if (!opposingPosition.trim() || !opening.trim() || wordCount > 2500 || !category) return;
                    const id = await onChallenge(position.id, {
                      opening: opening.trim(),
                      opposingPosition: opposingPosition.trim(),
                      definitions,
                      category,
                    });
                    if (id) {
                      setShowChallenge(false);
                      setOpposingPosition('');
                      setOpening('');
                      setDefinitions([]);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors"
                >
                  Submit Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-cyan-200 uppercase text-xs font-semibold">Debates on this Position</p>
            <p className="text-slate-400 text-sm">
              Each debate is contained—no subrooms or branches.
            </p>
            {position.fromThoughtId && (
              <p className="text-xs text-slate-500 mt-1">Originated as a Thought.</p>
            )}
          </div>
          <Link
            to={fromExplore ? "/explore" : "/"}
            className="text-cyan-300 text-sm hover:text-white"
          >
            Return to {fromExplore ? 'Explore' : 'Home'}
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {relatedDebates.map((debate) => (
            <div
              key={debate.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md shadow-slate-900/40"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400">
                  {debate.status === DEBATE_STATUS.ACTIVE
                    ? 'Active'
                    : debate.status === DEBATE_STATUS.RESOLVED
                    ? 'Resolved'
                    : 'Pending'} · {new Date(debate.createdAt).toLocaleString()}
                </span>
                <Link
                  to={`/debates/${debate.id}`}
                  className="text-cyan-300 text-xs hover:text-white"
                >
                  Open Debate
                </Link>
              </div>
              <p className="text-sm text-slate-200 mt-2">
                Affirmative: {getDisplayName(debate.affirmativeUserId)}
              </p>
              <p className="text-sm text-slate-200">
                Negative: {getDisplayName(debate.negativeUserId)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {debate.challengeStatus === 'pending'
                  ? 'Challenge awaiting response.'
                  : 'No nesting. Max 10 linear turns.'}
              </p>
            </div>
          ))}
          {relatedDebates.length === 0 && (
            <div className="text-slate-400 text-sm">No debates started yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
