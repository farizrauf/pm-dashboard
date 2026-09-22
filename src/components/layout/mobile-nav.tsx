"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createContext, useContext, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";

type MobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used within MobileNavProvider");
  return ctx;
}

/**
 * Holds the mobile drawer open state and renders the app shell.
 * On desktop (>= md) the Sidebar shows inline exactly as before; the drawer
 * only renders for smaller screens.
 */
export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <MobileDrawer />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </MobileNavContext.Provider>
  );
}

/** Left off-canvas drawer shown on < md via the hamburger in the Header. */
function MobileDrawer() {
  const { open, setOpen } = useMobileNav();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 h-full w-[min(280px,86vw)] max-w-full overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
          <Sidebar mode="mobile" onClose={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
