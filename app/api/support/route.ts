import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are Selah AI, the support assistant for Selah.fm — an open-source CPM marketplace for music promotion.

Key facts about Selah.fm:
- Artists create campaigns with budgets, set CPM rates, and deposit via Stripe
- Creators browse campaigns, make TikToks/Reels/Shorts, submit for review
- Artists approve/reject submissions, creators get paid for verified views
- 20% platform fee on creator payouts, Stripe takes 2.9% + $0.30 on deposits
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

/**
 * Chat with DeepSeek for support responses.
 * Falls back to keyword matching if API key is not configured.
 */
export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    // ── Try DeepSeek API ──────────────────────────────────────
    if (DEEPSEEK_API_KEY) {
      try {
        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(Array.isArray(history) ? history.slice(-6).map((h: string) => {
            const [role, ...rest] = h.split(': ');
            return {
              role: role === 'user' ? 'user' : 'assistant',
              content: rest.join(': '),
            };
          }) : []),
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
            max_tokens: 300,
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ reply, source: 'ai' });
          }
        }
      } catch (aiErr) {
        console.error('DeepSeek API error:', aiErr);
      }
    }

    // ── Fallback: keyword matching ────────────────────────────
    const reply = keywordMatch(message);
    if (reply) {
      return NextResponse.json({ reply, source: 'keyword' });
    }

    // ── Auto-detect potential bugs ─────────────────────────────
    // Runs in background — doesn't affect user response
    detectBug(message, history).catch(() => {});

    // ── No response available — suggest email support ──────────
    return NextResponse.json({
      reply: "I'm not sure about that — please email support@selah.fm and our team will get back to you, usually within a few hours.",
      source: 'human',
    });
  } catch (e: any) {
    console.error('Support API error:', e.message);
    return NextResponse.json({ reply: 'Something went wrong. Please try again or email support@selah.fm.' }, { status: 500 });
  }
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
    return "You set your own CPM rate (cost per 1,000 views). The platform takes a 20% service fee from creator payouts. There are no hidden costs.";
  }
  if (/(fee|fees|charge|commission)/.test(m)) {
    return "Selah.fm charges a 20% platform fee on creator payouts. Artists pay exactly what they budget — no surprise costs.";
  }
  if (/(earn|payout|get paid|money|cash)/.test(m)) {
    return "Creators earn per 1,000 verified views at the campaign's CPM rate, minus 20%. Payouts via Stripe Connect. Set up in the Earnings page.";
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

  // Bug-like patterns
  const bugPatterns = [
    /\b(not working|doesn'?t work|isn'?t working|broken|broke)\b/,
    /\b(error|bug|glitch|crash|freeze|stuck|hang)\b/,
    /\b(won'?t load|can'?t load|not loading|empty|blank|missing)\b/,
    /\b(can'?t (?:click|submit|save|upload|sign|log|create|edit|delete))\b/,
    /\b(404|500|page not found|something went wrong)\b/,
    /\b(showing (?:0|zero|nothing|no ))\b/,
  ];

  const isBugLike = bugPatterns.some(p => p.test(msg));
  if (!isBugLike) return;

  // Don't log if it's a known FAQ
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
