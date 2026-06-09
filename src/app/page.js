'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import { ShoppingCart, BookOpen, FileText, ClipboardList, Bot, MessageSquare, Wrench } from 'lucide-react';

const features = [
  { href: '/marketplace', icon: ShoppingCart, title: 'Student Marketplace', desc: 'Buy, sell, rent, donate or exchange books, electronics, lab equipment & more with verified VIT students.', color: '#6366f1' },
  { href: '/notes', icon: BookOpen, title: 'Notes & PYQ Repository', desc: 'Access and share class notes, previous year papers, and study materials organized by branch and semester.', color: '#3b82f6' },
  { href: '/assignments', icon: FileText, title: 'Assignment Repository', desc: 'Find and share solved assignments, lab manuals, and project reports from your department.', color: '#8b5cf6' },
  { href: '/requests', icon: ClipboardList, title: 'Resource Request Board', desc: 'Post requests for specific resources and let the community help you find what you need.', color: '#10b981' },
  { href: '/ai-assistant', icon: Bot, title: 'AI Academic Assistant', desc: 'Get instant help with academics — powered by Gemini AI, trained to assist VIT students.', color: '#f59e0b' },
  { href: '/chat', icon: MessageSquare, title: 'Student Chat', desc: 'Connect with fellow VIT students in real-time. Discuss courses, share tips, and build your network.', color: '#ef4444' },
  { href: '/tools', icon: Wrench, title: 'Academic Tools', desc: 'GPA calculator, attendance tracker, timetable builder, and deadline tracker — all in one place.', color: '#06b6d4' },
];

const stats = [
  { value: '7+', label: 'Features' },
  { value: 'VIT', label: 'Pune Exclusive' },
  { value: '24/7', label: 'AI Assistant' },
  { value: '100%', label: 'Free to Use' },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content container animate-fadeInUp">
          <h1>
            Everything VIT Students Need,
            <br />
            <span className="gradient-text">All In One Place</span>
          </h1>
          <p>
            ShareVIT is the ultimate resource-sharing platform built exclusively for VIT Pune students.
            Buy, sell, share notes, track attendance, and connect with your peers.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link href="/marketplace" className="btn btn-primary btn-lg">Explore Marketplace</Link>
            ) : (
              <>
                <Link href="/signup" className="btn btn-primary btn-lg">Get Started — It&apos;s Free</Link>
                <Link href="/login" className="btn btn-secondary btn-lg">Log In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="page-content" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-8)' }}>
        <div className="container">
          <div className="grid grid-4 stagger-children">
            {stats.map(s => (
              <div key={s.label} className="stat-card animate-fadeInUp">
                <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-content" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="page-header text-center animate-fadeInUp">
            <h2 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)' }}>
              Packed with Features
            </h2>
            <p>Everything you need for academic success at VIT Pune</p>
          </div>
          <div className="grid grid-3 stagger-children">
            {features.map(f => (
              <Link key={f.href} href={f.href} className="card-glass card-interactive" style={{ textDecoration: 'none', color: 'inherit', padding: 'var(--space-8)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: `${f.color}20`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                  <f.icon size={28} />
                </div>
                <h3 style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--space-2)' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-relaxed)' }}>{f.desc}</p>
                <span style={{ color: f.color, marginTop: 'var(--space-4)', display: 'block', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-sm)' }}>
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <div className="container animate-fadeInUp">
          <div className="card-glass" style={{ padding: 'var(--space-16) var(--space-8)', maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)', marginBottom: 'var(--space-4)' }}>
              Ready to Get Started?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', maxWidth: 450, margin: '0 auto var(--space-8)' }}>
              Join your fellow VIT Pune students and start sharing resources today.
            </p>
            <Link href="/signup" className="btn btn-primary btn-lg">Create Your Account</Link>
          </div>
        </div>
      </section>
    </>
  );
}