import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileNavProvider } from "@/components/layout/mobile-nav";
import { SessionProvider } from "next-auth/react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <MobileNavProvider>{children}</MobileNavProvider>
    </SessionProvider>
  );
}
