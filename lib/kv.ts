import { Redis } from '@upstash/redis';

let _kv: Redis | null = null;

function getKV(): Redis {
  if (!_kv) {
    // Vercel/Upstash integration can inject under several different names
    const url =
      process.env.KV_REST_API_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_URL;

    const token =
      process.env.KV_REST_API_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN;

    // Debug — visible in Vercel function logs
    console.log('[kv] url set:', !!url, '| token set:', !!token);
    console.log('[kv] available env keys:', Object.keys(process.env).filter(k =>
      k.includes('KV') || k.includes('REDIS') || k.includes('UPSTASH')
    ));

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

export async function getUser(nickname: string): Promise<User | null> {
  const data = await getKV().hgetall(`user:${nickname.toLowerCase()}`);
  if (!data || Object.keys(data).length === 0) return null;
  return data as unknown as User;
}

export async function createUser(user: User): Promise<void> {
  await getKV().hset(`user:${user.nickname.toLowerCase()}`, user as unknown as Record<string, unknown>);
}

export async function createSession(token: string, nickname: string): Promise<void> {
  await getKV().set(`session:${token}`, nickname, { ex: 60 * 60 * 24 * 7 });
}

export async function getSession(token: string): Promise<string | null> {
  return await getKV().get<string>(`session:${token}`);
}

export async function deleteSession(token: string): Promise<void> {
  await getKV().del(`session:${token}`);
}

export async function getMessages(limit = 120): Promise<Message[]> {
  const raw = await getKV().lrange<Message>('messages', 0, limit - 1);
  return [...raw].reverse();
}

export async function addMessage(msg: Message): Promise<void> {
  await getKV().lpush('messages', msg);
  await getKV().ltrim('messages', 0, 499);
}
