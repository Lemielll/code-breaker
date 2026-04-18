/**
 * Register Page — Code Breaker
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', nickname: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.username, form.password, form.nickname);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error?.details
        ? err.response.data.error.details.map(d => d.message).join(', ')
        : err.response?.data?.error?.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card-glass" style={{ maxWidth: 400, width: '100%' }}>
        <h1 className="page-title text-center" style={{ fontSize: '1.5rem' }}>📝 Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              className="form-input"
              type="text"
              placeholder="3-20 alphanumeric"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              minLength={3}
              maxLength={20}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-nickname">Nickname</label>
            <input
              id="reg-nickname"
              className="form-input"
              type="text"
              placeholder="3-16 alphanumeric"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              required
              minLength={3}
              maxLength={16}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="form-input"
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          {error && <p className="form-error mb-4">{error}</p>}
          <button type="submit" className="btn btn-success btn-block btn-lg" disabled={loading} id="register-submit">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-muted mt-4" style={{ fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
