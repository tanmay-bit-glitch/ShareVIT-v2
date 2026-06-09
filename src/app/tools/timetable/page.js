'use client';
import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00'];
const colors = ['#6366f1', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316'];

export default function TimetablePage() { return <ProtectedRoute><TimetableContent /></ProtectedRoute>; }

function TimetableContent() {
  const [entries, setEntries] = useState([]);
  const [adding, setAdding] = useState(null); // { day, time }
  const [form, setForm] = useState({ subject: '', room: '', type: 'Lecture' });

  const addEntry = () => {
    if (!adding || !form.subject) return;
    const color = colors[entries.length % colors.length];
    setEntries(p => [...p, { ...adding, ...form, color, id: Date.now() }]);
    setAdding(null);
    setForm({ subject: '', room: '', type: 'Lecture' });
  };

  const removeEntry = (id) => setEntries(p => p.filter(e => e.id !== id));
  const getEntry = (day, time) => entries.find(e => e.day === day && e.time === time);

  return (
    <div className="page-content" style={{ padding: 'var(--space-6) 0 var(--space-12)' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        <div className="page-header animate-fadeInUp text-center">
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)', marginBottom: 'var(--space-2)' }}>📅 Timetable Builder</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Create, manage and customize your weekly class schedule</p>
        </div>

        <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-5)', overflowX: 'auto', borderRadius: 'var(--radius-xl)', boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}>
          <table style={{ minWidth: 800, borderCollapse: 'separate', borderSpacing: '6px' }}>
            <thead>
              <tr>
                <th style={{ width: 90, textAlign: 'center', background: 'transparent', borderBottom: 'none', textTransform: 'uppercase', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Time</th>
                {days.map(d => (
                  <th key={d} style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)', borderBottom: 'none', color: 'var(--text-primary)' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time}>
                  <td style={{ textAlign: 'center', padding: 'var(--space-2) 0', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', background: 'rgba(15, 23, 41, 0.2)', borderRadius: 'var(--radius-md)' }}>
                    {time}
                  </td>
                  {days.map(day => {
                    const entry = getEntry(day, time);
                    return (
                      <td key={day} style={{ padding: 0, height: 70, position: 'relative' }}>
                        {entry ? (
                          <div
                            style={{
                              background: `${entry.color}15`,
                              border: `1px solid ${entry.color}40`,
                              borderRadius: 'var(--radius-md)',
                              padding: 'var(--space-2)',
                              height: '100%',
                              fontSize: 'var(--fs-xs)',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              boxShadow: `inset 0 0 10px ${entry.color}08`
                            }}
                            onClick={() => removeEntry(entry.id)}
                            title="Click to remove"
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                              e.currentTarget.style.borderColor = entry.color;
                              e.currentTarget.style.boxShadow = `0 4px 12px ${entry.color}20, inset 0 0 10px ${entry.color}10`;
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.borderColor = `${entry.color}40`;
                              e.currentTarget.style.boxShadow = `inset 0 0 10px ${entry.color}08`;
                            }}
                          >
                            <p style={{ fontWeight: 'var(--fw-bold)', color: entry.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.subject}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }}>
                              📍 {entry.room || 'N/A'} • {entry.type}
                            </p>
                          </div>
                        ) : (
                          <div
                            style={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              borderRadius: 'var(--radius-md)',
                              border: '1px dashed rgba(255, 255, 255, 0.04)',
                              background: 'rgba(15, 23, 41, 0.1)',
                              transition: 'all 0.2s ease',
                              fontSize: '1.2rem',
                              color: 'rgba(255, 255, 255, 0.15)'
                            }}
                            onClick={() => setAdding({ day, time })}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                              e.currentTarget.style.color = 'var(--accent-primary)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(15, 23, 41, 0.1)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.15)';
                            }}
                          >
                            +
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {adding && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10, 10, 15, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3000,
              animation: 'fadeInUp 0.3s ease'
            }}
            onClick={() => setAdding(null)}
          >
            <div
              className="card-glass"
              style={{
                padding: 'var(--space-8)',
                maxWidth: 420,
                width: '90%',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)' }}>
                Add Class — {adding.day} {adding.time}
              </h3>
              <div className="form-group">
                <label className="form-label">Subject Name *</label>
                <input className="form-input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Data Structures" required />
              </div>
              <div className="form-group">
                <label className="form-label">Room / Lab Location</label>
                <input className="form-input" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="e.g. A-301, Lab 4" />
              </div>
              <div className="form-group" style={{ marginBottom: 'var(--space-8)' }}>
                <label className="form-label">Class Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option>Lecture</option>
                  <option>Lab</option>
                  <option>Tutorial</option>
                  <option>Seminar</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setAdding(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={addEntry}>Add to Schedule</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}