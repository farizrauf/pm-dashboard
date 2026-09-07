import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { SettingsClient } from "@/components/settings/settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" description="Manage your account and workspace preferences" />
      <div className="flex-1 p-6 overflow-auto">
        <SettingsClient user={session?.user ?? null} />
      </div>
    </div>
  );
}
