import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getUser, createUser, createSession } from '@/lib/kv';

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const { nickname, password } = await req.json();

  if (!nickname || !password) return badRequest('Nickname and password are required.');

  const nick = nickname.trim();
  if (nick.length < 2 || nick.length > 20)
    return badRequest('Nickname must be 2–20 characters.');
  if (!/^[a-zA-Z0-9_]+$/.test(nick))
    return badRequest('Nickname can only contain letters, numbers, and underscores.');
  if (password.length < 4)
    return badRequest('Password must be at least 4 characters.');

  const existing = await getUser(nick);

  if (existing) {
    // LOGIN
    const match = await bcrypt.compare(password, existing.passwordHash);
    if (!match) return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  } else {
    // REGISTER
    const passwordHash = await bcrypt.hash(password, 10);
    await createUser({ nickname: nick, passwordHash, createdAt: Date.now() });
  }

  const token = uuidv4();
  await createSession(token, nick);

  return NextResponse.json({
    token,
    nickname: nick,
    isNew: !existing,
  });
}
