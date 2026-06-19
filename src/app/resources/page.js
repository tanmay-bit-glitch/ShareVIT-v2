'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  BookOpen, Search, Filter, Download, ArrowUpRight, Star, 
  FileText, FolderOpen, Code, Award, AwardIcon, Bookmark, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResourcesPage() {
  return (
    <ProtectedRoute>
      <ResourcesContent />
    </ProtectedRoute>
  );
}

function ResourcesContent() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');

  const tabs = ['All', 'Notes', 'PYQs', 'Lab Manuals', 'Projects', 'Research Papers'];
  const branches = ['All', 'Computer Science (CSE)', 'Electronics (ENTC)', 'Mechanical', 'Civil', 'Information Technology (IT)'];
  const semesters = ['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

  // Dummy resource data (Cleared)
  const resources = [];

  // Filtering Logic
  const filteredResources = resources.filter(res => {
    const matchesTab = activeTab === 'All' || res.type === activeTab;
    const matchesSearch = res.title.toLowerCase().includes(search.toLowerCase()) || res.author.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = selectedBranch === 'All' || res.branch === selectedBranch;
    const matchesSemester = selectedSemester === 'All' || res.semester === selectedSemester;
    return matchesTab && matchesSearch && matchesBranch && matchesSemester;
  });

  return (
    <div className="page-content" style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Resource Hub
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>Access, search and download notes, assignments, PYQs, and projects shared by peer students and faculty.</p>
          </div>
          <button className="btn btn-primary">
            <Plus size={18} /> Upload Resource
          </button>
        </div>

        {/* Points Info Banner */}
        <div className="card-glass" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-3) var(--space-4)', background: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
            💡 Trade engineering resources, textbooks, or tools on the marketplace to earn XP: <strong>+50 XP</strong> for your first listing, and <strong>+100 XP</strong> for completing a sale!
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Level up your Student Portfolio!</span>
        </div>

        {/* Search & Filter Bar */}
        <div className="card-glass" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            
            {/* Search Input */}
            <div style={{ flex: 2, minWidth: '260px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search resources by title, author, or subject..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>

            {/* Branch Selector */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <select className="form-select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                <option value="All">All Branches</option>
                {branches.filter(b => b !== 'All').map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Semester Selector */}
            <div style={{ flex: 1, minWidth: '120px' }}>
              <select className="form-select" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                <option value="All">All Semesters</option>
                {semesters.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

          </div>
        </div>

        {/* Tab Filters */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-color)' }}>
          {tabs.map(tab => (
            <button 
              key={tab} 
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab(tab)}
              style={{ fontSize: 'var(--fs-sm)', padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-full)' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Listing Grid */}
        <div className="grid grid-3">
          <AnimatePresence>
            {filteredResources.map((res, index) => (
              <motion.div 
                key={res.id} 
                className="card-glass card-interactive" 
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-info">{res.type}</span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{res.size}</span>
                </div>

                <h4 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', minHeight: '44px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {res.title}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                  <span>Branch: {res.branch}</span>
                  <span>Semester: {res.semester}</span>
                  <span>Shared by: <strong>{res.author}</strong></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-warning)', fontSize: 'var(--fs-sm)' }}>
                    <Star size={14} fill="currentColor" /> {res.rating}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{res.downloads} downloads</span>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)' }}>
                      <Download size={14} style={{ color: 'var(--accent-primary)' }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
            <FolderOpen size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }} />
            <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)' }}>No resources found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your branch or semester filters, or try search keywords.</p>
          </div>
        )}

      </div>
    </div>
  );
}
