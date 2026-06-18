'use client';
import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="page-content"><div className="container" style={{ maxWidth: 900 }}>
      <div className="page-header animate-fadeInUp text-center"><h1>📊 Attendance Tracker</h1><p>Track your attendance and calculate safe skips</p></div>

      <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div className="form-group" style={{ margin: 0, minWidth: 200 }}>
              <label className="form-label">Target Attendance %</label>
              <input className="form-input" type="number" value={target} onChange={e => setTarget(Number(e.target.value))} style={{ maxWidth: 120 }} />
            </div>
          </div>

          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('attendance-file-upload').click()}
            style={{
              border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-color)',
              backgroundColor: isDragging ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'transparent',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              textAlign: 'center',
              padding: 'var(--space-8)'
            }}
          >
            {isProcessing ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                {uploadProgress < 100 ? (
                  <div style={{ width: '100%', maxWidth: '300px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: 'var(--accent-primary)', transition: 'width 0.2s ease' }} />
                  </div>
                ) : (
                  <div className="spinner" />
                )}
                <p style={{ margin: 0, fontWeight: 'var(--fw-medium)' }}>{processingStatus}</p>
                {uploadProgress < 100 && <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>{uploadProgress}%</p>}
                {uploadProgress === 100 && <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>This may take a few seconds</p>}
              </div>
            ) : (
              <>
                <p style={{ fontSize: '2.5rem', margin: '0 0 var(--space-2) 0' }}>📄</p>
                <p style={{ fontWeight: 'var(--fw-medium)', margin: '0 0 var(--space-1) 0' }}>Drag & drop your timetable/attendance screenshot here</p>
                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Supports Images (PNG, JPG, HEIC, WebP), PDF, CSV, Excel</p>
              </>
            )}
            <input id="attendance-file-upload" type="file" style={{ display: 'none' }} accept="image/*,.txt,.csv,.xlsx,.pdf" onChange={handleFileUpload} />
          </div>
        </div>
      </div>

      <div className="card-glass animate-fadeInUp" style={{ padding: 0, overflow: 'hidden' }}>
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
                  flexWrap: 'wrap',
                  padding: 'var(--space-4) var(--space-6)', 
                  borderBottom: i < subjects.length - 1 ? '1px solid var(--border-color)' : 'none',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  
                  {/* Subject Name */}
                  <div style={{ flex: '2 1 200px', minWidth: '200px', marginBottom: 'var(--space-2)' }}>
                    <input 
                      className="form-input" 
                      placeholder="Subject Name" 
                      value={s.name} 
                      onChange={e => update(i, 'name', e.target.value)} 
                      style={{ 
                        border: 'none', 
                        backgroundColor: 'transparent', 
                        fontWeight: 'var(--fw-bold)', 
                        fontSize: '1.125rem', 
                        padding: 'var(--space-2) 0',
                        margin: 0,
                        boxShadow: 'none',
                        width: '100%'
                      }} 
                    />
                  </div>

                  {/* Attended Stepper */}
                  <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 var(--space-2)' }}>
                    <span className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Attended</span>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
                      <button className="btn btn-ghost" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => update(i, 'attended', String(Math.max(0, a - 1)))}>-</button>
                      <input 
                        type="number" 
                        value={s.attended} 
                        onChange={e => update(i, 'attended', e.target.value)}
                        style={{ width: '36px', textAlign: 'center', fontWeight: 'var(--fw-medium)', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: 0, fontSize: '0.875rem' }} 
                      />
                      <button className="btn btn-ghost" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => update(i, 'attended', String(a + 1))}>+</button>
                    </div>
                  </div>

                  {/* Total Stepper */}
                  <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 var(--space-2)' }}>
                    <span className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Total</span>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
                      <button className="btn btn-ghost" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => update(i, 'total', String(Math.max(0, t - 1)))}>-</button>
                      <input 
                        type="number" 
                        value={s.total} 
                        onChange={e => update(i, 'total', e.target.value)}
                        style={{ width: '36px', textAlign: 'center', fontWeight: 'var(--fw-medium)', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: 0, fontSize: '0.875rem' }} 
                      />
                      <button className="btn btn-ghost" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => update(i, 'total', String(t + 1))}>+</button>
                    </div>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div style={{ flex: '2 1 200px', padding: '0 var(--space-4)', minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>{pct}%</span>
                      {t > 0 && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 'var(--fw-bold)', 
                          color: isAbove ? 'var(--accent-success)' : 'var(--accent-danger)',
                          backgroundColor: isAbove ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {isAbove ? `Can skip ${skip}` : `Attend ${need}`}
                        </span>
                      )}
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.min(100, pct)}%`, 
                          height: '100%', 
                          backgroundColor: isAbove ? 'var(--accent-success)' : 'var(--accent-danger)', 
                          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', alignItems: 'center', paddingLeft: 'var(--space-4)' }}>
                    <button 
                      className="btn btn-primary" 
                      title="Attended class (+1 to both)" 
                      onClick={() => { update(i, 'attended', String(a+1)); update(i, 'total', String(t+1)); }} 
                      style={{ padding: 'var(--space-1) var(--space-3)', fontSize: '0.875rem', borderRadius: 'var(--radius-full)', minHeight: '32px' }}
                    >
                      +1 Class
                    </button>
                    <button 
                      className="btn btn-ghost" 
                      title="Delete Subject"
                      onClick={() => removeSubject(i)} 
                      style={{ color: 'var(--text-muted)', padding: 'var(--space-2)', minHeight: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            No subjects added yet. Add a subject or upload your timetable below.
          </div>
        )}
        
        <div style={{ padding: 'var(--space-4)', borderTop: subjects.length > 0 ? '1px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <button className="btn btn-ghost" onClick={addSubject} style={{ color: 'var(--accent-primary)', fontWeight: 'var(--fw-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '1.25rem' }}>+</span> Add New Subject
          </button>
        </div>
      </div>
    </div></div>
  );
}