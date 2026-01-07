
import React, { useMemo } from 'react';

/**
 * Renders a contribution graph similar to GitHub
 * activity = [{ date: '2023-01-01', count: 5 }]
 */
export default function ActivityHeatmap({ activity = [] }) {
  // Generate last 90 days or so
  const days = useMemo(() => {
    const d = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayActivity = activity.find(a => a.date === dateStr);
      d.push({
        date: dateStr,
        count: dayActivity ? dayActivity.count : 0,
        dayOfWeek: date.getDay()
      });
    }
    return d;
  }, [activity]);

  const getColor = (count) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.05)';
    if (count <= 2) return 'rgba(99, 102, 241, 0.4)'; // Dim nebula
    if (count <= 4) return 'rgba(99, 102, 241, 0.7)'; // Bright nebula
    if (count <= 6) return 'rgba(255, 255, 255, 0.8)'; // Star
    return '#ffffff'; // Supernova
  };

  const getGlow = (count) => {
    if (count > 4) return `0 0 ${count * 2}px rgba(255, 255, 255, 0.6)`;
    return 'none';
  };

  return (
    <div className="activity-heatmap glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--asteroid)', background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(12px)', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--supernova)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
        Activity Star Map
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: '4px' }}>
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${day.count} activities`}
            style={{
              width: '100%',
              paddingBottom: '100%',
              backgroundColor: getColor(day.count),
              borderRadius: '3px',
              boxShadow: getGlow(day.count),
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--moonlight)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Less</span>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px' }} />
          <div style={{ width: '10px', height: '10px', backgroundColor: 'rgba(99, 102, 241, 0.4)', borderRadius: '2px' }} />
          <div style={{ width: '10px', height: '10px', backgroundColor: 'rgba(99, 102, 241, 0.7)', borderRadius: '2px' }} />
          <div style={{ width: '10px', height: '10px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '2px' }} />
          <div style={{ width: '10px', height: '10px', backgroundColor: '#ffffff', borderRadius: '2px' }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
