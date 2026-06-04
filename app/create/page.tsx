import { Metadata } from 'next';
import CreateCampaignClient from './CreateCampaignClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create a Campaign — Selah.fm',
  description: 'Launch a music promotion campaign. Set your budget, CPM rate, and requirements for creators.',
};

export default function CreatePage() {
  return <CreateCampaignClient />;
}
