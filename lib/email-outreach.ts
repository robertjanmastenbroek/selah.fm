/**
 * Email outreach module — sends personalized emails to discovered artists.
 * Uses Resend (already integrated) for delivery.
 */

import { emailWrapper } from '@/lib/email-templates';

// ── Email template ───────────────────────────────────────────────

export function renderArtistOutreachEmail(params: {
  artistName: string;
  trackName: string;
  campaignUrl: string;
  claimUrl: string;
}): { subject: string; html: string } {
  const { artistName, trackName, campaignUrl, claimUrl } = params;

  const subject = `Your "${trackName}" page on Selah.fm`;
  
  const body = [
    `Hey ${artistName},`,
    '',
    `I run Selah.fm — a marketplace where artists set a budget and creators make TikToks/Reels/Shorts for their music. You only pay for verified views.`,
    '',
    `I came across "${trackName}" and built a campaign page for it. Here's what that means:`,
    '',
    `1. <strong>Share it with your fans</strong> — they can make videos with your song and earn per view, or chip in a few bucks to fund promotion`,
    `2. <strong>You approve every video</strong> — nothing goes live without your say-so`,
    `3. <strong>You pay nothing upfront</strong> — only when videos get verified views`,
    '',
    `The page is live right now. Just claim it and share with your people. Or don't — no pressure.`,
    '',
    `— Robert-Jan<br>Founder, Selah.fm`,
  ].join('<br>');

  return {
    subject,
    html: emailWrapper({
      title: `Your campaign page is live`,
      body,
      cta: { text: 'View your campaign page →', url: campaignUrl },
    }),
  };
}

// ── DeepSeek-powered email generation ────────────────────────────

const EMAIL_PROMPT = `You are Robert-Jan Mastenbroek, founder of Selah.fm — a CPM marketplace where artists set budgets and creators earn per verified view for TikToks, Reels, and Shorts.

YOUR VOICE: Warm, direct, a little rough around the edges. Like a friend who's been through hell and came out the other side. Use contractions ALWAYS. Start sentences with And/But/So/Because/Look/Here's. Vary sentence length. Never use: furthermore, moreover, game-changer, revolutionary, leverage, empower.

TASK: Write a short, personal email to an independent artist. They have a campaign page on Selah.fm for their track.

STRUCTURE:
1. Brief, personal opening about their track (1-2 sentences, specific)
2. What Selah.fm is and what the page does (2-3 sentences)
3. How they benefit — creators make videos, they pay only for verified views, fans can chip in (2-3 sentences)
4. Soft close — the page is there, claim it when ready, no pressure (1 sentence)

RULES:
- Under 150 words total
- Include the campaign URL as a clear CTA
- Sign as: — Robert-Jan (founder, Selah.fm)
- Format as plain text email (use line breaks, not HTML)
- Never: "I came across your profile", "Your music is amazing", "As a fellow musician", "We'd love to have you"
- Never: more than one exclamation mark
- Return ONLY the email text, no JSON, no quotes`;

export async function generateOutreachEmail(
  artistName: string,
  trackName: string,
  genre: string,
  campaignUrl: string,
): Promise<{ subject: string; body: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const tpl = renderArtistOutreachEmail({ artistName, trackName, campaignUrl, claimUrl: '' });
    return { subject: tpl.subject, body: tpl.html.replace(/<[^>]*>/g, '') };
  }

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: EMAIL_PROMPT },
          { role: 'user', content: `Artist: ${artistName}\nTrack: ${trackName}\nGenre: ${genre}\nCampaign: ${campaignUrl}` },
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const tpl = renderArtistOutreachEmail({ artistName, trackName, campaignUrl, claimUrl: '' });
      return { subject: tpl.subject, body: tpl.html.replace(/<[^>]*>/g, '') };
    }

    const data = await res.json();
    const body = data.choices?.[0]?.message?.content?.trim() || '';
    
    return {
      subject: `${artistName} — your "${trackName}" campaign page`,
      body,
    };
  } catch {
    const tpl = renderArtistOutreachEmail({ artistName, trackName, campaignUrl, claimUrl: '' });
    return { subject: tpl.subject, body: tpl.html.replace(/<[^>]*>/g, '') };
  }
}

// ── Resend Audience ──────────────────────────────────────────────

/**
 * Add a delivered email to a Resend audience for future marketing.
 * No-op if RESEND_AUDIENCE_ID is not configured.
 */
export async function addToAudience(email: string, artistName: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return;

  try {
    await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        first_name: artistName,
        unsubscribed: false,
      }),
    });
  } catch {}
}

// ── Email sending via Resend ─────────────────────────────────────

export async function sendOutreachEmail(params: {
  to: string;
  subject: string;
  htmlBody: string;
}): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Robert-Jan <robertjan@selah.fm>',
        to: [params.to],
        subject: params.subject,
        html: params.htmlBody,
        reply_to: 'robertjan@selah.fm',
      }),
    });

    const data = await res.json();
    if (res.ok) {
      return { sent: true, messageId: data.id };
    }
    return { sent: false, error: data.message || 'Unknown error' };
  } catch (e: any) {
    return { sent: false, error: e.message };
  }
}
