import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getMessages, addMessage, getSession } from '@/lib/kv';

async function authenticate(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  return getSession(token);
}

export async function GET(req: NextRequest) {
  const dept = req.nextUrl.searchParams.get('dept');
  if (!dept) return NextResponse.json({ error: 'dept param required' }, { status: 400 });
  const messages = await getMessages(dept, 120);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const nickname = await authenticate(req);
  if (!nickname) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { text, department } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: 'Message is empty.' }, { status: 400 });
  if (!department) return NextResponse.json({ error: 'Department missing.' }, { status: 400 });

  const msg = {
    id: uuidv4(),
    nickname,
    department,
    text: text.trim().slice(0, 500),
    timestamp: Date.now(),
  };

  await addMessage(msg);
  return NextResponse.json(msg, { status: 201 });
}
