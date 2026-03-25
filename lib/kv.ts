import { Redis } from '@upstash/redis';

let _kv: Redis | null = null;

function getKV(): Redis {
  if (!_kv) {
    const url =
      process.env.KV_REST_API_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_URL;
    const token =
      process.env.KV_REST_API_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(`[kv] Missing Redis credentials. url=${url ?? 'MISSING'}, token=${token ? '***' : 'MISSING'}`);
    }
    _kv = new Redis({ url, token });
  }
  return _kv;
}

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

const EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUser(nickname: string): Promise<User | null> {
  const data = await getKV().hgetall(`user:${nickname.toLowerCase()}`);
  if (!data || Object.keys(data).length === 0) return null;
  return data as unknown as User;
}

export async function createUser(user: User): Promise<void> {
  await getKV().hset(`user:${user.nickname.toLowerCase()}`, user as unknown as Record<string, unknown>);
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function createSession(token: string, nickname: string): Promise<void> {
  await getKV().set(`session:${token}`, nickname, { ex: 60 * 60 * 24 * 7 });
}

export async function getSession(token: string): Promise<string | null> {
  return await getKV().get<string>(`session:${token}`);
}

export async function deleteSession(token: string): Promise<void> {
  await getKV().del(`session:${token}`);
}

// ── Messages — per-department, auto-expire after 48h ─────────────────────────

export async function getMessages(department: string, limit = 120): Promise<Message[]> {
  const key = `messages:${department}`;
  const raw = await getKV().lrange<Message>(key, 0, limit - 1);
  const cutoff = Date.now() - EXPIRY_MS;
  // Filter out expired messages and return oldest-first
  return [...raw].reverse().filter(m => m.timestamp > cutoff);
}

export async function addMessage(msg: Message): Promise<void> {
  const key = `messages:${msg.department}`;
  await getKV().lpush(key, msg);
  await getKV().ltrim(key, 0, 499);
}

// Called on every GET — removes messages older than 48h from the Redis list
export async function pruneOldMessages(department: string): Promise<void> {
  const key = `messages:${department}`;
  const cutoff = Date.now() - EXPIRY_MS;
  try {
    // Fetch all, filter fresh ones, rewrite the list atomically
    const all = await getKV().lrange<Message>(key, 0, -1);
    const fresh = all.filter(m => m.timestamp > cutoff);
    if (fresh.length === all.length) return; // nothing to prune
    if (fresh.length === 0) {
      await getKV().del(key);
    } else {
      // Rewrite: del + push fresh (newest first, matching lpush order)
      await getKV().del(key);
      // Push in reverse so newest ends up at head
      const ordered = [...fresh].sort((a, b) => b.timestamp - a.timestamp);
      for (const msg of ordered) {
        await getKV().rpush(key, msg);
      }
    }
  } catch {
    // Non-fatal — prune will retry on next request
  }
}
