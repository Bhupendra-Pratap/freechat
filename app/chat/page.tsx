'use client';
import { useEffect, useRef, useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  nickname: string;
  department: string;
  text: string;
  timestamp: number;
}

const DEPT_LABELS: Record<string, string> = {
  CS:'Computer Science', EE:'Electrical Engg.', ME:'Mechanical Engg.',
  CE:'Civil Engg.', MBA:'Business & MBA', BIO:'Biotechnology',
  CHEM:'Chemistry', MATH:'Mathematics', PHY:'Physics',
  LAW:'Law', MED:'Medical / MBBS', ARTS:'Arts & Humanities',
  ECON:'Economics', ARCH:'Architecture', OTHER:'Other',
};

const DEPT_COLORS: Record<string, string> = {
  CS:'#4fc3f7', EE:'#ffd740', ME:'#ff8a65', CE:'#a5d6a7',
  MBA:'#ce93d8', BIO:'#80cbc4', CHEM:'#ef9a9a', MATH:'#fff176',
  PHY:'#90caf9', LAW:'#bcaaa4', MED:'#f48fb1', ARTS:'#ffe082',
  ECON:'#b0bec5', ARCH:'#ffcc80', OTHER:'#9e9e9e',
};

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const router = useRouter();
  const [nick, setNick] = useState('');
  const [dept, setDept] = useState('');
  const [token, setToken] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [online] = useState(() => Math.floor(Math.random() * 18) + 3);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const t = sessionStorage.getItem('fcc_token');
    const n = sessionStorage.getItem('fcc_nick');
    const d = sessionStorage.getItem('fcc_dept');
    if (!t || !n || !d) { router.replace('/'); return; }
    setToken(t); setNick(n); setDept(d);
  }, [router]);

  const fetchMessages = useCallback(async () => {
    if (!dept) return;
    try {
      const res = await fetch(`/api/messages?dept=${dept}`);
      if (!res.ok) return;
      setMessages(await res.json());
    } catch { /* ignore */ }
  }, [dept]);

  useEffect(() => {
    if (!token || !dept) return;
    fetchMessages();
    const id = setInterval(fetchMessages, 3000);
    return () => clearInterval(id);
  }, [token, dept, fetchMessages]);

  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      prevCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true); setError('');
    const text = input.trim();
    setInput('');
    const optimistic: Message = {
      id: `opt-${Date.now()}`, nickname: nick, department: dept, text, timestamp: Date.now(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text, department: dept }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to send.'); setInput(text);
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      } else { await fetchMessages(); }
    } catch {
      setError('Network error.'); setInput(text);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally { setSending(false); inputRef.current?.focus(); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as unknown as FormEvent); }
  }

  function logout() { sessionStorage.clear(); router.push('/'); }
  function changeDept() { router.push('/department'); }

  const deptColor = DEPT_COLORS[dept] ?? '#9e9e9e';
  const deptLabel = DEPT_LABELS[dept] ?? dept;

  return (
    <>
      {/* Responsive styles injected globally */}
      <style>{`
        html, body { overflow: hidden; }
        .chat-wrap { display: flex; flex-direction: column; height: 100dvh; height: 100vh; background: var(--bg); overflow: hidden; }

        /* ── Header ── */
        .chat-header {
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 14px; height: 52px; gap: 8px;
          background: var(--surface); border-bottom: 1px solid var(--border);
          box-shadow: 0 1px 12px rgba(0,0,0,0.4);
          min-width: 0; overflow: hidden;
        }
        .chat-header-left {
          display: flex; align-items: center; gap: 8px;
          min-width: 0; overflow: hidden; flex: 1;
        }
        .chat-logo {
          font-family: var(--font-head); font-size: 1.5rem;
          color: var(--accent); letter-spacing: 0.04em;
          white-space: nowrap; flex-shrink: 0;
        }
        .dept-badge {
          padding: 3px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 700;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 130px; flex-shrink: 1;
        }
        .chat-header-right {
          display: flex; align-items: center; gap: 6px; flex-shrink: 0;
        }
        .online-pill {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.75rem; color: var(--muted); white-space: nowrap;
        }
        .online-dot {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%;
          background: var(--success); animation: pulse-dot 2s infinite; flex-shrink: 0;
        }
        .nick-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 3px 8px; border-radius: 20px;
          background: var(--surface2); border: 1px solid var(--border);
          font-size: 0.78rem; color: var(--text); font-family: var(--font-mono);
          white-space: nowrap; max-width: 110px; overflow: hidden; text-overflow: ellipsis;
        }
        .nick-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .btn-sm {
          padding: 5px 10px; border-radius: var(--radius);
          font-size: 0.76rem; font-weight: 600; cursor: pointer;
          border: 1px solid var(--border); background: transparent;
          color: var(--muted); transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
        }
        .btn-sm:hover { color: var(--text); border-color: var(--muted); }

        /* hide online count on very small screens */
        @media (max-width: 380px) {
          .online-pill { display: none; }
          .dept-badge { max-width: 90px; }
          .nick-pill { max-width: 80px; }
          .chat-logo { font-size: 1.25rem; }
        }

        /* ── Messages ── */
        .chat-messages {
          flex: 1; overflow-y: auto; padding: 12px 14px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .chat-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: var(--muted); gap: 8px;
          font-family: var(--font-mono); font-size: 0.85rem; text-align: center;
        }
        .msg-row { display: flex; flex-direction: column; }
        .msg-meta {
          display: flex; align-items: center; gap: 6px; margin-bottom: 3px;
        }
        .msg-meta-me { flex-direction: row-reverse; }
        .msg-bubble {
          max-width: min(72%, 340px); padding: 8px 12px;
          font-size: 0.9rem; line-height: 1.55;
          word-break: break-word; color: var(--text);
        }

        /* ── Input ── */
        .chat-input-wrap {
          flex-shrink: 0; padding: 10px 14px 14px;
          background: var(--surface); border-top: 1px solid var(--border);
        }
        .chat-input-row {
          display: flex; gap: 8px; align-items: flex-end;
        }
        .chat-textarea {
          flex: 1; resize: none; line-height: 1.5; max-height: 100px;
          min-height: 40px; font-family: var(--font-body);
        }
        .chat-send-btn {
          flex-shrink: 0; height: 40px; padding: 0 14px;
          font-size: 0.88rem;
        }
        .chat-footer-note {
          font-size: 0.7rem; color: var(--muted); margin-top: 6px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>

      <div className="chat-wrap">

        {/* ── HEADER ── */}
        <header className="chat-header">
          <div className="chat-header-left">
            <span className="chat-logo">FCC</span>
            <span className="dept-badge" style={{
              background: `${deptColor}20`, color: deptColor,
              border: `1px solid ${deptColor}50`,
            }}>
              # {deptLabel}
            </span>
          </div>

          <div className="chat-header-right">
            <span className="online-pill">
              <span className="online-dot" />
              {online}
            </span>
            <span className="nick-pill">
              <span className="nick-dot" style={{ background: deptColor }} />
              @{nick}
            </span>
            <button className="btn-sm" onClick={changeDept} title="Switch department">⇄</button>
            <button className="btn-sm" onClick={logout} title="Leave">✕</button>
          </div>
        </header>

        {/* ── MESSAGES ── */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <span style={{ fontSize: '2rem' }}>💬</span>
              <span>No messages yet in <strong style={{ color: deptColor }}>#{dept}</strong>.<br />Be the first.</span>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.nickname === nick;
            const color = DEPT_COLORS[msg.department] ?? '#9e9e9e';
            const sameSender = messages[idx - 1]?.nickname === msg.nickname;

            return (
              <div key={msg.id} className="msg-row" style={{
                marginTop: sameSender ? 0 : '0.6rem',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                animation: 'bubblePop 0.2s ease both',
              }}>
                {!sameSender && (
                  <div className={`msg-meta${isMe ? ' msg-meta-me' : ''}`}>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color, fontWeight: 700 }}>
                      @{msg.nickname}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{fmtTime(msg.timestamp)}</span>
                  </div>
                )}
                <div className="msg-bubble" style={{
                  background: isMe ? 'rgba(245,197,24,0.13)' : 'var(--surface2)',
                  border: `1px solid ${isMe ? 'rgba(245,197,24,0.25)' : 'var(--border)'}`,
                  borderRadius: isMe ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── INPUT ── */}
        <div className="chat-input-wrap">
          {error && (
            <div style={{
              marginBottom: '6px', padding: '6px 10px', borderRadius: 'var(--radius)',
              background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)',
              color: 'var(--danger)', fontSize: '0.8rem',
            }}>⚠ {error}</div>
          )}
          <form onSubmit={send} className="chat-input-row">
            <textarea
              ref={inputRef}
              className="input chat-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${dept}…`}
              rows={1}
            />
            <button className="btn btn-primary chat-send-btn" type="submit" disabled={sending || !input.trim()}>
              {sending ? '…' : '↑'}
            </button>
          </form>
          <p className="chat-footer-note">
            @{nick} · #{deptLabel} · Switch dept: ⇄ &nbsp;|&nbsp; Leave: ✕
          </p>
        </div>
      </div>
    </>
  );
}
