import { redirect } from 'next/navigation';

export default function DonateRedirect({ params }: { params: { id: string } }) {
  redirect(`/checkout?campaignId=${params.id}&type=donation`);
}
