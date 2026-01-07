import { useEffect, useState } from 'react';
import { fetchTracks, updateTrack, createTrack, completeTrack } from '../api/tracks.js';
import { fetchTasks } from '../api/tasks.js';
import { requestAI } from '../api/ai.js';
import { useAuth } from '../context/AuthContext.jsx';
import CosmicLoader from '../components/CosmicLoader.jsx';

export default function TracksPage() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    setLoading(true);
    try {
      const [tracksData, tasksData] = await Promise.all([
        fetchTracks(),
        fetchTasks().catch(() => [])
      ]);
      setTracks(tracksData);
      setTasks(tasksData);
      if (tracksData.length > 0) {
        setSelectedTrack(tracksData[0]);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const tryParse = (text, serverParsed) => {
    // 1. Use server parsed if valid
    if (serverParsed && serverParsed.level_title) return serverParsed;

    // 2. Try client-side parse
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end + 1));
      }
    } catch {
      // Parse failed
    }
    return {};
  };

  const handleGenerateNext = async () => {
    if (!selectedTrack || isGenerating) return;

    setIsGenerating(true);
    try {
      const currentLevel = selectedTrack.levels?.[selectedTrack.currentLevel - 1];
      const data = await requestAI('/generate/track', {
        user_name: user?.name || 'User',
        track_theme: selectedTrack.name,
        current_level: selectedTrack.currentLevel,
        recent_accomplishments: currentLevel?.focusGoal || 'Making progress',
        reflection_snippet: 'Ready for the next challenge',
      });

      const trackText = data.track || 'Continue building on your progress';
      const parsed = tryParse(trackText, data.parsed);

      const newLevel = {
        levelNumber: selectedTrack.currentLevel + 1,
        title: parsed.level_title || extractTitle(trackText),
        description: parsed.level_description || trackText,
        focusGoal: parsed.focus_goal || extractFocusGoal(trackText),
      };

      // Auto-accept: Update track immediately
      const updatedLevels = [...(selectedTrack.levels || []), newLevel];
      const updated = await updateTrack(selectedTrack._id, {
        levels: updatedLevels,
        currentLevel: newLevel.levelNumber,
      });

      setTracks(tracks.map(t => t._id === updated._id ? updated : t));
      setSelectedTrack(updated);

      // Trigger supernova animation
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2000);
    } catch {
      // Silent fail
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteTrack = async () => {
    if (!selectedTrack || selectedTrack.status === 'completed') return;

    try {
      const completed = await completeTrack(selectedTrack._id);
      setTracks(tracks.map(t => t._id === completed._id ? completed : t));
      setSelectedTrack(completed);

      // Show celebration animation
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2000);
    } catch {
      // Silent fail
    }
  };

  const extractTitle = (text) => {
    // If text looks like JSON, don't use it as title
    if (text.trim().startsWith('{')) return "New Level";

    const firstLine = text.split('\n')[0].replace(/^#+\s*/, '');
    return firstLine.length <= 50 ? firstLine : firstLine.substring(0, 47) + '...';
  };

  const extractFocusGoal = (text) => {
    if (text.trim().startsWith('{')) return "Complete the level objectives";
    const lines = text.split('\n').filter(l => l.trim());
    return lines.length > 1 ? lines[1].substring(0, 100) : 'Continue making progress';
  };

  if (loading) {
    return <CosmicLoader message="Loading journeys..." />;
  }

  const initializeTrack = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      // Prompt for name or use a default one that doesn't conflict easily
      const currentTrackCount = tracks.length;
      const trackName = currentTrackCount === 0 ? 'Productivity Path' : `Focus Journey ${currentTrackCount + 1}`;

      const data = await requestAI('/generate/track', {
        user_name: user?.name || 'User',
        track_theme: 'Productivity', // default seed
        current_level: 0,
        recent_accomplishments: 'Starting fresh',
        reflection_snippet: 'Ready to begin',
      });

      const trackText = data.track || 'Begin your journey';
      const parsed = tryParse(trackText, data.parsed);

      const safeTitle = (parsed.level_title || extractTitle(trackText))
        .replace(/[`*]/g, '').trim().substring(0, 50);
      const safeDescription = (parsed.level_description || trackText)
        .replace(/[`*]/g, '').trim().substring(0, 400);

      const firstLevel = {
        levelNumber: 1,
        title: safeTitle || "New Level",
        description: safeDescription || "Journey starting...",
        focusGoal: (parsed.focus_goal || extractFocusGoal(trackText)).substring(0, 100),
      };

      const newTrack = await createTrack({
        name: trackName,
        levels: [firstLevel],
        currentLevel: 1
      });

      setTracks([...tracks, newTrack]);
      setSelectedTrack(newTrack);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2000);
    } catch {
      // Silent fail
    } finally {
      setIsGenerating(false);
    }
  };

  if (!selectedTrack) {
    return (
      <section className="journeys-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className="text-h2 mb-4">No Active Journey</h1>
        <p className="text-body mb-8" style={{ color: 'var(--starlight)' }}>
          Begin your first productivity track to start evolving.
        </p>
        <button
          className="btn-ghost-primary"
          onClick={initializeTrack}
          disabled={isGenerating}
        >
          {isGenerating ? 'Initiating sequence...' : 'Begin Journey'}
        </button>
      </section>
    );
  }

  const allLevels = selectedTrack.levels || [];
  const currentLevelData = allLevels.find(l => l.levelNumber === selectedTrack.currentLevel);
  const currentLevelTasks = tasks.filter(t => String(t.trackId) === String(selectedTrack._id) && t.trackLevel === selectedTrack.currentLevel);
  const completedTasksInLevel = currentLevelTasks.filter(t => t.completed).length;
  const isGated = completedTasksInLevel < 3 && selectedTrack.status === 'active';

  return (
    <section className="journeys-page">
      {/* Level Up Effect */}
      {showLevelUp && <div className="level-up-effect" />}

      <div className="journeys-layout">
        {/* Sidebar Manager */}
        <aside className="journeys-manager-sidebar">
          <h2 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--moonlight)', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
            Active Journeys
          </h2>
          {tracks.filter(t => t.status !== 'completed').map(track => (
            <div
              key={track._id}
              className={`journey-selector-item ${selectedTrack._id === track._id ? 'active' : ''}`}
              onClick={() => setSelectedTrack(track)}
            >
              <span className="journey-selector-name">{track.name}</span>
              <span className="journey-selector-meta">Lvl {track.currentLevel}</span>
            </div>
          ))}

          <button
            className="btn-initialize-new"
            onClick={initializeTrack}
            disabled={isGenerating}
          >
            {isGenerating ? 'Mapping...' : '+ Launch New Journey'}
          </button>

          {tracks.some(t => t.status === 'completed') && (
            <>
              <h2 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--moonlight)', letterSpacing: '0.1em', marginTop: 'var(--space-8)', marginBottom: 'var(--space-2)' }}>
                Completed
              </h2>
              {tracks.filter(t => t.status === 'completed').map(track => (
                <div
                  key={track._id}
                  className={`journey-selector-item ${selectedTrack._id === track._id ? 'active' : ''}`}
                  onClick={() => setSelectedTrack(track)}
                  style={{ opacity: 0.6 }}
                >
                  <span className="journey-selector-name">{track.name}</span>
                  <span className="journey-selector-meta">Finalized</span>
                </div>
              ))}
            </>
          )}
        </aside>

        {/* Journey Timeline */}
        <div className="journey-timeline" style={{ margin: 0, maxWidth: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h1 style={{ fontSize: 'var(--text-4xl)', color: 'var(--supernova)', marginBottom: 'var(--space-4)' }}>
              {selectedTrack.name}
            </h1>
            {selectedTrack.status === 'completed' && (
              <p style={{ color: 'var(--success)', fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
                ✓ Journey Completed
              </p>
            )}
            {selectedTrack.status === 'active' && (
              <p style={{ color: 'var(--starlight)', fontSize: 'var(--text-sm)' }}>
                Level {selectedTrack.currentLevel} of {selectedTrack.targetLevel || 5}
              </p>
            )}
          </div>

          {allLevels.map((level) => {
            const isCurrent = level.levelNumber === selectedTrack.currentLevel;
            const isPast = level.levelNumber < selectedTrack.currentLevel;
            const className = isCurrent ? 'current' : isPast ? 'past' : 'future';

            // Get tasks for this level
            const levelTasks = tasks.filter(t => String(t.trackId) === String(selectedTrack._id) && t.trackLevel === level.levelNumber);
            const completedTasks = levelTasks.filter(t => t.completed);
            const isLevelComplete = level.completed || completedTasks.length >= 3;

            return (
              <div key={level.levelNumber} className={`timeline-node ${className}`}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <p className="timeline-level">Level {level.levelNumber} {isLevelComplete && '✓'}</p>
                  <h3 className="timeline-title">{level.title}</h3>
                  <p className="timeline-description">{level.description}</p>

                  {/* Tasks for this level */}
                  {levelTasks.length > 0 && (
                    <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--moonlight)', marginBottom: 'var(--space-2)', fontWeight: 'bold' }}>
                        Tasks ({completedTasks.length}/{levelTasks.length})
                      </p>
                      {levelTasks.slice(0, 5).map(task => (
                        <div key={task._id} style={{ fontSize: 'var(--text-xs)', color: task.completed ? 'var(--success)' : 'var(--starlight)', marginBottom: 'var(--space-1)' }}>
                          {task.completed ? '✓' : '○'} {task.title}
                        </div>
                      ))}
                      {levelTasks.length > 5 && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--moonlight)', marginTop: 'var(--space-1)' }}>
                          +{levelTasks.length - 5} more tasks
                        </p>
                      )}
                    </div>
                  )}

                  {/* Level completion indicator */}
                  {isCurrent && !isLevelComplete && (
                    <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2)', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--glow)', margin: 0 }}>
                        Complete {3 - completedTasks.length} more task{3 - completedTasks.length !== 1 ? 's' : ''} to finish this level
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="generate-next-container">
            {selectedTrack.status !== 'completed' && selectedTrack.currentLevel >= (selectedTrack.targetLevel || 5) ? (
              <button
                className="btn-ghost-primary"
                onClick={handleCompleteTrack}
                style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
              >
                Complete Journey
              </button>
            ) : selectedTrack.status !== 'completed' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
                <button
                  className="btn-ghost-primary"
                  onClick={handleGenerateNext}
                  disabled={isGenerating || isGated}
                >
                  {isGenerating ? 'Generating...' : 'Generate Next Level'}
                </button>
                {isGated && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--starlight)', opacity: 0.8 }}>
                    Complete <strong>{3 - completedTasksInLevel} more task{3 - completedTasksInLevel !== 1 ? 's' : ''}</strong> in Level {selectedTrack.currentLevel} to advance.
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--starlight)', textAlign: 'center', padding: 'var(--space-8)' }}>
                Journey completed! Launch a new journey from the sidebar to continue your progress.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}