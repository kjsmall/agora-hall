import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { CATEGORY_OPTIONS, DEBATE_STATUS } from '../utils/domainModels';

const formatDate = (value) => new Date(value).toLocaleString();

export default function ExploreScreen({ thoughts, positions, debates, getDisplayName, thoughtError, getCategoryLabel, positionError, debateError, currentUser }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(true);

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

  const categoryOptions = useMemo(
    () => CATEGORY_OPTIONS.map((cat) => ({ value: cat, label: cat })),
    []
  );

  const tagOptions = useMemo(
    () => tags.map((tag) => ({ value: tag, label: tag })),
    [tags]
  );

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
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [thoughts, positions]);

  const getItemTags = (item) => {
    if (item.type === 'position' || item.thesis) {
      const defs = (item.definitions || []).map((d) => d.term);
      const srcs = item.sources || [];
      return [...defs, ...srcs].filter(Boolean);
    }
    return [];
  };

  const selectedCategoryValues = selectedCategories.map((c) => c.value);
  const selectedTagValues = selectedTags.map((t) => t.value);

  const filteredFeed = useMemo(() => {
    return feedItems
      .filter((item) => {
        const categoryMatch =
          selectedCategoryValues.length === 0 || selectedCategoryValues.includes(item.category);
        if (!categoryMatch) return false;
        if (selectedTagValues.length === 0) return true;
        const itemTags = getItemTags(item).map((t) => t.toLowerCase());
        return selectedTagValues.some((tag) => itemTags.includes(tag.toLowerCase()));
      })
      .slice(0, 20);
  }, [feedItems, selectedCategoryValues, selectedTagValues]);

  const activeDebates = debates
    .filter((d) => d.status !== DEBATE_STATUS.RESOLVED)
    .slice(0, 4);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const topPosters = useMemo(() => {
    const last7Counts = {};
    const allCounts = {};
    const catTracker = {};
    const tagTracker = {};

    [...thoughts, ...positions].forEach((item) => {
      const created = new Date(item.createdAt);
      const id = item.authorId;
      allCounts[id] = allCounts[id] || 0;
      allCounts[id] += 1;
      if (created >= sevenDaysAgo) {
        last7Counts[id] = last7Counts[id] || 0;
        last7Counts[id] += 1;
      }

      const catKey = item.category;
      if (catKey) {
        if (!catTracker[id]) catTracker[id] = {};
        catTracker[id][catKey] = (catTracker[id][catKey] || 0) + 1;
      }
      if (item.definitions) {
        item.definitions.forEach((d) => {
          if (!tagTracker[id]) tagTracker[id] = {};
          tagTracker[id][d.term] = (tagTracker[id][d.term] || 0) + 1;
        });
      }
      if (item.sources) {
        item.sources.forEach((src) => {
          if (!tagTracker[id]) tagTracker[id] = {};
          tagTracker[id][src] = (tagTracker[id][src] || 0) + 1;
        });
      }
    });

    const pickTop = (countsObj) =>
      Object.entries(countsObj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => {
          const cats = Object.entries(catTracker[userId] || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k]) => k);
          const tags = Object.entries(tagTracker[userId] || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k]) => k);
          return { userId, count, name: getDisplayName(userId) || userId, topCategories: cats, topTags: tags };
        });

    const recent = pickTop(last7Counts);
    if (recent.length > 0) return recent;
    return pickTop(allCounts).slice(0, 3);
  }, [thoughts, positions, getDisplayName, sevenDaysAgo]);

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: '#0f172a',
      borderColor: '#1e293b',
      minHeight: '38px',
      boxShadow: 'none',
      color: '#e2e8f0',
      '&:hover': { borderColor: '#22d3ee' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#0f172a',
      border: '1px solid #1e293b',
      zIndex: 10,
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#1e293b',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#e2e8f0',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#94a3b8',
      ':hover': { backgroundColor: '#22d3ee', color: '#0f172a' },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'rgba(34,211,238,0.15)' : '#0f172a',
      color: '#e2e8f0',
      '&:active': { backgroundColor: 'rgba(34,211,238,0.25)' },
    }),
    input: (base) => ({ ...base, color: '#e2e8f0' }),
    placeholder: (base) => ({ ...base, color: '#94a3b8' }),
    singleValue: (base) => ({ ...base, color: '#e2e8f0' }),
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-900/30">
        <p className="text-cyan-200 uppercase text-xs font-semibold mb-2">Explore</p>
        <h1 className="text-3xl font-semibold text-slate-50">Top engaged posts</h1>
        <p className="text-slate-400 mt-2">
          Curated signals from structured exchange—no algorithmic feeds, just tagged paths into the debate hall.
        </p>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs text-slate-400 uppercase font-semibold">Most active (last 7 days)</p>
          {topPosters.length === 0 && <p className="text-slate-400 text-sm mt-2">No activity yet.</p>}
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topPosters.map((poster) => (
              <div
                key={poster.userId}
                className="rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-sm shadow-slate-900/30 space-y-2"
              >
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span className="font-semibold">{poster.name}</span>
                  <span className="text-xs text-slate-400">{poster.count} posts</span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  {poster.topCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {poster.topCategories.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-200">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                  {poster.topTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {poster.topTags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
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

          <Section title="Feed" description="Latest thoughts and positions in one scroll." large>
          {thoughtError && <p className="text-sm text-red-300">{thoughtError}</p>}
          {positionError && <p className="text-sm text-red-300">{positionError}</p>}
          <div className="mb-3">
            {showFilters && (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <span className="block text-xs text-slate-400 uppercase mb-1">Categories</span>
                    <Select
                      isMulti
                      options={categoryOptions}
                      value={selectedCategories}
                      onChange={(vals) => setSelectedCategories(vals || [])}
                      classNamePrefix="rs"
                      styles={selectStyles}
                      placeholder="Select categories"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs text-slate-400 uppercase mb-1">Tags</span>
                    <Select
                      isMulti
                      options={tagOptions}
                      value={selectedTags}
                      onChange={(vals) => setSelectedTags(vals || [])}
                      classNamePrefix="rs"
                      styles={selectStyles}
                      placeholder="Select tags"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-cyan-300 hover:text-white"
                    type="button"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {filteredFeed.map((item) => (
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
                  <h3 className="text-lg font-semibold text-slate-50 mt-1">{item.title || 'Untitled'}</h3>
                  <p className="text-slate-100 mt-1 line-clamp-3">
                    {item.type === 'thought' ? item.content : item.thesis}
                  </p>
                </div>
              ))}
              {filteredFeed.length === 0 && <p className="text-slate-400 text-sm">No posts yet.</p>}
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
                    <h3 className="text-lg font-semibold text-slate-50 mt-1">{thought.title || 'Untitled'}</h3>
                    <p className="text-slate-100 mt-1 line-clamp-3">{thought.content}</p>
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
        <p
          className={`text-cyan-200 uppercase font-semibold ${
            ['Feed', 'Active Debates', 'Top Thoughts'].includes(title) ? 'text-base' : 'text-sm'
          }`}
        >
          {title}
        </p>
        <p
          className={`text-slate-400 ${
            ['Feed', 'Active Debates', 'Top Thoughts'].includes(title) ? 'text-sm' : 'text-xs'
          }`}
        >
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
