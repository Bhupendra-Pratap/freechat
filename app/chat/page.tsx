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

const DEPT_COLORS: Record<string, string> = {
  CS:'#4fc3f7', EE:'#ffd740', ME:'#ff8a65', CE:'#a5d6a7',
  MBA:'#ce93d8', BIO:'#80cbc4', CHEM:'#ef9a9a', MATH:'#fff176',
  PHY:'#90caf9', LAW:'#bcaaa4', MED:'#f48fb1', ARTS:'#ffe082',
  ECON:'#b0bec5', ARCH:'#ffcc80', OTHER:'#9e9e9e',
};

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function DotOnline() {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: 'var(--success)', animation: 'pulse-dot 2s infinite',
    }} />
  );
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

  // auth guard
  useEffect(() => {
    const t = sessionStorage.getItem('fcc_token');
    const n = sessionStorage.getItem('fcc_nick');
    const d = sessionStorage.getItem('fcc_dept');
    if (!t || !n || !d) { router.replace('/'); return; }
    setToken(t); setNick(n); setDept(d);
  }, [router]);

  // fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) return;
      const data: Message[] = await res.json();
      setMessages(data);
    } catch { /* ignore */ }
  }, []);

  // initial fetch + poll every 3s
  useEffect(() => {
    if (!token) return;
    fetchMessages();
    const id = setInterval(fetchMessages, 3000);
    return () => clearInterval(id);
  }, [token, fetchMessages]);

  // scroll to bottom on new messages
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

    // optimistic
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
      } else {
        await fetchMessages(); // sync with server
      }
    } catch {
      setError('Network error.'); setInput(text);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as unknown as FormEvent); }
  }

  function logout() {
    sessionStorage.clear();
    router.push('/');
  }

  const deptColor = DEPT_COLORS[dept] ?? '#9e9e9e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <header style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.25rem', height: '56px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', color: 'var(--accent)', letterSpacing: '0.04em' }}>
            FreeChatCU
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem',
            background: 'rgba(245,197,24,0.12)', color: 'var(--accent)', fontFamily: 'var(--font-mono)',
          }}>
            LIVE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <DotOnline /> {online} online
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px 10px', borderRadius: '20px',
            background: 'var(--surface2)', border: '1px solid var(--border)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: deptColor, flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
              @{nick}
            </span>
            <span style={{
              fontSize: '0.7rem', padding: '1px 6px', borderRadius: '3px',
              background: `${deptColor}22`, color: deptColor, fontWeight: 600,
            }}>
              {dept}
            </span>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Leave
          </button>
        </div>
      </header>

      {/* ── MESSAGES ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1rem 1.25rem',
        display: 'flex', flexDirection: 'column', gap: '2px',
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
          }}>
            <span style={{ fontSize: '2rem' }}>💬</span>
            <span>No messages yet. Break the silence.</span>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.nickname === nick;
          const color = DEPT_COLORS[msg.department] ?? '#9e9e9e';
          const prevMsg = messages[idx - 1];
          const sameSender = prevMsg?.nickname === msg.nickname;
          const gap = sameSender ? '0' : '0.6rem';

          return (
            <div
              key={msg.id}
              style={{
                marginTop: gap,
                display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                animation: 'bubblePop 0.2s ease both',
              }}
            >
              {!sameSender && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginBottom: '3px',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                }}>
                  <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color, fontWeight: 700 }}>
                    @{msg.nickname}
                  </span>
                  <span style={{
                    fontSize: '0.68rem', padding: '1px 5px', borderRadius: '3px',
                    background: `${color}20`, color, fontWeight: 600,
                  }}>
                    {msg.department}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    {fmtTime(msg.timestamp)}
                  </span>
                </div>
              )}
              <div style={{
                maxWidth: '72%', padding: '0.55rem 0.9rem',
                background: isMe ? 'rgba(245,197,24,0.13)' : 'var(--surface2)',
                border: `1px solid ${isMe ? 'rgba(245,197,24,0.25)' : 'var(--border)'}`,
                borderRadius: isMe ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                fontSize: '0.9rem', lineHeight: 1.55,
                fontFamily: 'var(--font-body)', wordBreak: 'break-word',
                color: 'var(--text)',
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ── */}
      <div style={{
        flexShrink: 0, padding: '0.9rem 1.25rem',
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
      }}>
        {error && (
          <div style={{
            marginBottom: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)',
            background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)',
            color: 'var(--danger)', fontSize: '0.8rem',
          }}>
            ⚠ {error}
          </div>
        )}
        <form onSubmit={send} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{
              flex: 1, resize: 'none', lineHeight: 1.5, maxHeight: '120px',
              fontFamily: 'var(--font-body)',
            }}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={sending || !input.trim()}
            style={{ flexShrink: 0, height: '42px', padding: '0 1.2rem' }}
          >
            {sending ? '…' : '↑ Send'}
          </button>
        </form>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
          Chatting as <strong style={{ color: deptColor }}>@{nick}</strong> from <strong style={{ color: deptColor }}>{dept}</strong> · All messages are anonymous nicknames only
        </p>
      </div>
    </div>
  );
}
