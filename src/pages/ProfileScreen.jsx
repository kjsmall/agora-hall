import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';

export default function ProfileScreen({ users, thoughts, positions, debates, currentUser, onUpdateUser }) {
  const { userId: routeUserId } = useParams();
  const effectiveUserId = routeUserId || currentUser?.id;
  const user = users[effectiveUserId];
  const positionDirectory = positions.reduce((acc, pos) => {
    acc[pos.id] = pos;
    return acc;
  }, {});
  const authoredThoughts = thoughts.filter((t) => t.authorId === effectiveUserId);
  const authoredPositions = positions.filter((p) => p.authorId === effectiveUserId);
  const participatedDebates = debates.filter(
    (d) => d.affirmativeUserId === effectiveUserId || d.negativeUserId === effectiveUserId
  );
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.user_email || '');
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.display_name || '');
    setUsername(user.username || '');
    setEmail(user.user_email || '');
  }, [user]);

  const isOwner = currentUser?.id === effectiveUserId;

  if (!user) {
    return <p className="text-slate-400">User not found.</p>;
  }

  const hasChanges =
    displayName !== (user.display_name || '') ||
    username !== (user.username || '') ||
    email !== (user.user_email || '');

  const handleSave = () => {
    if (!isOwner || !hasChanges) return;
    setUpdateError(null);
    onUpdateUser(effectiveUserId, { display_name: displayName, username, user_email: email })
      .catch((err) => setUpdateError(err.message || 'Unable to update profile.'));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md shadow-slate-900/40 space-y-3">
        <p className="text-xs text-slate-400 uppercase font-semibold">Profile</p>
        <h1 className="text-2xl font-semibold text-slate-50 mt-1">Username: {user.username}</h1>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 uppercase">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!isOwner}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isOwner}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isOwner}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
          />
        </div>
        {isOwner && (
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40"
          >
            Save Profile
          </button>
        )}
        <p className="text-sm text-slate-400">
          Intentional contributor. No follower counts—just a record of structured dialogue.
        </p>
      </div>

      <ProfileSection title="Thoughts" empty="No thoughts yet.">
        {authoredThoughts.map((thought) => (
          <div
            key={thought.id}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-slate-900/30"
          >
            <p className="text-xs text-slate-500">{new Date(thought.createdAt).toLocaleString()}</p>
            <h3 className="text-lg font-semibold text-slate-50 mt-1">{thought.title || 'Untitled'}</h3>
            <p className="text-slate-100 mt-1">{thought.content}</p>
            {isOwner && !thought.isPromoted && (
              <Link
                to={`/thoughts/${thought.id}`}
                className="text-xs text-cyan-300 hover:text-white"
              >
                Convert to Position
              </Link>
            )}
          </div>
        ))}
      </ProfileSection>

      <ProfileSection title="Positions" empty="No positions published yet.">
        {authoredPositions.map((position) => (
          <div
            key={position.id}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-slate-900/30"
          >
            <p className="text-xs text-slate-500">{new Date(position.createdAt).toLocaleString()}</p>
            <h3 className="text-lg font-semibold text-slate-50 mt-1">{position.title || 'Untitled Position'}</h3>
            <p className="text-slate-100 mt-1">{position.thesis}</p>
            <p className="text-xs text-slate-500 mt-1">
              {position.definitions.length} definitions · {position.sources.length} sources
            </p>
          </div>
        ))}
      </ProfileSection>

      <ProfileSection title="Debates" empty="No debates yet.">
        {participatedDebates.map((debate) => (
          <div
            key={debate.id}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-slate-900/30"
          >
            <p className="text-xs text-slate-500">
              {debate.status === 'active' ? 'Active' : 'Resolved'} · {new Date(debate.createdAt).toLocaleString()}
            </p>
            <p className="text-slate-100 mt-2">
              Debate on position {positionDirectory[debate.positionId]?.thesis || debate.positionId}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Role: {debate.affirmativeUserId === effectiveUserId ? 'Affirmative' : 'Negative'}
            </p>
          </div>
        ))}
      </ProfileSection>
    </div>
  );
}

function ProfileSection({ title, children, empty }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : true;
  return (
    <section className="space-y-2">
      <p className="text-cyan-200 uppercase text-xs font-semibold">{title}</p>
      {hasContent ? children : <p className="text-slate-400 text-sm">{empty}</p>}
    </section>
  );
}
