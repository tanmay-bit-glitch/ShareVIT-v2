'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, BookOpen, ClipboardList, Calendar, FileText, Briefcase, Menu, X } from 'lucide-react';
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

const MODES = [
  { id: 'explain', label: 'Concept Explainer', desc: 'Explains complex academic engineering concepts and code.', icon: BookOpen, emoji: '📖', intro: "Hi! I'm in Concept Explainer mode. Send me any engineering concept, formula, or code block and I'll explain it clearly step-by-step." },
  { id: 'solve', label: 'PYQ Solver', desc: 'Solves Previous Year Questions and numericals with full derivations.', icon: ClipboardList, emoji: '✏️', intro: "Hi! I'm in PYQ Solver mode. Paste any question or exam numerical, and I'll solve it step-by-step showing all formulas used." },
  { id: 'plan', label: 'Study Planner', desc: 'Generates custom study schedules and test prep strategies.', icon: Calendar, emoji: '📅', intro: "Hi! I'm in Study Planner mode. Let me know what exam you're preparing for and how many days you have, and I'll build you a schedule." },
  { id: 'resume', label: 'Resume Reviewer', desc: 'Reviews resume text and provides tips for placement portfolios.', icon: FileText, emoji: '📄', intro: "Hi! I'm in Resume Reviewer mode. Paste any resume section, project description, or bullet point, and I'll help you improve it for tech placement selectors." },
  { id: 'interview', label: 'Mock Interviewer', desc: 'Simulates a mock technical interview one question at a time.', icon: Briefcase, emoji: '💼', intro: "Hi! I'm in Mock Interviewer mode. Let me know what role or topics you want to practice, and I'll start asking you questions like a real interviewer!" },
];

const SUGGESTED_PROMPTS = {
  explain: [
    "Explain Dijkstra's Algorithm in simple terms.",
    "How does a Fourier Transform work in ENTC?",
    "Derive the bending stress formula in beams."
  ],
  solve: [
    "Solve: If matrix A is orthogonal, prove det(A) = ±1.",
    "Find the Laplace Transform of t^2 * sin(at).",
    "How to solve a Context-Free Grammar normalization question?"
  ],
  plan: [
    "Create a 7-day study plan for CSE Data Structures MSE.",
    "Divide my time to study for Mechanical Thermodynamics ESE.",
    "Suggest a timeline for a final year capstone project."
  ],
  resume: [
    "Review my DSA project bullet for my resume.",
    "Improve my web dev internship details to sound more impactful.",
    "List top resume writing tips for VIT Pune placements."
  ],
  interview: [
    "Start a technical mock interview for software dev role.",
    "Test me on DBMS and Operating System fundamentals.",
    "Ask me system design questions for a scaling chat app."
  ]
};

function AIContent() {
  const [activeMode, setActiveMode] = useState(MODES[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: activeMode.intro, typing: false }]);
  }, [activeMode]);

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
        body: JSON.stringify({ message: userMsg, history: messages, mode: activeMode.id }),
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

  const handleSuggestionClick = async (promptText) => {
    if (loading) return;
    setMessages(prev => [...prev, { role: 'user', content: promptText, typing: false }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText, history: messages, mode: activeMode.id }),
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
    <div className="page-content" style={{ padding: 'clamp(var(--space-2), 3vw, var(--space-6))', height: 'calc(100vh - var(--navbar-height))', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b0f19' }}>
      
      {/* Main Grid Wrapper */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        gap: 'clamp(12px, 2vw, 24px)',
        height: isMobile ? 'calc(100vh - var(--navbar-height) - 32px)' : '85vh',
        position: 'relative'
      }}>
        
        {/* Left Sidebar Mode Selector */}
        <div className={`ai-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
          width: '280px',
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          display: sidebarOpen ? 'flex' : 'none',
          flexDirection: 'column',
          padding: '24px 16px',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease-in-out',
          position: isMobile ? 'absolute' : 'relative',
          height: '100%',
          zIndex: isMobile ? 50 : 1,
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-150%)') : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Select Assistant Mode</span>
            </h3>
            <button className="navbar-hamburger" onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            {MODES.map(m => {
              const Icon = m.icon;
              const isActive = activeMode.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMode(m);
                    setSidebarOpen(false);
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)'}`,
                    background: isActive ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.01)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    outline: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13.5px' }}>
                    <Icon size={16} style={{ color: isActive ? 'var(--accent-primary-hover)' : 'var(--text-tertiary)' }} />
                    <span>{m.label}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,0.65)' : 'var(--text-tertiary)', lineHeight: '1.4' }}>{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Container */}
        <div style={{
          flex: 1,
          background: 'rgba(15, 23, 41, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          width: isMobile ? '100%' : 'auto'
        }}>
          {/* Header */}
          <div style={{ padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 32px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex', marginRight: '4px' }}>
                <Menu size={20} />
              </button>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: '24px' }}>{activeMode.emoji}</span>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{activeMode.label} Mode</h2>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Personal Academic Copilot</p>
              </div>
            </div>
            <button 
              className="btn btn-ghost" 
              onClick={() => setMessages([{ role: 'assistant', content: activeMode.intro, typing: false }])} 
              style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', background: 'transparent', cursor: 'pointer' }}
            >
              Clear Chat
            </button>
          </div>

          {/* Messages list */}
          <div className="chat-messages" style={{ flex: 1, padding: 'clamp(16px, 4vw, 24px)', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', alignSelf: isUser ? 'flex-end' : 'flex-start', gap: '10px', maxWidth: '85%', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    background: isUser ? '#6366f1' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  }}>
                    {isUser ? '👤' : activeMode.emoji}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '16px',
                    fontSize: '14.5px',
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
            
            {/* Suggested Prompts Render */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', alignSelf: 'flex-start', gap: '10px', maxWidth: '85%', flexDirection: 'row', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 'var(--fw-semibold)', margin: '4px 0' }}>Suggested starting points:</p>
                  {SUGGESTED_PROMPTS[activeMode.id].map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(promptText)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        outline: 'none'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <span>✨</span>
                      <span>{promptText}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {loading && (
              <div style={{ display: 'flex', alignSelf: 'flex-start', gap: '10px', maxWidth: '85%', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                }}>
                  {activeMode.emoji}
                </div>
                <div style={{ display: 'flex', gap: '8px', padding: '14px 20px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '13.5px', color: '#94a3b8' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 32px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 'clamp(8px, 2vw, 16px)' }}>
              <input
                placeholder={`Ask in ${activeMode.label} Mode...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  background: '#0b0f19',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '24px',
                  padding: '14px 20px',
                  color: '#f8fafc',
                  outline: 'none',
                  fontSize: 'clamp(13px, 3.5vw, 14.5px)',
                  transition: 'all 0.3s ease',
                  width: '100%'
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
                  padding: '0 20px',
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
                    <span style={{ display: isMobile ? 'none' : 'inline' }}>Send</span>
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