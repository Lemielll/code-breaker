/**
 * Navbar Component — Code Breaker
 */
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">{'<'}Code Breaker{'/>'}</Link>
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/leaderboard" className={isActive('/leaderboard')}>🏆 Leaderboard</Link>
          {user && !user.guest && (
            <Link to="/profile" className={isActive('/profile')}>👤 Profile</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={isActive('/admin')}>🛠️ Admin</Link>
          )}
          {user ? (
            <button className="btn text-white btn-sm btn-outline" onClick={logout}>Logout</button>
          ) : (
            <Link to="/login" className={`btn text-white btn-sm btn-primary ${isActive('/login')}`}>Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
