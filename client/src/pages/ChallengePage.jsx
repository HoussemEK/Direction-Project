import { useEffect, useState, useRef } from 'react';
import {
  fetchActiveChallenge,

  startTimedChallenge as acceptChallenge,
  skipChallenge,
  completeChallenge,
  createChallenge,
} from '../api/challenges.js';
import { useAuth } from '../context/AuthContext.jsx';
import CosmicLoader from '../components/CosmicLoader.jsx';

/**
 * Missions (Challenges Redesign)
 * 
 * Features:
 * - Full-screen mission briefing
 * - Circular timer progress
 * - Removed category badges
 * - Space travel animation on completion
 */

// Category styling based on Challenge model CATEGORIES
const getCategoryStyle = (category) => {
  const styles = {
    productivity: { icon: '📊', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
    wellness: { icon: '🧘', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
    learning: { icon: '📚', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)' },
    social: { icon: '👥', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
    creativity: { icon: '🎨', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)' },
    fitness: { icon: '💪', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
  };
  return styles[category] || styles.productivity;
};

export default function ChallengePage() {
  useAuth();
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [showSpaceTravel, setShowSpaceTravel] = useState(false);
  const timerRef = useRef(null);

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const data = await fetchActiveChallenge();
      setActiveChallenge(data);
      if (data?.startedAt && data?.isTimed) {
        calculateRemainingTime(data);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setActiveChallenge(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('Timer useEffect triggered:', {
      hasChallenge: !!activeChallenge,
      startedAt: activeChallenge?.startedAt,
      durationMinutes: activeChallenge?.durationMinutes,
      remainingTime
    });

    if (activeChallenge?.startedAt && activeChallenge?.durationMinutes) {
      // Only calculate remaining time if not already set
      if (remainingTime === null) {
        console.log('Calculating remaining time from startedAt');
        calculateRemainingTime(activeChallenge);
      }
      console.log('Starting timer interval');
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        console.log('Clearing timer interval');
        clearInterval(timerRef.current);
      }
    };
  }, [activeChallenge, remainingTime]);

  const calculateRemainingTime = (challenge) => {
    const started = new Date(challenge.startedAt);
    const duration = challenge.durationMinutes * 60 * 1000;
    const elapsed = Date.now() - started.getTime();
    const remaining = Math.max(0, duration - elapsed);
    setRemainingTime(Math.floor(remaining / 1000));
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    console.log('Timer interval started');

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev === null || prev <= 0) {
          console.log('Timer reached zero, clearing interval');
          clearInterval(timerRef.current);
          return 0;
        }
        const newTime = prev - 1;
        if (newTime % 10 === 0) {
          console.log('Timer countdown:', newTime, 'seconds remaining');
        }
        return newTime;
      });
    }, 1000);
  };

  const handleAccept = async () => {
    if (!activeChallenge || actionLoading) return;
    setActionLoading(true);
    try {
      console.log('Accepting challenge:', activeChallenge._id);
      const updated = await acceptChallenge(activeChallenge._id);
      console.log('Challenge accepted, response:', updated);

      setActiveChallenge(updated);

      if (updated.isTimed && updated.durationMinutes) {
        console.log('Initializing timer for timed challenge');
        // Set remaining time immediately to full duration
        const totalSeconds = updated.durationMinutes * 60;
        setRemainingTime(totalSeconds);
        console.log('Timer initialized with', totalSeconds, 'seconds');
        // Timer will start via useEffect when remainingTime updates
      }
    } catch (err) {
      console.error('Error accepting challenge:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!activeChallenge || actionLoading) return;
    setActionLoading(true);
    try {
      await skipChallenge(activeChallenge._id);
      await loadChallenge();
    } catch {
      // Silent fail
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!activeChallenge || actionLoading) return;
    setActionLoading(true);

    // Show space travel animation
    setShowSpaceTravel(true);

    try {
      await completeChallenge(activeChallenge._id);

      // Wait for animation to complete
      setTimeout(async () => {
        setShowSpaceTravel(false);
        await loadChallenge();
      }, 2000);
    } catch {
      setShowSpaceTravel(false);
      setActionLoading(false);
    }
  };

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeDescription, setNewChallengeDescription] = useState('');
  const [newChallengeDifficulty, setNewChallengeDifficulty] = useState('medium');
  const [newChallengeCategory, setNewChallengeCategory] = useState('productivity');
  const [newChallengeIsTimed, setNewChallengeIsTimed] = useState(false);
  const [newChallengeDuration, setNewChallengeDuration] = useState(15);

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!newChallengeTitle.trim()) return;

    setLoading(true);
    try {
      const newChallenge = await createChallenge({
        title: newChallengeTitle,
        description: newChallengeDescription || 'Complete this challenge',
        difficulty: newChallengeDifficulty,
        status: 'active',
        isTimed: newChallengeIsTimed,
        durationMinutes: newChallengeIsTimed ? newChallengeDuration : null,
        category: newChallengeCategory
      });
      setActiveChallenge(newChallenge);
      setShowCreateForm(false);
      setNewChallengeTitle('');
      setNewChallengeDescription('');
      setNewChallengeDifficulty('medium');
      setNewChallengeCategory('productivity');
      setNewChallengeIsTimed(false);
      setNewChallengeDuration(15);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCircularProgress = () => {
    if (!activeChallenge?.durationMinutes || remainingTime === null) return 0;
    const total = activeChallenge.durationMinutes * 60;
    return ((total - remainingTime) / total) * 100;
  };

  // Timer calculations handled inline in SVG

  if (loading) {
    return <CosmicLoader message="Loading mission..." />;
  }

  if (!activeChallenge) {
    return (
      <section className="missions-page">
        <div className="mission-briefing">
          <h1 className="mission-title">No Active Mission</h1>
          <p className="mission-description">
            All missions complete. Ready for a new challenge?
          </p>

          {!showCreateForm ? (
            <button className="btn-ghost-primary" onClick={() => setShowCreateForm(true)} style={{ marginTop: '2rem' }}>
              Create New Challenge
            </button>
          ) : (
            <form onSubmit={handleCreateChallenge} style={{ marginTop: '2rem', maxWidth: '500px', width: '100%' }}>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Challenge title..."
                  value={newChallengeTitle}
                  onChange={(e) => setNewChallengeTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <textarea
                  placeholder="Description (optional)..."
                  value={newChallengeDescription}
                  onChange={(e) => setNewChallengeDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', minHeight: '80px' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <select
                  value={newChallengeDifficulty}
                  onChange={(e) => setNewChallengeDifficulty(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              {/* Category Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--starlight)', fontSize: 'var(--text-sm)' }}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['productivity', 'wellness', 'learning', 'social', 'creativity', 'fitness'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewChallengeCategory(cat)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.75rem',
                        background: newChallengeCategory === cat ? getCategoryStyle(cat).bg : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${newChallengeCategory === cat ? getCategoryStyle(cat).border : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '20px',
                        color: newChallengeCategory === cat ? getCategoryStyle(cat).color : 'var(--starlight)',
                        cursor: 'pointer',
                        fontSize: 'var(--text-xs)',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{getCategoryStyle(cat).icon}</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newChallengeIsTimed}
                    onChange={(e) => setNewChallengeIsTimed(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Timed Challenge
                </label>
                {newChallengeIsTimed && (
                  <select
                    value={newChallengeDuration}
                    onChange={(e) => setNewChallengeDuration(Number(e.target.value))}
                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  >
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                    <option value={25}>25 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-ghost-primary">
                  Create Challenge
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    );
  }

  const isActive = activeChallenge.status === 'active';
  const isAccepted = activeChallenge.status === 'accepted';
  const isPending = activeChallenge.status === 'pending';
  const canComplete = isActive || isAccepted;

  // For timed challenges, start timer immediately when active
  const showTimer = activeChallenge.isTimed && (isActive || isAccepted);

  return (
    <>
      {showSpaceTravel && <div className="space-travel-overlay" />}

      <section className="missions-page">
        <div className="mission-briefing">

          {/* Circular Timer wrapping the title */}
          {showTimer ? (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
              <svg width="280" height="280" style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)' }}>
                {/* Background circle */}
                <circle
                  cx="140"
                  cy="140"
                  r="130"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="140"
                  cy="140"
                  r="130"
                  fill="none"
                  stroke={remainingTime !== null && remainingTime < 60 ? '#f87171' : 'var(--supernova)'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 130}
                  strokeDashoffset={2 * Math.PI * 130 - (getCircularProgress() / 100) * 2 * Math.PI * 130}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '140px 140px', transition: 'stroke-dashoffset 1s linear' }}
                />
                {/* Glowing dot at progress point */}
                <circle
                  cx="140"
                  cy="10"
                  r="6"
                  fill={remainingTime !== null && remainingTime < 60 ? '#f87171' : 'var(--supernova)'}
                  style={{
                    transform: `rotate(${(getCircularProgress() / 100) * 360}deg)`,
                    transformOrigin: '140px 140px',
                    filter: 'drop-shadow(0 0 8px currentColor)',
                    transition: 'transform 1s linear'
                  }}
                />
              </svg>

              {/* Title inside the circle */}
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '60px 40px' }}>
                <h1 className="mission-title" style={{ marginBottom: 'var(--space-4)' }}>{activeChallenge.title}</h1>
                <div style={{
                  fontSize: 'var(--text-4xl)',
                  fontWeight: 'bold',
                  color: remainingTime !== null && remainingTime < 60 ? '#f87171' : 'var(--supernova)',
                  fontFamily: 'monospace',
                  textShadow: remainingTime !== null && remainingTime < 60 ? '0 0 20px #f87171' : '0 0 20px var(--supernova)'
                }}>
                  {formatTime(remainingTime)}
                </div>
              </div>
            </div>
          ) : (
            <h1 className="mission-title">{activeChallenge.title}</h1>
          )}

          <p className="mission-description">{activeChallenge.description}</p>

          {/* Category Badge */}
          {activeChallenge.category && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: getCategoryStyle(activeChallenge.category).bg,
              border: `1px solid ${getCategoryStyle(activeChallenge.category).border}`,
              borderRadius: '20px',
              marginTop: 'var(--space-4)',
              marginBottom: 'var(--space-4)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{getCategoryStyle(activeChallenge.category).icon}</span>
              <span style={{
                fontSize: 'var(--text-sm)',
                color: getCategoryStyle(activeChallenge.category).color,
                fontWeight: '500',
                textTransform: 'capitalize'
              }}>
                {activeChallenge.category}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mission-actions">
            {isPending && (
              <>
                <button
                  className="btn-ghost-primary"
                  onClick={handleAccept}
                  disabled={actionLoading}
                >
                  Accept Mission
                </button>
                <button
                  style={{ opacity: 0.5, padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                  onClick={handleSkip}
                  disabled={actionLoading}
                >
                  Skip
                </button>
              </>
            )}

            {canComplete && (
              <button
                className="btn-ghost-primary"
                onClick={handleComplete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Completing...' : 'Mission Complete'}
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
