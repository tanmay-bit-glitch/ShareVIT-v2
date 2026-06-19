'use client';

import Link from 'next/link';
import { Sparkles, MessageSquare, Award, HelpCircle } from 'lucide-react';

const marketplaceTools = [
  { href: '/ai-assistant', icon: Sparkles, title: 'AI Assistant', desc: 'Scan bills, analyze item prices, or get assistance with listings.', color: '#6366f1' },
  { href: '/chat', icon: MessageSquare, title: 'Campus Chat', desc: 'Discuss and coordinate item handoffs with other VIT students.', color: '#3b82f6' },
  { href: '/academics', icon: Award, title: 'Gamification & Portfolio', desc: 'Track your Seller level, trust score, achievements, and streak.', color: '#8b5cf6' }
];

export default function ToolsPage() {
  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '900px' }}>
        
        <div className="page-header text-center animate-fadeInUp">
          <h1>Marketplace Tools</h1>
          <p>Utilities built to support secure transactions, item discovery, and trust within VIT Pune.</p>
        </div>

        {/* Info Banner */}
        <div className="card-glass" style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-4) var(--space-5)', background: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99, 102, 241, 0.15)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: 0 }}>
            ℹ️ To prioritize transactions, discovery, and student trust, legacy academic utilities (like attendance loggers and timetable builders) have been retired.
          </p>
        </div>

        <div className="grid grid-3 stagger-children">
          {marketplaceTools.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href} className="card-glass card-interactive" style={{ textDecoration: 'none', color: 'inherit', padding: 'var(--space-6)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: `${t.color}20`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-2)' }}>{t.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-relaxed)' }}>{t.desc}</p>
                <span style={{ color: t.color, marginTop: 'var(--space-4)', display: 'block', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-sm)' }}>
                  Open →
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
