'use client';
import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const vitGrades = [
  { grade: 'O', points: 10, range: '90-100' },
  { grade: 'A+', points: 9, range: '80-89' },
  { grade: 'A', points: 8, range: '70-79' },
  { grade: 'B+', points: 7, range: '60-69' },
  { grade: 'B', points: 6, range: '55-59' },
  { grade: 'C', points: 5, range: '50-54' },
  { grade: 'P', points: 4, range: '45-49' },
  { grade: 'F', points: 0, range: 'Below 45' },
];

export default function GPACalculatorPage() { return <ProtectedRoute><GPAContent /></ProtectedRoute>; }

function GPAContent() {
  const [subjects, setSubjects] = useState([{ name: '', credits: '', grade: 'O' }]);
  const [result, setResult] = useState(null);

  const addSubject = () => setSubjects(p => [...p, { name: '', credits: '', grade: 'O' }]);
  const removeSubject = (i) => setSubjects(p => p.filter((_, idx) => idx !== i));
  const updateSubject = (i, field, val) => setSubjects(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const calculate = () => {
    let totalCredits = 0, totalPoints = 0;
    subjects.forEach(s => {
      const credits = Number(s.credits);
      if (credits > 0) {
        const gradeObj = vitGrades.find(g => g.grade === s.grade);
        totalCredits += credits;
        totalPoints += credits * (gradeObj?.points || 0);
      }
    });
    if (totalCredits === 0) return;
    setResult({ sgpa: (totalPoints / totalCredits).toFixed(2), totalCredits, totalPoints });
  };

  return (
    <div className="page-content"><div className="container" style={{ maxWidth: 800 }}>
      <div className="page-header animate-fadeInUp text-center"><h1>🎓 GPA Calculator</h1><p>Calculate your SGPA using VIT&apos;s grading system</p></div>

      <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>VIT Grading System</h3>
        <div className="table-wrapper"><table><thead><tr><th>Grade</th><th>Points</th><th>Marks Range</th></tr></thead><tbody>{vitGrades.map(g => <tr key={g.grade}><td style={{ fontWeight: 'var(--fw-bold)' }}>{g.grade}</td><td>{g.points}</td><td>{g.range}</td></tr>)}</tbody></table></div>
      </div>

      <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-8)' }}>
        <h3 style={{ marginBottom: 'var(--space-6)' }}>Enter Your Subjects</h3>
        {subjects.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Subject</label><input className="form-input" placeholder="Subject name" value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Credits</label><input className="form-input" type="number" placeholder="3" value={s.credits} onChange={e => updateSubject(i, 'credits', e.target.value)} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Grade</label><select className="form-select" value={s.grade} onChange={e => updateSubject(i, 'grade', e.target.value)}>{vitGrades.map(g => <option key={g.grade} value={g.grade}>{g.grade}</option>)}</select></div>
            <button type="button" className="btn btn-ghost" onClick={() => removeSubject(i)} style={{ color: 'var(--accent-danger)', marginBottom: '2px' }}>✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button className="btn btn-secondary" onClick={addSubject}>+ Add Subject</button>
          <button className="btn btn-primary" onClick={calculate}>Calculate SGPA</button>
        </div>

        {result && (
          <div style={{ marginTop: 'var(--space-8)', textAlign: 'center', padding: 'var(--space-8)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Your SGPA</p>
            <p style={{ fontSize: 'var(--fs-5xl)', fontWeight: 'var(--fw-extrabold)', color: 'var(--accent-primary)' }}>{result.sgpa}</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)', marginTop: 'var(--space-2)' }}>Total Credits: {result.totalCredits} | Total Points: {result.totalPoints}</p>
          </div>
        )}
      </div>
    </div></div>
  );
}