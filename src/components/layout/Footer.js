'use client';

import Link from 'next/link';

const footerLinks = {
  Marketplace: [
    { href: '/marketplace', label: 'Browse Listings' },
    { href: '/marketplace/create', label: 'Create Listing' },
    { href: '/requests', label: 'Student Requests' },
    { href: '/profile?tab=wishlist', label: 'Active Wishlist' },
  ],
  Community: [
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/academics', label: 'Gamification & XP' },
    { href: '/chat', label: 'Student Chat' },
  ],
  Support: [
    { href: '/ai-assistant', label: 'AI Assistant' },
    { href: '/academics', label: 'Help Center' },
    { href: 'mailto:support@sharevit.com', label: 'Report Issue' },
  ],
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="navbar-logo" style={{ marginBottom: 'var(--space-4)' }}>
              <span className="navbar-logo-icon">📤</span>
              <span>Share<span style={{ color: 'var(--accent-primary)' }}>VIT</span></span>
            </div>
            <p style={{ color: 'var(--text-tertiary)', lineHeight: 'var(--lh-relaxed)', maxWidth: 300 }}>
              The go-to resource sharing platform for VIT Pune students. Buy, sell, share notes, and connect with fellow students.
            </p>
          </div>
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
          <p>© {new Date().getFullYear()} ShareVIT — Built for VIT Pune Students</p>
        </div>
      </div>
    </footer>
  );
}