const {Pool}=require('pg');
const p=new Pool({connectionString:process.env.SUPABASE_DATABASE_URL+'?pgbouncer=true',ssl:{rejectUnauthorized:false},max:3});
(async()=>{
  const artistId='7aa92cfd-41bf-44a6-9880-dca9e61adcc8';

  // 1. Calculate actual balance: total deposits minus total spent (campaign budget minus remaining)
  const dep=await p.query(`
    SELECT COALESCE(SUM(c.total_budget_cents),0)::int as total_budget
    FROM campaigns c
    JOIN campaign_claims cc ON cc.campaign_id=c.id
    WHERE cc.discovered_artist_id=$1
  `,[artistId]);
  const totalBudget=dep.rows[0].total_budget;

  const paid=await p.query(`
    SELECT COALESCE(SUM(s.payout_amount_cents) FILTER (WHERE s.payout_status='paid'),0)::int as paid
    FROM submissions s
    JOIN campaigns c ON c.id=s.campaign_id
    JOIN campaign_claims cc ON cc.campaign_id=c.id
    WHERE cc.discovered_artist_id=$1
  `,[artistId]);
  const paidOut=paid.rows[0].paid;

  const balance=totalBudget-paidOut;
  console.log('Total budget: $'+(totalBudget/100).toFixed(2));
  console.log('Paid out: $'+(paidOut/100).toFixed(2));
  console.log('Balance: $'+(balance/100).toFixed(2));

  // Update artist_profiles
  await p.query('UPDATE artist_profiles SET balance_cents=$1, lifetime_deposits_cents=$2 WHERE artist_id=$3',
    [balance, totalBudget, artistId]);
  console.log('✅ artist_profiles updated');

  // 2. Sync ALL artists' balances
  const all=await p.query(`
    UPDATE artist_profiles ap
    SET balance_cents=COALESCE((
      SELECT SUM(c.total_budget_cents)-COALESCE((
        SELECT SUM(s.payout_amount_cents) FILTER (WHERE s.payout_status='paid')
        FROM submissions s
        JOIN campaigns c2 ON c2.id=s.campaign_id
        JOIN campaign_claims cc2 ON cc2.campaign_id=c2.id
        WHERE cc2.discovered_artist_id=ap.artist_id
      ),0)
      FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id=c.id
      WHERE cc.discovered_artist_id=ap.artist_id
    ),0),
    lifetime_deposits_cents=COALESCE((
      SELECT SUM(c.total_budget_cents)
      FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id=c.id
      WHERE cc.discovered_artist_id=ap.artist_id
    ),0)
  `);
  console.log('✅ All artists balanced updated: '+all.rowCount+' rows');

  // 3. Create notification for the new submission
  const newSubs=await p.query(`
    SELECT s.id, s.campaign_id, s.creator_id, s.created_at, c.track_title, da.artist_name
    FROM submissions s
    JOIN campaigns c ON c.id=s.campaign_id
    JOIN campaign_claims cc ON cc.campaign_id=c.id
    JOIN discovered_artists da ON da.id=cc.discovered_artist_id
    WHERE cc.discovered_artist_id=$1 AND s.created_at > NOW()-INTERVAL '7 days'
    ORDER BY s.created_at DESC
  `,[artistId]);
  console.log('\nRecent submissions: '+newSubs.rows.length);
  for(const s of newSubs.rows){
    console.log(`  ${(s.track_title||'').substring(0,40)} | ${(s.artist_name||'')} | ${s.created_at}`);
  }

  await p.end();
})();
