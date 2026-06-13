'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AIAssistantPage() { return <ProtectedRoute><AIContent /></ProtectedRoute>; }

const parseInline = (text) => {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-bold)' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          background: 'rgba(99, 102, 241, 0.15)',
          color: 'var(--accent-primary-hover)',
          padding: '2px 6px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9em',
          fontFamily: 'monospace'
        }}>{part.slice(1, -1)}</code>
      );
    }
    return part;
  });
};

const parseMarkdown = (text) => {
  if (!text) return '';
  
  const blocks = text.split(/(```[\s\S]*?```)/g);
  
  return blocks.map((block, index) => {
    if (block.startsWith('```')) {
      const match = block.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : '';
      const code = match ? match[2] : block.replace(/```/g, '');
      
      return (
        <pre key={index} style={{
          background: 'rgba(15, 23, 41, 0.75)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          overflowX: 'auto',
          margin: 'var(--space-4) 0',
          fontFamily: 'Consolas, Monaco, monospace',
          position: 'relative',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
        }}>
          {language && (
            <span style={{
              position: 'absolute',
              top: 'var(--space-2)',
              right: 'var(--space-3)',
              fontSize: '10px',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              fontWeight: 'var(--fw-bold)',
              letterSpacing: '0.05em'
            }}>{language}</span>
          )}
          <code style={{ color: '#e2e8f0', fontSize: 'var(--fs-sm)', lineHeight: '1.5' }}>{code.trim()}</code>
        </pre>
      );
    }
    
    const lines = block.split('\n');
    return (
      <div key={index}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) {
            return <h4 key={lineIdx} style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 'var(--space-4) 0 var(--space-2)', color: 'var(--text-primary)' }}>{parseInline(trimmed.substring(4))}</h4>;
          }
          if (trimmed.startsWith('## ')) {
            return <h3 key={lineIdx} style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', margin: 'var(--space-5) 0 var(--space-2)', color: 'var(--text-primary)' }}>{parseInline(trimmed.substring(3))}</h3>;
          }
          if (trimmed.startsWith('# ')) {
            return <h2 key={lineIdx} style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-extrabold)', margin: 'var(--space-6) 0 var(--space-3)', color: 'var(--text-primary)' }}>{parseInline(trimmed.substring(2))}</h2>;
          }
          
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const content = trimmed.substring(2);
            return (
              <ul key={lineIdx} style={{ paddingLeft: 'var(--space-5)', margin: 'var(--space-1) 0 var(--space-2)' }}>
                <li style={{ listStyleType: 'disc', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{parseInline(content)}</span>
                </li>
              </ul>
            );
          }
          
          if (trimmed === '') {
            return <div key={lineIdx} style={{ height: 'var(--space-2)' }} />;
          }
          
          return <p key={lineIdx} style={{ marginBottom: 'var(--space-2)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{parseInline(line)}</p>;
        })}
      </div>
    );
  });
};

const Typewriter = ({ text, onComplete, scrollRef }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const speed = 10;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i += 3;
      if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      if (i > text.length + 3) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, onComplete, scrollRef]);

  return <>{parseMarkdown(displayedText)}</>;
};

function AIContent() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Hi! I'm the ShareVIT AI Assistant 🤖 powered by Gemini 1.5. I can help you with:\n\n• Explaining academic concepts\n• Exam preparation tips\n• Solving problems step-by-step\n• VIT Pune specific queries\n\nHow can I help you today?", typing: false }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { 
    if (messagesEndRef.current && !loading) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, typing: false }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response, typing: true }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.', typing: false }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Connection error. Please check your internet.', typing: false }]);
    } finally { setLoading(false); }
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
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: '24px' }}>🤖</span>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>AI Academic Assistant</h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px' }}>Powered by Gemini 3.5 — Explanations, code, formulas</p>
          </div>
          <button 
            className="btn btn-ghost" 
            onClick={() => setMessages([messages[0]])} 
            style={{ borderRadius: '20px', padding: '8px 16px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', background: 'transparent', cursor: 'pointer' }}
          >
            Clear Chat
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} style={{ display: 'flex', alignSelf: isUser ? 'flex-end' : 'flex-start', gap: '16px', maxWidth: '85%', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  background: isUser ? '#6366f1' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                }}>
                  {isUser ? '👤' : '🤖'}
                </div>

                {/* Bubble */}
                <div style={{
                  padding: '20px 24px',
                  borderRadius: '16px',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  background: isUser ? '#6366f1' : '#1e293b',
                  border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  color: '#f8fafc',
                  overflowWrap: 'break-word',
                  minWidth: '80px'
                }}>
                  {msg.typing ? (
                    <Typewriter 
                      text={msg.content} 
                      scrollRef={messagesEndRef}
                      onComplete={() => {
                        setMessages(p => p.map((m, idx) => idx === i ? {...m, typing: false} : m));
                      }} 
                    />
                  ) : (
                    parseMarkdown(msg.content)
                  )}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div style={{ display: 'flex', alignSelf: 'flex-start', gap: '16px', maxWidth: '85%', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
              }}>
                🤖
              </div>
              <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                <span className="spinner" style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '16px' }}>
            <input
              placeholder="Ask me anything academic..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
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
              disabled={loading || !input.trim()}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !input.trim()) ? 0.6 : 1,
                fontWeight: '500'
              }}
            >
              {loading ? '...' : (
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