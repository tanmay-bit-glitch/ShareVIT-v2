'use client';

import Link from 'next/link';
import { Heart, Github, Linkedin } from 'lucide-react';

const footerLinks = {
  Features: [
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/notes', label: 'Notes & PYQs' },
    { href: '/assignments', label: 'Assignments' },
    { href: '/requests', label: 'Requests' },
    { href: '/dashboard', label: 'Dashboard' },
  ],
  Tools: [
    { href: '/tools/gpa-calculator', label: 'GPA Calculator' },
    { href: '/tools/attendance', label: 'Attendance Tracker' },
    { href: '/tools/timetable', label: 'Timetable Builder' },
    { href: '/tools/deadline-tracker', label: 'Deadline Tracker' },
  ],
  More: [
    { href: '/ai-assistant', label: 'AI Assistant' },
    { href: '/chat', label: 'Student Chat' },
    { href: '/cart', label: 'My Cart' },
    { href: '/profile', label: 'Profile' },
  ],
};

const developers = [
  { name: 'Tanmay Chavanke', role: 'Full-Stack Developer & Founder', github: '#', linkedin: '#' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="navbar-logo" style={{ marginBottom: '0.75rem' }}>
              <span className="navbar-logo-icon">📤</span>
              <span>Share<span style={{ color: 'var(--accent-primary)' }}>VIT</span></span>
            </div>
            <p style={{ color: 'var(--text-tertiary)', lineHeight: 1.7, maxWidth: 280, fontSize: '0.875rem', marginBottom: '1rem' }}>
              The go-to resource sharing platform for VIT Pune students. Buy, sell, share notes, and connect with your community.
            </p>
            {/* Dev credits */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Built with <Heart size={10} style={{ display: 'inline', color: '#ef4444' }} /> by</p>
              {developers.map(dev => (
                <div key={dev.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{dev.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>— {dev.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="footer-heading">{heading}</h4>
              <ul className="footer-links">
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ShareVIT — Built for VIT Pune Students · Bibwewadi & Kondhwa Campus</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Made with passion in Pune 🇮🇳 · Not affiliated with official VIT institutions
          </p>
        </div>
      </div>
    </footer>
  );
}