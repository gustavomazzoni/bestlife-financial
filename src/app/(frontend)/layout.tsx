import { getUserId } from '@/lib/auth/session';
import { Header } from '@/components/shared/header';
import { BottomNav } from '@/components/shared/nav';

export default async function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect to /login if not authenticated
  await getUserId();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
