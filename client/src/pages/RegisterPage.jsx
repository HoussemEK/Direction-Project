import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Portal (Register Page Redesign)
 * 
 * Features:
 * - Full-screen starfield background
 * - Centered floating form
 * - Subtle animation on load
 * - "Join the Cosmos" button text
 */

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch {
      // Error is handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  // Generate starfield with varied sizes and brightness
  const stars = Array.from({ length: 150 }, (_, i) => {
    const size = Math.random() < 0.7 ? 2 : Math.random() < 0.9 ? 3 : 4;
    return {
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
      width: `${size}px`,
      height: `${size}px`,
      opacity: 0.3 + Math.random() * 0.7,
    };
  });

  return (
    <div className="portal-page">
      {/* Starfield Background */}
      <div className="starfield-background">
        {stars.map(star => (
          <div
            key={star.id}
            className="starfield-star"
            style={{
              top: star.top,
              left: star.left,
              width: star.width,
              height: star.height,
              opacity: star.opacity,
              animationDelay: star.animationDelay,
              animationDuration: star.animationDuration,
            }}
          />
        ))}
      </div>

      {/* Portal Form */}
      <div className="portal-form floating-panel-glass">
        <h1 className="portal-title">Join Direction</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="portal-input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            className="portal-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="portal-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="portal-button"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join the Cosmos'}
          </button>
        </form>

        <Link to="/login" className="portal-link">
          Already have an account? Enter the Void
        </Link>
      </div>
    </div>
  );
}
