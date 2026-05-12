import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

/**
 * Founder interview capture — structured brain dump endpoint.
 * Each interview session is a named topic area. Answers are chunked
 * and stored in voice_chunks with metadata for future blog generation.
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

async function deepseekChat(messages: { role: string; content: string }[], maxTokens = 1000) {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.8, max_tokens: maxTokens }),
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const { action, session_name, topic, question, answer, phase, count } = body;

  try {
    switch (action) {
      case 'generate_questions':
        return generateQuestions(topic, count || 5);
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
    if (session_name === 'stats') {
      const [count] = await sql`SELECT COUNT(*)::int FROM voice_chunks WHERE chunk_text NOT LIKE '%_session_start%'`;
      const [answerCount] = await sql`SELECT COUNT(*)::int FROM voice_chunks WHERE chunk_text LIKE '%_interview_answer%'`;
      return NextResponse.json({ total_voice_chunks: count?.count || 0, total_answers: answerCount?.count || 0 });
    }
    if (session_name) return getSessionData(session_name);
    return getSessions();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Question Generation ───────────────────────────────────────────

async function generateQuestions(topic: string, count: number) {
  if (!DEEPSEEK_API_KEY) {
    // Fallback: return topic-relevant generic questions
    const fallbacks: Record<string, string[]> = {
      'Life Story': ['What is your earliest memory?', 'What was your childhood like?', 'What moment changed the course of your life?', 'Who has influenced you the most?', 'What do you regret?'],
      'Faith & Spirituality': ['When did faith become real to you?', 'What spiritual practice grounds you daily?', 'How has your faith been tested?', 'What do you believe about purpose?', 'How do you hear from God?'],
      'Music Industry': ["What's broken about the music industry?", 'How should artists think about money?', 'What makes a song connect emotionally?', 'How has streaming changed creativity?', "What's your creative process?"],
      'Entrepreneurship': ['What was your first business?', 'What failure taught you the most?', 'How do you evaluate risk?', "What's your approach to building teams?", 'How do you handle the pressure of leading?'],
      'Marketing & Growth': ["What's the most underrated marketing channel?", 'How do you think about audience building?', 'What marketing trend is overhyped?', 'How has marketing changed since you started?', "What's a marketing campaign you're proud of?"],
      'Money & Mindset': ['What was your relationship with money growing up?', 'How did becoming wealthy change you?', 'What did losing everything teach you about money?', 'How do you think about financial freedom?', "What's your advice about abundance mindset?"],
      'Creator Economy': ["What's the biggest misconception about being a creator?", 'How should creators think about monetization?', 'What separates successful creators from the rest?', "Where is the creator economy headed?", 'How do creators avoid burnout?'],
      'AI & Technology': ['How do you use AI in your work?', 'What excites you about AI?', 'What worries you about AI?', 'How should creators think about AI tools?', "What's the future of human creativity with AI?"],
    };

    const questions = fallbacks[topic] || [
      `What's your perspective on ${topic}?`,
      `How has ${topic} shaped your life?`,
      `What's the biggest lesson you've learned about ${topic}?`,
      `What would you tell your younger self about ${topic}?`,
      `Where do you see ${topic} going in the next 5 years?`,
    ];

    return NextResponse.json({ questions: questions.slice(0, count), generated_by: 'fallback' });
  }

  const topicContext = topic === 'Life Story'
    ? "This is a deeply personal interview about the founder's entire life — childhood, family, career, failures, faith, transformation. Ask questions that uncover the full story, not just achievements."
    : `This is a deep-dive interview about "${topic}". Ask thought-provoking questions that reveal the founder's authentic perspective, hard-won lessons, and personal experiences.`;

  const response = await deepseekChat([
    {
      role: 'system',
      content: `You are a world-class interviewer preparing questions for Robert-Jan Mastenbroek, founder of Selah.fm. He's a Dutch entrepreneur who walked away from a record deal, built a €6M crowdfunding platform, lost everything, lived in a campervan busking on Tenerife beaches, found faith, and now builds electronic worship music. He's been a multi-millionaire and homeless — he has depth.

${topicContext}

Generate ${count} interview questions that:
- Cannot be answered with one word or a simple yes/no
- Dig into emotions, specific moments, and personal philosophy
- Mix practical questions with spiritual/meaning questions
- Feel like a conversation with a close friend

Return ONLY a JSON array of strings. Example: ["Question 1?", "Question 2?"]`,
    },
    { role: 'user', content: `Generate ${count} interview questions about: ${topic}` },
  ], 800);

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return NextResponse.json({ questions: parsed.slice(0, count), generated_by: 'deepseek' });
      }
    }
    // Fallback: split by newlines and filter
    const lines = response.split('\n').filter((l: string) => l.match(/^\d+[\.\)]\s/) || l.includes('?')).slice(0, count);
    return NextResponse.json({ questions: lines.length > 0 ? lines : ['Tell me about your journey with ' + topic], generated_by: 'fallback' });
  } catch {
    return NextResponse.json({ questions: [`What's your story with ${topic}?`], generated_by: 'fallback' });
  }
}

// ── Handlers ─────────────────────────────────────────────────────

async function startSession(name: string, phase: string) {
  await sql`
    INSERT INTO voice_chunks (interview_id, chunk_text)
    VALUES (NULL, ${JSON.stringify({
      _session_start: true,
      session_name: name,
      phase: phase,
      started_at: new Date().toISOString(),
    })})
  `;

  return NextResponse.json({ session: name, phase, started: true });
}

async function captureAnswer(sessionName: string, topic: string, question: string, answer: string) {
  if (!answer || answer.trim().length < 20) {
    return NextResponse.json({ error: 'Answer too short' }, { status: 400 });
  }

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

  // Also store raw answer chunks for voice matching
  if (answer.length > 60) {
    const chunks = answer.match(/.{1,500}/g) || [answer];
    for (const chunk of chunks.slice(0, 3)) {
      if (chunk.trim().length > 40) {
        await sql`INSERT INTO voice_chunks (interview_id, chunk_text) VALUES (NULL, ${chunk.trim()})`;
      }
    }
  }

  return NextResponse.json({ captured: true, topic, answer_length: answer.length });
}

async function getSessions() {
  const sessions = await sql`
    SELECT chunk_text FROM voice_chunks
    WHERE interview_id IS NULL AND chunk_text LIKE '%_session_start%'
    ORDER BY created_at DESC LIMIT 20
  `;

  const parsed = sessions.map((s: any) => {
    try {
      const data = JSON.parse(s.chunk_text);
      return { name: data.session_name, phase: data.phase, started: data.started_at };
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

  const [count] = await sql`SELECT COUNT(*)::int FROM voice_chunks`;

  return NextResponse.json({
    session: sessionName,
    answers: parsed,
    total_answers: parsed.length,
    total_voice_chunks: count?.count || 0,
  });
}
