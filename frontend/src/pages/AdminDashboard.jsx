import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken } from '../api.js';

const STATUSES = ['New', 'Contacted', 'Closed'];
const BUDGET_LABELS = {
  under_1k: 'Under $1,000',
  '1k_5k': '$1,000–$5,000',
  '5k_15k': '$5,000–$15,000',
  '15k_plus': '$15,000+',
};

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadState, setLoadState] = useState('loading'); // loading | ready | empty | error
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const fetchLeads = useCallback(async () => {
    setLoadState('loading');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const res = await api.getLeads(params);
      setLeads(res.leads);
      setLoadState(res.leads.length === 0 ? 'empty' : 'ready');
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMsg(err.message || 'Could not load leads');
      setLoadState('error');
    }
  }, [search, statusFilter, navigate]);

  useEffect(() => {
    const timer = setTimeout(fetchLeads, 250); // debounce search typing
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  async function handleStatusChange(id, status) {
    // Optimistic update so the toggle feels instant; roll back on failure.
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l._id === id ? { ...l, status } : l)));
    try {
      await api.updateStatus(id, status);
    } catch (err) {
      setLeads(prev);
      window.alert('Could not update status: ' + (err.message || 'unknown error'));
    }
  }

  function handleLogout() {
    clearToken();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <h1>Leads</h1>
        <button type="button" className="btn btn--ghost" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <div className="admin__controls">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search leads"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loadState === 'loading' && <p className="admin__state">Loading leads…</p>}

      {loadState === 'error' && (
        <div className="admin__state admin__state--error">
          <p>{errorMsg}</p>
          <button type="button" className="btn btn--ghost" onClick={fetchLeads}>
            Retry
          </button>
        </div>
      )}

      {loadState === 'empty' && (
        <div className="admin__state">
          <p>No leads match this view yet.</p>
        </div>
      )}

      {loadState === 'ready' && (
        <table className="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Budget</th>
              <th>Message</th>
              <th>Received</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id}>
                <td>{lead.name}</td>
                <td>{lead.email}</td>
                <td>{BUDGET_LABELS[lead.budgetRange] || lead.budgetRange}</td>
                <td className="leads-table__message">{lead.message}</td>
                <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                <td>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                    className={`status-pill status-pill--${lead.status.toLowerCase()}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
