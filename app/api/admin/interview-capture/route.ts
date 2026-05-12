import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession, isAdminRequest } from '@/lib/auth';

/**
 * Founder interview capture — structured brain dump endpoint.
 * Each interview session is a named topic area. Answers are chunked
 * and stored in voice_chunks with metadata for future blog generation.
 */

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const { action, session_name, topic, question, answer, phase } = body;

  try {
    switch (action) {
      case 'start_session':
        return startSession(session_name, phase);
      case 'capture_answer':
        return captureAnswer(session_name, topic, question, answer);
      case 'get_sessions':
        return getSessions();
      case 'get_session':
        return getSessionData(session_name);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Interview capture error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const session_name = searchParams.get('session');

  try {
    if (session_name) return getSessionData(session_name);
    return getSessions();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Handlers ─────────────────────────────────────────────────────

async function startSession(name: string, phase: string) {
  // Sessions are tracked as voice_chunks with a session_name tag
  // We use the existing voice_chunks table with a session metadata column
  await sql`
    INSERT INTO voice_chunks (interview_id, chunk_text)
    VALUES (NULL, ${JSON.stringify({
      _session_start: true,
      session_name: name,
      phase: phase,
      started_at: new Date().toISOString(),
    })})
  `;

  return NextResponse.json({
    session: name,
    phase,
    started: true,
    message: `Session "${name}" started. Begin capturing answers.`,
  });
}

async function captureAnswer(sessionName: string, topic: string, question: string, answer: string) {
  if (!answer || answer.trim().length < 20) {
    return NextResponse.json({ error: 'Answer too short' }, { status: 400 });
  }

  // Store each Q&A pair as a voice chunk with rich metadata
  const chunkText = `Q: ${question}\nA: ${answer}`;
  
  await sql`
    INSERT INTO voice_chunks (interview_id, chunk_text)
    VALUES (NULL, ${JSON.stringify({
      _interview_answer: true,
      session_name: sessionName,
      topic: topic,
      question: question,
      answer: answer,
      captured_at: new Date().toISOString(),
    })})
  `;

  // Also store the raw answer text as a standalone chunk for voice matching
  if (answer.length > 60) {
    const chunks = answer.match(/.{1,500}/g) || [answer];
    for (const chunk of chunks.slice(0, 3)) {
      if (chunk.trim().length > 40) {
        await sql`
          INSERT INTO voice_chunks (interview_id, chunk_text)
          VALUES (NULL, ${chunk.trim()})
        `;
      }
    }
  }

  return NextResponse.json({ captured: true, topic, answer_length: answer.length });
}

async function getSessions() {
  const sessions = await sql`
    SELECT chunk_text FROM voice_chunks
    WHERE interview_id IS NULL AND chunk_text LIKE '%_session_start%'
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const parsed = sessions.map((s: any) => {
    try {
      const data = JSON.parse(s.chunk_text);
      return { session: data.session_name, phase: data.phase, started: data.started_at };
    } catch { return null; }
  }).filter(Boolean);

  return NextResponse.json(parsed);
}

async function getSessionData(sessionName: string) {
  const answers = await sql`
    SELECT chunk_text, created_at FROM voice_chunks
    WHERE interview_id IS NULL AND chunk_text LIKE '%' || ${sessionName} || '%'
    AND chunk_text LIKE '%_interview_answer%'
    ORDER BY created_at
  `;

  const parsed = answers.map((a: any, i: number) => {
    try {
      const data = JSON.parse(a.chunk_text);
      return { index: i + 1, topic: data.topic, question: data.question, answer: data.answer, captured_at: data.captured_at };
    } catch { return { index: i + 1, raw: a.chunk_text.slice(0, 200) }; }
  });

  // Count total voice chunks
  const [count] = await sql`SELECT COUNT(*)::int FROM voice_chunks`;

  return NextResponse.json({
    session: sessionName,
    answers: parsed,
    total_answers: parsed.length,
    total_voice_chunks: count?.count || 0,
  });
}
