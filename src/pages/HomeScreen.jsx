import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEBATE_STATUS } from '../utils/domainModels';

const formatDate = (value) => new Date(value).toLocaleString();

export default function HomeScreen({
  thoughts,
  positions,
  debates,
  users,
  getDisplayName,
  thoughtError,
  positionError,
  debateError,
  getCategoryLabel,
  onAddThought,
  onAddPosition,
  thoughtsTodayCount,
  positionsTodayCount,
  thoughtsLimit,
  positionsLimit,
  categories,
}) {
  const [thoughtDraft, setThoughtDraft] = useState('');
  const [thoughtTitle, setThoughtTitle] = useState('');
  const [positionDraft, setPositionDraft] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [thoughtCategory, setThoughtCategory] = useState('');
  const [positionCategory, setPositionCategory] = useState('');
  const [definitions, setDefinitions] = useState([]);
  const [sources, setSources] = useState([]);
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [definitionTerm, setDefinitionTerm] = useState('');
  const [definitionText, setDefinitionText] = useState('');
  const [sourceDraft, setSourceDraft] = useState('');
  const [showThoughtForm, setShowThoughtForm] = useState(false);
  const [showPositionForm, setShowPositionForm] = useState(false);
  const positionDirectory = positions.reduce((acc, pos) => {
    acc[pos.id] = pos;
    return acc;
  }, {});
  // Treat any non-resolved debate (active or scheduled) as active for display.
  const activeDebates = debates.filter((debate) => debate.status !== DEBATE_STATUS.RESOLVED);
  const resolvedDebates = debates.filter((debate) => debate.status === DEBATE_STATUS.RESOLVED);

  const handleThoughtSubmit = async () => {
    const trimmed = thoughtDraft.trim();
    const titleTrimmed = thoughtTitle.trim();
    if (!trimmed || !titleTrimmed || !thoughtCategory) return;
    const id = await onAddThought({ title: titleTrimmed, content: trimmed, category: thoughtCategory });
    if (id) {
      resetThoughtForm();
    }
  };

  const handlePositionSubmit = async () => {
    const trimmed = positionDraft.trim();
    const titleTrimmed = positionTitle.trim();
    if (!trimmed || !titleTrimmed || !positionCategory) return;
    const id = await onAddPosition({ title: titleTrimmed, thesis: trimmed, definitions, sources, category: positionCategory });
    if (id) {
      resetPositionForm();
    }
  };

  const addDefinition = () => {
    if (!definitionTerm.trim() || !definitionText.trim()) return;
    setDefinitions((prev) => [...prev, { term: definitionTerm.trim(), definition: definitionText.trim() }]);
    setDefinitionTerm('');
    setDefinitionText('');
    setShowDefinitionModal(false);
  };

  const addSource = () => {
    if (!sourceDraft.trim()) return;
    setSources((prev) => [...prev, sourceDraft.trim()]);
    setSourceDraft('');
    setShowSourceModal(false);
  };

  const resetThoughtForm = () => {
    setThoughtDraft('');
    setThoughtTitle('');
    setThoughtCategory('');
    setShowThoughtForm(false);
  };

  const resetPositionForm = () => {
    setPositionDraft('');
    setPositionTitle('');
    setPositionCategory('');
    setDefinitions([]);
    setSources([]);
    setShowPositionForm(false);
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-200 uppercase text-xs font-semibold">Post a Thought</p>
              <p className="text-slate-400 text-sm">Max {thoughtsLimit} per day. Comments count toward the limit.</p>
            </div>
            <span className="text-xs text-slate-400">
                {thoughtsTodayCount}/{thoughtsLimit} today
              </span>
            </div>
          {!showThoughtForm ? (
            <button
              onClick={() => setShowThoughtForm(true)}
              disabled={thoughtsTodayCount >= thoughtsLimit}
              className="mt-3 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40"
            >
              Post Thought
            </button>
          ) : (
            <>
              <input
                className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Share your thought as consisely as possible"
                value={thoughtTitle}
                onChange={(e) => setThoughtTitle(e.target.value)}
                disabled={thoughtsTodayCount >= thoughtsLimit}
              />
              <textarea
                className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                rows={3}
                placeholder="Explain your thought in more detail here..."
                value={thoughtDraft}
                onChange={(e) => setThoughtDraft(e.target.value)}
                disabled={thoughtsTodayCount >= thoughtsLimit}
              />
              <div className="mt-3">
                <label className="text-xs text-slate-400 uppercase">Category</label>
                <select
                  value={thoughtCategory}
                  onChange={(e) => setThoughtCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
                  disabled={thoughtsTodayCount >= thoughtsLimit}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleThoughtSubmit}
                  disabled={thoughtsTodayCount >= thoughtsLimit || !thoughtCategory || !thoughtDraft.trim() || !thoughtTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40"
                >
                  Publish Thought
                </button>
                <button
                  onClick={resetThoughtForm}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-200 uppercase text-xs font-semibold">Publish a Position</p>
            <p className="text-slate-400 text-sm">Max {positionsLimit} per day. Formal theses only.</p>
          </div>
          <span className="text-xs text-slate-400">
            {positionsTodayCount}/{positionsLimit} today
          </span>
        </div>
          {!showPositionForm ? (
            <button
              onClick={() => setShowPositionForm(true)}
              disabled={positionsTodayCount >= positionsLimit}
              className="mt-3 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40"
            >
              Publish Position
            </button>
          ) : (
            <>
              <input
                className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="State your position as concisely as possible"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                disabled={positionsTodayCount >= positionsLimit}
              />
              <textarea
                className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                rows={3}
                placeholder="Extrapolate on your position here..."
                value={positionDraft}
                onChange={(e) => setPositionDraft(e.target.value)}
                disabled={positionsTodayCount >= positionsLimit}
              />
              <div className="mt-3">
                <label className="text-xs text-slate-400 uppercase">Category</label>
                <select
                  value={positionCategory}
                  onChange={(e) => setPositionCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
                  disabled={positionsTodayCount >= positionsLimit}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowDefinitionModal(true)}
                    className="w-6 h-6 rounded-full bg-slate-800 text-cyan-200 text-sm font-bold border border-slate-700"
                  >
                    +
                  </button>
                  <span>Add Definition</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSourceModal(true)}
                    className="w-6 h-6 rounded-full bg-slate-800 text-cyan-200 text-sm font-bold border border-slate-700"
                  >
                    +
                  </button>
                  <span>Add Source</span>
                </div>
              </div>
              {(definitions.length > 0 || sources.length > 0) && (
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  {definitions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {definitions.map((def, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">
                          {def.term}
                        </span>
                      ))}
                    </div>
                  )}
                  {sources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sources.map((src, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handlePositionSubmit}
                  disabled={
                    positionsTodayCount >= positionsLimit ||
                    !positionCategory ||
                    !positionDraft.trim() ||
                    !positionTitle.trim()
                  }
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40"
                >
                  Publish Position
                </button>
                <button
                  onClick={resetPositionForm}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Section
          title="Recent Thoughts"
          description="Fresh reflections ready to be promoted into Positions."
        >
          {thoughtError && <p className="text-sm text-red-300">{thoughtError}</p>}
          <div className="grid gap-4">
            {thoughts.slice(0, 4).map((thought) => (
              <Card key={thought.id}>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-slate-400">
                    {getDisplayName(thought.authorId)} · {formatDate(thought.createdAt)}
                  </span>
                  <Link
                    to={`/thoughts/${thought.id}`}
                    className="text-cyan-300 text-xs hover:text-white transition-colors"
                  >
                    View Thought
                  </Link>
                </div>
                <h3 className="text-lg font-semibold text-slate-50 mt-1">{thought.title || 'Untitled'}</h3>
                <p className="text-slate-100 mt-1 line-clamp-3">{thought.content}</p>
                <p className="text-xs text-cyan-200 mt-1">{getCategoryLabel(thought.category)}</p>
                {thought.linkedPositionId && (
                  <p className="text-xs text-slate-500 mt-2">
                    Promoted to Position:{' '}
                    <Link to={`/positions/${thought.linkedPositionId}`} className="text-cyan-300 hover:text-white">
                      {positionDirectory[thought.linkedPositionId]?.thesis || thought.linkedPositionId}
                    </Link>
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="Recent Positions"
          description="Formal theses with definitions and sources. Start debates from here."
        >
          {positionError && <p className="text-sm text-red-300">{positionError}</p>}
          <div className="grid gap-4">
            {positions.slice(0, 4).map((position) => (
              <Card key={position.id}>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-slate-400">
                    {getDisplayName(position.authorId)} · {formatDate(position.createdAt)}
                  </span>
                  <Link
                    to={`/positions/${position.id}`}
                    className="text-cyan-300 text-xs hover:text-white transition-colors"
                  >
                    Open Position
                  </Link>
                </div>
                <h3 className="text-lg font-semibold mt-2 text-slate-50">{position.title || 'Untitled Position'}</h3>
                <p className="text-slate-200 mt-1 line-clamp-3">{position.thesis}</p>
                <p className="text-xs text-cyan-200 mt-1">{getCategoryLabel(position.category)}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {position.definitions.length} definitions · {position.sources.length} sources
                </p>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Section
          title="Active Debates"
          description="Live, turn-limited duels. No branching threads."
        >
          {debateError && <p className="text-sm text-red-300">{debateError}</p>}
          <div className="grid gap-4">
            {activeDebates.slice(0, 4).map((debate) => (
              <Card key={debate.id}>
                <div className="flex justify-between items-start">
                  <div className="text-xs text-slate-400">
                    Active · {formatDate(debate.createdAt)}
                  </div>
                  <Link
                    to={`/debates/${debate.id}`}
                    className="text-cyan-300 text-xs hover:text-white transition-colors"
                  >
                    Enter Debate
                  </Link>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  Position:{' '}
                  <Link to={`/positions/${debate.positionId}`} className="text-cyan-300 hover:text-white">
                    {positionDirectory[debate.positionId]?.thesis || debate.positionId}
                  </Link>
                </p>
                <p className="text-sm text-slate-200 mt-1">
                  Affirmative: {getDisplayName(debate.affirmativeUserId)}
                </p>
                <p className="text-sm text-slate-200">
                  Negative: {getDisplayName(debate.negativeUserId)}
                </p>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="Recently Resolved Debates"
          description="Archived duels with recorded outcomes and turns."
        >
          <div className="grid gap-4">
            {resolvedDebates.slice(0, 4).map((debate) => (
              <Card key={debate.id}>
                <div className="flex justify-between items-start">
                  <div className="text-xs text-slate-400">
                    Resolved · {debate.resolvedAt ? formatDate(debate.resolvedAt) : 'Pending'}
                  </div>
                  <Link
                    to={`/debates/${debate.id}`}
                    className="text-cyan-300 text-xs hover:text-white transition-colors"
                  >
                    Review
                  </Link>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  Position:{' '}
                  <Link to={`/positions/${debate.positionId}`} className="text-cyan-300 hover:text-white">
                    {positionDirectory[debate.positionId]?.thesis || debate.positionId}
                  </Link>
                </p>
                <p className="text-sm text-slate-200 mt-1">
                  Affirmative: {getDisplayName(debate.affirmativeUserId)}
                </p>
                <p className="text-sm text-slate-200">
                  Negative: {getDisplayName(debate.negativeUserId)}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      </div>
      {showDefinitionModal && (
        <Modal onClose={() => setShowDefinitionModal(false)} title="Add Definition">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Term"
              value={definitionTerm}
              onChange={(e) => setDefinitionTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <textarea
              rows={3}
              placeholder="Definition"
              value={definitionText}
              onChange={(e) => setDefinitionText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              onClick={addDefinition}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors"
            >
              Save Definition
            </button>
          </div>
        </Modal>
      )}
      {showSourceModal && (
        <Modal onClose={() => setShowSourceModal(false)} title="Add Source">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Source reference"
              value={sourceDraft}
              onChange={(e) => setSourceDraft(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              onClick={addSource}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors"
            >
              Save Source
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-2xl font-semibold text-slate-50 mb-1">{title}</p>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md shadow-slate-900/40">
      {children}
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm z-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-900/40">
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-semibold text-slate-50">{title}</p>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
