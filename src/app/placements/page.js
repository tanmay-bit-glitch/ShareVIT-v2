'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Briefcase, TrendingUp, Sparkles, Award, FileText, 
  Terminal, ShieldCheck, Map, ExternalLink, BookOpen, AlertCircle, ShoppingCart
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlacementsPage() {
  return (
    <ProtectedRoute>
      <PlacementsContent />
    </ProtectedRoute>
  );
}

function PlacementsContent() {
  const { userData } = useAuth();
  const { level, streak } = useGamification();

  const mockJobs = [];

  const techCategories = [
    { title: 'IoT & Microcontrollers', desc: 'Arduino starter kits, ESP32 boards, Raspberry Pi, sensors, breadboards.', count: 14, icon: Terminal, color: 'var(--accent-primary)' },
    { title: 'Reference Textbooks', desc: 'Cracking the Coding Interview, DBMS manuals, OS guides, placement test prep booklets.', count: 28, icon: BookOpen, color: 'var(--accent-info)' },
    { title: 'Project Hardware & Tools', desc: 'Digital multimeters, soldering irons, component packages, lab coats.', count: 9, icon: ShoppingCart, color: 'var(--accent-success)' }
  ];

  return (
    <div className="page-content" style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Placement Resources Hub
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>Get the engineering tools, project hardware, and study sheets you need for placement season.</p>
          </div>
          <span className="badge badge-success" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--fs-base)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Briefcase size={18} style={{ color: 'var(--accent-success)' }} /> Active Level: {level}
          </span>
        </div>

        {/* Info Banner about ERP Streamlining */}
        <div className="card-glass" style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-4) var(--space-5)', background: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99, 102, 241, 0.2)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertCircle size={22} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: '0 0 4px', color: '#fff' }}>DSA Logs & Resume Metrics Streamlined</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: 0, lineHeight: 1.4 }}>
              To prevent ERP clutter, personal DSA solvers and resume grade percentages have been removed. Instead, use this hub to get project hardware and placement reference manuals from seniors, or list your own tech gear when you are placed!
            </p>
          </div>
        </div>

        {/* Dashboard Grid showing Recommended Prep Categories */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
          {techCategories.map((cat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="card-glass flex-col gap-3 card-interactive"
              style={{ padding: 'var(--space-6)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <cat.icon size={26} style={{ color: cat.color }} />
                <span className="badge badge-info" style={{ fontSize: '10px' }}>{cat.count} listings</span>
              </div>
              <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', margin: '4px 0 0' }}>{cat.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', lineHeight: 1.5, margin: 0 }}>
                {cat.desc}
              </p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 'auto', alignSelf: 'flex-start', padding: '6px 12px', fontSize: 'var(--fs-xs)' }}>
                Browse Category →
              </button>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          
          {/* Left Column: Jobs List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)' }}>Featured Opportunities & Internships</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {mockJobs.length === 0 ? (
                <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                  <Briefcase size={36} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>No openings active at this moment. Trade textbooks and tools to prepare in the meantime!</p>
                </div>
              ) : (
                mockJobs.map(job => (
                  <div key={job.id} className="card-glass" style={{ padding: 'var(--space-5)' }}>
                    {/* Placeholder for future jobs integration */}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Career Rewards & Study Sheets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Career XP Rewards Card */}
            <div className="card-glass flex-col gap-3" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-success)' }}>
                <TrendingUp size={18} /> Career Earning Rules
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: 0 }}>Level up your campus portfolio by trading gear during placement preparation:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--fs-xs)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>📦 Post Placement Prep Book</span><strong style={{ color: 'var(--accent-success)' }}>+50 XP</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>⚡ Rent out Arduino/IoT Kit</span><strong style={{ color: 'var(--accent-success)' }}>+80 XP</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>🤝 Buy Calculator / drafter</span><strong style={{ color: 'var(--accent-success)' }}>+40 XP</strong></div>
              </div>
            </div>

            <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)' }}>Study Sheets & Guides</h3>
            
            <div className="card-glass flex-col gap-4">
              {[
                { title: 'SDE Core Interview Roadmap', icon: Map, color: 'var(--accent-primary)' },
                { title: 'Top 100 DSA Interview Guide', icon: Terminal, color: 'var(--accent-success)' },
                { title: 'DBMS & OS Cheat Sheets', icon: BookOpen, color: 'var(--accent-info)' },
                { title: 'System Design Fundamentals', icon: Map, color: 'var(--accent-secondary)' },
              ].map((sheet, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i === 3 ? 0 : 'var(--space-3)', borderBottom: i === 3 ? 'none' : '1px solid var(--border-color)', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <sheet.icon size={16} style={{ color: sheet.color }} />
                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>{sheet.title}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px', marginLeft: 'auto' }}><ExternalLink size={14} /></button>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
