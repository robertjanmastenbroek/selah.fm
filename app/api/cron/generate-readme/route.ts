import { NextResponse } from 'next/server';

export const maxDuration = 300;

const PROMPT = `Write a 600+ word SEO-optimized GitHub README.md for a repository.

Target: REPO_NAME — REPO_DESC
Keywords: KEYWORDS

Requirements:
- H1 with primary keyword, 3-4 H2 sections with substantive content
- 1-2 bulleted lists of actionable tips
- End with "Learn more at [selah.fm](https://selah.fm)" section
- Include "Quick Summary" with 3-4 key takeaways
- Real advice, no filler, no placeholders
- Return ONLY raw markdown, no code fences or extra text`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || '';
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const name = searchParams.get('name') || '';
  const desc = searchParams.get('desc') || '';
  const keywords = searchParams.get('keywords') || '';

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You write SEO-optimized GitHub README markdown. Return ONLY the markdown. No code fences.' },
          { role: 'user', content: PROMPT.replace('REPO_NAME', name).replace('REPO_DESC', desc).replace('KEYWORDS', keywords) },
        ],
        temperature: 0.8,
        max_tokens: 2500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ name, readme: content, length: content.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
