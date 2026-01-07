import { getUserId } from '@/lib/auth/session';

export default async function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect to /login if not authenticated
  await getUserId();

  return <>{children}</>;
}
