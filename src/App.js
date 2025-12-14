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
import ThoughtScreen from './pages/ThoughtScreen';
import ExploreScreen from './pages/ExploreScreen';
import PeopleScreen from './pages/PeopleScreen';
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
  const [positionError, setPositionError] = useState(null);
  const [debateError, setDebateError] = useState(null);

  const [thoughts, setThoughts] = useState([]);

  const [positions, setPositions] = useState([]);
  const [debates, setDebates] = useState([]);

  const [turns, setTurns] = useState([]);
  const [debateVotes, setDebateVotes] = useState({});

  const navigate = useNavigate();
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

  const fetchPositions = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('positions')
      .select('id, author_id, premise, definitions, sources, category, created_at, from_thought_id')
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
       // Optimistically set so routing/UI can proceed even if network is slow.
      setCurrentUser((prev) => prev || baseProfile);
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
    if (supabase) {
      const { data, error } = await supabase
        .from('positions')
        .insert({
          author_id: authorId,
          premise: thesis,
          definitions,
          sources,
          category,
        })
        .select('id, author_id, premise, definitions, sources, category, created_at, from_thought_id')
        .single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error inserting position', error);
        return null;
      }
      const newPosition = {
        id: data.id,
        authorId: data.author_id,
        thesis: data.premise || '',
        definitions: data.definitions || [],
        sources: data.sources || [],
        category: data.category || category,
        createdAt: data.created_at,
        fromThoughtId: data.from_thought_id || null,
      };
      setPositions((prev) => [newPosition, ...prev]);
      return newPosition.id;
    }
    const newPosition = createPosition({
      authorId,
      thesis,
      definitions,
      sources,
      category,
    });
    setPositions((prev) => [newPosition, ...prev]);
    return newPosition.id;
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
    }
    updateDebate(debateId, (prevDebate) => {
      const updates =
        role === 'challenger'
          ? { closingChallenger: text }
          : { closingOpponent: text };
      const bothHave =
        (role === 'challenger' ? text : prevDebate.closingChallenger) &&
        (role === 'challengee' ? text : prevDebate.closingOpponent);
      const nextTurnProfileId = role === 'challenger' ? prevDebate.negativeUserId : null;
      if (bothHave && supabase) {
        supabase
          .from('debates')
          .update({
            status: 'completed',
            resolved_at: new Date().toISOString(),
            current_turn_profile_id: null,
          })
          .eq('id', debateId);
      } else if (supabase) {
        supabase
          .from('debates')
          .update({ current_turn_profile_id: nextTurnProfileId })
          .eq('id', debateId);
      }
      return {
        ...updates,
        status: bothHave ? DEBATE_STATUS.RESOLVED : prevDebate.status,
        resolvedAt: bothHave ? new Date().toISOString() : prevDebate.resolvedAt,
        currentTurnProfileId: nextTurnProfileId,
        winnerUserId: bothHave ? null : prevDebate.winnerUserId,
      };
    });
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
                  positionError={positionError}
                  debateError={debateError}
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
                  onForfeit={forfeitDebate}
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
