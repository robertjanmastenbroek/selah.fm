import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const { searchParams } = new URL(request.url, 'https://selah.fm');
  const search = searchParams.get('search') || '';
  
  try {
    let users;
    if (search) {
      users = await sql`SELECT id, email, display_name, user_type, created_at, stripe_connect_id FROM users WHERE email ILIKE ${'%'+search+'%'} OR display_name ILIKE ${'%'+search+'%'} ORDER BY created_at DESC LIMIT 100`;
    } else {
      users = await sql`SELECT id, email, display_name, user_type, created_at, stripe_connect_id FROM users ORDER BY created_at DESC LIMIT 100`;
    }
    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
