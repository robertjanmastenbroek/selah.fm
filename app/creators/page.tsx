import CreatorsClient from './CreatorsClient';

export const dynamic = 'force-dynamic';

async function getCreators() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
    const res = await fetch(`${baseUrl}/api/creators`);
    if (!res.ok) return { creators: [] };
    return res.json();
  } catch {
    return { creators: [] };
  }
}

export default async function CreatorsPage() {
  const data = await getCreators();
  return <CreatorsClient initialCreators={data.creators || []} />;
}
