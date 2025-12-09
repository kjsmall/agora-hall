import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import LoginScreen from './pages/LoginScreen';
import HomeScreen from './pages/HomeScreen';
import PositionScreen from './pages/PositionScreen';
import DebateScreen from './pages/DebateScreen';
import ProfileScreen from './pages/ProfileScreen';
import ThoughtScreen from './pages/ThoughtScreen';
import ExploreScreen from './pages/ExploreScreen';
import Header from './components/Header';
import { CATEGORY_OPTIONS, DEBATE_STATUS, createDebate, createDebateTurn, createPosition, createThought } from './utils/domainModels';
import { supabase } from './utils/supabaseClient';

const isSameDay = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

const THOUGHTS_PER_DAY = 5;
const POSITIONS_PER_DAY = 1;
const slugifyCategory = (value) =>
  (value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'miscellaneous';

const CATEGORY_LABELS = {
  philosophy_ethics: 'Philosophy & Ethics',
  politics_governance: 'Politics & Governance',
  economics_finance: 'Economics & Finance',
  science_technology: 'Science & Technology',
  society_culture: 'Society & Culture',
  law_justice: 'Law & Justice',
  health_medicine_bioethics: 'Health, Medicine & Bioethics',
  environment_sustainability: 'Environment & Sustainability',
  religion_theology_spirituality: 'Religion, Theology & Spirituality',
  miscellaneous: 'Miscellaneous',
};

const profileFromUser = (user) => {
  const base = (user.email || '').split('@')[0] || user.id.slice(0, 6);
  return {
    id: user.id,
    username: base,
    display_name: base,
    user_email: user.email || '',
  };
};

function AppShell() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([
    { id: 'alex', username: 'alex', display_name: 'Alex Mercer', user_email: 'alex@agora.local' },
    { id: 'riley', username: 'riley', display_name: 'Riley Tran', user_email: 'riley@agora.local' },
    { id: 'marco', username: 'marco', display_name: 'Marco Diaz', user_email: 'marco@agora.local' },
    { id: 'sofia', username: 'sofia', display_name: 'Sofia Demir', user_email: 'sofia@agora.local' },
  ]);
  const [authError, setAuthError] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);
  const [thoughtError, setThoughtError] = useState(null);

  const [thoughts, setThoughts] = useState([]);

  const [positions, setPositions] = useState([
    {
      id: 'p1',
      authorId: 'alex',
      thesis: 'Truth requires upfront definitions before adversarial exchange.',
      definitions: [
        { term: 'Truth', definition: 'A claim that corresponds to reality independent of preference.' },
        { term: 'Relativism', definition: 'The stance that truth is contingent on cultural or personal frames.' },
      ],
      sources: ['SEP: Truth', 'Habermas: Theory of Communicative Action'],
      createdAt: '2024-03-11T18:00:00Z',
      fromThoughtId: 't1',
      category: 'Philosophy & Ethics',
    },
    {
      id: 'p2',
      authorId: 'marco',
      thesis: 'Civic duty anchors liberty; without it, freedom decays into license.',
      definitions: [
        { term: 'Duty', definition: 'Obligations owed to community and institutions.' },
        { term: 'Liberty', definition: 'The protected space for individual agency under law.' },
      ],
      sources: ['Arendt: On Revolution', 'Rawls: A Theory of Justice'],
      createdAt: '2024-03-14T12:00:00Z',
      fromThoughtId: 't3',
      category: 'Politics & Governance',
    },
  ]);

  const [debates, setDebates] = useState([
    {
      id: 'd1',
      positionId: 'p1',
      affirmativeUserId: 'alex',
      negativeUserId: 'riley',
      status: DEBATE_STATUS.ACTIVE,
      createdAt: '2024-03-12T10:00:00Z',
      resolvedAt: null,
      challengeStatus: 'accepted',
      challengerOpening: 'We must pin truth and relativism with shared definitions; here is my stance.',
      challengeeOpening: 'Truth can be stress-tested; definitions help but cannot bind inquiry.',
      opposingPosition: 'Relativism overstates flexibility; truth is sturdier than preference.',
      challengeDefinitions: [{ term: 'Truth', definition: 'Correspondence with reality' }],
      closingChallenger: '',
      closingOpponent: '',
      votes: { challenger: 0, challengee: 0, neither: 0 },
    },
    {
      id: 'd2',
      positionId: 'p2',
      affirmativeUserId: 'marco',
      negativeUserId: 'sofia',
      status: DEBATE_STATUS.RESOLVED,
      createdAt: '2024-02-01T15:00:00Z',
      resolvedAt: '2024-02-03T10:30:00Z',
      challengeStatus: 'accepted',
      challengerOpening: 'Liberty without duty collapses; I argue duty anchors freedom.',
      challengeeOpening: 'Duty must not smother liberty; balance is key.',
      opposingPosition: 'Freedom outweighs communal duty when they conflict.',
      challengeDefinitions: [{ term: 'Liberty', definition: 'Protected space for individual agency under law.' }],
      closingChallenger: 'Duty and liberty can align; ignoring duty invites chaos.',
      closingOpponent: 'Over-indexing on duty stifles progress; liberty must lead.',
      votes: { challenger: 1, challengee: 1, neither: 0 },
    },
  ]);

  const [turns, setTurns] = useState([
    createDebateTurn({
      id: 'turn1',
      debateId: 'd1',
      turnNumber: 1,
      authorId: 'alex',
      content: 'We cannot spar about truth until we pin what truth means here.',
      createdAt: '2024-03-12T10:05:00Z',
    }),
    createDebateTurn({
      id: 'turn2',
      debateId: 'd1',
      turnNumber: 2,
      authorId: 'riley',
      content: 'Definitions can be weaponized; truth emerges in testing claims.',
      createdAt: '2024-03-12T10:12:00Z',
    }),
    createDebateTurn({
      id: 'turn3',
      debateId: 'd2',
      turnNumber: 1,
      authorId: 'marco',
      content: 'Liberty must sit on duty; otherwise participation collapses.',
      createdAt: '2024-02-01T15:10:00Z',
    }),
    createDebateTurn({
      id: 'turn4',
      debateId: 'd2',
      turnNumber: 2,
      authorId: 'sofia',
      content: 'Duty without liberty calcifies into control; balance matters.',
      createdAt: '2024-02-01T15:15:00Z',
    }),
  ]);

  const navigate = useNavigate();
  const location = useLocation();
  const userDirectory = useMemo(
    () => users.reduce((acc, user) => ({ ...acc, [user.id]: user }), {}),
    [users]
  );

  const fetchThoughts = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('thoughts')
      .select('id, author_id, content, created_at, category')
      .order('created_at', { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading thoughts from Supabase', error);
      setThoughtError(error.message || 'Unable to load thoughts.');
      return;
    }
    const mapped = (data || []).map((row) =>
      createThought({
        id: row.id,
        authorId: row.author_id,
        content: row.content,
        createdAt: row.created_at,
        category: row.category || 'miscellaneous',
      })
    );
    setThoughts(mapped);
    setThoughtError(null);
  }, []);

  useEffect(() => {
    fetchThoughts();
  }, [fetchThoughts, currentUser]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, user_email');
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading profiles from Supabase', error);
        return;
      }
      setUsers(data || []);
    };
    fetchProfiles();
  }, []);

  const mergeProfile = (profile) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === profile.id);
      return exists ? prev.map((u) => (u.id === profile.id ? { ...u, ...profile } : u)) : [...prev, profile];
    });
  };

  const ensureProfile = useCallback(
    async (user) => {
      if (!user) return null;
      const baseProfile = profileFromUser(user);
      if (!supabase) {
        mergeProfile(baseProfile);
        setCurrentUser(baseProfile);
        return baseProfile;
      }
      const { data: ensured, error } = await supabase
        .from('profiles')
        .upsert({
          id: baseProfile.id,
          username: baseProfile.username,
          display_name: baseProfile.display_name,
          user_email: baseProfile.user_email,
        })
        .select('id, username, display_name, user_email')
        .single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error ensuring profile', error);
        mergeProfile(baseProfile);
        setCurrentUser(baseProfile);
        return baseProfile;
      }
      mergeProfile(ensured);
      setCurrentUser(ensured);
      return ensured;
    },
    [supabase, mergeProfile]
  );

  useEffect(() => {
    const syncSession = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error getting session', error);
        return;
      }
      const sessionUser = data?.session?.user;
      if (sessionUser) {
        await ensureProfile(sessionUser);
        if (location.pathname === '/login') {
          navigate('/');
        }
      }
    };
    syncSession();
    const { data: listener } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await ensureProfile(session.user);
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else {
        setCurrentUser(null);
      }
    }) || {};
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const getDisplayName = (userId) => {
    const user = userDirectory[userId];
    if (!user) return 'Anonymous';
    return user.display_name || user.username || user.user_email || 'Anonymous';
  };

  const getCategoryLabel = (slug) => {
    if (!slug) return 'Uncategorized';
    const lowered = slug.toLowerCase();
    if (CATEGORY_LABELS[lowered]) return CATEGORY_LABELS[lowered];
    return lowered
      .split('_')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  };

  const thoughtsTodayCount = currentUser
    ? thoughts.filter(
        (thought) => thought.authorId === currentUser.id && isSameDay(thought.createdAt, new Date())
      ).length
    : 0;

  const positionsTodayCount = currentUser
    ? positions.filter(
        (position) => position.authorId === currentUser.id && isSameDay(position.createdAt, new Date())
      ).length
    : 0;

  const handleLogin = async (identifier) => {
    setAuthError(null);
    setAuthNotice(null);
    if (!supabase) {
      setAuthError('Supabase client not configured.');
      return;
    }
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) return;

    const emailRedirectTo = 'http://localhost:3000';
    const email = trimmed;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });
    if (error) {
      setAuthError(error.message || 'Unable to send login link.');
      return;
    }
    setAuthNotice('Check your email for a login link to continue.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
    supabase?.auth?.signOut().catch(() => {});
  };

  const addThought = async ({ content, category, linkedPositionId = null, replyToThoughtId = null }) => {
    if (!currentUser) return null;
    const ensuredUser = await ensureProfile(currentUser);
    const authorId = ensuredUser?.id || currentUser.id;
    const todayCount = thoughts.filter(
      (thought) => thought.authorId === authorId && isSameDay(thought.createdAt, new Date())
    ).length;
    if (todayCount >= THOUGHTS_PER_DAY) return null;
    if (!category) return null;
    const categorySlug = slugifyCategory(category);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('thoughts')
          .insert({
            author_id: authorId,
            content,
            category: categorySlug,
          })
          .select('id, author_id, content, created_at, category')
          .single();
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Error inserting thought', error);
          return null;
        }
        const newThought = createThought({
          id: data.id,
          authorId: data.author_id,
          content: data.content,
          createdAt: data.created_at,
          linkedPositionId,
          replyToThoughtId,
          category: data.category || categorySlug,
        });
        setThoughts((prev) => [newThought, ...prev]);
        return newThought.id;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error inserting thought', err);
    }
    const fallbackThought = createThought({
      authorId: authorId,
      content,
      linkedPositionId,
      replyToThoughtId,
      category: categorySlug,
    });
    setThoughts((prev) => [fallbackThought, ...prev]);
    return fallbackThought.id;
  };

  const addPosition = async ({ thesis, definitions = [], sources = [], category }) => {
    if (!currentUser) return null;
    const ensuredUser = await ensureProfile(currentUser);
    const authorId = ensuredUser?.id || currentUser.id;
    const todayCount = positions.filter(
      (position) => position.authorId === authorId && isSameDay(position.createdAt, new Date())
    ).length;
    if (todayCount >= POSITIONS_PER_DAY) return null;
    if (!category) return null;
    const newPosition = createPosition({
      authorId,
      thesis,
      definitions,
      sources,
      category,
    });
    setPositions((prev) => [...prev, newPosition]);
    return newPosition.id;
  };

  const startDebate = async (positionId) => {
    if (!currentUser) return null;
    const ensuredUser = await ensureProfile(currentUser);
    const newDebate = createDebate({
      positionId,
      affirmativeUserId: ensuredUser?.id || currentUser.id,
      negativeUserId: 'tbd-opponent',
      status: DEBATE_STATUS.ACTIVE,
      challengeStatus: 'accepted',
    });
    setDebates((prev) => [...prev, newDebate]);
    return newDebate.id;
  };

  const createChallenge = async ({ positionId, opening, opposingPosition, definitions }) => {
    if (!currentUser) return null;
    const ensuredUser = await ensureProfile(currentUser);
    const newDebate = createDebate({
      positionId,
      affirmativeUserId: ensuredUser?.id || currentUser.id,
      negativeUserId: positions.find((p) => p.id === positionId)?.authorId || 'unknown',
      status: DEBATE_STATUS.SCHEDULED,
      challengeStatus: 'pending',
      challengerOpening: opening,
      opposingPosition,
      challengeDefinitions: definitions || [],
    });
    setDebates((prev) => [...prev, newDebate]);
    return newDebate.id;
  };

  const addTurn = (debateId, authorId, content) => {
    setTurns((prev) => {
      const relevant = prev.filter((t) => t.debateId === debateId);
      const nextTurnNumber = relevant.length + 1;
      if (nextTurnNumber > 10) return prev;
      const newTurn = createDebateTurn({
        debateId,
        authorId,
        turnNumber: nextTurnNumber,
        content,
      });
      return [...prev, newTurn];
    });
  };

  const updateDebate = (debateId, updater) => {
    setDebates((prev) =>
      prev.map((debate) =>
        debate.id === debateId
          ? { ...debate, ...(typeof updater === 'function' ? updater(debate) : updater) }
          : debate
      )
    );
  };

  const acceptChallenge = (debateId, opening) => {
    updateDebate(debateId, {
      challengeStatus: 'accepted',
      status: DEBATE_STATUS.ACTIVE,
      challengeeOpening: opening,
    });
  };

  const rejectChallenge = (debateId) => {
    updateDebate(debateId, { challengeStatus: 'rejected' });
  };

  const submitClosing = (debateId, role, text) => {
    updateDebate(debateId, (debate) => {
      const updates =
        role === 'challenger'
          ? { closingChallenger: text }
          : { closingOpponent: text };
      const bothHave =
        (role === 'challenger' ? text : debate.closingChallenger) &&
        (role === 'challengee' ? text : debate.closingOpponent);
      return {
        ...updates,
        status: bothHave ? DEBATE_STATUS.RESOLVED : debate.status,
        resolvedAt: bothHave ? new Date().toISOString() : debate.resolvedAt,
      };
    });
  };

  const voteDebate = (debateId, choice) => {
    updateDebate(debateId, (debate) => ({
      votes: {
        ...debate.votes,
        [choice]: (debate.votes?.[choice] || 0) + 1,
      },
    }));
  };

  const updateUserProfile = async (id, updates) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
    if (currentUser?.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
    if (supabase) {
      await supabase
        .from('profiles')
        .upsert({
          id,
          username: updates.username,
          display_name: updates.display_name,
          user_email: updates.user_email,
        });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.08),transparent_35%),radial-gradient(circle_at_80%_0,rgba(168,85,247,0.08),transparent_30%)] pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 pb-12">
        {currentUser && (
          <Header
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}
        <Routes>
          <Route
            path="/login"
            element={
              currentUser ? (
                <Navigate to="/" replace />
              ) : (
                <LoginScreen onLogin={handleLogin} error={authError} notice={authNotice} />
              )
            }
          />
          <Route
            path="/"
            element={
              currentUser ? (
                <HomeScreen
                  thoughts={thoughts}
                  thoughtError={thoughtError}
                  positions={positions}
                  debates={debates}
                  users={userDirectory}
                  getDisplayName={getDisplayName}
                  getCategoryLabel={getCategoryLabel}
                  onAddThought={(content, category) => addThought({ content, category })}
                  onAddPosition={(thesis, defs, srcs, category) =>
                    addPosition({ thesis, definitions: defs, sources: srcs, category })
                  }
                  categories={CATEGORY_OPTIONS}
                  thoughtsTodayCount={thoughtsTodayCount}
                  positionsTodayCount={positionsTodayCount}
                  thoughtsLimit={THOUGHTS_PER_DAY}
                  positionsLimit={POSITIONS_PER_DAY}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/positions/:positionId"
            element={
              currentUser ? (
                <PositionScreen
                  positions={positions}
                  debates={debates}
                  users={userDirectory}
                  getDisplayName={getDisplayName}
                  onStartDebate={async (positionId) => {
                    const newId = await startDebate(positionId);
                    if (newId) navigate(`/debates/${newId}`);
                  }}
                  onChallenge={async (positionId, data) => {
                    const newId = await createChallenge({ positionId, ...data });
                    if (newId) navigate(`/debates/${newId}`);
                  }}
                  categories={CATEGORY_OPTIONS}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/thoughts/:thoughtId"
            element={
              currentUser ? (
                <ThoughtScreen
                  thoughts={thoughts}
                  users={userDirectory}
                  onAddComment={(content, thoughtId, category) =>
                    addThought({ content, replyToThoughtId: thoughtId, category })
                  }
                  currentUser={currentUser}
                  getDisplayName={getDisplayName}
                  thoughtsTodayCount={thoughtsTodayCount}
                  thoughtsLimit={THOUGHTS_PER_DAY}
                  categories={CATEGORY_OPTIONS}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/debates/:debateId"
            element={
              currentUser ? (
                <DebateScreen
                  currentUser={currentUser}
                  positions={positions}
                  debates={debates}
                  users={userDirectory}
                  getDisplayName={getDisplayName}
                  turns={turns}
                  onAddTurn={addTurn}
                  onAcceptChallenge={acceptChallenge}
                  onRejectChallenge={rejectChallenge}
                  onSubmitClosing={submitClosing}
                  onVote={voteDebate}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile/:userId"
            element={
              currentUser ? (
                <ProfileScreen
                  currentUser={currentUser}
                  users={userDirectory}
                  thoughts={thoughts}
                  positions={positions}
                  debates={debates}
                  onUpdateUser={(id, updates) => updateUserProfile(id, updates)}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/explore"
            element={
              currentUser ? (
                <ExploreScreen
                  thoughts={thoughts}
                  positions={positions}
                  debates={debates}
                  getDisplayName={getDisplayName}
                  thoughtError={thoughtError}
                  getCategoryLabel={getCategoryLabel}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="*"
            element={<Navigate to={currentUser ? '/' : '/login'} replace />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
