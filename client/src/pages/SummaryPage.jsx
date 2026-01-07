import { useEffect, useState } from 'react';
import { fetchTasks } from '../api/tasks.js';
import { fetchReflections } from '../api/reflections.js';
import { fetchChallenges } from '../api/challenges.js';
import CosmicLoader from '../components/CosmicLoader.jsx';

export default function SummaryPage() {
  const [stats, setStats] = useState({ tasks: 0, reflections: 0, challenges: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      // 1. Fetch user data first
      const [tasksData, reflectionsData, challengesData] = await Promise.all([
        fetchTasks().catch(() => []),
        fetchReflections().catch(() => []),
        fetchChallenges().catch(() => []),
      ]);

      // 2. Calculate stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const completedTasks = tasksData.filter(t =>
        t.completed && new Date(t.updatedAt) > weekAgo
      ).length;

      const weekReflections = reflectionsData.filter(r =>
        new Date(r.createdAt) > weekAgo
      ).length;

      const completedChallenges = challengesData.filter(c =>
        c.status === 'completed' && new Date(c.updatedAt) > weekAgo
      ).length;

      const currentStats = {
        tasks: completedTasks,
        reflections: weekReflections,
        challenges: completedChallenges,
      };
      setStats(currentStats);

    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  // Generate week timeline
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  const currentDayIndex = today === 0 ? 6 : today - 1; // Convert Sunday=0 to Sunday=6

  if (loading) {
    return <CosmicLoader message="Loading flight log..." />;
  }

  return (
    <section className="flight-log-page">
      <h1 style={{ fontSize: 'var(--text-4xl)', color: 'var(--supernova)', marginBottom: 'var(--space-8)' }}>
        Flight Log
      </h1>

      {/* Horizontal Week Timeline */}
      <div className="horizontal-week-timeline">
        {weekDays.map((day, index) => (
          <div key={day} className={`week-day ${index === currentDayIndex ? 'active' : ''}`}>
            <p className="week-day-name">{day}</p>
            <div className="week-day-dot" />
            <p className="week-day-count">{index <= currentDayIndex ? '•' : ''}</p>
          </div>
        ))}
      </div>

      {/* Simple Stats */}
      <div className="simple-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.tasks}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.reflections}</div>
          <div className="stat-label">Reflections</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.challenges}</div>
          <div className="stat-label">Challenges</div>
        </div>
      </div>

      {/* Weekly Summary */}
      {(stats.tasks > 0 || stats.reflections > 0 || stats.challenges > 0) && (
        <div className="transmission-card">
          <div className="transmission-header">
            &gt;&gt; Weekly Summary
          </div>
          <div className="transmission-content">
            Great progress this week! You completed {stats.tasks} task{stats.tasks !== 1 ? 's' : ''}, 
            logged {stats.reflections} reflection{stats.reflections !== 1 ? 's' : ''}, 
            and finished {stats.challenges} challenge{stats.challenges !== 1 ? 's' : ''}. 
            Keep up the momentum!
          </div>
        </div>
      )}
    </section>
  );
}