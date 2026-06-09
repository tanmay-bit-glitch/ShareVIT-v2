'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ChatPage() { return <ProtectedRoute><ChatContent /></ProtectedRoute>; }

function ChatContent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { user, userData } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'chatMessages'), orderBy('createdAt', 'asc'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chatMessages'), {
        text: input.trim(),
        senderId: user.uid,
        senderName: userData?.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
      });
      setInput('');
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  return (
    <div className="page-content" style={{ padding: 'var(--space-4) 0' }}>
      <div className="container">
        <div className="chat-container card-glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 'var(--fs-lg)' }}>💬 Student Chat</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)' }}>Chat with fellow VIT students in real-time</p>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && <div className="empty-state" style={{ padding: 'var(--space-8)' }}><p>No messages yet. Start the conversation! 👋</p></div>}
            {messages.map(msg => (
              <div key={msg.id} className={`chat-bubble ${msg.senderId === user?.uid ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                {msg.senderId !== user?.uid && <p style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-xs)', color: 'var(--accent-primary)', marginBottom: '2px' }}>{msg.senderName}</p>}
                <p>{msg.text}</p>
                <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px', textAlign: 'right' }}>{msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="chat-input-bar">
            <input placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} />
            <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}