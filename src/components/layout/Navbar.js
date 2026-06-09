'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { ShoppingCart, BookOpen, FileText, ClipboardList, Bot, MessageSquare, Wrench, Menu, X, User, LogOut } from 'lucide-react';

const navLinks = [
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
  { href: '/notes', label: 'Notes & PYQs', icon: BookOpen },
  { href: '/assignments', label: 'Assignments', icon: FileText },
  { href: '/requests', label: 'Requests', icon: ClipboardList },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/tools', label: 'Tools', icon: Wrench },
];

export default function Navbar() {
  const { user, userData, signOut, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-left">
            <button className="navbar-hamburger hide-tablet-up" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={24} />
            </button>
            <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Image src="/logo.png" alt="ShareVIT Logo" width={36} height={36} style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
              <span>Share<span style={{ color: 'var(--accent-primary)' }}>VIT</span></span>
            </Link>
          </div>

          {isAuthenticated && (
            <ul className="navbar-links">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className={pathname?.startsWith(link.href) ? 'active' : ''}>
                    <link.icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="navbar-right">
            {isAuthenticated ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <div className="navbar-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  {getInitials(userData?.displayName)}
                </div>
                {dropdownOpen && (
                  <div className="navbar-dropdown">
                    <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-color)', marginBottom: 'var(--space-2)' }}>
                      <p style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', fontSize: 'var(--fs-sm)' }}>
                        {userData?.displayName || 'Student'}
                      </p>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)', marginTop: '2px' }}>
                        {user?.email}
                      </p>
                    </div>
                    <Link href="/profile" onClick={() => setDropdownOpen(false)}>
                      <User size={16} /> Profile
                    </Link>
                    <button onClick={() => { setDropdownOpen(false); signOut(); }} style={{ color: 'var(--accent-danger)' }}>
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-row gap-3">
                <Link href="/login" className="btn btn-ghost">Log In</Link>
                <Link href="/signup" className="btn btn-primary">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <div className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <Link href="/" className="navbar-logo" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Image src="/logo.png" alt="ShareVIT Logo" width={36} height={36} style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
            <span>Share<span style={{ color: 'var(--accent-primary)' }}>VIT</span></span>
          </Link>
          <button className="mobile-nav-close" onClick={() => setMobileOpen(false)}><X size={24} /></button>
        </div>
        <ul className="mobile-nav-links">
          {navLinks.map(link => (
            <li key={link.href}>
              <Link href={link.href} className={pathname?.startsWith(link.href) ? 'active' : ''} onClick={() => setMobileOpen(false)}>
                <link.icon size={20} />
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
          <li style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            {isAuthenticated ? (
              <>
                <Link href="/profile" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><User size={20} /> Profile</Link>
                <button
                  onClick={() => { setMobileOpen(false); signOut(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', width: '100%', border: 'none', background: 'none', color: 'var(--accent-danger)', fontSize: 'var(--fs-base)', cursor: 'pointer' }}
                >
                  <LogOut size={20} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><User size={20} /> Log In</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><FileText size={20} /> Sign Up</Link>
              </>
            )}
          </li>
        </ul>
      </div>
    </>
  );
}