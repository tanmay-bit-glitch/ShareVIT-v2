'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ShoppingCart, BookOpen, FileText, ClipboardList, Bot, MessageSquare, Wrench, ArrowRight, TrendingUp, Star, Zap, Award, Upload } from 'lucide-react';

const quickLinks = [
  { href: '/marketplace', icon: ShoppingCart, label: 'Marketplace', color: '#6366f1', desc: 'Buy & sell' },
  { href: '/notes', icon: BookOpen, label: 'Notes & PYQs', color: '#3b82f6', desc: 'Study materials' },
  { href: '/assignments', icon: FileText, label: 'Assignments', color: '#8b5cf6', desc: 'Lab & reports' },
  { href: '/requests', icon: ClipboardList, label: 'Requests', color: '#10b981', desc: 'Ask community' },
  { href: '/ai-assistant', icon: Bot, label: 'AI Assistant', color: '#f59e0b', desc: 'Ask anything' },
  { href: '/chat', icon: MessageSquare, label: 'Community', color: '#ef4444', desc: 'Student chat' },
  { href: '/tools', icon: Wrench, label: 'Tools', color: '#06b6d4', desc: 'GPA & more' },
];

const badges = [
  { icon: '📚', name: 'First Upload', desc: 'Uploaded your first resource', earned: true },
  { icon: '🛒', name: 'First Sale', desc: 'Sold your first item', earned: false },
  { icon: '💬', name: 'Community Star', desc: 'Sent 50+ messages', earned: false },
  { icon: '🤖', name: 'AI Explorer', desc: 'Used AI Assistant 10x', earned: false },
  { icon: '🏆', name: 'Top Contributor', desc: 'Ranked in top 10 this month', earned: false },
  { icon: '⚡', name: 'Power User', desc: 'Active for 7 days straight', earned: false },
];

const recentActivity = [
  { icon: '📤', text: 'You uploaded "DSP Unit 4 Notes"', time: '2 hours ago', color: '#6366f1' },
  { icon: '💬', text: 'New reply in Student Chat', time: '4 hours ago', color: '#ef4444' },
  { icon: '🛍️', text: 'Your listing "Calculus Textbook" got 3 views', time: 'Yesterday', color: '#10b981' },
];

export default function DashboardPage() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}

function DashboardContent() {
  const { user, userData } = useAuth();
  const displayName = userData?.displayName || user?.email?.split('@')[0] || 'Student';
  const initial = displayName[0]?.toUpperCase() || '?';
  const xp = 320; // placeholder — can be wired to Firebase later
  const xpMax = 500;
  const level = 3;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-content">
      <div className="container">

        {/* ── WELCOME BANNER ── */}
        <div className="animate-fadeInUp" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 24, padding: '2.5rem', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          {/* BG orb */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 20px rgba(99,102,241,0.4)', border: '3px solid rgba(255,255,255,0.1)' }}>
              {initial}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{getGreeting()},</p>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{displayName} 👋</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Welcome back to ShareVIT. Here&apos;s your activity overview.</p>
            </div>
            {/* XP Bar */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} color="#f59e0b" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>Level {level}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{xp}/{xpMax} XP</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(xp / xpMax) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 9999, transition: 'width 1s ease' }} />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>{xpMax - xp} XP to Level {level + 1}</p>
            </div>
          </div>
        </div>

        {/* ── QUICK STATS ── */}
        <div className="grid grid-4 stagger-children" style={{ marginBottom: '2.5rem' }}>
          {[
            { icon: Upload, label: 'Resources Shared', value: '4', color: '#6366f1' },
            { icon: ShoppingCart, label: 'Listings Active', value: '2', color: '#10b981' },
            { icon: MessageSquare, label: 'Messages Sent', value: '87', color: '#ef4444' },
            { icon: Star, label: 'XP Earned', value: `${xp}`, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="card-glass animate-fadeInUp" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={18} color={s.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', marginBottom: '2.5rem' }}>

          {/* Quick Links */}
          <div className="card-glass animate-fadeInUp" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="var(--accent-primary)" />
              Quick Access
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {quickLinks.map(l => (
                <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                  <div className="card-interactive" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${l.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem', border: `1px solid ${l.color}25` }}>
                      <l.icon size={18} color={l.color} />
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{l.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{l.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card-glass animate-fadeInUp" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{a.icon}</div>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{a.text}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem', textDecoration: 'none' }}>
              View all activity <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ── BADGES ── */}
        <div className="card-glass animate-fadeInUp" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={16} color="var(--accent-primary)" />
              Achievements & Badges
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>1 / {badges.length} unlocked</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {badges.map((b, i) => (
              <div key={i} style={{ padding: '1rem', background: b.earned ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${b.earned ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 14, opacity: b.earned ? 1 : 0.5, transition: 'all 0.2s' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{b.icon}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: b.earned ? 'var(--text-primary)' : 'var(--text-tertiary)', marginBottom: 2 }}>{b.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{b.desc}</div>
                {b.earned && <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600, marginTop: '0.4rem' }}>✓ Earned</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── EXPLORE CTA ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <Link href="/marketplace" style={{ textDecoration: 'none' }}>
            <div className="card-glass card-interactive animate-fadeInUp" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.04) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <ShoppingCart size={22} color="#818cf8" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Browse Marketplace</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Find books, electronics & more from fellow students</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#818cf8', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.75rem' }}>Explore <ArrowRight size={13} /></div>
            </div>
          </Link>
          <Link href="/notes" style={{ textDecoration: 'none' }}>
            <div className="card-glass card-interactive animate-fadeInUp" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.04) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <BookOpen size={22} color="#60a5fa" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Browse Notes & PYQs</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Find study materials organized by branch and semester</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#60a5fa', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.75rem' }}>Explore <ArrowRight size={13} /></div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
