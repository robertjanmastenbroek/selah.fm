import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

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

// ── Comprehensive fallback question bank (52 topics) ──────────────

const TOPIC_QUESTIONS: Record<string, string[]> = {
  // Identity & Life
  'Life Story': ['What is your earliest memory?', 'What childhood moment shaped who you became?', 'What moment changed the entire course of your life?', 'Who influenced you most — and why?', 'What do you regret?', 'What are you most proud of?'],
  'Childhood & Family': ['Describe your parents. What did they teach you?', 'What was home like growing up?', 'What role did siblings or lack of them play?', 'What family tradition still impacts you?', 'What did you want to be when you grew up?'],
  'Dutch Roots': ['What does being Dutch mean to you?', 'How did growing up in Holland shape your worldview?', 'What Dutch values do you still carry?', 'How does Dutch culture differ from where you live now?', 'What do you miss most about Holland?'],
  'Tenerife Life': ['Why Tenerife?', 'What is daily life like there?', 'How has island living changed you?', 'What surprises people about living in Tenerife?', 'What do you love and hate about it?'],
  'Relationships': ['What have you learned about friendship?', 'How do you think about romantic relationships now?', 'Who has been your most important relationship — and why?', 'What is the hardest thing about relationships for you?', 'How do you handle conflict with people you love?'],
  'Darkest Moments': ['What was the lowest point of your life?', 'What got you through it?', 'What did you learn about yourself in the darkness?', 'How did that period change how you treat people?', 'What would you tell someone going through hell right now?'],
  'Greatest Wins': ['What achievement are you most proud of?', 'What win surprised you the most?', 'How do you celebrate success?', 'Has success ever felt empty?', 'What does winning mean to you now vs. 10 years ago?'],

  // Faith & Spirit
  'Faith Journey': ['When did faith become real to you?', 'What was your life like before faith?', 'What spiritual moment changed everything?', 'How has your faith evolved?', 'What do you still wrestle with?', 'What is the role of doubt in your faith?'],
  'Prayer & Practice': ['What does your prayer life actually look like?', 'How do you hear from God?', 'What spiritual practice grounds you daily?', 'Have you ever felt like God was silent?', 'How do you pray when you do not feel like it?'],
  'Worship & Music': ['What is worship to you?', 'How is worship different from performance?', 'What happens inside you when you lead worship?', 'How do you prepare spiritually before making music?', 'What worship song has meant the most to you — and why?'],
  'Theology & Beliefs': ['What do you believe about God?', 'What do you believe about grace?', 'What doctrine do you hold loosely?', 'What theological idea changed how you live?', 'How do you approach people who believe differently?'],
  'Spiritual Warfare': ['Do you believe in spiritual warfare?', 'How have you experienced it?', 'How do you protect yourself spiritually?', 'What is the biggest spiritual battle you have faced?', 'How do you know when something is spiritual attack vs. life happening?'],
  'Faith in Business': ['How does your faith affect business decisions?', 'Have you ever compromised faith for business?', 'How do you handle money as a person of faith?', 'What is the line between business and ministry?', 'How do you work with people who do not share your beliefs?'],

  // Music & Art
  'Music Industry': ['What is broken about the music industry?', 'How should artists think about money?', 'What makes a song connect emotionally?', 'How has streaming changed creativity?', 'What would you change about the industry if you could?'],
  'Songwriting': ['What is your songwriting process?', 'Where do your best ideas come from?', 'How do you know when a song is finished?', 'What makes a great lyric?', 'How do you handle creative blocks?'],
  'Electronic Production': ['How did you get into electronic music production?', 'What is your production setup?', 'What is your workflow from idea to finished track?', 'What is the hardest part of electronic production?', 'What producers inspire you?'],
  'Live Performance': ['What is it like performing live?', 'How is live performance different from studio work?', 'What was your best live moment ever?', 'What was your worst?', 'How do you handle stage fright or nerves?'],
  'Music Tech & Gear': ['What gear can you not live without?', 'How much does gear actually matter?', 'What is the best investment you made in equipment?', 'What tech trend in music is overhyped?', 'What is your dream setup?'],
  'Record Labels': ['Why did you walk away from a record deal?', 'What do labels get right?', 'What do they get wrong?', 'Should independent artists ever sign with a label?', 'What is the future of record labels?'],
  'Streaming & Distribution': ['How do you think about Spotify?', 'What distribution strategy works best for independents?', 'How has streaming changed how you make music?', 'Is the streaming model fair to artists?', 'Where is music distribution headed?'],
  'DJing & Sets': ['How did you get into DJing?', 'What makes a great DJ set?', 'How do you read a crowd?', 'What is the difference between a DJ and a producer?', 'What is your philosophy on track selection?'],

  // Business & Money
  'Entrepreneurship': ['What was your first business?', 'What failure taught you the most?', 'How do you evaluate risk?', 'How do you handle the pressure of leading?', 'What is the biggest myth about entrepreneurship?'],
  'Crowdfunding': ['How did you build a €6M crowdfunding platform?', 'What makes a crowdfunding campaign succeed?', 'What makes one fail?', 'How did crowdfunding change your view of people?', 'What would you do differently if you started over?'],
  'Startup Failure': ['What happened when your platform was hacked?', 'How did it feel to lose everything?', 'What did the failure teach you about trust?', 'How did you rebuild after losing it all?', 'What advice do you have for founders facing collapse?'],
  'Money Mindset': ['What was your relationship with money growing up?', 'How did becoming wealthy change you?', 'What did losing everything teach you about money?', 'How do you think about financial freedom?', 'What is enough money?'],
  'Investing': ['What was your best investment?', 'What was your worst?', 'How do you think about risk in investing?', 'What is your philosophy on Bitcoin and crypto?', 'How should young people think about investing?'],
  'Sales & Negotiation': ['What is your approach to selling?', 'How do you negotiate?', 'What is the biggest sales mistake people make?', 'How do you handle rejection?', 'What is the art of persuasion?'],
  'Leadership': ['What is your leadership style?', 'How do you handle people who disagree with you?', 'What makes a great team?', 'How do you make hard decisions?', 'What leader do you admire most — and why?'],
  'Business Ethics': ['Where do you draw ethical lines in business?', 'Have you ever crossed one?', 'How do you handle temptation to cut corners?', 'What is the purpose of business — profit or people?', 'How do you build trust with customers?'],

  // Marketing & Growth
  'Marketing Strategy': ['What is the most underrated marketing channel?', 'How do you think about audience building?', 'What marketing trend is overhyped?', 'How has marketing changed since you started?', 'What campaign are you most proud of?'],
  'Email Marketing': ['Why is email still powerful?', 'How do you build an email list?', 'What makes an email people actually read?', 'How often should you email your list?', 'What is the biggest email mistake?'],
  'Content Creation': ['What makes content go viral?', 'How do you stay consistent with content?', 'What is the difference between content and noise?', 'How do you find your content voice?', 'What content format works best right now?'],
  'Brand Building': ['What is a brand — really?', 'How did you build the Selah.fm brand?', 'What brand do you admire most and why?', 'How do you stay authentic while building a brand?', 'What is the biggest branding mistake?'],
  'Community Building': ['How do you build a community from zero?', 'What makes a community stick together?', 'How do you handle trolls or toxic members?', 'What community are you most proud of building?', 'How is community different from an audience?'],
  'Growth Hacking': ['What growth hack actually worked for you?', 'What growth tactic was a waste of time?', 'How do you think about virality?', 'What metrics actually matter for growth?', 'How do you balance growth with sustainability?'],
  'Conversion Optimization': ['How do you turn visitors into users?', 'What makes a landing page convert?', 'What is the psychology of a click?', 'How do you reduce friction in signup flows?', 'What is the most important conversion metric?'],

  // Creator Economy
  'Creator Economy': ['What is the biggest misconception about being a creator?', 'How should creators think about monetization?', 'What separates successful creators from the rest?', 'Where is the creator economy headed?', 'How do creators avoid burnout?'],
  'Platform Algorithms': ['How do you think about algorithms?', 'Should creators try to game algorithms?', 'What algorithm change impacted you most?', 'How do you stay visible when algorithms change?', 'What platform has the fairest algorithm?'],
  'TikTok Strategy': ['What works on TikTok that fails elsewhere?', 'How important is the first second of a TikTok?', 'What is your TikTok content strategy?', 'How do TikTok trends work — and should you chase them?', 'What is the future of TikTok for musicians?'],
  'YouTube Strategy': ['How is YouTube different from short-form platforms?', 'What makes a YouTube video perform?', 'How important are thumbnails and titles?', 'Should creators focus on Shorts or long-form?', 'How do you build a YouTube channel from zero?'],
  'Instagram Strategy': ['Is Instagram still relevant for musicians?', 'What works on Reels vs. feed posts?', 'How do you use Instagram Stories effectively?', 'What is the best Instagram growth strategy right now?', 'How has Instagram changed — and is it better or worse?'],
  'Spotify for Artists': ['How do you get on Spotify playlists?', 'What matters more — streams or saves?', 'How do you use Spotify for Artists analytics?', 'Is Spotify promotion worth paying for?', 'What is the future of music discovery on Spotify?'],
  'Monetization Models': ['What is the best way for creators to make money?', 'How do you think about CPM vs. brand deals?', 'What monetization model is underrated?', 'How should creators diversify income?', 'What is the fair price for creator work?'],

  // Mindset & Growth
  'Personal Development': ['How do you work on yourself?', 'What book changed your life?', 'What habit has the biggest ROI?', 'How do you measure personal growth?', 'What are you working on improving right now?'],
  'Resilience': ['How do you bounce back from failure?', 'What keeps you going when everything falls apart?', 'How did losing everything build your resilience?', 'What is the difference between resilience and stubbornness?', 'How do you help others build resilience?'],
  'Habits & Discipline': ['What is your morning routine?', 'How do you stay disciplined?', 'What habit was hardest to build?', 'How do you handle days when you have zero motivation?', 'What habit would you tell your younger self to start?'],
  'Overcoming Fear': ['What are you afraid of?', 'How do you make decisions when you are scared?', 'What fear held you back the longest?', 'How did you overcome it?', 'What would you do if you were not afraid?'],
  'Identity & Self-Worth': ['How do you define yourself?', 'Has your identity ever been wrapped up in the wrong thing?', 'How did losing everything affect your self-worth?', 'Where does your worth come from now?', 'How do you help people who struggle with self-worth?'],
  'Success Redefined': ['What is success to you now?', 'How has your definition of success changed?', 'What is the most successful failure you ever had?', 'Is ambition good or dangerous?', 'What would you tell someone obsessed with being successful?'],
  'Purpose & Meaning': ['What do you believe your purpose is?', 'How did you discover it?', 'Has your purpose changed over time?', 'How do you know if you are living on purpose?', 'What is the relationship between purpose and happiness?'],

  // Tech & Future
  'AI & Technology': ['How do you use AI in your work?', 'What excites you about AI?', 'What worries you about AI?', 'How should creators think about AI tools?', 'What is the future of human creativity with AI?', 'Will AI replace musicians?'],
  'Web3 & Crypto': ['What is your experience with crypto?', 'What did Bitcoin mining teach you?', 'Do you think Web3 will change the creator economy?', 'What is overhyped about crypto?', 'What is real about it?'],
  'Future of Work': ['How will AI change work?', 'What jobs do you think will disappear?', 'What skills will matter most in 10 years?', 'How should young people prepare for the future?', 'What is the future of being a creative professional?'],
  'Automation': ['What do you automate in your life?', 'What should never be automated?', 'How has automation changed your workflow?', 'What is the danger of automating too much?', 'What tool has saved you the most time?'],
  'Digital Nomad Life': ['What is it like working from anywhere?', 'What are the real challenges of nomad life?', 'How do you stay productive while moving around?', 'What is the best place you have worked from?', 'Would you recommend this lifestyle?'],
  'Tech Ethics': ['What ethical lines should tech not cross?', 'What worries you about surveillance and data?', 'How should we regulate AI?', 'What responsibility do tech founders have?', 'What tech trend feels dystopian to you?'],

  // Philosophy
  'Freedom': ['What does freedom mean to you?', 'When have you felt most free?', 'Is total freedom possible — or desirable?', 'How do you balance freedom and responsibility?', 'What is the relationship between freedom and money?'],
  'Risk & Courage': ['How do you think about risk?', 'What was the biggest risk you ever took?', 'Was it worth it?', 'How do you know when to be cautious vs. bold?', 'What is courage to you?'],
  'Legacy & Impact': ['What do you want to be remembered for?', 'How do you measure impact?', 'What impact are you most proud of?', 'Does legacy matter if no one remembers your name?', 'What is the difference between impact and ego?'],
  'Truth & Deception': ['How do you discern truth?', 'What is the biggest lie you ever believed?', 'How has deception affected your life?', 'How do you handle people who deceive you?', 'What is the relationship between truth and love?'],
  'Justice & Fairness': ['What does justice mean to you?', 'How do you respond to unfairness?', 'What injustice makes you most angry?', 'How do you fight for justice without becoming bitter?', 'Is the world fundamentally fair or unfair?'],
  'Beauty & Excellence': ['What is beauty to you?', 'Why does beauty matter?', 'How do you pursue excellence without perfectionism?', 'What is the most beautiful thing you have ever experienced?', 'How does beauty point to something bigger?'],
};

// ── API Routes ────────────────────────────────────────────────────

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
  const fallbacks = TOPIC_QUESTIONS[topic];

  // Fetch previously asked questions for this topic to avoid duplicates
  const prevAnswers = await sql`
    SELECT chunk_text FROM voice_chunks
    WHERE chunk_text LIKE '%_interview_answer%'
    AND chunk_text LIKE '%' || ${'topic":"' + topic + '"'} || '%'
  `;
  const prevQuestions = new Set(
    prevAnswers.map((r: any) => {
      try { return JSON.parse(r.chunk_text).question?.toLowerCase().trim(); }
      catch { return null; }
    }).filter(Boolean)
  );

  // Filter out previously answered questions from fallbacks
  const freshFallbacks = fallbacks
    ? fallbacks.filter(q => !prevQuestions.has(q.toLowerCase().trim()))
    : null;

  // If we have enough fresh curated questions, use them
  if (freshFallbacks && freshFallbacks.length >= count) {
    return NextResponse.json({ questions: freshFallbacks.slice(0, count), generated_by: 'curated' });
  }

  // If all curated questions are exhausted, note it and use DeepSeek
  const alreadyAnswered = fallbacks ? fallbacks.length - (freshFallbacks?.length || 0) : 0;
  if (alreadyAnswered > 0 && fallbacks && fallbacks.length === alreadyAnswered) {
    // All curated questions answered — force DeepSeek
    count = Math.max(count, 3); // ensure at least some questions
  }

  // If no DeepSeek key, return whatever fallbacks we have (even if fewer than requested)
  if (!DEEPSEEK_API_KEY) {
    const questions = fallbacks || [
      `What is your perspective on ${topic}?`,
      `How has ${topic} shaped your life?`,
      `What is the biggest lesson you have learned about ${topic}?`,
      `What would you tell your younger self about ${topic}?`,
      `Where do you see ${topic} going in the next 5 years?`,
    ];
    return NextResponse.json({ questions: questions, generated_by: fallbacks ? 'curated' : 'fallback' });
  }

  // Need more questions than we have cached — use DeepSeek for the full set
  // (mixing curated + generated creates quality inconsistency)

  // DeepSeek generation for custom topics
  const topicContext = topic === 'Life Story'
    ? "This is a deeply personal interview about the founder's entire life — childhood, family, career, failures, faith, transformation. Ask questions that uncover the full story, not just achievements."
    : `This is a deep-dive interview about "${topic}". Ask thought-provoking questions that reveal the founder's authentic perspective, hard-won lessons, and personal experiences.`;

  const response = await deepseekChat([
    {
      role: 'system',
      content: `You are a world-class interviewer preparing questions for Robert-Jan Mastenbroek, founder of Selah.fm. He is a Dutch entrepreneur who walked away from a record deal, built a EUR6M crowdfunding platform, lost everything, lived in a campervan busking on Tenerife beaches, found faith, and now builds electronic worship music. He has been a multi-millionaire and homeless — he has depth.

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
    const lines = response.split('\n').filter((l: string) => l.match(/^\d+[\.\)]\s/) || l.includes('?')).slice(0, count);
    return NextResponse.json({ questions: lines.length > 0 ? lines : [`Tell me about your journey with ${topic}`], generated_by: 'fallback' });
  } catch {
    return NextResponse.json({ questions: [`What is your story with ${topic}?`], generated_by: 'fallback' });
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
  return NextResponse.json({ session: sessionName, answers: parsed, total_answers: parsed.length, total_voice_chunks: count?.count || 0 });
}
