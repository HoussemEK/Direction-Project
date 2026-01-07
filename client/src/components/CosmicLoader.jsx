import React from 'react';

const CosmicLoader = ({ message = "Initializing systems..." }) => (
  <div className="loading-screen" style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '200px',
    width: '100%'
  }}>
    <div className="loading-spinner" style={{
      borderColor: 'var(--asteroid)',
      borderTopColor: 'var(--supernova)',
      width: '40px',
      height: '40px',
      borderWidth: '3px',
      borderStyle: 'solid',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ marginTop: '1rem', color: 'var(--starlight)', fontSize: '0.9rem' }}>{message}</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default CosmicLoader;
