'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MessagesSquare, Send, Hash } from 'lucide-react';

const ROOMS = [
  { id: 'general',     label: 'General',     emoji: '💬', col: 'chatMessages',            desc: 'All students' },
  { id: 'cse',         label: 'CSE',         emoji: '💻', col: 'chatMessages_cse',        desc: 'Comp Science' },
  { id: 'entc',        label: 'ENTC',        emoji: '📡', col: 'chatMessages_entc',       desc: 'Electronics' },
  { id: 'mechanical',  label: 'Mechanical',  emoji: '⚙️', col: 'chatMessages_mech',       desc: 'Mechanical' },
  { id: 'civil',       label: 'Civil',       emoji: '🏗️', col: 'chatMessages_civil',      desc: 'Civil Engg' },
  { id: 'marketplace', label: 'Marketplace', emoji: '🛒', col: 'chatMessages_market',     desc: 'Buy/Sell help' },
];

export default function ChatPage() { return <ProtectedRoute><ChatContent /></ProtectedRoute>; }

function ChatContent() {
  const [room, setRoom] = useState(ROOMS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { user, userData } = useAuth();
  const bottomRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    const q = query(collection(db, room.col), orderBy('createdAt', 'asc'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [room]);

  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, room.col), {
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
    <div className="page-content" style={{ padding: 'var(--space-6)', height: 'calc(100vh - var(--navbar-height))', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b0f19' }}>
      
      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '900px',
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: '85vh',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        
        {/* Header */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <div style={{ padding: '6px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', borderRadius: '8px', display: 'flex' }}>
              <MessagesSquare size={18} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                {room.emoji} #{room.label}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '12px' }}>{room.desc} — Community Chat</p>
            </div>
          </div>
          {/* Room selector tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ROOMS.map(r => (
              <button
                key={r.id}
                onClick={() => setRoom(r)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  border: `1px solid ${r.id === room.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  background: r.id === room.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: r.id === room.id ? '#818cf8' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: r.id === room.id ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>{r.emoji}</span> {r.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Messages */}
        <div className="chat-messages" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {messages.length === 0 && <div className="empty-state" style={{ padding: '32px', color: '#94a3b8' }}><p>No messages yet. Start the conversation! 👋</p></div>}
          {messages.map((msg, index) => {
            const isUser = msg.senderId === user?.uid;
            
            // Generate a consistent color based on sender name
            const getAvatarColor = (name) => {
              const colors = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
              let hash = 0;
              for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
              return colors[Math.abs(hash) % colors.length];
            };
            const senderName = msg.senderName || 'Anonymous';
            const avatarColor = getAvatarColor(senderName);
            const initial = senderName.charAt(0).toUpperCase();

            return (
              <div key={msg.id} style={{ display: 'flex', alignSelf: isUser ? 'flex-end' : 'flex-start', gap: '16px', maxWidth: '85%', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                
                {/* Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  background: isUser ? '#6366f1' : avatarColor
                }}>
                  {initial}
                </div>

                {/* Message Content Wrapper */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  
                  {/* Sender Name (External) */}
                  {!isUser && (
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '6px', marginLeft: '4px' }}>
                      {senderName}
                    </span>
                  )}
                  
                  {/* Bubble */}
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    fontSize: '15px',
                    background: isUser ? '#6366f1' : '#1e293b',
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    color: '#f8fafc',
                    overflowWrap: 'break-word',
                    minWidth: '80px'
                  }}>
                    <p style={{ lineHeight: '1.6' }}>{msg.text}</p>
                    <p style={{ 
                      fontSize: '11px', 
                      color: isUser ? 'rgba(255,255,255,0.8)' : '#94a3b8', 
                      marginTop: '8px', 
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                      {isUser && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '16px' }}>
            <input
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={sending}
              style={{
                flex: 1,
                background: '#0b0f19',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '16px 24px',
                color: '#f8fafc',
                outline: 'none',
                fontSize: '15px',
                transition: 'all 0.3s ease'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#6366f1';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: (sending || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (sending || !input.trim()) ? 0.6 : 1,
                fontWeight: '500'
              }}
            >
              {sending ? '...' : (
                <>
                  <span>Send</span>
                  <Send size={18} strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}