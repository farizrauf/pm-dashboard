import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { SettingsClient } from "@/components/settings/settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();

  // Read the freshest profile from the DB so avatar/name changes persist
  // across reloads instead of relying on the (static) JWT session.
  let user: { id: string; name: string | null; email: string | null; image: string | null } | null = null;
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true },
    });
    user = dbUser;
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" description="Manage your account and workspace preferences" />
      <div className="flex-1 p-6 overflow-auto">
        <SettingsClient user={user} />
      </div>
    </div>
  );
}
