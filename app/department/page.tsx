'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DEPARTMENTS = [
  { id: 'CS',     label: 'Computer Science',   icon: '💻', color: '#4fc3f7' },
  { id: 'EE',     label: 'Electrical Engg.',    icon: '⚡', color: '#ffd740' },
  { id: 'ME',     label: 'Mechanical Engg.',    icon: '⚙️',  color: '#ff8a65' },
  { id: 'CE',     label: 'Civil Engg.',         icon: '🏗️',  color: '#a5d6a7' },
  { id: 'MBA',    label: 'Business & MBA',      icon: '📊', color: '#ce93d8' },
  { id: 'BIO',    label: 'Biotechnology',       icon: '🧬', color: '#80cbc4' },
  { id: 'CHEM',   label: 'Chemistry',           icon: '🧪', color: '#ef9a9a' },
  { id: 'MATH',   label: 'Mathematics',         icon: '∑',  color: '#fff176' },
  { id: 'PHY',    label: 'Physics',             icon: '🔭', color: '#90caf9' },
  { id: 'LAW',    label: 'Law',                 icon: '⚖️',  color: '#bcaaa4' },
  { id: 'MED',    label: 'Medical / MBBS',      icon: '🩺', color: '#f48fb1' },
  { id: 'ARTS',   label: 'Arts & Humanities',   icon: '🎨', color: '#ffe082' },
  { id: 'ECON',   label: 'Economics',           icon: '📈', color: '#b0bec5' },
  { id: 'ARCH',   label: 'Architecture',        icon: '🏛️',  color: '#ffcc80' },
  { id: 'OTHER',  label: 'Other',               icon: '🎓', color: '#9e9e9e' },
];

export default function DepartmentPage() {
  const router = useRouter();
  const [nick, setNick] = useState('');
  const [selected, setSelected] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('fcc_token');
    const n = sessionStorage.getItem('fcc_nick');
    if (!token || !n) { router.replace('/'); return; }
    setNick(n);
  }, [router]);

  function choose(id: string) {
    setSelected(id);
    sessionStorage.setItem('fcc_dept', id);
    setTimeout(() => router.push('/chat'), 220);
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 70%, #0d1206 0%, var(--bg) 65%)',
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* header */}
        <div className="fade-up" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2.4rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>
            FreeChatCU
          </h1>
          <p style={{ color: 'var(--text)', fontSize: '1.05rem', marginTop: '0.5rem' }}>
            Welcome, <strong style={{ color: 'var(--accent)' }}>@{nick}</strong>
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Select your department to enter the chat
          </p>
        </div>

        {/* grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.75rem',
        }}>
          {DEPARTMENTS.map((d, i) => (
            <button
              key={d.id}
              onClick={() => choose(d.id)}
              className="fade-up"
              style={{
                animationDelay: `${i * 0.04}s`,
                background: selected === d.id ? `${d.color}22` : 'var(--surface)',
                border: `1px solid ${selected === d.id ? d.color : 'var(--border)'}`,
                borderRadius: '10px',
                padding: '1.1rem 1rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = d.color;
                (e.currentTarget as HTMLButtonElement).style.background = `${d.color}15`;
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                if (selected !== d.id) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)';
                }
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
            >
              <span style={{ fontSize: '1.5rem', flexShrink: 0, lineHeight: 1 }}>{d.icon}</span>
              <span style={{
                fontFamily: 'var(--font-body)', fontWeight: 500,
                fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.3,
              }}>
                {d.label}
              </span>
              {selected === d.id && (
                <span style={{ marginLeft: 'auto', color: d.color, fontSize: '1rem', flexShrink: 0 }}>→</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
