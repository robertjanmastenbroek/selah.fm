#!/usr/bin/env node

/**
 * Rollback helper — reverts the last N commits and pushes.
 * Usage: node scripts/rollback.mjs [count=1]
 * 
 * This is a last-resort rollback. Prefer `git revert` for clean history.
 */

import { execSync } from 'child_process';

const count = parseInt(process.argv[2] || '1', 10);

try {
  // Get the commit hash to rollback to
  const targetHash = execSync(`git log --skip=${count} -1 --format=%H`, { encoding: 'utf-8' }).trim();
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  
  console.log(`\n📋 Rollback Plan:`);
  console.log(`   Branch: ${currentBranch}`);
  console.log(`   Rolling back ${count} commit(s)`);
  console.log(`   Target: ${targetHash.slice(0, 8)}`);
  console.log('');
  
  // Show the commits being reverted
  const commits = execSync(`git log -${count} --format="%h %s"`, { encoding: 'utf-8' }).trim();
  console.log(`   Reverting:\n${commits.split('\n').map(c => `     • ${c}`).join('\n')}`);
  console.log('');

  // Use `git revert` to create inverse commits (cleaner than reset --hard)
  execSync(`git revert --no-edit HEAD~${count}..HEAD`, { stdio: 'inherit' });
  
  console.log(`\n✅ Rollback commits created locally.`);
  console.log(`   Run 'git push origin ${currentBranch}' to deploy the rollback.`);
} catch (err) {
  console.error('❌ Rollback failed:', err.message);
  process.exit(1);
}
