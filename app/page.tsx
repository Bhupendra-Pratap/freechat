'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }

      sessionStorage.setItem('fcc_token', data.token);
      sessionStorage.setItem('fcc_nick', data.nickname);
      router.push('/department');
    } catch {
      setError('Connection error. Try again.');
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 40%, #1a1606 0%, var(--bg) 70%)',
      padding: '1rem',
    }}>
      {/* decorative grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(245,197,24,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="fade-up" style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem',
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>💬</span>
            <h1 style={{
              fontFamily: 'var(--font-head)', fontSize: '2.8rem', letterSpacing: '0.06em',
              color: 'var(--accent)', lineHeight: 1,
            }}>FreeChatCU</h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
            anonymous · open · yours
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '2rem', boxShadow: 'var(--shadow)',
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Enter the board
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            New nickname? It registers automatically. Returning? Just log back in.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Nickname
              </label>
              <input
                className="input"
                placeholder="e.g. shadow_hawk"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                autoCapitalize="none" autoComplete="off" spellCheck={false}
                required
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                Letters, numbers, underscores. 2–20 chars.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                placeholder="Min. 4 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)',
                borderRadius: 'var(--radius)', padding: '0.6rem 0.9rem',
                color: 'var(--danger)', fontSize: '0.85rem',
              }}>
                ⚠ {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.25rem', fontSize: '1rem', padding: '0.8rem' }}>
              {loading ? 'Connecting…' : 'Enter →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.78rem', marginTop: '1.5rem', lineHeight: 1.6 }}>
          Your nickname is your only identity. No email, no tracking.
        </p>
      </div>
    </main>
  );
}
