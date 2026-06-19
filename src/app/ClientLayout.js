'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { GamificationProvider, useGamification } from '@/context/GamificationContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartFAB from '@/components/layout/CartFAB';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Award, Flame, X, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <GamificationProvider>
          <Navbar />
          <main className="page-wrapper app-layout-content">
            {children}
          </main>
          <CartFAB />
          <div className="app-layout-content">
            <Footer />
          </div>
          <GamificationOverlays />
        </GamificationProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

function GamificationOverlays() {
  const {
    level,
    levelTitle,
    xpToasts,
    levelUpData,
    setLevelUpData,
    showOnboarding,
    completeOnboarding,
    activeTourStep,
    nextTourStep,
    skipTour,
  } = useGamification();

  const tourSteps = [
    { title: '🛒 The Marketplace', desc: 'Browse and search for textbooks, electronics, drawing kits, hostel essentials, or cycles sold and rented by peers.' },
    { title: '📋 Item Requests', desc: "Can't find what you need? Post a request here to let student sellers know what you're looking to buy." },
    { title: '🤖 AI Assistant', desc: 'Chat with our AI companion to scan your resume, explain complex formulas, or brainstorm project ideas.' },
    { title: '💬 Student Chat', desc: 'Securely message buyers and sellers to negotiate prices, set meeting spots, and swap item coordinates.' },
    { title: '🛠️ Student Tools', desc: 'Calculate utility shares, verify transactions, or explore calculators built directly by other students.' },
    { title: '👤 Student Portfolio', desc: 'Access your profile to check your Trust Score, view repeat customers, check reviews, and update social handles.' }
  ];

  return (
    <>
      {/* 1. WELCOME ONBOARDING MODAL */}
      <AnimatePresence>
        {showOnboarding && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-glass"
              style={{ maxWidth: '520px', width: '100%', padding: 'var(--space-6)', border: '1px solid rgba(99, 102, 241, 0.25)', boxShadow: 'var(--shadow-glow)' }}
            >
              <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-extrabold)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center', margin: '0 0 16px' }}>
                Welcome to ShareVIT! 👋
              </h2>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', textAlign: 'center', lineHeight: 1.5, marginBottom: '24px' }}>
                Your trusted, peer-to-peer student marketplace. Buy textbooks, rent lab equipment, request hostel essentials, and build your campus reputation safely.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>🛒</span>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Buy & Sell:</strong> Clear out your hostel room or find cheap gadgets.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>📅</span>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Renting:</strong> Rent drawing drafters, calculators, or ESP32 boards for a week or two.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>🛡️</span>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Trust Score & Reputation:</strong> Trade verified items, respond quickly, and maintain 4.8+ ratings to rise on leaderboards!
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => completeOnboarding(false)}>
                  Skip Intro
                </button>
                <button className="btn btn-primary" onClick={() => completeOnboarding(true)}>
                  Take a Quick Tour <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. GUIDED WALKTHROUGH TOUR OVERLAY */}
      <AnimatePresence>
        {activeTourStep !== null && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 8, 0.4)', zIndex: 9999, pointerEvents: 'auto' }}>
            <motion.div 
              initial={{ opacity: 0, y: 50, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="card-glass"
              style={{ 
                position: 'fixed', 
                bottom: '24px', 
                left: '24px', 
                maxWidth: '380px', 
                width: 'calc(100% - 48px)', 
                border: '1px solid var(--accent-primary)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge" style={{ fontSize: '9px' }}>Tour Step {activeTourStep + 1} / 6</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }} onClick={skipTour}>
                  <X size={14} />
                </button>
              </div>
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'bold', margin: '0 0 6px', color: '#fff' }}>
                {tourSteps[activeTourStep].title}
              </h3>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
                {tourSteps[activeTourStep].desc}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '10px' }} onClick={skipTour}>Skip</button>
                <button className="btn btn-primary btn-sm" style={{ fontSize: '10px', padding: '6px 12px' }} onClick={nextTourStep}>
                  {activeTourStep === 5 ? 'Finish' : 'Next Step →'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. XP FLOATING TOASTS */}
      <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 10001, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        <AnimatePresence>
          {xpToasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              style={{ 
                background: 'rgba(16, 185, 129, 0.95)', 
                color: '#fff', 
                padding: '10px 16px', 
                borderRadius: 'var(--radius-md)', 
                fontWeight: 'bold', 
                fontSize: '13px',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                pointerEvents: 'auto'
              }}
            >
              <Sparkles size={16} />
              <span>+{toast.amount} XP</span>
              <span style={{ fontWeight: 'normal', opacity: 0.9, fontSize: '11px', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '8px' }}>
                {toast.reason}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 4. LEVEL UP MODAL */}
      <AnimatePresence>
        {levelUpData && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 8, 0.9)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="card-glass"
              style={{ 
                maxWidth: '440px', 
                width: '100%', 
                padding: 'var(--space-8)', 
                textAlign: 'center',
                border: '2px solid var(--accent-warning)',
                boxShadow: '0 0 35px rgba(245, 158, 11, 0.4)',
                background: 'rgba(15, 23, 41, 0.95)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)', color: 'var(--accent-warning)' }}>
                <Award size={64} style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 'var(--fw-extrabold)', color: 'var(--accent-warning)', margin: '0 0 4px' }}>
                LEVEL UP!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', margin: '0 0 20px' }}>
                You reached Level {levelUpData.level}
              </p>
              
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                  {levelUpData.title}
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                  🎁 Reward: {levelUpData.reward}
                </span>
              </div>

              <button className="btn btn-primary btn-full" onClick={() => setLevelUpData(null)}>
                Awesome!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
