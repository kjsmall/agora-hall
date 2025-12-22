import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const formatDate = (value) => new Date(value).toLocaleString();

export default function ThoughtScreen({
  thoughts,
  users,
  onAddComment,
  currentUser,
  getDisplayName,
  thoughtsTodayCount,
  thoughtsLimit,
  categories,
  onConvertThought,
}) {
  const { thoughtId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const thought = thoughts.find((t) => t.id === thoughtId);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentTitle, setCommentTitle] = useState('');
  const [commentCategory, setCommentCategory] = useState('');
  const fromExplore = location.state?.fromExplore;
  const [showConvert, setShowConvert] = useState(location.state?.convert || false);
  const [convertTitle, setConvertTitle] = useState(thought?.title || '');
  const [convertPremise, setConvertPremise] = useState(thought?.content || '');
  const [convertCategory, setConvertCategory] = useState(thought?.category || '');
  const [convertDefs, setConvertDefs] = useState('');
  const [convertSources, setConvertSources] = useState('');
  const [convertError, setConvertError] = useState(null);

  const replies = useMemo(
    () =>
      thoughts
        .filter((t) => t.replyToThoughtId === thoughtId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [thoughtId, thoughts]
  );

  if (!thought) {
    return (
      <div className="text-slate-200">
        <p className="text-slate-400">Thought not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-cyan-300 hover:text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  const handleSubmitComment = async () => {
    const trimmed = commentDraft.trim();
    const titleTrimmed = commentTitle.trim();
    if (!trimmed || !titleTrimmed || !commentCategory) return;
    const id = await onAddComment({
      title: titleTrimmed,
      content: trimmed,
      category: commentCategory,
      replyToThoughtId: thoughtId,
    });
    if (id) {
      setCommentDraft('');
      setCommentTitle('');
      setCommentCategory('');
    }
  };

  const parseDefinitions = (text) => {
    if (!text.trim()) return [];
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [term, ...rest] = line.split(':');
        return { term: term.trim(), definition: rest.join(':').trim() || '' };
      });
  };

  const parseSources = (text) => {
    if (!text.trim()) return [];
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const handleConvert = async () => {
    setConvertError(null);
    const titleTrim = convertTitle.trim();
    const premiseTrim = convertPremise.trim();
    if (!titleTrim || !premiseTrim || !convertCategory) return;
    const defs = parseDefinitions(convertDefs);
    const srcs = parseSources(convertSources);
    const newId = await onConvertThought({
      thoughtId,
      title: titleTrim,
      premise: premiseTrim,
      definitions: defs,
      sources: srcs,
      category: convertCategory,
    });
    if (newId) {
      navigate(`/positions/${newId}`);
    } else {
      setConvertError('Unable to convert. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-900/40">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400">
              {getDisplayName(thought.authorId)} · {formatDate(thought.createdAt)}
            </p>
            <h1 className="text-2xl font-semibold text-slate-50 mt-2">{thought.title || 'Thought'}</h1>
          </div>
          <Link to="/" className="text-cyan-300 text-sm hover:text-white">
            Return to {fromExplore ? 'Explore' : 'Home'}
          </Link>
        </div>
        <p className="text-slate-100 mt-4 whitespace-pre-wrap">{thought.content}</p>
      </div>

      {currentUser?.id === thought.authorId && !thought.isPromoted && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md shadow-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-50">Convert to Position</h2>
            <button
              onClick={() => setShowConvert((prev) => !prev)}
              className="text-xs text-cyan-300 hover:text-white"
              type="button"
            >
              {showConvert ? 'Hide' : 'Show'}
            </button>
          </div>
          {showConvert && (
            <div className="space-y-3">
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={convertTitle}
                onChange={(e) => setConvertTitle(e.target.value)}
                placeholder="Position title"
              />
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                rows={4}
                value={convertPremise}
                onChange={(e) => setConvertPremise(e.target.value)}
                placeholder="Premise / description"
              />
              <div>
                <label className="text-xs text-slate-400 uppercase">Category</label>
                <select
                  value={convertCategory}
                  onChange={(e) => setConvertCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase">Definitions (one per line, term: definition)</label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  rows={3}
                  value={convertDefs}
                  onChange={(e) => setConvertDefs(e.target.value)}
                  placeholder="Term: Definition"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase">Sources (one per line)</label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  rows={3}
                  value={convertSources}
                  onChange={(e) => setConvertSources(e.target.value)}
                  placeholder="Source link or citation"
                />
              </div>
              {convertError && <p className="text-sm text-red-300">{convertError}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConvert}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40"
                  disabled={!convertTitle.trim() || !convertPremise.trim() || !convertCategory}
                >
                  Create Position
                </button>
                <button
                  onClick={() => setShowConvert(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md shadow-slate-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-50">Responses (Thoughts)</h2>
          <span className="text-xs text-slate-400">
            {thoughtsTodayCount}/{thoughtsLimit} today
          </span>
        </div>
        <div className="space-y-3">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {getDisplayName(reply.authorId)} · {formatDate(reply.createdAt)}
                </p>
              </div>
              <h3 className="text-base font-semibold text-slate-50 mt-2">{reply.title || 'Thought'}</h3>
              <p className="text-slate-100 mt-2 whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))}
          {replies.length === 0 && (
            <p className="text-slate-400 text-sm">No responses yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          <p className="text-sm text-slate-200">Add your response (counts toward Thought limit).</p>
          <div>
            <label className="text-xs text-slate-400 uppercase">Title</label>
            <input
              type="text"
              value={commentTitle}
              onChange={(e) => setCommentTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
              placeholder="Short headline for your thought"
              disabled={thoughtsTodayCount >= thoughtsLimit}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase">Category</label>
            <select
              value={commentCategory}
              onChange={(e) => setCommentCategory(e.target.value)}
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
          <textarea
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
            rows={3}
            placeholder="Respond thoughtfully. No branching debates here."
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            disabled={thoughtsTodayCount >= thoughtsLimit}
          />
          <button
            onClick={handleSubmitComment}
            disabled={
              thoughtsTodayCount >= thoughtsLimit ||
              !commentCategory ||
              !commentDraft.trim() ||
              !commentTitle.trim()
            }
            className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40"
          >
            Post Thought Response
          </button>
          {thoughtsTodayCount >= thoughtsLimit && (
            <p className="text-xs text-red-300">Daily Thought limit reached.</p>
          )}
        </div>
      </div>
    </div>
  );
}
