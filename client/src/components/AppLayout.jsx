import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';


const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tracks', label: 'Tracks' },
  { to: '/challenge', label: 'Challenge' },
  { to: '/reflection', label: 'Reflection' },
  { to: '/summary', label: 'Weekly Summary' },
  { to: '/settings', label: 'Settings' }
];


const StarBackground = () => {
  // Generate stable stars
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1 + 'px',
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.5 + 0.3
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            backgroundColor: 'white',
            borderRadius: '50%',
            opacity: star.opacity,
            animation: `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
            animationDelay: star.animationDelay,
          }}
        />
      ))}
      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
          }
        `}
      </style>
    </div>
  );
};

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  // const { isDarkMode, toggleDarkMode, themeColor, setThemeColor, themeColors } = useTheme(); // Removed
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <StarBackground />
      <aside className="sidebar">

        <h1 className="logo">Direction</h1>
        <nav className="nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Theme Section Removed for Cosmic Minimalism */}

        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
          )}
          <button onClick={handleLogout} className="logout-button">
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}