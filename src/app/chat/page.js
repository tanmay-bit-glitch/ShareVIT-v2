'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MessagesSquare, Send, Hash, Menu, X } from 'lucide-react';

const ROOMS = [
  { id: 'general',          label: 'general',          emoji: '💬', col: 'chatMessages',            desc: 'General announcements and student chatter' },
  { id: 'cse',              label: 'cse',              emoji: '💻', col: 'chatMessages_cse',        desc: 'Computer Science department discussion' },
  { id: 'entc',             label: 'entc',             emoji: '📡', col: 'chatMessages_entc',       desc: 'Electronics & Telecomm discussion' },
  { id: 'mechanical',       label: 'mechanical',       emoji: '⚙️', col: 'chatMessages_mech',       desc: 'Mechanical engineering discussion' },
  { id: 'civil',            label: 'civil',            emoji: '🏗️', col: 'chatMessages_civil',      desc: 'Civil engineering discussion' },
  { id: 'placements',       label: 'placements',       emoji: '💼', col: 'chatMessages_placements', desc: 'Placement preparation, mock talks & jobs' },
  { id: 'marketplace-help', label: 'marketplace-help', emoji: '🛒', col: 'chatMessages_market',     desc: 'Help with transactions, items & requests' },
];

export default function ChatPage() { return <ProtectedRoute><ChatContent /></ProtectedRoute>; }

function ChatContent() {
  const [room, setRoom] = useState(ROOMS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(false);
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
      
      {/* Main Grid Wrapper */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        gap: '24px',
        height: '85vh',
        position: 'relative'
      }}>
        
        {/* Left Channels Sidebar */}
        <div className={`chat-sidebar ${channelsOpen ? 'open' : ''}`} style={{
          width: '260px',
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          gap: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'transform 0.3s ease-in-out',
        }}>
          {/* Sidebar Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessagesSquare size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>ShareVIT Server</span>
            </h3>
            <button className="hide-tablet-up" onClick={() => setChannelsOpen(false)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          
          {/* Channels List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '8px', marginBottom: '4px' }}>Text Channels</p>
            {ROOMS.map(r => {
              const isActive = room.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setRoom(r);
                    setChannelsOpen(false);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13.5px',
                    outline: 'none',
                    fontWeight: isActive ? '600' : '400'
                  }}
                >
                  <Hash size={16} style={{ color: isActive ? 'var(--accent-primary-hover)' : 'var(--text-tertiary)' }} />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Message Pane */}
        <div style={{
          flex: 1,
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="navbar-hamburger hide-tablet-up" onClick={() => setChannelsOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex', marginRight: '4px' }}>
              <Menu size={20} />
            </button>
            <Hash size={22} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{room.label}</span>
                <span style={{ fontSize: '16px' }}>{room.emoji}</span>
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{room.desc}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
            {messages.length === 0 && (
              <div className="empty-state" style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>
                <p>Welcome to #{room.label}! This is the start of the channel. 👋</p>
              </div>
            )}
            {messages.map((msg) => {
              const isUser = msg.senderId === user?.uid;
              
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
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
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
                    {!isUser && (
                      <span style={{ fontSize: '12.5px', fontWeight: '500', color: '#94a3b8', marginBottom: '4px', marginLeft: '4px' }}>
                        {senderName}
                      </span>
                    )}
                    
                    {/* Bubble */}
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: '16px',
                      fontSize: '14.5px',
                      background: isUser ? '#6366f1' : '#1e293b',
                      border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      color: '#f8fafc',
                      overflowWrap: 'break-word',
                      minWidth: '80px'
                    }}>
                      <p style={{ lineHeight: '1.6' }}>{msg.text}</p>
                      <p style={{ 
                        fontSize: '10px', 
                        color: isUser ? 'rgba(255,255,255,0.75)' : '#94a3b8', 
                        marginTop: '6px', 
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                        {isUser && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '16px' }}>
              <input
                placeholder={`Message #${room.label}`}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending}
                style={{
                  flex: 1,
                  background: '#0b0f19',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '24px',
                  padding: '14px 20px',
                  color: '#f8fafc',
                  outline: 'none',
                  fontSize: '14.5px',
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
                  padding: '0 20px',
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
                    <Send size={16} strokeWidth={2} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}