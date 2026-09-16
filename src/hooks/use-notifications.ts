"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationType = "TASK" | "MILESTONE" | "INVOICE" | "RISK" | "ISSUE" | "COMMENT";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export function notificationTime(value: string) {
  return relativeTime(value);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?limit=20", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        notifications: AppNotification[];
        unreadCount: number;
      };
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Keep the last known notification state when polling is unavailable.
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const markRead = (id: string) => {
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
    setUnreadCount((current) => Math.max(0, current - (notifications.some((item) => item.id === id && !item.read) ? 1 : 0)));
    void fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    void fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  };

  return { notifications, unreadCount, markRead, markAllRead, refresh };
}
