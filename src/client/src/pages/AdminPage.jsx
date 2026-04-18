/**
 * Admin Page — Code Breaker
 * Dashboard + Puzzle CRUD.
 */
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', plaintext: '', shiftValue: 3, hint: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (tab === 'dashboard') fetchDashboard();
    else fetchPuzzles();
  }, [tab]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setDashboard(res.data.data);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const fetchPuzzles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/puzzles');
      setPuzzles(res.data.data.puzzles || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/admin/puzzles', {
        ...form,
        shiftValue: parseInt(form.shiftValue, 10),
      });
      setSuccess('Puzzle created!');
      setShowCreate(false);
      setForm({ title: '', plaintext: '', shiftValue: 3, hint: '' });
      fetchPuzzles();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/admin/puzzles/${id}`, { status: newStatus });
      fetchPuzzles();
    } catch (err) {
      alert(err.response?.data?.error?.details?.[0]?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this puzzle?')) return;
    try {
      await api.delete(`/admin/puzzles/${id}`);
      fetchPuzzles();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete');
    }
  };

  const statusBadge = (status) => {
    const map = { draft: 'badge-yellow', published: 'badge-green', archived: 'badge-red' };
    return <span className={`badge ${map[status] || ''}`}>{status}</span>;
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">🛠️ Admin Panel</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
          <button className={`btn ${tab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('dashboard')}>
            📊 Dashboard
          </button>
          <button className={`btn ${tab === 'puzzles' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('puzzles')}>
            🧩 Puzzles
          </button>
        </div>

        {loading && <div className="spinner" />}

        {/* Dashboard Tab */}
        {!loading && tab === 'dashboard' && dashboard && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{dashboard.totalPlayers}</div>
              <div className="stat-label">Players</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{dashboard.totalPuzzles}</div>
              <div className="stat-label">Puzzles</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{dashboard.puzzlesByStatus?.published || 0}</div>
              <div className="stat-label">Published</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{dashboard.gamesToday}</div>
              <div className="stat-label">Games Today</div>
            </div>
          </div>
        )}

        {/* Puzzles Tab */}
        {!loading && tab === 'puzzles' && (
          <>
            <button className="btn btn-success mb-4" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? '✕ Cancel' : '➕ Create Puzzle'}
            </button>

            {success && <p style={{ color: 'var(--accent-green)', marginBottom: 'var(--sp-4)' }}>✅ {success}</p>}

            {showCreate && (
              <div className="card mb-4">
                <form onSubmit={handleCreate}>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required maxLength={100} />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Plaintext (4 hex)</label>
                      <input className="form-input text-mono" value={form.plaintext} onChange={(e) => setForm({...form, plaintext: e.target.value.toUpperCase()})} required pattern="[0-9A-Fa-f]{4}" maxLength={4} placeholder="A3F1" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Shift (0-15)</label>
                      <input className="form-input" type="number" min={0} max={15} value={form.shiftValue} onChange={(e) => setForm({...form, shiftValue: e.target.value})} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hint (optional)</label>
                    <input className="form-input" value={form.hint} onChange={(e) => setForm({...form, hint: e.target.value})} maxLength={500} />
                  </div>
                  {error && <p className="form-error mb-4">{error}</p>}
                  <button type="submit" className="btn btn-primary">Create Puzzle</button>
                </form>
              </div>
            )}

            {puzzles.length === 0 ? (
              <p className="text-muted text-center">No puzzles yet.</p>
            ) : (
              <div className="card" style={{ overflow: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Plain</th>
                      <th>Cipher</th>
                      <th>Shift</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {puzzles.map((p) => (
                      <tr key={p.id}>
                        <td>{p.title}</td>
                        <td className="text-mono">{p.plaintext}</td>
                        <td className="text-mono">{p.ciphertext}</td>
                        <td className="text-mono">{p.shiftValue}</td>
                        <td>{statusBadge(p.status)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
                            {p.status === 'draft' && (
                              <>
                                <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(p.id, 'published')}>Publish</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                              </>
                            )}
                            {p.status === 'published' && (
                              <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(p.id, 'archived')}>Archive</button>
                            )}
                            {p.status === 'archived' && <span className="text-muted">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
