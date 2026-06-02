import { redirect } from 'next/navigation';

interface Props {
  params: { userId: string };
}

export default function MessageUserPage({ params }: Props) {
  redirect(`/messages?user=${encodeURIComponent(params.userId)}`);
}