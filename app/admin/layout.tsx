import { redirect } from 'next/navigation';
import { ADMIN_EMAILS } from '@/lib/constants';
import { getUser } from '@/lib/supabase/server';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user?.email) {
    redirect('/login?redirect=/admin');
  }

  const isAdmin = ADMIN_EMAILS.some(
    (a) => a.toLowerCase() === user.email!.toLowerCase()
  );

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <AdminLayoutClient isAdmin={isAdmin} email={user.email}>
      {children}
    </AdminLayoutClient>
  );
}
