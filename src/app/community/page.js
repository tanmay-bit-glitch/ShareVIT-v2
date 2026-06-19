'use client';

import { useState } from 'react';
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
  const [joinedClubs, setJoinedClubs] = useState([1, 2]);

  const clubs = [
    { id: 1, name: 'Google Developer Student Clubs (GDSC)', category: 'Technical', members: 450, desc: 'Fostering tech development and dev-skills among students.', logo: 'GD' },
    { id: 2, name: 'ShareVIT coding core', category: 'Technical', members: 120, desc: 'Algorithms, Competitive coding, and pair programming prep.', logo: 'SV' },
    { id: 3, name: 'VIT Motorsports', category: 'Design & Build', members: 230, desc: 'Designing and building formula-student racing cars.', logo: 'VM' },
    { id: 4, name: 'Astronomy & Physics Club', category: 'Science', members: 95, desc: 'Stargazing, space-exploration talks, and paper presentations.', logo: 'AP' },
  ];

  const events = [
    { id: 101, title: 'DevHack 2026 - Campus Hackathon', date: 'June 25-26', location: 'VIT Audi 2', fee: 'Free', type: 'Hackathon', participants: 420 },
    { id: 102, title: 'AI/ML Bootcamp: Hands-on session', date: 'June 21 • 3 PM', location: 'CSE Seminar Hall', fee: 'Free', type: 'Workshop', participants: 150 },
    { id: 103, title: 'Resume Review & Placement Seminar', date: 'June 23 • 11 AM', location: 'Online', fee: 'Free', type: 'Seminar', participants: 300 },
  ];

  const handleJoinClub = (id) => {
    setJoinedClubs(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  };

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
            <Users size={18} /> Reputation: 250
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
          
          {/* Left Column: Clubs & Events */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            
            {/* Clubs Section */}
            <div>
              <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-4)' }}>Campus Clubs</h3>
              <div className="grid grid-2">
                {clubs.map(club => {
                  const isJoined = joinedClubs.includes(club.id);
                  return (
                    <div key={club.id} className="card-glass flex-col gap-3" style={{ border: isJoined ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }}>
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
                      <button 
                        className={`btn btn-sm ${isJoined ? 'btn-secondary' : 'btn-primary'}`} 
                        style={{ marginTop: 'var(--space-2)' }}
                        onClick={() => handleJoinClub(club.id)}
                      >
                        {isJoined ? 'Leave Club' : 'Join Club'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Events Section */}
            <div>
              <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-4)' }}>Upcoming Events & Hackathons</h3>
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
            </div>

          </div>

          {/* Right Column: Mentorship & Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Peer Mentorship Card */}
            <div className="card-glass flex-col gap-4">
              <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} style={{ color: 'var(--accent-warning)' }} /> Peer Mentorship
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                Connect with verified senior students for exam guidance, project reviews, or interview preparation.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: '#fff' }}>SK</div>
                  <div>
                    <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', margin: 0 }}>Saurabh K. (BE CSE)</p>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Mentor: WebDev, DSA</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px', marginLeft: 'auto' }}><MessageSquare size={14} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: '#fff' }}>PD</div>
                  <div>
                    <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xs)', margin: 0 }}>Pragati D. (TE ENTC)</p>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Mentor: Arduino, IoT</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px', marginLeft: 'auto' }}><MessageSquare size={14} /></button>
                </div>
              </div>

              <button className="btn btn-secondary btn-full" style={{ marginTop: 'var(--space-2)' }}>Become a Mentor</button>
            </div>

            {/* Community achievements */}
            <div className="card-glass flex-col gap-3">
              <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--accent-success)' }} /> Achievements
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                  <span>🏆 GDSC Hackathon Finalist</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                  <span>🤝 Helped 12 peers with assignments</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                  <span>📝 Contributed 5 set of PYQs</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
