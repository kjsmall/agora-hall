import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

const formatDate = (value) => new Date(value).toLocaleString();

export default function PublicProfileScreen({ users, thoughts, positions, debates, currentUser }) {
  const { userId } = useParams();
  const user = users[userId];

  const authoredThoughts = thoughts.filter((t) => t.authorId === userId);
  const authoredPositions = positions.filter((p) => p.authorId === userId);
  const participatedDebates = debates.filter(
    (d) => d.affirmativeUserId === userId || d.negativeUserId === userId
  );

  const wins = participatedDebates.filter((d) => d.winnerUserId === userId).length;
  const losses = participatedDebates.filter((d) => d.winnerUserId && d.winnerUserId !== userId).length;

  const topCategory = useMemo(() => {
    const categories = {};
    authoredThoughts.forEach((t) => {
      if (!categories[t.category]) categories[t.category] = 0;
      categories[t.category] += 1;
    });
    authoredPositions.forEach((p) => {
      if (!categories[p.category]) categories[p.category] = 0;
      categories[p.category] += 1;
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';
  }, [authoredThoughts, authoredPositions]);

  const activeDebates = participatedDebates.filter((d) => d.status === 'active');
  const resolvedDebates = participatedDebates.filter((d) => d.status === 'completed' || d.status === 'resolved');

  if (!user) {
    return <p className="text-slate-400">Profile not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-900/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-cyan-200 uppercase text-xs font-semibold">Public Profile</p>
            <h1 className="text-2xl font-semibold text-slate-50">{user.display_name || user.username || 'Anonymous'}</h1>
            <p className="text-sm text-slate-400">{user.user_email || 'No email provided'}</p>
          </div>
          {currentUser?.id === userId && (
            <Link to="/profile" className="text-xs text-cyan-300 hover:text-white">Edit your profile</Link>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-slate-200">
          <Stat label="Thoughts" value={authoredThoughts.length} />
          <Stat label="Positions" value={authoredPositions.length} />
          <Stat label="Wins" value={wins} />
          <Stat label="Losses" value={losses} />
        </div>
        <p className="text-xs text-slate-400">Top Category: <span className="text-cyan-200">{topCategory}</span></p>
      </div>

      <Section title="Thoughts" empty="No thoughts yet.">
        {authoredThoughts.map((thought) => (
          <Card key={thought.id}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{formatDate(thought.createdAt)}</p>
              <Link to={`/thoughts/${thought.id}`} className="text-xs text-cyan-300 hover:text-white">Open</Link>
            </div>
            <h3 className="text-lg font-semibold text-slate-50 mt-1">{thought.title || 'Untitled'}</h3>
            <p className="text-slate-100 mt-1">{thought.content}</p>
          </Card>
        ))}
      </Section>

      <Section title="Positions" empty="No positions yet.">
        {authoredPositions.map((position) => (
          <Card key={position.id}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{formatDate(position.createdAt)}</p>
              <Link to={`/positions/${position.id}`} className="text-xs text-cyan-300 hover:text-white">Open</Link>
            </div>
            <h3 className="text-lg font-semibold text-slate-50 mt-1">{position.title || 'Untitled Position'}</h3>
            <p className="text-slate-100 mt-1">{position.thesis}</p>
            <p className="text-xs text-slate-500 mt-1">{position.definitions.length} definitions · {position.sources.length} sources</p>
          </Card>
        ))}
      </Section>

      <Section title="Active Debates" empty="No active debates.">
        {activeDebates.map((debate) => (
          <Card key={debate.id}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{formatDate(debate.createdAt)}</p>
              <Link to={`/debates/${debate.id}`} className="text-xs text-cyan-300 hover:text-white">Enter</Link>
            </div>
            <p className="text-sm text-slate-200 mt-1">Role: {debate.affirmativeUserId === userId ? 'Challenger' : 'Challengee'}</p>
          </Card>
        ))}
      </Section>

      <Section title="Resolved Debates" empty="No resolved debates.">
        {resolvedDebates.map((debate) => (
          <Card key={debate.id}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{formatDate(debate.resolvedAt || debate.createdAt)}</p>
              <Link to={`/debates/${debate.id}`} className="text-xs text-cyan-300 hover:text-white">Review</Link>
            </div>
            <p className="text-sm text-slate-200 mt-1">Role: {debate.affirmativeUserId === userId ? 'Challenger' : 'Challengee'}</p>
            {debate.winnerUserId && (
              <p className="text-xs text-slate-400">Winner: {debate.winnerUserId === userId ? 'This user' : 'Opponent'}</p>
            )}
          </Card>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children, empty }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <section className="space-y-2">
      <p className="text-cyan-200 uppercase text-xs font-semibold">{title}</p>
      {hasContent ? children : <p className="text-slate-400 text-sm">{empty}</p>}
    </section>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-md shadow-slate-900/30 space-y-2">
      {children}
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
