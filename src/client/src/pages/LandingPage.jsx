/**
 * Landing Page — Code Breaker
 * Hero section + mode selection + guest entry.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user, guestLogin } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [showGuest, setShowGuest] = useState(false);
  const [error, setError] = useState('');

  const handleModeSelect = (mode) => {
    if (user) {
      navigate(`/game/${mode}`);
    } else {
      setShowGuest(true);
    }
  };

  const handleGuestPlay = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await guestLogin(nickname);
      navigate('/game/classic');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid nickname');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <h1 className="hero-title">{'{ CODE BREAKER }'}</h1>
          <p className="hero-subtitle">
            Crack the 4-digit hex code. Each guess reveals clues.
            <span style={{ color: 'var(--accent-green)' }}> 🟢 Correct</span>,
            <span style={{ color: 'var(--accent-yellow)' }}> 🟡 Misplaced</span>,
            <span style={{ color: 'var(--text-secondary)' }}> ⚫ Wrong</span>.
            Can you break the code?
          </p>
          {!user && (
            <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
                🔐 Login
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => setShowGuest(true)}>
                👤 Play as Guest
              </button>
            </div>
          )}
        </div>

        {showGuest && !user && (
          <div className="card-glass" style={{ maxWidth: 400, margin: '0 auto var(--sp-6)' }}>
            <form onSubmit={handleGuestPlay}>
              <div className="form-group">
                <label className="form-label">Enter your nickname</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="HexMaster42"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  minLength={3}
                  maxLength={16}
                  required
                  autoFocus
                  id="guest-nickname-input"
                />
                {error && <p className="form-error">{error}</p>}
              </div>
              <button type="submit" className="btn btn-success btn-block">
                Start Playing →
              </button>
            </form>
          </div>
        )}

        <div className="mode-grid">
          <div className="mode-card classic" onClick={() => handleModeSelect('classic')} id="mode-classic">
            <div className="mode-icon">🎯</div>
            <div className="mode-title">Classic Mode</div>
            <div className="mode-desc">Random hex code. 8 attempts. Pure skill.</div>
          </div>
          <div className="mode-card daily" onClick={() => handleModeSelect('daily')} id="mode-daily">
            <div className="mode-icon">📅</div>
            <div className="mode-title">Daily Challenge</div>
            <div className="mode-desc">Same puzzle for everyone. One shot per day.</div>
          </div>
          <div className="mode-card cipher" onClick={() => handleModeSelect('cipher')} id="mode-cipher">
            <div className="mode-icon">🔓</div>
            <div className="mode-title">Cipher Crack</div>
            <div className="mode-desc">Decrypt the ciphertext. 6 attempts. Hints available.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
