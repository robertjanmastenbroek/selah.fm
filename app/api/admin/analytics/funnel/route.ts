import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/funnel
 * 
 * Returns conversion funnel data and cohort retention analysis.
 * Admin-only: requires authentication and admin email.
 */

const FUNNEL_STEPS = [
  { event: 'page_view', label: 'Visit site' },
  { event: 'signup_start', label: 'Started signup' },
  { event: 'signup_complete', label: 'Signed up' },
  { event: 'onboarding_complete', label: 'Completed onboarding' },
  { event: 'first_browse', label: 'Browsed tracks' },
  { event: 'first_submit', label: 'Submitted video' },
  { event: 'first_approval', label: 'First approval' },
  { event: 'first_payout', label: 'First payout' },
];

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '90'), 365);

  try {
    // ── 1. Conversion Funnel ────────────────────────────────────
    const funnel: { step: string; label: string; count: number; dropPercent: number }[] = [];
    let previousCount = 0;

    for (let i = 0; i < FUNNEL_STEPS.length; i++) {
      const step = FUNNEL_STEPS[i];
      let count = 0;

      if (step.event === 'page_view') {
        // Total unique visitors = distinct session_ids with page_view
        const [row] = await sql`
          SELECT COUNT(DISTINCT session_id)::int as count
          FROM analytics_events
          WHERE event = 'page_view'
            AND created_at > NOW() - ${days + ' days'}::interval
        `;
        count = row?.count || 0;
      } else {
        const [row] = await sql`
          SELECT COUNT(*)::int as count
          FROM analytics_events
          WHERE event = ${step.event}
            AND created_at > NOW() - ${days + ' days'}::interval
        `;
        count = row?.count || 0;
      }

      const dropPercent = previousCount > 0
        ? Math.round((1 - count / previousCount) * 100)
        : 0;

      funnel.push({ step: step.event, label: step.label, count, dropPercent });
      previousCount = count > 0 ? count : previousCount;
    }

    // ── 2. Cohort Retention ─────────────────────────────────────
    // For each weekly signup cohort, track how many users returned each week
    const cohorts: {
      week: string;
      size: number;
      week1: number;
      week2: number;
      week3: number;
      week4: number;
      retention_w1: number;
      retention_w2: number;
      retention_w3: number;
      retention_w4: number;
    }[] = [];

    const cohortRaw = await sql`
      WITH weekly_cohorts AS (
        SELECT
          DATE_TRUNC('week', created_at)::date as cohort_week,
          COUNT(*)::int as cohort_size,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM analytics_events ae2
              WHERE ae2.user_id = analytics_events.user_id
                AND ae2.event = 'page_view'
                AND ae2.created_at > analytics_events.created_at + INTERVAL '7 days'
                AND ae2.created_at <= analytics_events.created_at + INTERVAL '14 days'
            )
          )::int as week_1_returned,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM analytics_events ae2
              WHERE ae2.user_id = analytics_events.user_id
                AND ae2.event = 'page_view'
                AND ae2.created_at > analytics_events.created_at + INTERVAL '14 days'
                AND ae2.created_at <= analytics_events.created_at + INTERVAL '21 days'
            )
          )::int as week_2_returned,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM analytics_events ae2
              WHERE ae2.user_id = analytics_events.user_id
                AND ae2.event = 'page_view'
                AND ae2.created_at > analytics_events.created_at + INTERVAL '21 days'
                AND ae2.created_at <= analytics_events.created_at + INTERVAL '28 days'
            )
          )::int as week_3_returned,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM analytics_events ae2
              WHERE ae2.user_id = analytics_events.user_id
                AND ae2.event = 'page_view'
                AND ae2.created_at > analytics_events.created_at + INTERVAL '28 days'
                AND ae2.created_at <= analytics_events.created_at + INTERVAL '35 days'
            )
          )::int as week_4_returned
        FROM analytics_events
        WHERE event = 'signup_complete'
          AND user_id IS NOT NULL
          AND created_at > NOW() - ${days + ' days'}::interval
        GROUP BY cohort_week
        ORDER BY cohort_week DESC
        LIMIT 12
      )
      SELECT * FROM weekly_cohorts
    `;

    for (const c of cohortRaw) {
      const size = c.cohort_size || 0;
      const w1 = c.week_1_returned || 0;
      const w2 = c.week_2_returned || 0;
      const w3 = c.week_3_returned || 0;
      const w4 = c.week_4_returned || 0;

      cohorts.push({
        week: c.cohort_week?.toISOString?.()?.slice(0, 10) || String(c.cohort_week),
        size,
        week1: w1, week2: w2, week3: w3, week4: w4,
        retention_w1: size > 0 ? Math.round((w1 / size) * 100) : 0,
        retention_w2: size > 0 ? Math.round((w2 / size) * 100) : 0,
        retention_w3: size > 0 ? Math.round((w3 / size) * 100) : 0,
        retention_w4: size > 0 ? Math.round((w4 / size) * 100) : 0,
      });
    }

    // ── 3. Summary Stats ────────────────────────────────────────
    const [summary] = await sql`
      SELECT
        COUNT(*)::int as total_events,
        COUNT(DISTINCT session_id)::int as unique_sessions,
        COUNT(DISTINCT user_id)::int as unique_users,
        COUNT(*) FILTER (WHERE event = 'signup_complete')::int as total_signups,
        COUNT(*) FILTER (WHERE event = 'first_submit')::int as total_submissions
      FROM analytics_events
      WHERE created_at > NOW() - ${days + ' days'}::interval
    `;

    return NextResponse.json({
      days,
      summary,
      funnel,
      cohorts,
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
