'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, BookOpen, FileText, ClipboardList, Bot, MessageSquare, Wrench, Star, ArrowRight, Users, Upload, Zap, Shield, CheckCircle } from 'lucide-react';

const features = [
  { href: '/marketplace', icon: ShoppingCart, title: 'Student Marketplace', desc: 'Buy, sell, rent, donate or exchange books, electronics, lab equipment & more with verified VIT students.', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  { href: '/notes', icon: BookOpen, title: 'Notes & PYQ Repository', desc: 'Access and share class notes, previous year papers, and study materials organized by branch and semester.', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  { href: '/assignments', icon: FileText, title: 'Assignment Repository', desc: 'Find and share solved assignments, lab manuals, and project reports from your department.', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  { href: '/requests', icon: ClipboardList, title: 'Resource Request Board', desc: 'Post requests for specific resources and let the community help you find what you need.', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  { href: '/ai-assistant', icon: Bot, title: 'AI Academic Assistant', desc: 'Get instant help with academics — powered by Gemini AI, trained to assist VIT students.', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  { href: '/chat', icon: MessageSquare, title: 'Student Communities', desc: 'Connect with fellow VIT students in branch-specific rooms. Discuss courses, share tips, and build your network.', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
  { href: '/tools', icon: Wrench, title: 'Academic Tools', desc: 'GPA calculator, attendance tracker, timetable builder, and deadline tracker — all in one place.', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
];

const stats = [
  { value: '2,400+', label: 'Active Students', icon: Users },
  { value: '12,000+', label: 'Resources Shared', icon: Upload },
  { value: '4.8★', label: 'Student Rating', icon: Star },
  { value: '100%', label: 'Free to Use', icon: Zap },
];

const testimonials = [
  {
    name: 'Arjun Mehta',
    branch: 'CSE, 3rd Year',
    avatar: 'AM',
    color: '#6366f1',
    text: "ShareVIT literally saved my semester. Found PYQs for 4 subjects the night before exams and sold my old DSP lab manual in under 2 hours. Best student app at VIT Pune, period.",
    stars: 5,
  },
  {
    name: 'Priya Kulkarni',
    branch: 'ENTC, 2nd Year',
    avatar: 'PK',
    color: '#10b981',
    text: "The AI Copilot is insane. I pasted my resume, asked it to review for software roles, and got a detailed breakdown in seconds. Got shortlisted at 3 companies this placement season.",
    stars: 5,
  },
  {
    name: 'Rohan Desai',
    branch: 'Mechanical, 4th Year',
    avatar: 'RD',
    color: '#f59e0b',
    text: "I uploaded my semester notes and earned 450 XP in one go. The community here actually helps — asked for a textbook at 11pm and had a response within 20 minutes. Incredible.",
    stars: 5,
  },
];

const howItWorks = [
  { step: '01', icon: Shield, title: 'Create your VIT account', desc: 'Sign up with your VIT email in under 30 seconds. Your account is automatically verified.' },
  { step: '02', icon: Upload, title: 'Share & discover resources', desc: 'Upload notes, list items for sale, or browse thousands of student resources instantly.' },
  { step: '03', icon: Zap, title: 'Earn XP & grow together', desc: 'Every contribution earns you points. Climb the leaderboard and unlock exclusive badges.' },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero" style={{ paddingTop: 'calc(var(--navbar-height) + 5rem)', paddingBottom: '5rem' }}>
        {/* Animated orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'heroGlow 8s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'heroGlow 10s ease-in-out infinite reverse', pointerEvents: 'none' }} />

        <div className="hero-content container animate-fadeInUp" style={{ position: 'relative', zIndex: 1 }}>
          {/* Pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 9999, padding: '6px 16px', marginBottom: '2rem', fontSize: '0.8rem', fontWeight: 600, color: '#818cf8' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block' }} />
            VIT Pune&apos;s #1 Student Platform
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Everything VIT Students<br />
            Need, <span className="gradient-text">All In One Place</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: 580, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Marketplace · Notes & PYQs · AI Copilot · Placement Hub · Student Communities — built exclusively for VIT Pune.
          </p>

          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <Link href="/marketplace" className="btn btn-primary btn-lg" style={{ borderRadius: 9999, padding: '14px 32px', fontSize: '1rem' }}>
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
                <Link href="/ai-assistant" className="btn btn-secondary btn-lg" style={{ borderRadius: 9999, padding: '14px 32px', fontSize: '1rem' }}>
                  Try AI Copilot
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup" className="btn btn-primary btn-lg" style={{ borderRadius: 9999, padding: '14px 32px', fontSize: '1rem' }}>
                  Get Started — It&apos;s Free <ArrowRight size={18} />
                </Link>
                <Link href="/login" className="btn btn-secondary btn-lg" style={{ borderRadius: 9999, padding: '14px 32px', fontSize: '1rem' }}>
                  Log In
                </Link>
              </>
            )}
          </div>

          {/* Social proof avatars */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: '2.5rem' }}>
            <div style={{ display: 'flex' }}>
              {['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'].map((c, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: '2px solid var(--bg-primary)', marginLeft: i === 0 ? 0 : -10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {['A','P','R','S','K'][i]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>2,400+</strong> students already on ShareVIT
            </span>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'rgba(15,23,41,0.4)' }}>
        <div className="container">
          <div className="grid grid-4 stagger-children">
            {stats.map(s => (
              <div key={s.label} className="animate-fadeInUp" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <s.icon size={24} color="var(--accent-primary)" />
                </div>
                <div style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section style={{ padding: '6rem 0' }}>
        <div className="container">
          <div className="page-header text-center animate-fadeInUp" style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 9999, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', marginBottom: '1rem' }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>Up and running in minutes</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 500, margin: '0.75rem auto 0' }}>No setup, no confusion. Just sign up and start sharing.</p>
          </div>
          <div className="grid grid-3 stagger-children">
            {howItWorks.map((step) => (
              <div key={step.step} className="animate-fadeInUp" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
                <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '1.5rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <step.icon size={28} color="#818cf8" />
                  </div>
                  <span style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>{step.step.slice(-1)}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section style={{ padding: '2rem 0 6rem' }}>
        <div className="container">
          <div className="page-header text-center animate-fadeInUp" style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 9999, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', marginBottom: '1rem' }}>PLATFORM FEATURES</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>Everything you need to<br />ace your semester</h2>
          </div>
          <div className="grid grid-4 stagger-children">
            {features.map(f => (
              <Link key={f.href} href={f.href} className="card-glass card-interactive" style={{ textDecoration: 'none', color: 'inherit', padding: '1.75rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: `1px solid ${f.color}30` }}>
                  <f.icon size={22} color={f.color} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1rem' }}>{f.desc}</p>
                <span style={{ color: f.color, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Explore <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section style={{ padding: '4rem 0 6rem', background: 'rgba(15,23,41,0.5)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="page-header text-center animate-fadeInUp" style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 9999, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', marginBottom: '1rem' }}>STUDENT REVIEWS</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>Loved by VIT students</h2>
          </div>
          <div className="grid grid-3 stagger-children">
            {testimonials.map((t, i) => (
              <div key={i} className="card-glass animate-fadeInUp" style={{ padding: '1.75rem' }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: '1rem' }}>
                  {Array(t.stars).fill(0).map((_, si) => (
                    <Star key={si} size={14} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                {/* Quote */}
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '1.25rem', fontStyle: 'italic' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t.branch}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <CheckCircle size={16} color="#10b981" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div className="container animate-fadeInUp">
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 32, position: 'relative', overflow: 'hidden' }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 200, background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚀</div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                Ready to join your classmates?
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem', lineHeight: 1.7 }}>
                2,400+ VIT Pune students are already sharing resources,<br />
                prepping for placements, and earning XP. Don&apos;t miss out.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/signup" className="btn btn-primary btn-lg" style={{ borderRadius: 9999, padding: '14px 36px' }}>
                  Create Free Account <ArrowRight size={18} />
                </Link>
                <Link href="/placement" className="btn btn-secondary btn-lg" style={{ borderRadius: 9999, padding: '14px 28px' }}>
                  View Placement Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}