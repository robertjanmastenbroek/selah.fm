/**
 * User Engagement System — welcome emails, re-engagement, onboarding tracking.
 * 
 * Flow:
 * 1. User signs up → auth callback detects new user → redirects to /onboarding
 * 2. Onboarding complete → PATCH /api/auth/me → sets onboarded_at → triggers welcome email #1
 * 3. Welcome email sequence: 3 emails over 5 days (triggered by cron)
 * 4. Re-engagement: if no action in 3+ days, send re-engagement email
 */

import sql from '@/lib/db';
import { sendOutreachEmail } from '@/lib/email-outreach';
import { emailWrapper } from '@/lib/email-templates';

// ── Types ───────────────────────────────────────────────────────

export interface UserEngagement {
  onboarded_at: string | null;
  last_action_at: string | null;
  welcome_emails_sent: number;
  reengage_at: string | null;
}

// ── Welcome Email Templates ─────────────────────────────────────

export function renderWelcomeEmail1(name: string, role: 'artist' | 'creator'): { subject: string; html: string } {
  const isArtist = role === 'artist';
  const subject = isArtist
    ? `${name}, your music deserves to be heard 🎵`
    : `${name}, ready to earn from your content? 🎬`;

  const body = isArtist
    ? [
        `Hey ${name},`,
        '',
        `Welcome to Selah.fm — the marketplace where creators make videos for your music and you only pay for verified views.`,
        '',
        `<strong>Here's how to get started in 2 minutes:</strong>`,
        '',
        `1. <strong>Claim your campaign</strong> — we may have already built one for you. Check your email for a claim link, or create one from your dashboard.`,
        `2. <strong>Set your budget</strong> — you decide what you're willing to pay per 1M verified views. We add 20% on top.`,
        `3. <strong>Share with your fans</strong> — they can chip in to fund your promotion, or make videos themselves and earn.`,
        '',
        `No upfront costs. You only pay when videos get real, verified views.`,
        '',
        `— Robert-Jan<br>Founder, Selah.fm`,
      ].join('<br>')
    : [
        `Hey ${name},`,
        '',
        `Welcome to Selah.fm — earn money making TikToks, Reels, and Shorts with music you actually like.`,
        '',
        `<strong>Here's how it works:</strong>`,
        '',
        `1. <strong>Browse campaigns</strong> — artists set budgets for their tracks. Pick the ones that fit your style.`,
        `2. <strong>Make content</strong> — same content you already make, just with their song.`,
        `3. <strong>Get paid per view</strong> — every verified view counts. You keep every cent. No deductions.`,
        '',
        `Some creators are making $50-500 per campaign. Not life-changing, but real money for content you're already making.`,
        '',
        `— Robert-Jan<br>Founder, Selah.fm`,
      ].join('<br>');

  return {
    subject,
    html: emailWrapper({
      title: isArtist ? 'Your music, amplified' : 'Start earning from your content',
      body,
      cta: { text: isArtist ? 'Go to dashboard →' : 'Browse campaigns →', url: isArtist ? 'https://selah.fm/dashboard' : 'https://selah.fm/browse' },
    }),
  };
}

export function renderWelcomeEmail2(name: string, role: 'artist' | 'creator'): { subject: string; html: string } {
  const isArtist = role === 'artist';
  const subject = isArtist
    ? `${name}, here's what other artists are doing`
    : `${name}, here's how creators are earning`;

  const body = isArtist
    ? [
        `Hey ${name},`,
        '',
        `Quick follow-up — I wanted to share what's working for other artists on Selah.fm.`,
        '',
        `<strong>The artists getting the most traction do three things:</strong>`,
        '',
        `1. <strong>They share their campaign link</strong> with their existing fans on social media. A simple story post: "Help me promote my new track — make a video and earn"`,
        `2. <strong>They set a realistic budget.</strong> Even $50 gets creators excited. You only pay for verified views.`,
        `3. <strong>They approve videos fast.</strong> Creators move on if submissions sit pending.`,
        '',
        `Your campaign page is already live. Just claim it and share.`,
        '',
        `— Robert-Jan`,
      ].join('<br>')
    : [
        `Hey ${name},`,
        '',
        `I wanted to share a quick tip from creators who are earning the most on Selah.fm.`,
        '',
        `<strong>The highest-earning creators do this:</strong>`,
        '',
        `1. <strong>They browse daily.</strong> New campaigns go live every few hours. The early creator gets the views.`,
        `2. <strong>They pick tracks they actually like.</strong> Authentic content outperforms forced promotion every time.`,
        `3. <strong>They submit fast and promote their video.</strong> More views = more earnings. Share your Selah.fm video on your own channels too.`,
        '',
        `There are 2,500+ campaigns waiting. Find one that fits your style.`,
        '',
        `— Robert-Jan`,
      ].join('<br>');

  return {
    subject,
    html: emailWrapper({
      title: isArtist ? 'What working artists do' : 'What top creators do',
      body,
      cta: { text: isArtist ? 'Go to dashboard →' : 'Browse campaigns →', url: isArtist ? 'https://selah.fm/dashboard' : 'https://selah.fm/browse' },
    }),
  };
}

export function renderWelcomeEmail3(name: string, role: 'artist' | 'creator'): { subject: string; html: string } {
  const isArtist = role === 'artist';
  const subject = `Last one, ${name} — then I'll leave you alone`;

  const body = isArtist
    ? [
        `Hey ${name},`,
        '',
        `Last email from me — promise. I just wanted to make sure you know your campaign page is live and waiting.`,
        '',
        `No pressure. No rush. The page stays up either way. But if you want to try it:`,
        '',
        `<strong>Claim your page → set a budget → share with fans.</strong> That's it. Three steps.`,
        '',
        `Creators are already browsing campaigns on Selah.fm right now, looking for tracks to make content with. Yours could be one of them.`,
        '',
        `Either way — appreciate you being here.`,
        '',
        `— Robert-Jan`,
      ].join('<br>')
    : [
        `Hey ${name},`,
        '',
        `Last one — I'll keep it short.`,
        '',
        `There are campaigns on Selah.fm with budgets sitting unspent. Artists literally want to pay creators to make content with their music.`,
        '',
        `Browse the campaigns, pick one you like, make a TikTok or Reel, submit it. That's the whole thing.`,
        '',
        `Some creators are pulling $200-500 per campaign. The money's there if you want it.`,
        '',
        `— Robert-Jan`,
      ].join('<br>');

  return {
    subject,
    html: emailWrapper({
      title: isArtist ? 'Your page is ready' : 'Money on the table',
      body,
      cta: { text: isArtist ? 'Go to dashboard →' : 'Browse campaigns →', url: isArtist ? 'https://selah.fm/dashboard' : 'https://selah.fm/browse' },
    }),
  };
}

export function renderReengageEmail(name: string, daysSinceSignup: number): { subject: string; html: string } {
  const subject = `${name}, still interested?`;

  const body = [
    `Hey ${name},`,
    '',
    `You signed up for Selah.fm ${daysSinceSignup} days ago — just checking in. No pressure at all.`,
    '',
    `If you're still interested, here's what's new:`,
    '',
    `<strong>New campaigns go live every few hours.</strong> Artists are adding budgets, creators are submitting videos, and payouts are happening.`,
    '',
    `Your account is still here. Your dashboard is still ready. Whenever you're ready.`,
    '',
    `— Robert-Jan`,
  ].join('<br>');

  return {
    subject,
    html: emailWrapper({
      title: 'Still here when you\'re ready',
      body,
      cta: { text: 'Go to Selah.fm →', url: 'https://selah.fm/browse' },
    }),
  };
}

// ── Welcome Email Sending ───────────────────────────────────────

const WELCOME_EMAILS = [
  renderWelcomeEmail1,
  renderWelcomeEmail2,
  renderWelcomeEmail3,
];

export async function sendWelcomeEmail(userId: string, email: string, name: string, role: 'artist' | 'creator', index: number): Promise<boolean> {
  if (index < 0 || index >= WELCOME_EMAILS.length) return false;
  
  try {
    const { subject, html: htmlBody } = WELCOME_EMAILS[index](name, role);
    const result = await sendOutreachEmail({ to: email, subject, htmlBody });
    
    if (result.sent) {
      await sql`
        UPDATE users 
        SET welcome_emails_sent = welcome_emails_sent + 1,
            updated_at = NOW()
        WHERE id = ${userId}
      `;
      
      // Schedule next welcome email (day 2 for index 0, day 5 for index 1)
      const nextDelays = ['2 days', '5 days', null];
      const nextDelay = nextDelays[index];
      if (nextDelay) {
        await sql.raw(
          `UPDATE users SET reengage_at = NOW() + INTERVAL '${nextDelay}', updated_at = NOW() WHERE id = $1`,
          [userId]
        );
      }
      
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function sendWelcomeEmailSequence(userId: string, email: string, name: string, role: 'artist' | 'creator'): Promise<number> {
  let sent = 0;
  for (let i = 0; i < WELCOME_EMAILS.length; i++) {
    const ok = await sendWelcomeEmail(userId, email, name, role, i);
    if (ok) sent++;
  }
  return sent;
}

// ── Re-engagement ───────────────────────────────────────────────

export async function sendReengageEmail(userId: string, email: string, name: string, daysSinceSignup: number): Promise<boolean> {
  try {
    const { subject, html: htmlBody } = renderReengageEmail(name, daysSinceSignup);
    const result = await sendOutreachEmail({ to: email, subject, htmlBody });
    
    if (result.sent) {
      await sql.raw(
        `UPDATE users SET reengage_at = NOW() + INTERVAL '14 days', updated_at = NOW() WHERE id = $1`,
        [userId]
      );
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Action Tracking ─────────────────────────────────────────────

export async function recordUserAction(userId: string): Promise<void> {
  await sql`
    UPDATE users 
    SET last_action_at = NOW(),
        reengage_at = NULL,
        updated_at = NOW()
    WHERE id = ${userId}
  `;
}

export async function markOnboarded(userId: string, role: 'artist' | 'creator'): Promise<void> {
  const name = role === 'artist' ? 'Artist' : 'Creator';
  await sql`
    UPDATE users 
    SET onboarded_at = NOW(),
        last_action_at = NOW(),
        user_type = ${role},
        is_creator = true,
        updated_at = NOW()
    WHERE id = ${userId}
  `;
}
