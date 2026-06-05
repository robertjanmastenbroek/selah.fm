/**
 * Creator Email Outreach — email generation and sending for creators.
 * Parallel to the artist email outreach module (lib/email-outreach.ts).
 */

import { emailWrapper } from '@/lib/email-templates';

// ── Template ────────────────────────────────────────────────────

export function renderCreatorOutreachEmail(params: {
  creatorName: string;
  niche: string;
  browseUrl: string;
}): { subject: string; html: string } {
  const { creatorName, niche, browseUrl } = params;

  const subject = 'Earn money making TikToks with music 🎵';

  const body = [
    `Hey ${creatorName},`,
    '',
    `I saw your content on TikTok — ${niche || 'your style caught my eye'}. Good stuff.`,
    '',
    `Here's the thing. I run Selah.fm — a marketplace where you browse music campaigns, pick a track, make a TikTok or Reel with it, and earn per verified view.`,
    '',
    `• No brand deals. No minimum followers. No application.`,
    `• Browse campaigns, pick tracks you actually like`,
    `• Make the content you already make — just with music`,
    `• Earnings per 1,000 verified views (creators keep every cent)`,
    '',
    `Some creators are making $50-500 per campaign. Not life-changing, but real money for content you're already making.`,
    '',
    `Browse campaigns here: ${browseUrl}`,
    '',
    `<strong>Spot a mistake on an artist's page?</strong><br>`,
    `You can <a href="${browseUrl}" style="color:#5B7FFF;">suggest edits to any artist page</a> to help other creators find accurate info.`,
    '',
    `— Robert-Jan<br>Founder, Selah.fm`,
  ].join('<br>');

  return {
    subject,
    html: emailWrapper({
      title: 'Get paid for your content',
      body,
      cta: { text: 'Browse campaigns →', url: browseUrl },
    }),
  };
}

// ── DeepSeek-powered email generation ────────────────────────────

const CREATOR_EMAIL_PROMPT = `You are Robert-Jan Mastenbroek, founder of Selah.fm — a CPM marketplace where creators earn per verified view for TikToks, Reels, and Shorts featuring music.

YOUR VOICE: Warm, direct, a little rough around the edges. Like a friend who's been through hell and came out the other side. Use contractions ALWAYS. Start sentences with And/But/So/Because/Look/Here's. Vary sentence length. Never use: furthermore, moreover, game-changer, revolutionary, leverage, empower.

TASK: Write a short, personal email to a content creator inviting them to earn money on Selah.fm.

STRUCTURE:
1. Brief acknowledgment of their content (1 sentence)
2. What Selah.fm is and how it works (2-3 sentences)
3. Key selling points — no application, no minimum followers, browse campaigns, pick tracks, earn per view (2-3 sentences)
4. Soft close with link to browse (1 sentence)

RULES:
- Under 120 words total
- Mention their niche/style if provided
- Include the browse URL as a clear CTA
- Sign as: — Robert-Jan (founder, Selah.fm)
- Format as plain text email (use line breaks, not HTML)
- Never: "I came across your profile", "Your content is amazing"
- Never: more than one exclamation mark
- Return ONLY the email text, no JSON, no quotes`;

export async function generateCreatorOutreachEmail(
  creatorName: string,
  niche: string,
  browseUrl: string,
): Promise<{ subject: string; body: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const tpl = renderCreatorOutreachEmail({ creatorName, niche, browseUrl });
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
          { role: 'system', content: CREATOR_EMAIL_PROMPT },
          {
            role: 'user',
            content: `Creator: ${creatorName}\nNiche: ${niche || 'content creator'}\nBrowse URL: ${browseUrl}`,
          },
        ],
        temperature: 0.9,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const tpl = renderCreatorOutreachEmail({ creatorName, niche, browseUrl });
      return { subject: tpl.subject, body: tpl.html.replace(/<[^>]*>/g, '') };
    }

    const data = await res.json();
    const body = data.choices?.[0]?.message?.content?.trim() || '';

    return {
      subject: `${creatorName} — earn making TikToks with music`,
      body,
    };
  } catch {
    const tpl = renderCreatorOutreachEmail({ creatorName, niche, browseUrl });
    return { subject: tpl.subject, body: tpl.html.replace(/<[^>]*>/g, '') };
  }
}
