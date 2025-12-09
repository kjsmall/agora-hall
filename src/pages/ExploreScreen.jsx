import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_OPTIONS, DEBATE_STATUS } from '../utils/domainModels';

const formatDate = (value) => new Date(value).toLocaleString();

export default function ExploreScreen({ thoughts, positions, debates, getDisplayName, thoughtError, getCategoryLabel, positionError, debateError }) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_OPTIONS[0]);

  const tags = useMemo(() => {
    const collected = [];
    positions.forEach((pos) => {
      pos.definitions.forEach((d) => collected.push(d.term));
    });
    positions.forEach((pos) => {
      pos.sources.forEach((src) => collected.push(src));
    });
    return Array.from(new Set(collected)).slice(0, 20);
  }, [positions]);

  const categories = useMemo(() => {
    return CATEGORY_OPTIONS.map((cat) => {
      const thoughtCount = thoughts.filter((t) => t.category === cat).length;
      const positionCount = positions.filter((p) => p.category === cat).length;
      return { name: cat, thoughtCount, positionCount };
    });
  }, [thoughts, positions]);

  const topThoughts = useMemo(() => {
    return [...thoughts]
      .sort((a, b) => b.content.length - a.content.length)
      .slice(0, 6);
  }, [thoughts]);

  const topPositions = useMemo(() => {
    return [...positions]
      .sort((a, b) => b.definitions.length - a.definitions.length || b.sources.length - a.sources.length)
      .slice(0, 6);
  }, [positions]);

  const feedItems = useMemo(() => {
    const all = [
      ...thoughts.map((t) => ({ type: 'thought', createdAt: t.createdAt, ...t })),
      ...positions.map((p) => ({ type: 'position', createdAt: p.createdAt, ...p })),
    ];
    return all
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
  }, [thoughts, positions]);

  const activeDebates = debates.filter((d) => d.status === DEBATE_STATUS.ACTIVE).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-900/30">
        <p className="text-cyan-200 uppercase text-xs font-semibold mb-2">Explore</p>
        <h1 className="text-3xl font-semibold text-slate-50">Top engaged posts</h1>
        <p className="text-slate-400 mt-2">
          Curated signals from structured exchange—no algorithmic feeds, just tagged paths into the debate hall.
        </p>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Section title="Tags" description="Themes sourced from definitions and citations.">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-200 text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length === 0 && <p className="text-slate-400 text-sm">No tags yet.</p>}
              </div>
            </Section>

        <Section title="Categories" description="Author-selected topic areas.">
          <div className="space-y-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {categories
                  .filter((cat) => cat.name === selectedCategory)
                  .map((cat) => (
                    <div
                      key={cat.name}
                      className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between ring-1 ring-cyan-400/60"
                    >
                      <div>
                        <p className="text-sm text-slate-100">{cat.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {cat.thoughtCount} thoughts · {cat.positionCount} positions
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedCategory(cat.name)}
                        className="text-xs text-cyan-200 hover:text-white"
                      >
                        Change
                      </button>
                    </div>
                  ))}
              </div>
            </Section>

            <Section title="Active Debates" description="Live duels to enter now.">
              <div className="space-y-3">
                {activeDebates.map((debate) => (
                  <div
                    key={debate.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/80 p-3"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-slate-400">Active · {formatDate(debate.createdAt)}</p>
                      <Link
                        to={`/debates/${debate.id}`}
                        state={{ fromExplore: true }}
                        className="text-cyan-300 text-xs hover:text-white"
                      >
                        Enter
                      </Link>
                    </div>
                    <p className="text-sm text-slate-200 mt-1">Aff: {getDisplayName(debate.affirmativeUserId)}</p>
                    <p className="text-sm text-slate-200">Neg: {getDisplayName(debate.negativeUserId)}</p>
                  </div>
                ))}
                {activeDebates.length === 0 && <p className="text-slate-400 text-sm">No active debates.</p>}
              </div>
            </Section>
          </div>

        <Section title="Feed" description="Latest thoughts and positions in one scroll.">
          {thoughtError && <p className="text-sm text-red-300">{thoughtError}</p>}
          {positionError && <p className="text-sm text-red-300">{positionError}</p>}
          <div className="space-y-3">
            {feedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-4"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-slate-400">
                      {getDisplayName(item.authorId)} · {formatDate(item.createdAt)}
                    </p>
                    {item.type === 'thought' ? (
                      <Link
                        to={`/thoughts/${item.id}`}
                        state={{ fromExplore: true }}
                        className="text-cyan-300 text-xs hover:text-white"
                      >
                        Open Thought
                      </Link>
                    ) : (
                      <Link
                        to={`/positions/${item.id}`}
                        state={{ fromExplore: true }}
                        className="text-cyan-300 text-xs hover:text-white"
                      >
                        Open Position
                      </Link>
                    )}
                  </div>
                <p className="text-xs text-cyan-200 mt-1">{getCategoryLabel(item.category)}</p>
                  <p className="text-slate-100 mt-2">
                    {item.type === 'thought' ? item.content : item.thesis}
                  </p>
                </div>
              ))}
              {feedItems.length === 0 && <p className="text-slate-400 text-sm">No posts yet.</p>}
            </div>
          </Section>
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-900/30">
          <Section title="Top Thoughts" description="Most engaged reflective posts.">
            <div className="space-y-3">
              {topThoughts.map((thought) => (
                <div
                  key={thought.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-4"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-slate-400">
                      {getDisplayName(thought.authorId)} · {formatDate(thought.createdAt)}
                    </p>
                    <Link
                      to={`/thoughts/${thought.id}`}
                      state={{ fromExplore: true }}
                      className="text-cyan-300 text-xs hover:text-white"
                    >
                      Open
                    </Link>
                  </div>
                  <p className="text-xs text-cyan-200 mt-1">{getCategoryLabel(thought.category)}</p>
                  <p className="text-slate-100 mt-2">{thought.content}</p>
                </div>
              ))}
              {topThoughts.length === 0 && <p className="text-slate-400 text-sm">No thoughts yet.</p>}
            </div>
          </Section>

          <Section title="Top Positions" description="Structured theses with definitions and sources.">
            <div className="space-y-3">
              {topPositions.map((position) => (
                <div
                  key={position.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-4"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-slate-400">
                      {getDisplayName(position.authorId)} · {formatDate(position.createdAt)}
                    </p>
                    <Link
                      to={`/positions/${position.id}`}
                      state={{ fromExplore: true }}
                      className="text-cyan-300 text-xs hover:text-white"
                    >
                      Open
                    </Link>
                  </div>
                  <p className="text-xs text-cyan-200 mt-1">{getCategoryLabel(position.category)}</p>
                  <p className="text-slate-100 mt-2">{position.thesis}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {position.definitions.length} definitions · {position.sources.length} sources
                  </p>
                </div>
              ))}
              {topPositions.length === 0 && <p className="text-slate-400 text-sm">No positions yet.</p>}
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="space-y-2">
      <div>
        <p className="text-cyan-200 uppercase text-xs font-semibold">{title}</p>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}
