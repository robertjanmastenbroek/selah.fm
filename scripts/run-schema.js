// Run the Supabase schema via Management API
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get access token from supabase CLI's debug output  
const debugOutput = execSync('npx supabase --debug projects list 2>&1', { encoding: 'utf8' });
const tokenMatch = debugOutput.match(/access_token["\s:]+([a-zA-Z0-9._-]+)/);
if (!tokenMatch) {
  console.error('Could not extract access token.');
  process.exit(1);
}
const accessToken = tokenMatch[1];
console.log('Token found, length:', accessToken.length);

// Read schema files
const schema = fs.readFileSync(path.join(__dirname, '..', 'lib/db/supabase-schema.sql'), 'utf8');
console.log('Schema:', schema.length, 'bytes');

// Write payload to temp file (avoids shell escaping issues)
const payload = JSON.stringify({ query: schema });
const tmpFile = '/tmp/supabase-schema-payload.json';
fs.writeFileSync(tmpFile, payload);
console.log('Payload written:', payload.length, 'bytes');

// Execute via Management API
const projectRef = 'jxniwtzbkthrgmyrslno';
const url = `https://api.supabase.com/v1/projects/${projectRef}/sql`;

console.log('Running schema...');
const result = execSync(
  `curl -s -X POST "${url}" -H "Authorization: Bearer ${accessToken}" -H "Content-Type: application/json" -d @${tmpFile}`,
  { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
);
console.log(result.substring(0, 1000));
