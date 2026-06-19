'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadDocument, validateDocument } from '@/lib/cloudinary';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { notifyGroup } from '@/lib/notifications';

const noteTypes = ['Notes', 'PYQ', 'Syllabus', 'Reference Material'];
const departments = ['Computer Engineering', 'IT', 'AI & DS', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Instrumentation'];

export default function UploadNotesPage() {
  return <ProtectedRoute><UploadNotesContent /></ProtectedRoute>;
}

function UploadNotesContent() {
  const [form, setForm] = useState({ title: '', subject: '', type: 'Notes', semester: '', department: '', description: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, userData } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject || !file) return toast.error('Title, subject and file are required.');

    try {
      validateDocument(file);
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext !== 'pdf') {
        return toast.error('Invalid document format');
      }
    } catch (err) {
      return toast.error(err.message || 'Invalid document format');
    }

    setLoading(true);
    try {
      const fileUrl = await uploadDocument(file, undefined, 'sharevit/notes');
      await addDoc(collection(db, 'notes'), {
        title: form.title,
        subject: form.subject,
        branch: form.department || 'N/A',
        semester: form.semester || 'N/A',
        pdfUrl: fileUrl,
        uploadedBy: userData?.displayName || 'Anonymous',
        downloads: 0,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', user.uid), { uploadsCount: increment(1), reputation: increment(5) });
      
      await notifyGroup(
        `🆕 New ${form.type || 'Notes'} Uploaded!`,
        `${userData?.displayName || 'Someone'} uploaded "${form.title}" for ${form.subject}.`,
        'Academic',
        form.department ? { department: form.department } : {},
        { link: '/notes', type: 'new_note' },
        user.uid
      );

      toast.success('Notes uploaded! +5 reputation');
      router.push('/notes');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-content"><div className="container" style={{ maxWidth: 700 }}>
      <div className="page-header animate-fadeInUp"><h1>Upload Notes</h1><p>Share study material with fellow students</p></div>
      <form onSubmit={handleSubmit} className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-8)' }}>
        <div className="form-group"><label className="form-label">Title *</label><input className="form-input" placeholder="e.g. DBMS Unit 3 Notes" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Subject *</label><input className="form-input" placeholder="e.g. Database Management Systems" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>{noteTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Semester</label><select className="form-select" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}><option value="">Select</option>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}><option value="">Select</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Brief description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">File *</label>
          <div className="upload-area" onClick={() => document.getElementById('note-file').click()}>
            {file ? <p>📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p> : <><p style={{ fontSize: '2rem' }}>📁</p><p>Click to upload (PDF only)</p></>}
            <input id="note-file" type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} accept=".pdf,application/pdf" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>{loading ? <><span className="spinner" /> Uploading...</> : 'Upload Notes'}</button>
      </form>
    </div></div>
  );
}
