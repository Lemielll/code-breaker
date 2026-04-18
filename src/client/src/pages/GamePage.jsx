/**
 * Game Page — Code Breaker
 * Main game board with hex input, feedback display, and results.
 * Cipher mode includes puzzle selection step.
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const MODES = {
  classic: { label: 'Classic Mode', icon: '🎯', maxAttempts: 8 },
  daily: { label: 'Daily Challenge', icon: '📅', maxAttempts: 8 },
  cipher: { label: 'Cipher Crack', icon: '🔓', maxAttempts: 6 },
};

export default function GamePage() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const modeConfig = MODES[mode] || MODES.classic;

  const [sessionId, setSessionId] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [result, setResult] = useState(null);
  const [cipherInfo, setCipherInfo] = useState(null);
  const [error, setError] = useState('');
  const [inputValues, setInputValues] = useState(['', '', '', '']);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Cipher puzzle selection
  const [puzzles, setPuzzles] = useState([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);

  // Start game on mount (except cipher — need puzzle selection first)
  useEffect(() => {
    if (mode === 'cipher') {
      fetchPuzzles();
    } else {
      startGame();
    }
  }, [mode]);

  /**
   * Fetch available published puzzles for cipher mode.
   */
  const fetchPuzzles = async () => {
    setLoadingPuzzles(true);
    setStatus('select_puzzle');
    setResult(null);
    setError('');
    try {
      const res = await api.get('/games/puzzles');
      setPuzzles(res.data.data || []);
    } catch {
      setPuzzles([]);
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const startGame = async (puzzleId) => {
    try {
      setGuesses([]);
      setStatus('playing');
      setResult(null);
      setError('');
      setInputValues(['', '', '', '']);
      setCipherInfo(null);

      const body = { mode };
      if (mode === 'cipher' && puzzleId) {
        body.puzzleId = puzzleId;
      }

      const res = await api.post('/games/start', body);
      setSessionId(res.data.data.sessionId);

      if (mode === 'cipher' && res.data.data.ciphertext) {
        setCipherInfo({
          ciphertext: res.data.data.ciphertext,
          cipherMethod: res.data.data.cipherMethod,
          hint: res.data.data.hint,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.error?.details
        ? err.response.data.error.details.map(d => d.message).join(', ')
        : err.response?.data?.error?.message || 'Failed to start game';
      setError(msg);
      setStatus('error');
    }
  };

  const handleInput = (index, value) => {
    const hex = value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(-1);
    const newValues = [...inputValues];
    newValues[index] = hex;
    setInputValues(newValues);

    if (hex && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !inputValues[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      submitGuess();
    }
  };

  const submitGuess = async () => {
    const guess = inputValues.join('');
    if (guess.length !== 4) {
      setError('Enter all 4 hex digits');
      return;
    }

    setError('');
    try {
      const res = await api.post(`/games/${sessionId}/guess`, { guess });
      const data = res.data.data;

      setGuesses((prev) => [...prev, {
        guess,
        feedback: data.feedback,
        attemptNumber: data.attemptNumber,
      }]);

      setInputValues(['', '', '', '']);
      inputRefs[0].current?.focus();

      if (data.status === 'won' || data.status === 'lost') {
        setStatus(data.status);
        setResult({
          status: data.status,
          score: data.score,
          correctCode: data.correctCode,
          progression: data.progression || null,
        });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit guess');
    }
  };

  const maxAttempts = modeConfig.maxAttempts;
  const remaining = maxAttempts - guesses.length;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="page-title">{modeConfig.icon} {modeConfig.label}</h1>
          {status === 'playing' && (
            <p className="text-muted">
              Attempts: <span className="text-mono" style={{ color: remaining <= 2 ? 'var(--accent-red)' : 'var(--accent-blue)' }}>
                {guesses.length}/{maxAttempts}
              </span>
            </p>
          )}
          {mode === 'cipher' && cipherInfo && (
            <div className="card-glass mt-4" style={{ display: 'inline-block', padding: 'var(--sp-3) var(--sp-5)' }}>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>CIPHERTEXT</span>
              <div className="text-mono" style={{ fontSize: '1.5rem', color: 'var(--accent-purple)', letterSpacing: '0.3em' }}>
                {cipherInfo.ciphertext}
              </div>
            </div>
          )}
        </div>

        {/* Cipher Puzzle Selection */}
        {status === 'select_puzzle' && (
          <div>
            {loadingPuzzles ? (
              <div className="spinner" />
            ) : puzzles.length === 0 ? (
              <div className="text-center">
                <p style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }}>🧩</p>
                <p className="text-muted mb-4">No cipher puzzles available yet.</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  An admin needs to create and publish puzzles first.
                </p>
                <button className="btn btn-outline mt-4" onClick={() => navigate('/')}>
                  ← Back to Menu
                </button>
              </div>
            ) : (
              <div>
                <p className="text-muted mb-4 text-center">Select a puzzle to crack:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {puzzles.map((p) => (
                    <div
                      key={p.id}
                      className="card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => startGame(p.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.title}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Method: {p.cipherMethod} | Ciphertext: <span className="text-mono">{p.ciphertext}</span>
                          </div>
                        </div>
                        <span className="badge badge-purple">Play →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && status !== 'error' && status !== 'select_puzzle' && (
          <div className="card-glass mb-4 text-center" style={{ borderColor: 'var(--accent-red)', padding: 'var(--sp-3)' }}>
            <span style={{ color: 'var(--accent-red)', fontSize: '0.875rem' }}>⚠️ {error}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <p style={{ color: 'var(--accent-red)' }}>{error}</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>← Back to Menu</button>
          </div>
        )}

        {/* Game Board */}
        {(status === 'playing' || status === 'won' || status === 'lost') && (
          <div className="game-board">
            {guesses.map((g, i) => (
              <div className="guess-row" key={i}>
                {g.feedback.map((f, j) => (
                  <div
                    key={j}
                    className={`feedback-dot feedback-${f.status} animate-pop`}
                    style={{ animationDelay: `${j * 0.1}s` }}
                    title={`${f.digit}: ${f.status}`}
                  >
                    {f.digit}
                  </div>
                ))}
              </div>
            ))}

            {status === 'playing' && Array.from({ length: remaining - 1 }, (_, i) => (
              <div className="guess-row" key={`empty-${i}`}>
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="feedback-dot feedback-empty">·</div>
                ))}
              </div>
            ))}

            {status === 'playing' && (
              <div style={{ marginTop: 'var(--sp-4)' }}>
                <div className="hex-input-group" style={{ justifyContent: 'center' }}>
                  {inputValues.map((val, i) => (
                    <input
                      key={i}
                      ref={inputRefs[i]}
                      className="hex-input"
                      type="text"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleInput(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      autoFocus={i === 0}
                      id={`hex-input-${i}`}
                    />
                  ))}
                </div>
                <div className="text-center mt-4">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={submitGuess}
                    disabled={inputValues.join('').length !== 4}
                    id="submit-guess-btn"
                  >
                    Submit Guess →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result Overlay */}
        {result && (
          <div className="result-overlay" onClick={(e) => e.target === e.currentTarget && setResult(null)}>
            <div className="result-card">
              <div className="result-icon">
                {result.status === 'won' ? '🎉' : '💀'}
              </div>
              <div className="result-title">
                {result.status === 'won' ? 'Code Cracked!' : 'Game Over'}
              </div>
              {result.correctCode && (
                <p className="text-muted mb-4">
                  The code was: <span className="text-mono" style={{ color: 'var(--accent-blue)', fontSize: '1.25rem' }}>{result.correctCode}</span>
                </p>
              )}
              {result.score > 0 && (
                <div className="result-score mb-4">+{result.score} pts</div>
              )}
              {result.progression && (
                <div className="card-glass mb-4" style={{ textAlign: 'left', padding: 'var(--sp-3)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PROGRESSION</div>
                  <div style={{ fontSize: '0.875rem' }}>
                    XP: <span style={{ color: 'var(--accent-purple)' }}>+{result.progression.xpEarned}</span>
                    {' | '}Level: <span style={{ color: 'var(--accent-blue)' }}>{result.progression.level}</span>
                    {result.progression.leveledUp && <span className="badge badge-green" style={{ marginLeft: 8 }}>LEVEL UP!</span>}
                  </div>
                  {result.progression.streakCount > 0 && (
                    <div style={{ fontSize: '0.875rem' }}>
                      🔥 Streak: {result.progression.streakCount} days
                    </div>
                  )}
                  {result.progression.newBadges?.length > 0 && (
                    <div style={{ marginTop: 'var(--sp-2)' }}>
                      {result.progression.newBadges.map((b) => (
                        <span key={b.id} className="badge badge-purple" style={{ marginRight: 4 }}>🏅 {b.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center' }}>
                <button className="btn btn-success" onClick={() => mode === 'cipher' ? fetchPuzzles() : startGame()} id="play-again-btn">
                  Play Again
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/')}>
                  Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
