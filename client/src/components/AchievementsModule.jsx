
import React from 'react';

export default function AchievementsModule({ badges = [] }) {
  // Take last 5 badges or all if fewer
  const displayBadges = [...badges].reverse().slice(0, 5);

  return (
    <div className="achievements-module glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--asteroid)', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--starlight)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Constellation
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--moonlight)' }}>{badges.length} found</span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {displayBadges.length > 0 ? displayBadges.map((badge, idx) => (
          <div key={idx} className="badge-item" style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{
              fontSize: '2rem',
              filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.3))',
              animation: `float ${3 + idx}s ease-in-out infinite`
            }}>
              {badge.icon || '⭐'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--moonlight)', marginTop: '0.5rem', maxWidth: '60px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {badge.name}
            </div>
          </div>
        )) : (
          <div style={{ color: 'var(--moonlight)', fontStyle: 'italic', padding: '1rem' }}>
            No stars discovered yet.
          </div>
        )}
      </div>
      <style>
        {`
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
          `}
      </style>
    </div>
  );
}
