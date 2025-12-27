import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const formatCount = (n) => (n || 0).toLocaleString();

export default function PeopleScreen({ users, thoughts, positions, debates, getCategoryLabel }) {
  const userStats = useMemo(() => {
    const stats = users.map((user) => {
      const thoughtsCount = thoughts.filter((t) => t.authorId === user.id).length;
      const positionsCount = positions.filter((p) => p.authorId === user.id).length;
      const debatesParticipated = debates.filter(
        (d) => d.affirmativeUserId === user.id || d.negativeUserId === user.id
      );
      const wins = debatesParticipated.filter((d) => d.winnerUserId === user.id).length;
      const losses = debatesParticipated.filter(
        (d) => d.winnerUserId && d.winnerUserId !== user.id
      ).length;

      const categories = {};
      thoughts
        .filter((t) => t.authorId === user.id)
        .forEach((t) => {
          const key = getCategoryLabel ? getCategoryLabel(t.category) : t.category;
          if (!categories[key]) categories[key] = 0;
          categories[key] += 1;
        });
      positions
        .filter((p) => p.authorId === user.id)
        .forEach((p) => {
          const key = getCategoryLabel ? getCategoryLabel(p.category) : p.category;
          if (!categories[key]) categories[key] = 0;
          categories[key] += 1;
        });
      const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';

      return {
        user,
        thoughtsCount,
        positionsCount,
        wins,
        losses,
        topCategory,
      };
    });
    return stats.sort((a, b) => b.thoughtsCount + b.positionsCount - (a.thoughtsCount + a.positionsCount));
  }, [users, thoughts, positions, debates, getCategoryLabel]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-900/30">
        <p className="text-cyan-200 uppercase text-xs font-semibold mb-2">People</p>
        <h1 className="text-3xl font-semibold text-slate-50">Profiles and contributions</h1>
        <p className="text-slate-400 mt-2">Track positions, thoughts, debates, and top categories.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userStats.map(({ user, thoughtsCount, positionsCount, wins, losses, topCategory }) => (
          <div
            key={user.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-md shadow-slate-900/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-200 font-semibold">{user.display_name || user.username || 'Anonymous'}</p>
                <p className="text-xs text-slate-500">{user.user_email || 'No email'}</p>
              </div>
              <Link
                to={`/profiles/${user.id}`}
                className="text-xs text-cyan-300 hover:text-white"
              >
                View Profile
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
              <Stat label="Thoughts" value={formatCount(thoughtsCount)} />
              <Stat label="Positions" value={formatCount(positionsCount)} />
              <Stat label="Wins" value={formatCount(wins)} />
              <Stat label="Losses" value={formatCount(losses)} />
            </div>
            <div className="text-xs text-slate-400">
              Top Category: <span className="text-cyan-200">{topCategory}</span>
            </div>
          </div>
        ))}
        {userStats.length === 0 && <p className="text-slate-400">No people to show yet.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}
