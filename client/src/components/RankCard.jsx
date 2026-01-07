
import React from 'react';

export default function RankCard({ gamification }) {
  if (!gamification) return null;

  const { level, totalXP } = gamification;

  // Calculate progress percentage
  // currentLevelXP is roughly totalXP - accumulatedXP for previous levels
  // simplified: (xp / (xp + xpForNextLevel)) * 100 for visual approximation or use exact from backend if available
  // The backend returns currentLevelXP, xpForNextLevel. Let's assume gamification object has these or we calculate.

  // Based on Gamification.js model:
  // levelInfo = { level, currentLevelXP, xpForNextLevel, totalXP }

  const progress = gamification.xpForNextLevel
    ? (gamification.currentLevelXP / gamification.xpForNextLevel) * 100
    : 0;

  const getRankTitle = (lvl) => {
    if (lvl < 5) return "Novice Explorer";
    if (lvl < 10) return "Rising Star";
    if (lvl < 20) return "Cosmic Voyager";
    if (lvl < 50) return "Galaxy Master";
    return "Universal Entity";
  };

  const xpNeeded = Math.floor(gamification.xpForNextLevel || 100) - Math.floor(gamification.currentLevelXP || 0);

  return (
    <div className="rank-card glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--asteroid)', background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(12px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--supernova)', fontWeight: 'bold' }}>{getRankTitle(level)}</h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: 'var(--starlight)', fontWeight: '600' }}>Level {level}</p>
        </div>
        <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.3))' }}>
          {level >= 50 ? '🌌' : level >= 20 ? '🪐' : level >= 10 ? '⭐' : level >= 5 ? '🚀' : '🌱'}
        </div>
      </div>

      {/* XP Needed Display */}
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--glow)', fontWeight: '500' }}>
          <span style={{ fontSize: '1.1rem', color: 'var(--supernova)', fontWeight: 'bold' }}>{xpNeeded} XP</span> to next level
        </p>
      </div>

      {/* Progress Bar */}
      <div className="xp-bar-container" style={{ width: '100%', height: '10px', background: 'var(--void)', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem', border: '1px solid var(--asteroid)' }}>
        <div
          className="xp-bar-fill"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1 0%, var(--supernova) 100%)',
            transition: 'width 1s ease-out',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
          }}
        />
      </div>

      {/* XP Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--moonlight)' }}>
        <span>{Math.floor(gamification.currentLevelXP || 0)} XP</span>
        <span style={{ fontWeight: '600' }}>{Math.floor(progress)}%</span>
        <span>{Math.floor(gamification.xpForNextLevel || 100)} XP</span>
      </div>

      {/* Total XP */}
      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--asteroid)', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--starlight)' }}>
          Total XP: <span style={{ color: 'var(--supernova)', fontWeight: 'bold' }}>{Math.floor(totalXP || 0)}</span>
        </p>
      </div>
    </div>
  );
}
