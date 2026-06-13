'use client';
import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import { UploadCloud, Plus, X as XIcon, Minus, Target } from 'lucide-react';

export default function AttendancePage() { return <ProtectedRoute><AttendanceContent /></ProtectedRoute>; }

function AttendanceContent() {
  const [subjects, setSubjects] = useState([{ name: '', attended: '', total: '' }]);
  const [target, setTarget] = useState(75);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');

  const addSubject = () => setSubjects(p => [...p, { name: '', attended: '', total: '' }]);
  const removeSubject = (i) => setSubjects(p => p.filter((_, idx) => idx !== i));
  const update = (i, field, val) => setSubjects(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const calcPercentage = (a, t) => t > 0 ? ((a / t) * 100).toFixed(1) : 0;
  const calcCanSkip = (a, t) => { if (t === 0) return 0; let skip = 0; while (((a) / (t + skip + 1)) * 100 >= target) skip++; return skip; };
  const calcNeedAttend = (a, t) => { if (t === 0) return 0; let need = 0; while (((a + need) / (t + need)) * 100 < target) { need++; if (need > 200) break; } return need; };

  const totalAttended = subjects.reduce((acc, s) => acc + (Number(s.attended) || 0), 0);
  const totalClasses = subjects.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const overallPct = calcPercentage(totalAttended, totalClasses);
  const overallAbove = overallPct >= target;

  const processFile = (file) => {
    if (!file) return;
    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/extract-attendance');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
        if (percentComplete === 100) {
          setProcessingStatus('Extracting data using AI...');
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.data && Array.isArray(data.data)) {
            setSubjects(data.data.map(d => ({ name: d.subject || '', attended: String(d.attended || 0), total: String(d.total || 0) })));
          }
        } catch { /* ignore */ }
      }
      setIsProcessing(false);
      setUploadProgress(0);
      setProcessingStatus('');
    };

    xhr.onerror = () => {
      setIsProcessing(false);
      setUploadProgress(0);
      setProcessingStatus('');
    };

    xhr.send(formData);
  };

  const handleFileUpload = (e) => processFile(e.target.files[0]);
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="page-content"><div className="container" style={{ maxWidth: 900 }}>
      
      {/* Premium Header / Total Summary Bar */}
      <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.15), transparent 50%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-extrabold)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Total Attendance
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '3rem', fontWeight: 'var(--fw-extrabold)', background: overallAbove ? 'var(--gradient-success)' : 'var(--gradient-danger)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {overallPct}%
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                {totalAttended} / {totalClasses} Classes
              </span>
            </div>
            
            <div style={{ marginTop: 'var(--space-4)', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(100, overallPct)}%`, 
                height: '100%', 
                background: overallAbove ? 'var(--gradient-success)' : 'var(--gradient-danger)', 
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: overallAbove ? '0 0 10px rgba(16, 185, 129, 0.5)' : '0 0 10px rgba(239, 68, 68, 0.5)'
              }} />
            </div>
          </div>

          <div style={{ flex: '0 1 250px', background: 'rgba(0,0,0,0.2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Target size={16} color="var(--accent-primary)" />
              <label style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--text-secondary)' }}>Target %</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <input 
                type="range" 
                min="0" max="100" 
                value={target} 
                onChange={e => setTarget(Number(e.target.value))} 
                style={{ flex: 1, accentColor: 'var(--accent-primary)' }} 
              />
              <span style={{ fontWeight: 'var(--fw-bold)', width: '40px', textAlign: 'right' }}>{target}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slim Drag & Drop Bar */}
      <div 
        className={`card-glass animate-fadeInUp ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('attendance-file-upload').click()}
        style={{
          border: isDragging ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
          backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-glass)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          padding: 'var(--space-4) var(--space-6)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)'
        }}
      >
        {isProcessing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%' }}>
            {uploadProgress < 100 ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: 'var(--accent-primary)', transition: 'width 0.2s ease' }} />
                </div>
                <span style={{ fontSize: '0.875rem' }}>{uploadProgress}%</span>
              </>
            ) : (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                <span style={{ fontSize: '0.875rem' }}>{processingStatus}</span>
              </>
            )}
          </div>
        ) : (
          <>
            <UploadCloud size={20} color="var(--accent-primary)" />
            <span style={{ fontWeight: 'var(--fw-medium)', fontSize: '0.875rem' }}>Upload Timetable / Attendance (Image, PDF, CSV)</span>
          </>
        )}
        <input id="attendance-file-upload" type="file" style={{ display: 'none' }} accept="image/*,.txt,.csv,.xlsx,.pdf" onChange={handleFileUpload} />
      </div>

      {/* Subjects List */}
      <div className="card-glass animate-fadeInUp" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        {subjects.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {subjects.map((s, i) => {
              const a = Number(s.attended) || 0;
              const t = Number(s.total) || 0;
              const pct = calcPercentage(a, t);
              const isAbove = pct >= target;
              const skip = isAbove ? calcCanSkip(a, t) : 0;
              const need = !isAbove ? calcNeedAttend(a, t) : 0;
              return (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexWrap: 'nowrap',
                  padding: 'var(--space-3) var(--space-4)', 
                  borderBottom: i < subjects.length - 1 ? '1px solid var(--border-color)' : 'none',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: 'transparent',
                  gap: 'var(--space-4)',
                  overflowX: 'auto'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  
                  {/* Subject Name */}
                  <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                    <span style={{ fontWeight: 'var(--fw-medium)', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {s.name || 'Unnamed Subject'}
                    </span>
                  </div>

                  {/* Classes Present / Total */}
                  <div style={{ minWidth: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {a} / {t}
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div style={{ flex: '2 1 150px', minWidth: '150px', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', position: 'relative' }}>
                        <div style={{ 
                          width: `${Math.min(100, pct)}%`, 
                          height: '100%', 
                          borderRadius: 'var(--radius-full)',
                          background: isAbove ? 'var(--gradient-success)' : 'var(--gradient-danger)', 
                          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isAbove ? '0 0 12px rgba(16, 185, 129, 0.6)' : '0 0 12px rgba(239, 68, 68, 0.6)'
                        }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', minWidth: '45px', textAlign: 'right' }}>{pct}%</span>
                  </div>

                  {/* Status Badge */}
                  <div style={{ width: '90px', textAlign: 'center' }}>
                    {t > 0 ? (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 'var(--fw-bold)', 
                        color: isAbove ? 'var(--accent-success)' : 'var(--accent-danger)',
                        backgroundColor: isAbove ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        whiteSpace: 'nowrap'
                      }}>
                        {isAbove ? `Skip ${skip}` : `Attend ${need}`}
                      </span>
                    ) : <span />}
                  </div>

                  {/* Actions (removed extra buttons, kept spacing consistent) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            No subjects added yet. Add a subject or upload your timetable.
          </div>
        )}
        {/* Add Subject area removed */}
      </div>

    </div></div>
  );
}