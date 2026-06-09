'use client';
import { useState, useRef, useEffect } from 'react';
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

function AIContent() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Hi! I'm the ShareVIT AI Assistant 🤖 powered by Gemini 3.5. I can help you with:\n\n• Explaining academic concepts\n• Exam preparation tips\n• Solving problems step-by-step\n• VIT Pune specific queries\n\nHow can I help you today?" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Connection error. Please check your internet.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="page-content" style={{ padding: 'var(--space-6) 0 var(--space-12)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="chat-container card-glass" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', height: 'calc(100vh - 12rem)', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border-color)', background: 'rgba(30, 41, 59, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)' }}>🤖 AI Academic Assistant</h2>
              </div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)', marginTop: '2px' }}>Powered by Gemini 3.5 — Explanations, code, formulas</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setMessages([messages[0]])} style={{ borderRadius: 'var(--radius-full)', padding: 'var(--space-1) var(--space-4)', fontSize: 'var(--fs-xs)', border: '1px solid rgba(255,255,255,0.06)' }}>Clear Chat</button>
          </div>

          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1, padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', overflowY: 'auto' }}>
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', alignSelf: isUser ? 'flex-end' : 'flex-start', gap: 'var(--space-3)', maxWidth: '85%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                    boxShadow: isUser ? '0 0 10px rgba(99, 102, 241, 0.4)' : '0 0 10px rgba(139, 92, 246, 0.3)',
                    background: isUser ? 'var(--gradient-primary)' : 'linear-gradient(135deg, #1e293b, #3b82f6)'
                  }}>
                    {isUser ? '👤' : '🤖'}
                  </div>

                  {/* Bubble */}
                  <div className={isUser ? 'chat-bubble-sent' : 'chat-bubble-received'} style={{
                    padding: 'var(--space-3) var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--fs-sm)',
                    lineHeight: '1.6',
                    background: isUser ? 'var(--gradient-primary)' : 'rgba(30, 41, 59, 0.35)',
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    color: '#fff',
                    boxShadow: isUser ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
                    borderTopRightRadius: isUser ? 'var(--radius-sm)' : 'var(--radius-lg)',
                    borderTopLeftRadius: isUser ? 'var(--radius-lg)' : 'var(--radius-sm)'
                  }}>
                    {parseMarkdown(msg.content)}
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div style={{ display: 'flex', alignSelf: 'flex-start', gap: 'var(--space-3)', maxWidth: '85%', alignItems: 'center' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1e293b, #3b82f6)',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
                }}>
                  🤖
                </div>
                <div style={{ display: 'flex', gap: '4px', padding: '12px 18px', background: 'rgba(30, 41, 59, 0.35)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', borderTopLeftRadius: 'var(--radius-sm)' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginLeft: '8px' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="chat-input-bar" style={{ padding: 'var(--space-4) var(--space-6)', background: 'rgba(15, 23, 41, 0.65)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 'var(--space-3)' }}>
            <input
              placeholder="Ask me anything academic..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                background: 'rgba(15, 23, 41, 0.45)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                padding: 'var(--space-3) var(--space-5)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: 'var(--fs-sm)',
                transition: 'all 0.3s ease'
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--accent-primary)';
                e.target.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !input.trim()}
              style={{
                borderRadius: 'var(--radius-full)',
                padding: 'var(--space-2) var(--space-6)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              {loading ? '...' : (
                <>
                  <span>Send</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}