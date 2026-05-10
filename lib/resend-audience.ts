/**
 * Sync a user to Resend Audience for broadcast emails.
 * Fire-and-forget — never blocks the signup flow.
 *
 * Requires RESEND_API_KEY and RESEND_AUDIENCE_ID in environment.
 * Create an audience at https://resend.com/audiences first.
 */
export function syncToResendAudience(email: string, displayName: string, userType: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) return;

  const firstName = displayName?.split(' ')[0] || '';
  const lastName = displayName?.split(' ').slice(1).join(' ') || '';

  fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
      unsubscribed: false,
    }),
  }).catch(() => {
    // Fire-and-forget — never fail signup for audience sync issues
  });
}
