import { kv } from '@vercel/kv';

export interface User {
  nickname: string;
  passwordHash: string;
  createdAt: number;
}

export interface Message {
  id: string;
  nickname: string;
  department: string;
  text: string;
  timestamp: number;
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUser(nickname: string): Promise<User | null> {
  const key = `user:${nickname.toLowerCase()}`;
  return await kv.hgetall<User>(key);
}

export async function createUser(user: User): Promise<void> {
  const key = `user:${user.nickname.toLowerCase()}`;
  await kv.hset(key, user);
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(token: string, nickname: string): Promise<void> {
  await kv.set(`session:${token}`, nickname, { ex: 60 * 60 * 24 * 7 }); // 7 days
}

export async function getSession(token: string): Promise<string | null> {
  return await kv.get<string>(`session:${token}`);
}

export async function deleteSession(token: string): Promise<void> {
  await kv.del(`session:${token}`);
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function getMessages(limit = 120): Promise<Message[]> {
  const raw = await kv.lrange<Message>('messages', 0, limit - 1);
  // Stored newest-first; reverse for display (oldest→newest)
  return [...raw].reverse();
}

export async function addMessage(msg: Message): Promise<void> {
  await kv.lpush('messages', msg);
  await kv.ltrim('messages', 0, 499); // cap at 500
}
