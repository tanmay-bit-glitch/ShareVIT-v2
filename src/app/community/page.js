'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Users, Calendar, Trophy, Heart, ArrowUpRight, Plus, 
  MapPin, Clock, ShieldAlert, Award, Star, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <CommunityContent />
    </ProtectedRoute>
  );
}

function CommunityContent() {
  const { userData } = useAuth();

  // Database-backed/Cleared arrays for community data
  const clubs = [];
  const events = [];
  const mentors = [];
  const achievements = [];

  return (
    <div className="page-content" style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Student Community
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>Engage with campus clubs, attend workshops, participate in hackathons, and find peer mentors.</p>
          </div>
          <span className="badge badge-info" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--fs-base)' }}>
            <Users size={18} /> Reputation: {userData?.reputation || 0}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
          
          {/* Left Column: Clubs & Events */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            
            {/* Clubs Section */}
            <div>
              <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-4)' }}>Campus Clubs</h3>
              {clubs.length === 0 ? (
                <div className="card-glass text-center animate-fadeInUp" style={{ padding: 'var(--space-10)' }}>
                  <Users size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)', marginInline: 'auto' }} />
                  <h4 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: '4px' }}>No campus clubs registered yet</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: 0 }}>Create a request or coordinate in campus chat to form study and trading groups!</p>
                </div>
              ) : (
                <div className="grid grid-2">
                  {clubs.map(club => (
                    <div key={club.id} className="card-glass flex-col gap-3" style={{ border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', color: '#fff' 
                        }}>
                          {club.logo}
                        </div>
                        <div>
                          <h4 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>{club.name}</h4>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{club.category} • {club.members} Members</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', flex: 1 }}>{club.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Events Section */}
            <div>
              <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-4)' }}>Upcoming Events & Hackathons</h3>
              {events.length === 0 ? (
                <div className="card-glass text-center animate-fadeInUp" style={{ padding: 'var(--space-10)' }}>
                  <Calendar size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)', marginInline: 'auto' }} />
                  <h4 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: '4px' }}>No upcoming events scheduled</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: 0 }}>Check back later for student-organized hackathons, bootcamps, and webinars.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {events.map(event => (
                    <div key={event.id} className="card-glass card-interactive" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <Calendar size={20} style={{ color: 'var(--accent-primary)', marginBottom: '4px' }} />
                        <span style={{ fontSize: '10px', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{event.date.split(' • ')[0]}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <span className="badge badge-info" style={{ fontSize: '9px', padding: '2px 6px', marginBottom: '4px' }}>{event.type}</span>
                        <h4 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0, color: 'var(--text-primary)' }}>{event.title}</h4>
                        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                          <span>📍 {event.location}</span>
                          <span>👥 {event.participants}+ participating</span>
                        </p>
                      </div>
                      <button className="btn btn-secondary btn-sm">Register <ArrowUpRight size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Mentorship & Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Peer Mentorship Card */}
            <div className="card-glass flex-col gap-4">
              <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} style={{ color: 'var(--accent-warning)' }} /> Peer Mentorship
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', margin: 0 }}>
                Connect with verified senior students for exam guidance, project reviews, or interview preparation.
              </p>
              
              {mentors.length === 0 ? (
                <div style={{ padding: 'var(--space-4) 0', textAlign: 'center', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)', margin: 0 }}>No peer mentors registered yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: '2px' }}>
                  {mentors.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: '#fff' }}>M</div>
                      <div>
                        <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', margin: 0 }}>{m.name}</p>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Mentor: {m.skills}</span>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px', marginLeft: 'auto' }}><MessageSquare size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn btn-secondary btn-full" style={{ marginTop: 'var(--space-2)' }}>Become a Mentor</button>
            </div>

            {/* Community Achievements */}
            <div className="card-glass flex-col gap-3">
              <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--accent-success)' }} /> Achievements
              </h3>
              {achievements.length === 0 ? (
                <div style={{ padding: 'var(--space-2) 0' }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)', margin: 0 }}>No community achievements unlocked yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {achievements.map((ach, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                      <span>{ach}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
