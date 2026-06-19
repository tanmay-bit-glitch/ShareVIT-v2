'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { NOTIFICATION_CATEGORIES } from '@/lib/notifications';

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <div className="page-content">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="card-glass animate-fadeInUp" style={{ padding: 'clamp(var(--space-4), 5vw, var(--space-6))' }}>
            <h1 style={{ fontSize: 'clamp(var(--fs-xl), 5vw, var(--fs-2xl))', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-3)' }}>
              Notification Center
            </h1>
            <NotificationsList />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function NotificationsList() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'all']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id) => {
    try { await updateDoc(doc(db, 'notifications', id), { read: true }); } 
    catch (e) { console.error('Error marking read', e); }
  };

  const deleteNotification = async (id) => {
    try { await deleteDoc(doc(db, 'notifications', id)); } 
    catch (e) { console.error('Error deleting', e); }
  };

  const markAllAsRead = () => {
    notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
  };

  const filteredNotifications = filter === 'All' 
    ? notifications 
    : notifications.filter(n => n.category === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}><span className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }} className="hide-scrollbar">
        <button 
          className={`btn btn-sm ${filter === 'All' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setFilter('All')}
        >
          All
        </button>
        {NOTIFICATION_CATEGORIES.map(cat => (
          <button 
            key={cat} 
            className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setFilter(cat)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </span>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>Mark All Read</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No notifications in this category.
          </div>
        ) : (
          filteredNotifications.map(note => (
            <div 
              key={note.id} 
              style={{ 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-md)', 
                background: note.read ? 'var(--bg-secondary)' : 'rgba(99, 102, 241, 0.1)', 
                border: note.read ? '1px solid var(--border-color)' : '1px solid var(--accent-primary)',
                display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span className="badge badge-info" style={{ whiteSpace: 'nowrap' }}>{note.category || 'System'}</span>
                    <strong style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{note.title}</strong>
                  </div>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {note.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(note.createdAt.toDate()) : 'Now'}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {note.message}
                </p>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {!note.read && (
                    <button onClick={() => markAsRead(note.id)} style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1) 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ✓ Mark Read
                    </button>
                  )}
                  <button onClick={() => deleteNotification(note.id)} style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1) 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
