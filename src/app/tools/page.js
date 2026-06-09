'use client';
import Link from 'next/link';

import { GraduationCap, BarChart2, Calendar, Clock } from 'lucide-react';

const tools = [
  { href: '/tools/gpa-calculator', icon: GraduationCap, title: 'GPA Calculator', desc: 'Calculate your SGPA & CGPA with VIT grading system', color: '#3b82f6' },
  { href: '/tools/attendance', icon: BarChart2, title: 'Attendance Tracker', desc: 'Track attendance and calculate classes needed or can skip', color: '#10b981' },
  { href: '/tools/timetable', icon: Calendar, title: 'Timetable Builder', desc: 'Create and manage your weekly class schedule', color: '#8b5cf6' },
  { href: '/tools/deadline-tracker', icon: Clock, title: 'Deadline Tracker', desc: 'Track assignment submissions, exams & deadlines', color: '#f59e0b' },
];

export default function ToolsPage() {
  return (
    <div className="page-content"><div className="container" style={{maxWidth:'900px'}}>
      <div className="page-header text-center animate-fadeInUp">
        <h1>Academic Tools</h1>
        <p>Utilities to help you manage your academic life at VIT</p>
      </div>
      <div className="grid grid-2 stagger-children">
        {tools.map(t => (
          <Link key={t.href} href={t.href} className="card-glass card-interactive" style={{textDecoration:'none',color:'inherit',padding:'var(--space-8)'}}>
            <div style={{width:56,height:56,borderRadius:'var(--radius-lg)',background:`${t.color}20`,color:t.color,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'var(--space-4)'}}><t.icon size={28} /></div>
            <h3 style={{fontSize:'var(--fs-xl)',marginBottom:'var(--space-2)'}}>{t.title}</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'var(--fs-sm)',lineHeight:'var(--lh-relaxed)'}}>{t.desc}</p>
            <span style={{color:t.color,marginTop:'var(--space-4)',display:'block',fontWeight:'var(--fw-semibold)',fontSize:'var(--fs-sm)'}}>Open Tool →</span>
          </Link>
        ))}
      </div>
    </div></div>
  );
}
