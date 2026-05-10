#!/usr/bin/env node
/**
 * Fetch new bug reports from the Selah.fm API for DeepSeek TUI.
 *
 * Usage:
 *   node scripts/fetch-new-bugs.mjs --secret YOUR_SECRET
 *   node scripts/fetch-new-bugs.mjs                     # uses BUG_PULL_SECRET env var
 *
 * The script outputs a TUI-ready list of bugs sorted by severity.
 * Paste the output into a DeepSeek TUI session to fix them.
 */

const args = process.argv.slice(2);
const secretFlagIdx = args.indexOf('--secret');
const secret = secretFlagIdx >= 0
  ? args[secretFlagIdx + 1]
  : process.env.BUG_PULL_SECRET;

if (!secret) {
  console.error('Error: Provide --secret <value> or set BUG_PULL_SECRET env variable.');
  console.error('Usage: node scripts/fetch-new-bugs.mjs --secret YOUR_SECRET');
  process.exit(1);
}

const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
const apiUrl = `${siteUrl}/api/bugs?auth=${encodeURIComponent(secret)}`;

(async () => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Error: Unauthorized — wrong BUG_PULL_SECRET.');
      } else {
        console.error(`Error: HTTP ${response.status} — ${response.statusText}`);
      }
      process.exit(1);
    }

    const { newBugs } = await response.json();

    if (!newBugs || newBugs.length === 0) {
      console.log('✅ No new bugs found. The queue is clear.');
      return;
    }

    console.log(`\n🐛 Found ${newBugs.length} new bug(s):\n`);
    console.log('='.repeat(60));

    newBugs.forEach((bug, index) => {
      const sevEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' }[bug.severity] || '⚪';
      console.log(`\n${sevEmoji} Bug #${index + 1} — ${bug.severity.toUpperCase()}`);
      console.log(`   ID: ${bug.id}`);
      console.log(`   Description: ${bug.description}`);
      if (bug.steps_to_reproduce) console.log(`   Steps: ${bug.steps_to_reproduce}`);
      console.log(`   Reported by: ${bug.user_email || 'anonymous'}`);
      console.log(`   Date: ${new Date(bug.created_at).toLocaleString()}`);
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log('\n📋 Copy the output above and paste into DeepSeek TUI:');
    console.log('   "Here are new bug reports from the database. Fix them one by one in priority order:"\n');
  } catch (error) {
    console.error('Failed to fetch bugs:', error.message);
    process.exit(1);
  }
})();
