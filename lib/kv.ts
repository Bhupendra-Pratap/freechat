import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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
  const data = await kv.hgetall(key);
  if (!data || Object.keys(data).length === 0) return null;
  return data as unknown as User;
}

export async function createUser(user: User): Promise<void> {
  const key = `user:${user.nickname.toLowerCase()}`;
  await kv.hset(key, user as unknown as Record<string, unknown>);
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

// ── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(limit = 120): Promise<Message[]> {
  const raw = await kv.lrange<Message>('messages', 0, limit - 1);
  // Stored newest-first; reverse for display (oldest→newest)
  return [...raw].reverse();
}

export async function addMessage(msg: Message): Promise<void> {
  await kv.lpush('messages', msg);
  await kv.ltrim('messages', 0, 499); // cap at 500
}
