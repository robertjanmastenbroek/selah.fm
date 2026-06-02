import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

// ── Rate limit constants ──────────────────────────────────────
const RATE_WINDOW_MS = 60_000;        // 1 minute
const RATE_MAX_REQUESTS = 5;          // 5 messages per minute per IP
const DAILY_AI_CAP_PER_IP = 30;       // 30 AI replies per day per IP
const GLOBAL_DAILY_AI_CAP = 500;      // 500 total AI calls per day (all users)
const MAX_MESSAGE_LENGTH = 500;       // characters per message

// ── In-memory stores (reset on server restart) ────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const dailyAiStore = new Map<string, number>(); // IP → AI calls today
let globalAiCallsToday = 0;
let globalAiDate = new Date().getUTCDate();

function resetDailyIfNeeded() {
  const today = new Date().getUTCDate();
  if (today !== globalAiDate) {
    globalAiCallsToday = 0;
    globalAiDate = today;
    dailyAiStore.clear();
  }
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || '127.0.0.1';
}

// ── Rate limit check (per-IP, sliding window) ─────────────────
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateLimitStore.set(ip, entry);
  }
  entry.count++;
  const remaining = Math.max(0, RATE_MAX_REQUESTS - entry.count);
  const resetIn = Math.max(0, entry.resetAt - now);

  // Periodic cleanup (every ~1000 entries)
  if (rateLimitStore.size > 5000) {
    for (const [k, v] of rateLimitStore) {
      if (now > v.resetAt) rateLimitStore.delete(k);
    }
  }

  return {
    allowed: entry.count <= RATE_MAX_REQUESTS,
    remaining,
    resetIn,
  };
}

const SYSTEM_PROMPT = `You are Selah AI, the support assistant for Selah.fm — an open-source CPM marketplace for music promotion.

Key facts about Selah.fm:
- Artists create campaigns with budgets, set CPM rates, and deposit via Stripe
- Creators browse campaigns, make TikToks/Reels/Shorts, submit for review
- Artists approve/reject submissions, creators get paid for verified views
- CPM rates are LOCKED once a campaign receives submissions. This protects creators.
  Artists must create a new campaign to change their CPM rate.
- 20% platform fee added on top of artist CPM (creators earn full CPM, displayed per 1M views), Stripe takes 2.9% + $0.30 on deposits
- YouTube views auto-verified via API, TikTok/Instagram via oEmbed
- Google OAuth + email/password signup at selah.fm/login
- Dashboard: selah.fm/dashboard | Browse: selah.fm/browse
- FAQ: selah.fm/faq | Bug report: selah.fm/report-bug
- All code is MIT licensed: github.com/robertjanmastenbroek/selah.fm
- Support email: support@selah.fm | Info: info@selah.fm
- Referrals: artists get 5% bonus on referred artist's first deposit (both get 5%)
- Campaign crowdfunding: fans can donate to artist campaigns at selah.fm/c/[id]
- Mobile-responsive: works on phones, tablets, desktop — no app needed

Rules:
- Be warm, concise, and helpful. Never mention you're an AI.
- Answer in 1-3 short paragraphs max.
- When relevant, include clickable links to Selah.fm pages: /dashboard, /browse, /faq, /login, /earnings, /review, /settings, /report-bug, /open-source, /privacy, /tos
- If you don't know something specific about the user's account, suggest they email support@selah.fm.
- Use emojis sparingly — one per message max.
- Never make up features that don't exist.`;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  resetDailyIfNeeded();

  // ── Guard 1: Rate limit (per-IP, 5 req/min) ──────────────────
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { reply: "You're sending messages too quickly. Please wait a moment before sending another.", source: 'rate_limited' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rl.resetIn / 1000)),
          'Retry-After': String(Math.ceil(rl.resetIn / 1000)),
        },
      }
    );
  }

  // ── Guard 2: Parse body, validate message length ─────────────
  let message: string;
  let history: any[];
  try {
    const body = await request.json();
    message = (body.message || '').trim();
    history = Array.isArray(body.history) ? body.history : [];
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({
      reply: `Your message is too long (${message.length} characters). Please keep it under ${MAX_MESSAGE_LENGTH} characters — try breaking it into shorter messages.`,
      source: 'validation',
    });
  }

  // ── Guard 3: Global daily AI cap ─────────────────────────────
  const globalCapExceeded = globalAiCallsToday >= GLOBAL_DAILY_AI_CAP;

  // ── Guard 4: Per-IP daily AI cap ─────────────────────────────
  const ipDailyCount = dailyAiStore.get(ip) || 0;
  const ipCapExceeded = ipDailyCount >= DAILY_AI_CAP_PER_IP;

  // ── Determine if we should use AI ────────────────────────────
  const canUseAi = DEEPSEEK_API_KEY && !globalCapExceeded && !ipCapExceeded;

  if (canUseAi) {
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(history.slice(-6).map((h: string) => {
          const [role, ...rest] = h.split(': ');
          return {
            role: role === 'user' ? 'user' : 'assistant',
            content: rest.join(': '),
          };
        })),
        { role: 'user', content: message },
      ];

      const res = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          // Track AI usage
          globalAiCallsToday++;
          dailyAiStore.set(ip, ipDailyCount + 1);

          return NextResponse.json(
            { reply, source: 'ai' },
            {
              headers: {
                'X-RateLimit-Remaining': String(rl.remaining),
                'X-RateLimit-Reset': String(Math.ceil(rl.resetIn / 1000)),
              },
            }
          );
        }
      }
    } catch (aiErr) {
      console.error('DeepSeek API error:', aiErr);
    }
  }

  // ── Fallback: keyword matching (free) ────────────────────────
  const reply = keywordMatch(message);
  const source = reply
    ? 'keyword'
    : globalCapExceeded
      ? 'global_cap'
      : ipCapExceeded
        ? 'daily_ip_cap'
        : 'keyword';

  if (reply) {
    return NextResponse.json(
      { reply, source },
      {
        headers: {
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rl.resetIn / 1000)),
        },
      }
    );
  }

  // Auto-detect potential bugs (fire-and-forget)
  detectBug(message, history).catch(() => {});

  // ── No match — suggest email support ─────────────────────────
  return NextResponse.json(
    {
      reply: "I'm not sure about that — please email support@selah.fm and our team will get back to you, usually within a few hours.",
      source: 'fallback',
    },
    {
      headers: {
        'X-RateLimit-Remaining': String(rl.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rl.resetIn / 1000)),
      },
    }
  );
}

// ── Keyword fallback ──────────────────────────────────────────
function keywordMatch(msg: string): string | null {
  const m = msg.toLowerCase();

  if (/^(hi|hello|hey|yo|sup|hola|greetings)/.test(m.trim())) {
    return "Hey there! 👋 I'm Selah AI, your support assistant. I can help with campaigns, payments, creator questions, or anything about the platform. What can I help you with?";
  }
  if (/(create|campaign|promote|launch).*(track|song|music)/.test(m)) {
    return "To create a campaign: go to your Dashboard, click New, choose a track, set your CPM rate and budget, and launch. Creators will find it on the Browse page and start making content!";
  }
  if (/(cpm|rate|budget|cost|price|pricing)/.test(m)) {
    return "You set your own CPM rate (displayed per 1M views). Once a campaign has submissions, the CPM is locked to protect creators. To change your rate, create a new campaign. A 20% platform fee is added on top — you pay CPM × 1.20. Creators earn the full CPM.";
  }
  if (/(fee|fees|charge|commission)/.test(m)) {
    return "Selah.fm adds a 20% platform fee on top of the artist's CPM rate. Creators earn the full CPM — no deductions. Example: $1,000/1M CPM → artist pays $1,200, creator gets $1,000.";
  }
  if (/(earn|payout|get paid|money|cash)/.test(m)) {
    return "Creators earn the full CPM rate per 1M verified views — nothing deducted. The 20% platform fee is added on the artist side. Payouts via Stripe Connect. Set up in the Earnings page.";
  }
  if (/(stripe|payment|bank|payout|connect)/.test(m)) {
    return "We use Stripe for all payments. Artists deposit via Stripe Checkout. Creators connect via Stripe Connect. Works in 40+ countries.";
  }
  if (/(verify|views|fake|bot|real)/.test(m)) {
    return "We verify views through YouTube's API, TikTok oEmbed, and manual review for Instagram. Only organic, verified views count.";
  }
  if (/(login|sign.*in|sign.*up|register|account|password|google|oauth)/.test(m)) {
    return "Sign up with email/password or Google. Google sign-in users must use 'Continue with Google'. For password resets: support@selah.fm.";
  }
  if (/(about|what is|how does|platform|marketplace)/.test(m)) {
    return "Selah.fm is an open-source CPM marketplace for music promotion. Artists set budgets, creators make content, artists approve and pay for verified views. MIT licensed on GitHub!";
  }
  if (/(open.source|github|code|mit|license)/.test(m)) {
    return "Fully open source under MIT! github.com/robertjanmastenbroek/selah.fm — you can contribute, audit, or run your own instance.";
  }
  return null;
}

// ── Auto bug detection ───────────────────────────────────────
async function detectBug(message: string, history: any[]) {
  const msg = message.toLowerCase();

  const bugPatterns = [
    /\b(not working|doesn'?t work|isn'?t working|broken|broke)\b/,
    /\b(error|bug|glitch|crash|freeze|stuck|hang)\b/,
    /\b(won'?t load|can'?t load|not loading|empty|blank|missing)\b/,
    /\b(can'?t (?:click|submit|save|upload|sign|log|create|edit|delete|connect|link|crop|pay|deposit))\b/,
    /\b(404|500|page not found|something went wrong)\b/,
    /\b(showing (?:0|zero|nothing|no ))\b/,
    /\b(problem|issue|fail|failing|won't connect)\b.*(?:stripe|connect|payment|account|upload|image|crop|save|campaign)/i,
    /(?:gives?|shows?|throws?|returns?).*(?:error|problem|issue)/i,
  ];

  const isBugLike = bugPatterns.some(p => p.test(msg));
  if (!isBugLike) return;

  const knownTopics = /(?:how (?:do|can|to)|what is|where (?:is|can)|when (?:can|will))/i;
  if (knownTopics.test(msg)) return;

  try {
    const { default: sql } = await import('@/lib/db');
    const historyText = Array.isArray(history) ? history.join('\n') : '';
    await sql`
      INSERT INTO bugs (description, steps_to_reproduce, severity, status)
      VALUES (
        ${message.slice(0, 2000)},
        ${historyText.slice(0, 2000) || 'No conversation history'},
        'medium',
        'new'
      )
    `;
    console.log('[BUG] Auto-captured:', message.slice(0, 80));
  } catch {
    // Table might not exist — non-critical
  }
}
