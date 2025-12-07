import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ProfileScreen({ users, thoughts, positions, debates, currentUser, onUpdateUser }) {
  const { userId } = useParams();
  const user = users[userId];
  const authoredThoughts = thoughts.filter((t) => t.authorId === userId);
  const authoredPositions = positions.filter((p) => p.authorId === userId);
  const participatedDebates = debates.filter(
    (d) => d.affirmativeUserId === userId || d.negativeUserId === userId
  );
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setEmail(user.email || '');
  }, [user]);

  const isOwner = currentUser?.id === userId;

  const hasChanges =
    firstName !== (user.firstName || '') ||
    lastName !== (user.lastName || '') ||
    email !== (user.email || '');

  const handleSave = () => {
    if (!isOwner || !hasChanges) return;
    onUpdateUser(userId, { firstName, lastName, email });
  };

  if (!user) {
    return <p className="text-slate-400">User not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-md shadow-slate-900/40 space-y-3">
        <p className="text-xs text-slate-400 uppercase font-semibold">Profile</p>
        <h1 className="text-2xl font-semibold text-slate-50 mt-1">Username: {user.username}</h1>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 uppercase">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isOwner}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
            <p className="text-slate-100 mt-2">{thought.content}</p>
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
            <p className="text-slate-100 mt-2">{position.thesis}</p>
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
            <p className="text-slate-100 mt-2">Debate on position {debate.positionId}</p>
            <p className="text-xs text-slate-500 mt-1">
              Role: {debate.affirmativeUserId === userId ? 'Affirmative' : 'Negative'}
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
