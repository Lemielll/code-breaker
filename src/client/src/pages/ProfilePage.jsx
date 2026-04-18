/**
 * Profile Page — Code Breaker
 * Stats, streak, badges.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import BADGES_DEF from '../constants/badges';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, badgesRes] = await Promise.all([
        api.get('/profile'),
        api.get('/profile/achievements'),
      ]);
      setProfile(profileRes.data.data);
      setBadges(badgesRes.data.data || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page"><div className="container"><div className="spinner" /></div></div>;
  if (!profile) return <div className="page"><div className="container text-center text-muted">Could not load profile</div></div>;

  const stats = profile.stats || {};

  // Merge badge definitions with unlock data
  const mergedBadges = BADGES_DEF.map((def) => {
    const serverBadge = badges.find((b) => b.id === def.id);
    return {
      ...def,
      unlocked: serverBadge?.unlocked || false,
      unlockedAt: serverBadge?.unlockedAt || null,
    };
  });

  return (
    <div className="page">
      <div className="container">
        {/* Profile Header */}
        <div className="card-glass mb-6" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)', flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
          }}>
            {(profile.nickname || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{profile.nickname}</h1>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>@{profile.username}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-5)', textAlign: 'center' }}>
            <div>
              <div className="text-mono" style={{ fontSize: '1.25rem', color: 'var(--accent-purple)' }}>Lv.{profile.level || 1}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>LEVEL</div>
            </div>
            <div>
              <div className="text-mono" style={{ fontSize: '1.25rem', color: 'var(--accent-blue)' }}>{(profile.totalXp || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>XP</div>
            </div>
            <div>
              <div className="text-mono" style={{ fontSize: '1.25rem', color: 'var(--accent-orange)' }}>🔥 {profile.currentStreak || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>STREAK</div>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--sp-1)' }}>
            <span>Level {profile.level || 1}</span>
            <span>{(profile.totalXp || 0) % 1000} / 1000 XP</span>
            <span>Level {(profile.level || 1) + 1}</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${((profile.totalXp || 0) % 1000) / 10}%`,
              background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))',
              borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Stats */}
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--sp-4)' }}>📊 Statistics</h2>
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-value">{stats.totalGamesPlayed || 0}</div>
            <div className="stat-label">Games Played</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.totalGamesWon || 0}</div>
            <div className="stat-label">Games Won</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>
              {stats.totalGamesPlayed > 0 ? Math.round((stats.totalGamesWon / stats.totalGamesPlayed) * 100) : 0}%
            </div>
            <div className="stat-label">Win Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{profile.longestStreak || 0}</div>
            <div className="stat-label">Best Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.classicBestScore || 0}</div>
            <div className="stat-label">Classic Best</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.dailyBestScore || 0}</div>
            <div className="stat-label">Daily Best</div>
          </div>
        </div>

        {/* Achievements */}
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--sp-4)' }}>🏅 Achievements</h2>
        <div className="achievement-grid">
          {mergedBadges.map((badge) => (
            <div key={badge.id} className={`achievement-card ${badge.unlocked ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">{badge.icon}</div>
              <div className="achievement-name">{badge.name}</div>
              <div className="achievement-desc">{badge.description}</div>
              {badge.unlocked && (
                <div className="badge badge-green mt-2">Unlocked</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
