/**
 * Google Indexing API client.
 * Submits URLs for immediate indexing via Google's Indexing API.
 * Max 200 URLs/day per site (free tier).
 *
 * Setup:
 * 1. Enable Indexing API in Google Cloud Console
 * 2. Create a service account, download JSON key
 * 3. Add service account email as owner in Google Search Console
 * 4. Set GOOGLE_INDEXING_SA_KEY env var with the JSON key content
 *
 * @see https://developers.google.com/search/apis/indexing-api/v3/quickstart
 */

const API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

interface IndexingResult {
  url: string;
  type: 'URL_UPDATED' | 'URL_DELETED';
  success: boolean;
  error?: string;
}

/**
 * Get an OAuth 2.0 access token using a Google service account.
 * Uses a JWT grant flow (no external SDK dependency).
 */
async function getAccessToken(): Promise<string | null> {
  const saKeyJson = process.env.GOOGLE_INDEXING_SA_KEY;
  if (!saKeyJson) {
    console.warn('[GOOGLE INDEXING] No GOOGLE_INDEXING_SA_KEY set — skipping');
    return null;
  }

  try {
    const saKey = JSON.parse(saKeyJson);
    const { client_email, private_key } = saKey;
    if (!client_email || !private_key) {
      console.warn('[GOOGLE INDEXING] Invalid service account key format');
      return null;
    }

    // JWT header
    const header = { alg: 'RS256', typ: 'JWT' };

    // JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Base64url encode
    function b64u(s: string): string {
      return Buffer.from(s).toString('base64url');
    }

    const b64Header = b64u(JSON.stringify(header));
    const b64Payload = b64u(JSON.stringify(payload));
    const signatureInput = `${b64Header}.${b64Payload}`;

    // Sign with RSA-SHA256 using the private key
    const crypto = await import('node:crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(private_key, 'base64url');

    const jwt = `${signatureInput}.${signature}`;

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`[GOOGLE INDEXING] Token exchange failed (${tokenRes.status}): ${errText.slice(0, 300)}`);
      return null;
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  } catch (e: any) {
    console.error('[GOOGLE INDEXING] Token error:', e.message);
    return null;
  }
}

/**
 * Submit a single URL for indexing.
 * @param url - The full URL to index (must be in a verified Search Console property)
 * @param type - URL_UPDATED (new/changed content) or URL_DELETED (removed content)
 */
export async function submitUrl(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<IndexingResult> {
  const token = await getAccessToken();
  if (!token) {
    return { url, type, success: false, error: 'No access token (GOOGLE_INDEXING_SA_KEY not configured)' };
  }

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, type }),
    });

    if (res.ok) {
      return { url, type, success: true };
    }

    const errBody = await res.json().catch(() => ({}));
    const errMsg = errBody.error?.message || `HTTP ${res.status}`;
    console.error(`[GOOGLE INDEXING] Failed for ${url}: ${errMsg}`);
    return { url, type, success: false, error: errMsg };
  } catch (e: any) {
    console.error(`[GOOGLE INDEXING] Network error for ${url}:`, e.message);
    return { url, type, success: false, error: e.message };
  }
}

/**
 * Submit multiple URLs for indexing in batch.
 * Google Indexing API doesn't support true batching, so we submit sequentially.
 * Max 200 URLs/day per property.
 */
export async function submitUrls(
  urls: string[],
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED',
  concurrency = 3,
): Promise<IndexingResult[]> {
  const results: IndexingResult[] = [];
  const chunks: string[][] = [];

  // Split into chunks of concurrency
  for (let i = 0; i < urls.length; i += concurrency) {
    chunks.push(urls.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map((url) => submitUrl(url, type)),
    );
    results.push(...chunkResults);
  }

  return results;
}
