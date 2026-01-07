import { useEffect, useState, useRef, useMemo } from 'react';
import { fetchTasks, updateTask, createTask } from '../api/tasks.js';
import { fetchTracks } from '../api/tracks.js';
import { fetchGamificationStats, fetchActivityHistory } from '../api/gamification.js';
import { useAuth } from '../context/AuthContext.jsx';
import CosmicLoader from '../components/CosmicLoader.jsx';
import RankCard from '../components/RankCard.jsx';
import ActivityHeatmap from '../components/ActivityHeatmap.jsx';
import AchievementsModule from '../components/AchievementsModule.jsx';

export default function DashboardPage() {
  useAuth();
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Gamification State
  const [gamification, setGamification] = useState(null);
  const [activity, setActivity] = useState([]);

  // Track State
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);

  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, gamData, actData, tracksData] = await Promise.all([
        fetchTasks().catch(() => []),
        fetchGamificationStats().catch(() => null),
        fetchActivityHistory().catch(() => []),
        fetchTracks().catch(() => [])
      ]);

      // Process Tasks
      const incompleteTasks = tasksData.filter(t => !t.completed);
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sorted = incompleteTasks.sort((a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
      setTasks(sorted);

      // Process Gamification
      setGamification(gamData);
      setActivity(actData);

      // Store all tracks that are not completed
      const availableTracks = tracksData.filter(t => t.status !== 'completed');
      setTracks(availableTracks);
      if (availableTracks.length > 0) {
        setSelectedTrackId(prev => prev || availableTracks[0]._id);
      }

    } catch {
      // Silent fail
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleSmartInputSubmit = async (e) => {
    if (e.key === 'Enter' && smartInput.trim()) {
      // Require a track to be selected
      if (!activeTrack) {
        return;
      }

      setIsCreating(true);
      try {
        let priority = 'medium';
        if (smartInput.toLowerCase().includes('urgent') || smartInput.includes('!')) priority = 'high';

        // Use activeTrack (derived from selected or default)
        const selectedTrack = activeTrack;

        // Link task to selected track
        const taskData = {
          title: smartInput,
          priority: priority,
          trackId: selectedTrack._id,
          trackLevel: selectedTrack.currentLevel,
        };

        const newTask = await createTask(taskData);

        setTasks(prev => {
          const newTasks = [...prev, newTask];
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return newTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        });
        setSmartInput('');
      } catch (err) {
        console.error("Task creation failed:", err);
      } finally {
        setIsCreating(false);
      }
    }
  };

  // Derive active track and filtered tasks
  const activeTrack = useMemo(() => {
    return tracks.find(t => t._id === selectedTrackId) || tracks[0] || null;
  }, [tracks, selectedTrackId]);

  const displayedTasks = useMemo(() => {
    if (!selectedTrackId) return tasks;
    return tasks.filter(t => String(t.trackId) === String(selectedTrackId));
  }, [tasks, selectedTrackId]);

  const currentTask = displayedTasks[currentTaskIndex];
  const sessionCompleted = useRef(0);

  // Reset index when track changes
  useEffect(() => {
    setCurrentTaskIndex(0);
  }, [selectedTrackId]);

  const handleCompleteTask = async () => {
    if (!currentTask || isCompleting) return;

    setIsCompleting(true);
    setIsExiting(true); // Trigger fade/slide out

    try {
      const res = await updateTask(currentTask._id, { completed: true });
      sessionCompleted.current += 1;

      // Update local gamification state if returned
      if (res.gamification) {
        setGamification(prev => ({
          ...prev,
          xp: res.gamification.totalXP,
          level: res.gamification.newLevel || prev.level,
          currentLevelXP: res.gamification.currentLevelXP,
          xpForNextLevel: res.gamification.xpForNextLevel,
          badges: res.gamification.newBadges.length > 0
            ? [...prev.badges, ...res.gamification.newBadges]
            : prev.badges
        }));
      }

      setTimeout(async () => {
        setIsExiting(false);
        setTasks(prev => prev.filter(t => t._id !== currentTask._id));
        setCurrentTaskIndex(0);
        setIsCompleting(false);
        // Reload data to update progress bar (and tracks)
        await loadData();
      }, 300); // Wait for animation
    } catch {
      setIsCompleting(false);
      setIsExiting(false);
    }
  };

  const getPriorityDisplay = (p) => {
    if (p === 'high') return 'CRITICAL';
    if (p === 'medium') return 'NORMAL';
    return 'LOW';
  };

  // Calculate level progress
  const levelProgress = activeTrack ? {
    tasksCompleted: tasks.filter(t => String(t.trackId) === String(activeTrack._id) && t.trackLevel === activeTrack.currentLevel && t.completed).length,
    tasksTotal: tasks.filter(t => String(t.trackId) === String(activeTrack._id) && t.trackLevel === activeTrack.currentLevel).length,
    levelNumber: activeTrack.currentLevel,
    trackName: activeTrack.name
  } : null;

  return (
    <section
      className="mission-control"
      style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 2fr)', gap: '2rem', maxWidth: '1200px', margin: '0 auto', alignItems: 'start' }}
    >
      {isLoadingTasks ? (
        <CosmicLoader message="Scanning mission parameters..." />
      ) : (
        <>
          {/* LEFT COLUMN: Gamification Stats */}
          <div className="dashboard-stats-col" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <RankCard gamification={gamification} />
            <ActivityHeatmap activity={activity} />
            {gamification && <AchievementsModule badges={gamification.badges} />}
          </div>

          {/* RIGHT COLUMN: Current Task (Mission) */}
          <div className="dashboard-mission-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>

            {/* Visual Track Switcher */}
            {tracks.length > 0 && (
              <div className="track-tabs">
                {tracks.map(track => (
                  <div
                    key={track._id}
                    className={`track-chip ${selectedTrackId === track._id ? 'active' : ''}`}
                    onClick={() => setSelectedTrackId(track._id)}
                  >
                    <span className="track-chip-name">{track.name}</span>
                    <span className="track-chip-level">Lvl {track.currentLevel}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Level Progress Card */}
            {levelProgress && (
              <div style={{ width: '100%', maxWidth: '500px', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid var(--asteroid)', borderRadius: '12px' }}>
                <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', color: 'var(--starlight)', textAlign: 'center' }}>
                  {levelProgress.trackName} - Level {levelProgress.levelNumber}
                </p>
                <div style={{ width: '100%', height: '8px', background: 'var(--void)', borderRadius: '4px', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
                  <div
                    style={{
                      width: `${levelProgress.tasksTotal > 0 ? (levelProgress.tasksCompleted / Math.max(3, levelProgress.tasksTotal)) * 100 : 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1 0%, var(--supernova) 100%)',
                      transition: 'width 0.5s ease-out'
                    }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--moonlight)', textAlign: 'center' }}>
                  {levelProgress.tasksCompleted}/3 tasks completed toward level completion
                </p>
              </div>
            )}

            {/* Main Task Card */}
            {currentTask ? (
              <div
                className={`current-task-card ${isExiting ? 'exiting' : ''}`}
              >
                <p className="current-task-priority">{getPriorityDisplay(currentTask.priority)}</p>
                <h1 className="current-task-title">{currentTask.title}</h1>

                <button
                  className="btn-ghost-primary complete-task-btn"
                  onClick={handleCompleteTask}
                  disabled={isCompleting}
                >
                  {isCompleting ? 'Completing...' : 'Mark Complete'}
                </button>
              </div>
            ) : (
              <div className="all-clear-message">
                <h1 className="all-clear-title">Orbit Stabilized</h1>
                <p className="all-clear-subtitle">
                  All systems nominal.<br />
                  <span style={{ fontSize: '0.9rem', opacity: 0.7, display: 'block', marginTop: '1rem' }}>
                    No tasks? Add one below.
                  </span>
                </p>
              </div>
            )}

            <p className="progress-indicator">
              {sessionCompleted.current} stars ignited this session
            </p>

            {/* Smart Input */}
            <div className="smart-task-input-container">
              {tracks.length > 0 ? (
                <input
                  type="text"
                  className={`smart-task-input ${isCreating ? 'success' : ''}`}
                  placeholder={`Add task for ${activeTrack?.name || 'track'}...`}
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  onKeyDown={handleSmartInputSubmit}
                  disabled={isCreating}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px dashed var(--asteroid)' }}>
                  <p style={{ color: 'var(--starlight)', marginBottom: 'var(--space-2)' }}>
                    No active track found
                  </p>
                  <a href="/tracks" style={{ color: 'var(--supernova)', textDecoration: 'underline' }}>
                    Create a Track first to add tasks
                  </a>
                </div>
              )}
            </div>
          </div>


        </>
      )}
    </section>
  );
}