import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchReflections, submitReflection } from '../api/reflections.js';

const MOOD_VALUES = {
  0: 'depleted',
  1: 'stretched',
  2: 'balanced',
  3: 'energized',
};

const MOOD_LABELS = ['Depleted', 'Stretched', 'Balanced', 'Energized'];

export default function ReflectionPage() {
  const [text, setText] = useState('');
  const [moodIndex, setMoodIndex] = useState(2); // Default to balanced
  const [pastReflections, setPastReflections] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    loadReflections();
  }, []);

  const loadReflections = async () => {
    try {
      const data = await fetchReflections();
      setPastReflections(data);
    } catch {
      // Silent fail
    }
  };

  // Auto-save with debounce
  const autoSave = useCallback(async () => {
    if (!text.trim()) return;

    setSaveStatus('Saving...');

    try {
      await submitReflection({
        text,
        mood: MOOD_VALUES[moodIndex],
      });
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2000);
      await loadReflections();
    } catch {
      setSaveStatus('Failed to save');
    }
  }, [text, moodIndex]);

  // Debounce auto-save
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (text.trim()) {
      saveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [text, moodIndex, autoSave]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="log-entry-page">
      <h1 style={{ fontSize: 'var(--text-3xl)', color: 'var(--supernova)', marginBottom: 'var(--space-8)' }}>
        Log Entry
      </h1>

      {/* Typewriter Input */}
      <textarea
        className="typewriter-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Record your thoughts..."
        rows={8}
      />

      {/* Auto-save Indicator */}
      <div className="auto-save-indicator">
        {saveStatus}
      </div>

      {/* Mood Slider */}
      <div className="mood-slider-container">
        <label className="mood-slider-label">
          Current Mood: {MOOD_LABELS[moodIndex]}
        </label>
        <input
          type="range"
          className="mood-slider"
          min="0"
          max="3"
          step="1"
          value={moodIndex}
          onChange={(e) => setMoodIndex(parseInt(e.target.value))}
        />
        <div className="mood-labels">
          {MOOD_LABELS.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      </div>

      {/* Past Entries Timeline */}
      {pastReflections.length > 0 && (
        <div className="faded-timeline">
          <h2 className="faded-timeline-title">Past Entries</h2>
          {pastReflections.map((reflection) => (
            <div key={reflection._id} className="timeline-entry">
              <p className="timeline-entry-date">{formatDate(reflection.createdAt)}</p>
              <p className="timeline-entry-text">{reflection.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}