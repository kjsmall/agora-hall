import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import LoginScreen from './pages/LoginScreen';
import HomeScreen from './pages/HomeScreen';
import PositionScreen from './pages/PositionScreen';
import DebateScreen from './pages/DebateScreen';
import ProfileScreen from './pages/ProfileScreen';
import PublicProfileScreen from './pages/PublicProfileScreen';
import ThoughtScreen from './pages/ThoughtScreen';
import ExploreScreen from './pages/ExploreScreen';
import PeopleScreen from './pages/PeopleScreen';
import SignupScreen from './pages/SignupScreen';
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

// Max number of signed-up users allowed; adjust as needed to cap signups.
const MAX_USERS = 5;
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
  const [positionError, setPositionError] = useState(null);
  const [debateError, setDebateError] = useState(null);

  const [thoughts, setThoughts] = useState([]);

  const [positions, setPositions] = useState([]);
  const [debates, setDebates] = useState([]);

  const [turns, setTurns] = useState([]);
  const [debateVotes, setDebateVotes] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navigate = useNavigate();
  const userDirectory = useMemo(
    () => users.reduce((acc, user) => ({ ...acc, [user.id]: user }), {}),
    [users]
  );
  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const mapNotification = (row) => ({
    id: row.id,
    recipientId: row.recipient_profile_id,
    type: row.type,
    debateId: row.debate_id,
    positionId: row.position_id,
    data: row.data,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  });

  const fetchNotifications = useCallback(async () => {
    if (!supabase || !currentUser) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('id, recipient_profile_id, type, debate_id, position_id, data, is_read, read_at, created_at')
      .eq('recipient_profile_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading notifications', error);
      return;
    }
    setNotifications((data || []).map(mapNotification));
  }, [currentUser]);

  const createNotification = async ({ recipientId, type, debateId = null, positionId = null, data = null }) => {
    if (!supabase || !recipientId) return;
    // Do not notify the same user who triggered the action.
    if (currentUser && recipientId === currentUser.id) return;
    try {
      const { data: inserted } = await supabase
        .from('notifications')
        .insert({
          recipient_profile_id: recipientId,
          type,
          debate_id: debateId,
          position_id: positionId,
          data,
        })
        .select('id, recipient_profile_id, type, debate_id, position_id, data, is_read, read_at, created_at')
        .single();
      if (inserted) {
        setNotifications((prev) => [mapNotification(inserted), ...prev]);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating notification', err);
    }
  };

  const notifyDebateCompleted = async ({ debateId, positionId, initiatorId, respondentId, winnerUserId }) => {
    await createNotification({
      recipientId: initiatorId,
      type: 'debate_completed',
      debateId,
      positionId,
      data: { winner_profile_id: winnerUserId },
    });
    await createNotification({
      recipientId: respondentId,
      type: 'debate_completed',
      debateId,
      positionId,
      data: { winner_profile_id: winnerUserId },
    });
  };

  const markNotificationsRead = async (ids) => {
    if (!supabase || !currentUser || !ids || ids.length === 0) return;
    const now = new Date().toISOString();
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .in('id', ids)
        .eq('recipient_profile_id', currentUser.id);
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true, readAt: now } : n))
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error marking notifications read', err);
    }
  };

  const fetchThoughts = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('thoughts')
      .select('id, author_id, title, content, created_at, category, is_promoted, parent_thought_id, root_thought_id, depth, is_deleted')
      .eq('is_promoted', false)
      .eq('is_deleted', false)
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
        title: row.title || '',
        content: row.content,
        createdAt: row.created_at,
        category: row.category || 'miscellaneous',
        isPromoted: row.is_promoted || false,
        parentThoughtId: row.parent_thought_id || null,
        rootThoughtId: row.root_thought_id || null,
        depth: row.depth || 0,
        isDeleted: row.is_deleted || false,
      })
    );
    setThoughts(mapped);
    setThoughtError(null);
  }, []);

  const fetchPositions = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('positions')
      .select('id, author_id, title, premise, definitions, sources, category, created_at, from_thought_id')
      .order('created_at', { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading positions from Supabase', error);
      setPositionError(error.message || 'Unable to load positions.');
      return;
    }
    const mapped = (data || []).map((row) => ({
      id: row.id,
      authorId: row.author_id,
      title: row.title || '',
      thesis: row.premise || '',
      definitions: row.definitions || [],
      sources: row.sources || [],
      category: row.category || 'miscellaneous',
      createdAt: row.created_at,
      fromThoughtId: row.from_thought_id || null,
    }));
    setPositions(mapped);
    setPositionError(null);
  }, []);

  const fetchDebates = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('debates')
      .select(
        'id, position_id, initiator_user_id, respondent_user_id, status, created_at, resolved_at, winner_user_id, max_rounds, current_round, current_turn_profile_id, forfeited_by_profile_id, forfeit_reason'
      )
      .order('created_at', { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading debates from Supabase', error);
      setDebateError(error.message || 'Unable to load debates.');
      return;
    }
    const mapped = (data || []).map((row) => {
      const normalizedStatus =
        row.status === 'completed'
          ? DEBATE_STATUS.RESOLVED
          : row.status === 'active'
          ? DEBATE_STATUS.ACTIVE
          : row.status === 'pending'
          ? 'pending'
          : row.status || DEBATE_STATUS.SCHEDULED;
      return {
        id: row.id,
        positionId: row.position_id,
        affirmativeUserId: row.initiator_user_id,
        negativeUserId: row.respondent_user_id,
        status: normalizedStatus,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
        winnerUserId: row.winner_user_id || null,
        maxRounds: row.max_rounds || 10,
        currentRound: row.current_round || 0,
        currentTurnProfileId: row.current_turn_profile_id || null,
        forfeitedByProfileId: row.forfeited_by_profile_id || null,
        forfeitReason: row.forfeit_reason || null,
        // Client-only fields
        challengeStatus: normalizedStatus === 'pending' ? 'pending' : 'accepted',
        challengerOpening: '',
        challengeeOpening: '',
        opposingPosition: '',
        challengeDefinitions: [],
        closingChallenger: '',
        closingOpponent: '',
        votes: debateVotes[row.id] || { challenger: 0, challengee: 0, neither: 0 },
      };
    });
    setDebates((prev) => {
      const prevMap = prev.reduce((acc, d) => ({ ...acc, [d.id]: d }), {});
      return mapped.map((d) => ({
        ...d,
        opposingPosition: prevMap[d.id]?.opposingPosition || d.opposingPosition,
        challengeDefinitions: prevMap[d.id]?.challengeDefinitions || d.challengeDefinitions,
        challengerOpening: prevMap[d.id]?.challengerOpening || d.challengerOpening,
        challengeeOpening: prevMap[d.id]?.challengeeOpening || d.challengeeOpening,
      }));
    });
    setDebateError(null);
  }, [debateVotes]);

  useEffect(() => {
    if (currentUser) {
      fetchThoughts();
    } else {
      setThoughts([]);
    }
  }, [currentUser, fetchThoughts]);

  useEffect(() => {
    if (currentUser) {
      fetchPositions();
    } else {
      setPositions([]);
    }
  }, [currentUser, fetchPositions]);

  useEffect(() => {
    if (currentUser) {
      fetchDebates();
    } else {
      setDebates([]);
    }
  }, [currentUser, fetchDebates]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
    setNotifications([]);
    return () => {};
  }, [currentUser, fetchNotifications]);

  const fetchDebateTurns = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('debate_turns')
      .select('id, debate_id, author_id, kind, round_number, content, created_at')
      .order('created_at', { ascending: true });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading debate turns from Supabase', error);
      return;
    }
    const mapped = (data || []).map((row) =>
      createDebateTurn({
        id: row.id,
        debateId: row.debate_id,
        authorId: row.author_id,
        turnNumber: row.kind === 'round' ? row.round_number || 0 : 0,
        content: row.content,
        createdAt: row.created_at,
        kind: row.kind,
        roundNumber: row.round_number,
      })
    );
    setTurns(mapped);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDebateTurns();
    } else {
      setTurns([]);
    }
  }, [currentUser, fetchDebateTurns]);

  const fetchDebateVotes = useCallback(async () => {
    if (!supabase) return {};
    const { data, error } = await supabase
      .from('debate_votes')
      .select('debate_id, side');
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading debate votes', error);
      return {};
    }
    const aggregates = {};
    (data || []).forEach((vote) => {
      if (!aggregates[vote.debate_id]) {
        aggregates[vote.debate_id] = { challenger: 0, challengee: 0, neither: 0 };
      }
      if (vote.side === 'initiator') aggregates[vote.debate_id].challenger += 1;
      else if (vote.side === 'respondent') aggregates[vote.debate_id].challengee += 1;
      else aggregates[vote.debate_id].neither += 1;
    });
    setDebateVotes(aggregates);
    return aggregates;
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDebateVotes();
    } else {
      setDebateVotes({});
    }
  }, [currentUser, fetchDebateVotes]);

  // Global polling to keep feeds/turns/votes fresh; direct creates still update immediately.
  useEffect(() => {
    if (!currentUser) return undefined;
    const interval = setInterval(() => {
      fetchThoughts();
      fetchPositions();
      fetchDebates();
      fetchDebateTurns();
      fetchDebateVotes();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser, fetchThoughts, fetchPositions, fetchDebates, fetchDebateTurns, fetchDebateVotes]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!supabase || !currentUser) return;
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
    if (!currentUser) {
      setUsers([]);
      return undefined;
    }
    fetchProfiles();
    return undefined;
  }, [currentUser]);

  const mergeProfile = useCallback((profile) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === profile.id);
      return exists ? prev.map((u) => (u.id === profile.id ? { ...u, ...profile } : u)) : [...prev, profile];
    });
  }, []);

  const ensureProfile = useCallback(
    async (user) => {
      if (!user) return null;
      const baseProfile = profileFromUser(user);
      setCurrentUser((prev) => prev || baseProfile);
      if (!supabase) {
        mergeProfile(baseProfile);
        setCurrentUser(baseProfile);
        return baseProfile;
      }
      // Check existing to avoid overwriting username/display_name
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, username, display_name, user_email')
        .eq('id', baseProfile.id)
        .maybeSingle();
      if (existing) {
        mergeProfile(existing);
        setCurrentUser(existing);
        return existing;
      }
      const { data: inserted, error } = await supabase
        .from('profiles')
        .insert({
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
      mergeProfile(inserted);
      setCurrentUser(inserted);
      return inserted;
    },
    [mergeProfile]
  );

  // On mount, stay logged out until explicit login. We do not auto-restore sessions.
  useEffect(() => {
    setCurrentUser(null);
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

  const buildNotificationLabel = useCallback(
    (note) => {
      const data = note.data || {};
      switch (note.type) {
        case 'new_challenge':
          return `New challenge on your position${data.challenger_profile_id ? ` from ${getDisplayName(data.challenger_profile_id)}` : ''}`;
        case 'new_turn': {
          const other = data.author_profile_id ? getDisplayName(data.author_profile_id) : 'Opponent';
          const kind = data.kind || 'turn';
          return `${other} posted a ${kind} in your debate`;
        }
        case 'debate_completed': {
          const winner =
            data.winner_profile_id && getDisplayName(data.winner_profile_id) !== 'Anonymous'
              ? getDisplayName(data.winner_profile_id)
              : null;
          return `Debate completed${winner ? ` – winner: ${winner}` : ''}`;
        }
        case 'thought_reply': {
          const from = data.replier_profile_id ? getDisplayName(data.replier_profile_id) : 'Someone';
          return `${from} replied to your thought`;
        }
        default:
          return 'Notification';
      }
    },
    [getDisplayName]
  );

  const decoratedNotifications = useMemo(
    () => notifications.map((n) => ({ ...n, message: buildNotificationLabel(n) })),
    [notifications, buildNotificationLabel]
  );

  const unreadIds = useMemo(() => notifications.filter((n) => !n.isRead).map((n) => n.id), [notifications]);

  const handleNotificationClick = (note) => {
    if (!note) return;
    if (note.type === 'thought_reply') {
      const thoughtId = note.data?.thought_id || note.data?.thoughtId;
      if (thoughtId) navigate(`/thoughts/${thoughtId}`);
    } else if (note.debateId) {
      navigate(`/debates/${note.debateId}`);
    }
    markNotificationsRead([note.id]);
    setNotificationsOpen(false);
  };

  const handleToggleNotifications = () => {
    setNotificationsOpen((prev) => {
      const next = !prev;
      if (!prev && unreadIds.length > 0) {
        markNotificationsRead(unreadIds);
      }
      return next;
    });
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

  const handleLogin = async (identifier, password) => {
    // eslint-disable-next-line no-console
    console.log('handleLogin called', {
      identifier,
      hasPassword: Boolean(password),
      supabaseReady: Boolean(supabase),
    });
    setAuthError(null);
    setAuthNotice(null);
    if (!supabase) {
      setAuthError('Supabase client not configured.');
      return;
    }
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) {
      setAuthError('Email is required.');
      return;
    }
    if (!password) {
      setAuthError('Password is required.');
      return;
    }

    setAuthNotice('Attempting to sign in...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      // eslint-disable-next-line no-console
      console.log('supabase.signInWithPassword result', { data, error });

      if (error) {
        setAuthError(error.message || 'Unable to authenticate.');
        setAuthNotice(null);
        return;
      }

      const sessionUser = data?.session?.user || data?.user;
      if (sessionUser) {
        const ensured = await ensureProfile(sessionUser);
        if (ensured) {
          setCurrentUser(ensured);
          setAuthNotice('Login successful. Redirecting...');
          navigate('/');
          return;
        }
        setAuthError('Unable to load profile after login.');
        setAuthNotice(null);
        return;
      }

      setAuthError('Unknown error occurred');
      setAuthNotice(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('signInWithPassword exception', err);
      setAuthError(err.message || 'Authentication failed.');
      setAuthNotice(null);
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await supabase?.auth?.signOut().catch(() => {});
    navigate('/login');
  };

  const handleSignup = async (email, password, username) => {
    setAuthError(null);
    setAuthNotice(null);
    if (!supabase) {
      setAuthError('Supabase client not configured.');
      return;
    }
    if (!email || !password || !username) {
      setAuthError('Email, username, and password are required.');
      return;
    }
    // Enforce global user limit
    if (users.length >= MAX_USERS) {
      setAuthError('User limit reached');
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message || 'Unable to create account.');
      return;
    }
    const sessionUser = data?.user || data?.session?.user;
    if (sessionUser && data?.session) {
      const ensured = await ensureProfile(sessionUser);
      if (ensured) {
        if (username) {
          try {
            await updateUserProfile(ensured.id, { username });
          } catch (err) {
            setAuthError(err.message || 'Unable to set username.');
            return;
          }
        }
        setCurrentUser((prev) => ({ ...prev, username }));
      }
      setAuthNotice('Account created. Redirecting...');
      navigate('/');
    } else {
      setAuthNotice('Account created. Check your email to confirm.');
    }
  };

  const addThought = async ({ title, content, category, linkedPositionId = null, replyToThoughtId = null, parentThoughtId = null }) => {
    if (!currentUser) return null;
    const ensuredUser = await ensureProfile(currentUser);
    const authorId = ensuredUser?.id || currentUser.id;
    const body = typeof content === 'string' ? content : String(content || '');
    const todayCount = thoughts.filter(
      (thought) => thought.authorId === authorId && !thought.isDeleted && isSameDay(thought.createdAt, new Date())
    ).length;
    if (todayCount >= THOUGHTS_PER_DAY) return null;
    const safeTitle =
      (title || '').trim() ||
      body
        .trim()
        .slice(0, 80);
    if (!category || !safeTitle || !body) return null;
    const categorySlug = slugifyCategory(category);
    const parentId = parentThoughtId || replyToThoughtId || null;
    let parentMeta = null;
    if (parentId) {
      parentMeta = thoughts.find((t) => t.id === parentId) || null;
      if (!parentMeta && supabase) {
        const { data: parentRow } = await supabase
          .from('thoughts')
          .select('id, root_thought_id, depth, author_id')
          .eq('id', parentId)
          .maybeSingle();
        if (parentRow) {
          parentMeta = {
            id: parentRow.id,
            rootThoughtId: parentRow.root_thought_id,
            depth: parentRow.depth || 0,
            authorId: parentRow.author_id,
          };
        }
      }
    }
    const rootThoughtId = parentMeta ? parentMeta.rootThoughtId || parentMeta.id : null;
    const depth = parentMeta ? (parentMeta.depth || 0) + 1 : 0;
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('thoughts')
          .insert({
            author_id: authorId,
            title: safeTitle,
            content: body,
            category: categorySlug,
            is_promoted: false,
            parent_thought_id: parentId,
            root_thought_id: rootThoughtId,
            depth,
            is_deleted: false,
          })
          .select('id, author_id, title, content, created_at, category, is_promoted, parent_thought_id, root_thought_id, depth, is_deleted')
          .single();
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Error inserting thought', error);
          return null;
        }
        const newThought = createThought({
          id: data.id,
          authorId: data.author_id,
          title: data.title || safeTitle,
          content: data.content,
          createdAt: data.created_at,
          linkedPositionId,
          parentThoughtId: data.parent_thought_id || null,
          rootThoughtId: data.root_thought_id || null,
          depth: data.depth || 0,
          category: data.category || categorySlug,
          isPromoted: data.is_promoted || false,
          isDeleted: data.is_deleted || false,
        });
        // If root is missing (top-level), set to self
        if (!newThought.rootThoughtId && supabase) {
          newThought.rootThoughtId = newThought.id;
          await supabase.from('thoughts').update({ root_thought_id: newThought.id }).eq('id', newThought.id);
        }
        setThoughts((prev) => [newThought, ...prev]);
        // Keep thoughts fresh immediately after creation (not tied to notification polling).
        fetchThoughts();
        if (parentId && parentMeta && parentMeta.authorId && parentMeta.authorId !== authorId) {
          await createNotification({
            recipientId: parentMeta.authorId,
            type: 'thought_reply',
            data: { thought_id: parentId, reply_thought_id: newThought.id, replier_profile_id: authorId },
          });
        }
        return newThought.id;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error inserting thought', err);
    }
    const fallbackThought = createThought({
      authorId: authorId,
      title: safeTitle,
      content: body,
      linkedPositionId,
      parentThoughtId: parentId,
      rootThoughtId: rootThoughtId || null,
      depth,
      category: categorySlug,
      isPromoted: false,
      isDeleted: false,
    });
    if (!fallbackThought.rootThoughtId && !parentId) {
      fallbackThought.rootThoughtId = fallbackThought.id;
    }
    setThoughts((prev) => [fallbackThought, ...prev]);
    fetchThoughts();
    if (parentId) {
      const parentThought = thoughts.find((t) => t.id === parentId);
      if (parentThought && parentThought.authorId !== authorId) {
        await createNotification({
          recipientId: parentThought.authorId,
          type: 'thought_reply',
          data: { thought_id: parentId, reply_thought_id: fallbackThought.id, replier_profile_id: authorId },
        });
      }
    }
    return fallbackThought.id;
  };

  const addPosition = async ({ title, thesis, definitions = [], sources = [], category }) => {
    if (!currentUser) return null;
    const ensuredUser = await ensureProfile(currentUser);
    const authorId = ensuredUser?.id || currentUser.id;
    const todayCount = positions.filter(
      (position) => position.authorId === authorId && isSameDay(position.createdAt, new Date())
    ).length;
    if (todayCount >= POSITIONS_PER_DAY) return null;
    if (!category || !title || !thesis) return null;
    if (supabase) {
      const { data, error } = await supabase
        .from('positions')
        .insert({
          author_id: authorId,
          title,
          premise: thesis,
          definitions,
          sources,
          category,
        })
        .select('id, author_id, title, premise, definitions, sources, category, created_at, from_thought_id')
        .single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error inserting position', error);
        return null;
      }
      const newPosition = {
        id: data.id,
        authorId: data.author_id,
        title: data.title || title,
        thesis: data.premise || '',
        definitions: data.definitions || [],
        sources: data.sources || [],
        category: data.category || category,
        createdAt: data.created_at,
        fromThoughtId: data.from_thought_id || null,
      };
      setPositions((prev) => [newPosition, ...prev]);
      // Refresh positions immediately after create to avoid waiting on any other polling.
      fetchPositions();
      return newPosition.id;
    }
    const newPosition = createPosition({
      authorId,
      title,
      thesis,
      definitions,
      sources,
      category,
    });
    setPositions((prev) => [newPosition, ...prev]);
    fetchPositions();
    return newPosition.id;
  };

  const convertThoughtToPosition = async ({
    thoughtId,
    title,
    premise,
    definitions = [],
    sources = [],
    category,
  }) => {
    if (!currentUser) return null;
    const ensuredUser = await ensureProfile(currentUser);
    const authorId = ensuredUser?.id || currentUser.id;
    const thought = thoughts.find((t) => t.id === thoughtId);
    const categoryValue = category || thought?.category || 'miscellaneous';
    const safeTitle = (title || thought?.title || '').trim();
    const safePremise = (premise || thought?.content || '').trim();
    if (!safeTitle || !safePremise) return null;
    if (supabase) {
      const { data, error } = await supabase
        .from('positions')
        .insert({
          author_id: authorId,
          title: safeTitle,
          premise: safePremise,
          definitions,
          sources,
          category: categoryValue,
          from_thought_id: thoughtId,
        })
        .select('id, author_id, title, premise, definitions, sources, category, created_at, from_thought_id')
        .single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error converting thought', error);
        return null;
      }
      await supabase.from('thoughts').update({ is_promoted: true }).eq('id', thoughtId);
      const newPosition = {
        id: data.id,
        authorId: data.author_id,
        title: data.title || safeTitle,
        thesis: data.premise || safePremise,
        definitions: data.definitions || [],
        sources: data.sources || [],
        category: data.category || categoryValue,
        createdAt: data.created_at,
        fromThoughtId: data.from_thought_id || thoughtId,
      };
      setPositions((prev) => [newPosition, ...prev]);
      setThoughts((prev) => prev.filter((t) => t.id !== thoughtId));
      return newPosition.id;
    }
    return null;
  };

  const startDebate = async (positionId) => {
    if (!currentUser) return null;
    const ensuredUser = await ensureProfile(currentUser);
    const initiatorId = ensuredUser?.id || currentUser.id;
    if (supabase) {
      const { data, error } = await supabase
        .from('debates')
        .insert({
          position_id: positionId,
          initiator_user_id: initiatorId,
          respondent_user_id: null,
          status: 'active',
        })
        .select('id, position_id, initiator_user_id, respondent_user_id, status, created_at, resolved_at, winner_user_id, max_rounds')
        .single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error creating debate', error);
        return null;
      }
      const mapped = {
        id: data.id,
        positionId: data.position_id,
        affirmativeUserId: data.initiator_user_id,
        negativeUserId: data.respondent_user_id,
        status: data.status || DEBATE_STATUS.ACTIVE,
        createdAt: data.created_at,
        resolvedAt: data.resolved_at,
        winnerUserId: data.winner_user_id,
        maxRounds: data.max_rounds || 10,
        challengeStatus: 'accepted',
        challengerOpening: '',
        challengeeOpening: '',
        opposingPosition: '',
        challengeDefinitions: [],
        closingChallenger: '',
        closingOpponent: '',
        votes: { challenger: 0, challengee: 0, neither: 0 },
      };
      setDebates((prev) => [mapped, ...prev]);
      return mapped.id;
    }
    const newDebate = createDebate({
      positionId,
      affirmativeUserId: initiatorId,
      negativeUserId: null,
      status: DEBATE_STATUS.ACTIVE,
    });
    setDebates((prev) => [newDebate, ...prev]);
    return newDebate.id;
  };

  const createChallenge = async ({ positionId, opening, opposingPosition, definitions }) => {
    if (!currentUser) return null;
    const ensuredUser = await ensureProfile(currentUser);
    const initiatorId = ensuredUser?.id || currentUser.id;
    const respondentId = positions.find((p) => p.id === positionId)?.authorId || null;
    if (respondentId && respondentId === initiatorId) {
      setDebateError('You cannot challenge your own position.');
      return null;
    }
    if (supabase) {
      const { data, error } = await supabase
        .from('debates')
        .insert({
          position_id: positionId,
          initiator_user_id: initiatorId,
          respondent_user_id: respondentId,
          status: 'pending',
          current_round: 0,
          current_turn_profile_id: respondentId,
        })
        .select('id, position_id, initiator_user_id, respondent_user_id, status, created_at, resolved_at, winner_user_id, max_rounds')
        .single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error creating challenge debate', error);
        return null;
      }
      // Insert challenger opening into debate_turns
      const { data: openingTurn } = await supabase
        .from('debate_turns')
        .insert({
          debate_id: data.id,
          author_id: initiatorId,
          kind: 'opening',
          content: opening,
        })
        .select('id, debate_id, author_id, kind, round_number, content, created_at')
        .single();
      if (openingTurn) {
        const newTurn = createDebateTurn({
          id: openingTurn.id,
          debateId: openingTurn.debate_id,
          authorId: openingTurn.author_id,
          content: openingTurn.content,
          createdAt: openingTurn.created_at,
          kind: openingTurn.kind,
          roundNumber: openingTurn.round_number,
          turnNumber: openingTurn.round_number || 0,
        });
        setTurns((prev) => [...prev, newTurn]);
      }
      const mapped = {
        id: data.id,
        positionId: data.position_id,
        affirmativeUserId: data.initiator_user_id,
        negativeUserId: data.respondent_user_id,
        status: data.status || 'pending',
        createdAt: data.created_at,
        resolvedAt: data.resolved_at,
        winnerUserId: data.winner_user_id,
        maxRounds: data.max_rounds || 10,
        challengeStatus: 'pending',
        challengerOpening: opening,
        challengeeOpening: '',
        opposingPosition,
        challengeDefinitions: definitions || [],
        closingChallenger: '',
        closingOpponent: '',
        votes: debateVotes[data.id] || { challenger: 0, challengee: 0, neither: 0 },
        currentRound: 0,
        currentTurnProfileId: respondentId,
      };
      setDebates((prev) => [mapped, ...prev]);
      await createNotification({
        recipientId: respondentId,
        type: 'new_challenge',
        debateId: mapped.id,
        positionId,
        data: { challenger_profile_id: initiatorId },
      });
      if (openingTurn) {
        await createNotification({
          recipientId: respondentId,
          type: 'new_turn',
          debateId: mapped.id,
          positionId,
          data: { author_profile_id: initiatorId, kind: 'opening' },
        });
      }
      return mapped.id;
    }
    const newDebate = createDebate({
      positionId,
      affirmativeUserId: initiatorId,
      negativeUserId: respondentId,
      status: DEBATE_STATUS.SCHEDULED,
      challengeStatus: 'pending',
      challengerOpening: opening,
      opposingPosition,
      challengeDefinitions: definitions || [],
    });
    setDebates((prev) => [newDebate, ...prev]);
    return newDebate.id;
  };

  const addTurn = async (debateId, authorId, content) => {
    const debate = debates.find((d) => d.id === debateId);
    if (!debate || debate.status !== DEBATE_STATUS.ACTIVE) return;
    if (debate.currentTurnProfileId && debate.currentTurnProfileId !== authorId) return;
    const currentRound = debate.currentRound || 0;
    const roundNumber = currentRound + 1;
    const roundTurns = turns.filter((t) => t.debateId === debateId && t.kind === 'round' && (t.roundNumber || t.turnNumber) === roundNumber);
    if (roundNumber > debate.maxRounds) return;
    if (supabase) {
      const { data, error } = await supabase
        .from('debate_turns')
        .insert({
          debate_id: debateId,
          author_id: authorId,
          kind: 'round',
          round_number: roundNumber,
          content,
        })
        .select('id, debate_id, author_id, kind, round_number, content, created_at')
        .single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error inserting debate turn', error);
        return;
      }
      const newTurn = createDebateTurn({
        id: data.id,
        debateId,
        authorId,
        turnNumber: data.round_number || roundNumber,
        content: data.content,
        createdAt: data.created_at,
        kind: data.kind,
        roundNumber: data.round_number,
      });
      setTurns((prev) => [...prev, newTurn]);
      const recipientId = authorId === debate.affirmativeUserId ? debate.negativeUserId : debate.affirmativeUserId;
      await createNotification({
        recipientId,
        type: 'new_turn',
        debateId,
        positionId: debate.positionId,
        data: { author_profile_id: authorId, kind: 'round', round_number: roundNumber },
      });

      // Determine next turn assignment
      const authorsThisRound = new Set([...roundTurns.map((t) => t.authorId), authorId]);
      let nextCurrentRound = debate.currentRound || 0;
      let nextTurnProfileId = debate.currentTurnProfileId;
      if (authorsThisRound.size < 2) {
        // Switch to the other participant for same round
        nextTurnProfileId = authorId === debate.affirmativeUserId ? debate.negativeUserId : debate.affirmativeUserId;
      } else {
        // Both sides spoke for this round
        nextCurrentRound = roundNumber;
        if (nextCurrentRound >= debate.maxRounds) {
          // Move to closings: challenger first
          nextTurnProfileId = debate.affirmativeUserId;
        } else {
          // Next round starts with challenger
          nextTurnProfileId = debate.affirmativeUserId;
        }
      }
      setDebates((prev) =>
        prev.map((d) =>
          d.id === debateId
            ? {
                ...d,
                currentRound: nextCurrentRound,
                currentTurnProfileId: nextTurnProfileId,
              }
            : d
        )
      );
      await supabase
        .from('debates')
        .update({ current_round: nextCurrentRound, current_turn_profile_id: nextTurnProfileId })
        .eq('id', debateId);
      return;
    }
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

  const acceptChallenge = async (debateId, opening) => {
    const debate = debates.find((d) => d.id === debateId);
    if (!debate) return;
    if (supabase) {
      await supabase
        .from('debates')
        .update({ status: 'active', current_round: 0, current_turn_profile_id: debate.affirmativeUserId })
        .eq('id', debateId);
      const { data: openingTurn } = await supabase
        .from('debate_turns')
        .insert({
          debate_id: debateId,
          author_id: debate.negativeUserId,
          kind: 'opening',
          content: opening,
        })
        .select('id, debate_id, author_id, kind, round_number, content, created_at')
        .single();
      if (openingTurn) {
        const newTurn = createDebateTurn({
          id: openingTurn.id,
          debateId: openingTurn.debate_id,
          authorId: openingTurn.author_id,
          content: openingTurn.content,
          createdAt: openingTurn.created_at,
          kind: openingTurn.kind,
          roundNumber: openingTurn.round_number,
          turnNumber: openingTurn.round_number || 0,
        });
        setTurns((prev) => [...prev, newTurn]);
        await createNotification({
          recipientId: debate.affirmativeUserId,
          type: 'new_turn',
          debateId,
          positionId: debate.positionId,
          data: { author_profile_id: debate.negativeUserId, kind: 'opening' },
        });
      }
    }
    updateDebate(debateId, {
      challengeStatus: 'accepted',
      status: DEBATE_STATUS.ACTIVE,
      challengeeOpening: opening,
      currentRound: 0,
      currentTurnProfileId: debate.affirmativeUserId,
    });
  };

  const rejectChallenge = (debateId) => {
    updateDebate(debateId, { challengeStatus: 'rejected' });
  };

  const submitClosing = async (debateId, role, text) => {
    const debate = debates.find((d) => d.id === debateId);
    if (!debate) return;
    const authorId = role === 'challenger' ? debate.affirmativeUserId : debate.negativeUserId;
    if (debate.currentTurnProfileId && debate.currentTurnProfileId !== authorId) return;
    if (supabase) {
      await supabase.from('debate_turns').insert({
        debate_id: debateId,
        author_id: authorId,
        kind: 'closing',
        content: text,
      });
      const recipientId = authorId === debate.affirmativeUserId ? debate.negativeUserId : debate.affirmativeUserId;
      await createNotification({
        recipientId,
        type: 'new_turn',
        debateId,
        positionId: debate.positionId,
        data: { author_profile_id: authorId, kind: 'closing' },
      });
    }
    let shouldComplete = false;
    let nextTurnProfileId = null;
    updateDebate(debateId, (prevDebate) => {
      const updates =
        role === 'challenger'
          ? { closingChallenger: text }
          : { closingOpponent: text };
      const bothHave =
        (role === 'challenger' ? text : prevDebate.closingChallenger) &&
        (role === 'challengee' ? text : prevDebate.closingOpponent);
      nextTurnProfileId = role === 'challenger' ? prevDebate.negativeUserId : null;
      shouldComplete = bothHave;
      return {
        ...updates,
        status: bothHave ? DEBATE_STATUS.RESOLVED : prevDebate.status,
        resolvedAt: bothHave ? new Date().toISOString() : prevDebate.resolvedAt,
        currentTurnProfileId: nextTurnProfileId,
        winnerUserId: bothHave ? null : prevDebate.winnerUserId,
      };
    });
    if (supabase) {
      if (shouldComplete) {
        await supabase
          .from('debates')
          .update({
            status: 'completed',
            resolved_at: new Date().toISOString(),
            current_turn_profile_id: null,
          })
          .eq('id', debateId);
        await notifyDebateCompleted({
          debateId,
          positionId: debate.positionId,
          initiatorId: debate.affirmativeUserId,
          respondentId: debate.negativeUserId,
          winnerUserId: null,
        });
      } else {
        await supabase
          .from('debates')
          .update({ current_turn_profile_id: nextTurnProfileId })
          .eq('id', debateId);
      }
    }
  };

  const forfeitDebate = async (debateId, forfeiterId) => {
    const debate = debates.find((d) => d.id === debateId);
    if (!debate) return;
    const winnerUserId = forfeiterId === debate.affirmativeUserId ? debate.negativeUserId : debate.affirmativeUserId;
    if (supabase) {
      await supabase
        .from('debates')
        .update({
          status: 'completed',
          resolved_at: new Date().toISOString(),
          winner_user_id: winnerUserId,
          forfeited_by_profile_id: forfeiterId,
          forfeit_reason: 'forfeit',
          current_turn_profile_id: null,
        })
        .eq('id', debateId);
      await notifyDebateCompleted({
        debateId,
        positionId: debate.positionId,
        initiatorId: debate.affirmativeUserId,
        respondentId: debate.negativeUserId,
        winnerUserId,
      });
    }
    updateDebate(debateId, {
      status: DEBATE_STATUS.RESOLVED,
      resolvedAt: new Date().toISOString(),
      winnerUserId,
      forfeitedByProfileId: forfeiterId,
      forfeitReason: 'forfeit',
      currentTurnProfileId: null,
    });
  };

  const voteDebate = async (debateId, choice) => {
    if (!currentUser) return;
    const side =
      choice === 'challenger' ? 'initiator' : choice === 'challengee' ? 'respondent' : 'draw';
    if (supabase) {
      const { error } = await supabase
        .from('debate_votes')
        .upsert({
          debate_id: debateId,
          voter_profile_id: currentUser.id,
          side,
        });
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error voting on debate', error);
        return;
      }
      const aggregates = await fetchDebateVotes();
      setDebates((prev) =>
        prev.map((debate) =>
          debate.id === debateId
            ? { ...debate, votes: aggregates[debateId] || debate.votes }
            : debate
        )
      );
      return;
    }
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
      const desiredUsername = updates.username;
      if (desiredUsername) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', desiredUsername)
          .neq('id', id)
          .maybeSingle();
        if (existing) {
          throw new Error('That handle is already taken. Please choose another one.');
        }
      }
      const { error, data: saved } = await supabase
        .from('profiles')
        .upsert({
          id,
          username: updates.username,
          display_name: updates.display_name,
          user_email: updates.user_email,
        });
      if (error) {
        throw new Error(error.message || 'Unable to save profile.');
      }
      if (saved && saved.length > 0) {
        const merged = { ...updates, ...saved[0], id };
        mergeProfile(merged);
        setCurrentUser((prev) => (prev?.id === id ? { ...prev, ...merged } : prev));
      }
    }
    return { id, ...updates };
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.08),transparent_35%),radial-gradient(circle_at_80%_0,rgba(168,85,247,0.08),transparent_30%)] pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 pb-12">
        {currentUser && (
          <Header
            currentUser={currentUser}
            onLogout={handleLogout}
            notifications={decoratedNotifications}
            unreadCount={unreadNotifications}
            notificationsOpen={notificationsOpen}
            onToggleNotifications={handleToggleNotifications}
            onNotificationClick={handleNotificationClick}
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
            path="/signup"
            element={
              currentUser ? (
                <Navigate to="/" replace />
              ) : (
                <SignupScreen onSignup={handleSignup} error={authError} notice={authNotice} />
              )
            }
          />
          <Route
            path="/"
            element={
              currentUser ? (
                <HomeScreen
                  currentUser={currentUser}
                  thoughts={thoughts}
                  thoughtError={thoughtError}
                  positionError={positionError}
                  debateError={debateError}
                  positions={positions}
                  debates={debates}
                  users={userDirectory}
                  getDisplayName={getDisplayName}
                  getCategoryLabel={getCategoryLabel}
                  onAddThought={(payload) => addThought(payload)}
                  onAddPosition={(payload) => addPosition(payload)}
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
                  onAddComment={(payload) => addThought(payload)}
                  currentUser={currentUser}
                  getDisplayName={getDisplayName}
                  thoughtsTodayCount={thoughtsTodayCount}
                  thoughtsLimit={THOUGHTS_PER_DAY}
                  categories={CATEGORY_OPTIONS}
                  onConvertThought={convertThoughtToPosition}
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
                  onForfeit={forfeitDebate}
                  onPollTurns={fetchDebateTurns}
                  onPollVotes={fetchDebateVotes}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile"
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
            path="/profiles/:userId"
            element={
              currentUser ? (
                <PublicProfileScreen
                  currentUser={currentUser}
                  users={userDirectory}
                  thoughts={thoughts}
                  positions={positions}
                  debates={debates}
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
                  currentUser={currentUser}
                  thoughts={thoughts}
                  positions={positions}
                  debates={debates}
                  getDisplayName={getDisplayName}
                  thoughtError={thoughtError}
                  positionError={positionError}
                  debateError={debateError}
                  getCategoryLabel={getCategoryLabel}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/people"
            element={
              currentUser ? (
                <PeopleScreen
                  users={users}
                  thoughts={thoughts}
                  positions={positions}
                  debates={debates}
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
