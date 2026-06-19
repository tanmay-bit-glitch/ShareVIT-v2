'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/cloudinary';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const types = ['Assignment', 'Lab Manual', 'Project Report', 'Mini Project'];
const departments = ['Computer Engineering', 'IT', 'AI & DS', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Instrumentation'];

export default function UploadAssignmentPage() { return <ProtectedRoute><UploadContent /></ProtectedRoute>; }

function UploadContent() {
  const [form, setForm] = useState({ title: '', subject: '', type: 'Assignment', semester: '', department: '', description: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, userData } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !file) return toast.error('Title and file are required.');
    setLoading(true);
    try {
      const fileUrl = await uploadFile(file, 'auto');
      await addDoc(collection(db, 'assignments'), { ...form, fileUrl, fileName: file.name, fileSize: file.size, uploaderId: user.uid, uploaderName: userData?.displayName || 'Anonymous', downloads: 0, createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'users', user.uid), { uploadsCount: increment(1), reputation: increment(5) });
      toast.success('Assignment uploaded! +5 reputation');
      router.push('/assignments');
    } catch (err) { console.error(err); toast.error('Upload failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-content"><div className="container" style={{ maxWidth: 700 }}>
      <div className="page-header animate-fadeInUp"><h1>Upload Assignment</h1><p>Share your work to help others</p></div>
      <form onSubmit={handleSubmit} className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-8)' }}>
        <div className="form-group"><label className="form-label">Title *</label><input className="form-input" placeholder="e.g. OS Assignment 3 - Process Scheduling" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Subject</label><input className="form-input" placeholder="e.g. Operating Systems" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>{types.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Semester</label><select className="form-select" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}><option value="">Select</option>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Sem {s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}><option value="">Select</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Brief description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">File *</label>
          <div className="upload-area" onClick={() => document.getElementById('assign-file').click()}>
            {file ? <p>📎 {file.name}</p> : <><p style={{ fontSize: '2rem' }}>📁</p><p>Click to upload</p></>}
            <input id="assign-file" type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>{loading ? <><span className="spinner" /> Uploading...</> : 'Upload'}</button>
      </form>
    </div></div>
  );
}