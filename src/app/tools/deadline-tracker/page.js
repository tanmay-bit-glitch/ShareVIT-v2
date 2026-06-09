'use client';
import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const priorityColors = { Low: '#3b82f6', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' };

export default function DeadlineTrackerPage() { return <ProtectedRoute><DeadlineContent /></ProtectedRoute>; }

function DeadlineContent() {
  const [deadlines, setDeadlines] = useState([]);
  const [form, setForm] = useState({ title: '', subject: '', date: '', time: '23:59', priority: 'Medium', notes: '' });
  const [showForm, setShowForm] = useState(false);

  const addDeadline = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setDeadlines(p => [...p, { ...form, id: Date.now(), completed: false }].sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time)));
    setForm({ title: '', subject: '', date: '', time: '23:59', priority: 'Medium', notes: '' });
    setShowForm(false);
  };

  const toggleComplete = (id) => setDeadlines(p => p.map(d => d.id === id ? { ...d, completed: !d.completed } : d));
  const removeDeadline = (id) => setDeadlines(p => p.filter(d => d.id !== id));

  const getDaysLeft = (date, time) => {
    const diff = new Date(date + 'T' + time) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `${days} days left`;
  };

  const upcoming = deadlines.filter(d => !d.completed);
  const completed = deadlines.filter(d => d.completed);

  return (
    <div className="page-content"><div className="container" style={{ maxWidth: 800 }}>
      <div className="page-header animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>⏰ Deadline Tracker</h1><p>Never miss a submission or exam deadline</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? '✕ Cancel' : '+ Add Deadline'}</button>
      </div>

      {showForm && (
        <form onSubmit={addDeadline} className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. OS Assignment 3 Submission" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group"><label className="form-label">Subject</label><input className="form-input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>{Object.keys(priorityColors).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group"><label className="form-label">Date *</label><input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Time</label><input className="form-input" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></div>
          </div>
          <button type="submit" className="btn btn-primary">Add Deadline</button>
        </form>
      )}

      {upcoming.length === 0 && completed.length === 0 ? (
        <div className="empty-state animate-fadeInUp"><div className="empty-state-icon">⏰</div><h3>No deadlines yet</h3><p>Add your first deadline to stay on track!</p></div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="animate-fadeInUp">
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>Upcoming ({upcoming.length})</h3>
              <div className="flex-col gap-3">{upcoming.map(d => {
                const daysLeft = getDaysLeft(d.date, d.time);
                const isUrgent = daysLeft === 'Overdue' || daysLeft === 'Today!' || daysLeft === 'Tomorrow';
                return (
                  <div key={d.id} className="card-glass" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderLeft: `3px solid ${priorityColors[d.priority]}` }}>
                    <input type="checkbox" className="custom-checkbox" checked={d.completed} onChange={() => toggleComplete(d.id)} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 'var(--fs-base)' }}>{d.title}</h4>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-1)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                        {d.subject && <span>{d.subject}</span>}
                        <span>📅 {new Date(d.date).toLocaleDateString()} {d.time}</span>
                      </div>
                    </div>
                    <span className={`badge ${isUrgent ? 'badge-danger' : 'badge-info'}`}>{daysLeft}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeDeadline(d.id)} style={{ color: 'var(--accent-danger)' }}>🗑</button>
                  </div>
                );
              })}</div>
            </div>
          )}
          {completed.length > 0 && (
            <div style={{ marginTop: 'var(--space-8)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-tertiary)' }}>Completed ({completed.length})</h3>
              <div className="flex-col gap-3">{completed.map(d => (
                <div key={d.id} className="card-glass" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', opacity: 0.5 }}>
                  <input type="checkbox" className="custom-checkbox" checked onChange={() => toggleComplete(d.id)} />
                  <div style={{ flex: 1, textDecoration: 'line-through' }}><h4 style={{ fontSize: 'var(--fs-base)' }}>{d.title}</h4></div>
                  <span className="badge badge-success">Done</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeDeadline(d.id)} style={{ color: 'var(--accent-danger)' }}>🗑</button>
                </div>
              ))}</div>
            </div>
          )}
        </>
      )}
    </div></div>
  );
}