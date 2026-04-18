/**
 * Leaderboard Page — Code Breaker
 */
import { useState, useEffect } from 'react';
import api from '../services/api';

const MODE_TABS = [
  { key: 'classic', label: '🎯 Classic' },
  { key: 'daily', label: '📅 Daily' },
  { key: 'cipher', label: '🔓 Cipher' },
];

export default function LeaderboardPage() {
  const [mode, setMode] = useState('classic');
  const [entries, setEntries] = useState([]);
  const [ownRank, setOwnRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [mode]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leaderboard/${mode}?limit=50`);
      setEntries(res.data.data.entries || []);
      setOwnRank(res.data.data.ownRank || null);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'lb-rank lb-rank-1';
    if (rank === 2) return 'lb-rank lb-rank-2';
    if (rank === 3) return 'lb-rank lb-rank-3';
    return 'lb-rank';
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">🏆 Leaderboard</h1>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
          {MODE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`btn ${mode === tab.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setMode(tab.key)}
              id={`lb-tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Own Rank */}
        {ownRank && (
          <div className="card-glass mb-4" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>YOUR RANK</span>
            <span className="text-mono" style={{ fontSize: '1.25rem', color: 'var(--accent-yellow)' }}>#{ownRank.rank}</span>
            <span>{ownRank.nickname}</span>
            <span className="text-mono" style={{ color: 'var(--accent-green)' }}>{ownRank.score} pts</span>
          </div>
        )}

        {loading ? (
          <div className="spinner" />
        ) : entries.length === 0 ? (
          <div className="text-center text-muted mt-6">
            <p style={{ fontSize: '2rem' }}>🏜️</p>
            <p>No scores yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="card">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.rank}>
                    <td className={getRankClass(entry.rank)}>
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                    </td>
                    <td>{entry.nickname}</td>
                    <td className="text-mono" style={{ color: 'var(--accent-green)' }}>{entry.score}</td>
                    <td className="text-mono" style={{ color: 'var(--accent-purple)' }}>Lv.{entry.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
