# Notification System — Design Spec
**Date:** 2026-09-16
**Status:** Approved
**Owner:** Fariz

---

## 1. Overview

Replace the hardcoded `MOCK_NOTIFICATIONS` in the header with a real, per-user,
event-driven notification system. Notifications are created at event time
(task assigned, comment added, risk raised, etc.) and stored in a
`Notification` Postgres table. The header bell badge shows live unread counts
and persists across page refreshes.

Scope: Standard PM set (see §3). Overdue invoices via a daily cron.
@mentions included via best-effort username matching.

---

## 2. Data Model

### 2.1 Prisma: `Notification` model

Add to `prisma/schema.prisma`:

```prisma
model Notification {
  id        String            @id @default(cuid())
  userId    String            // recipient
  type      NotificationType
  title     String
  body      String?
  href      String            @default("/")
  actorId   String?           // who caused the event (excluded from own notif)
  read      Boolean           @default(false)
  readAt    DateTime?
  createdAt DateTime          @default(now())

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  actor User?  @relation("NotificationActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([userId, read])
  @@index([userId, createdAt])
  @@map("notifications")
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_UPDATED
  TASK_STATUS
  COMMENT
  MENTION
  MILESTONE
  RISK
  ISSUE
  INVOICE
}
```

Also add to the existing `User` model:
```prisma
notifications Notification[] @relation("NotificationRecipient")
notificationsAsActor Notification[] @relation("NotificationActor")
```

---

## 3. Event Types & Recipients

| # | Event | Trigger location | Recipients |
|---|-------|-----------------|------------|
| 1 | Task assigned / reassigned | `actions/tasks.ts` — `createTask` + `updateTask` | new `assigneeId` |
| 2 | Task updated (title/due/priority) | `actions/tasks.ts` — `updateTask` | current `creatorId` + `assigneeId` |
| 3 | Task status changed | `actions/tasks.ts` — `updateTask` status branch | `creatorId` + `assigneeId` |
| 4 | Comment added | `actions/tasks.ts` — `addComment` (line ~215) | task `creatorId` + `assigneeId` (skip actor) |
| 5 | @mention in comment | same comment action | every `@Full Name` that resolves to a User |
| 6 | Milestone completed | `actions/milestones.ts` — `updateMilestone` | all `ProjectMember` users for that project |
| 7 | Milestone due within 3 days | `actions/milestones.ts` — `updateMilestone` | all `ProjectMember` users |
| 8 | High-severity Risk created | `actions/risks.ts` — `createRisk` | all `ProjectMember` users |
| 9 | High-severity Issue created | `actions/issues.ts` — `createIssue` | all `ProjectMember` users |
| 10 | Invoice overdue | `GET /api/cron/overdue-invoices` (daily cron) | all ADMIN role users |

**High-severity threshold:** `severity === "HIGH" || severity === "CRITICAL"`.

**De-dup rule:** Never notify a user twice for the same logical event.
For invoice overdue, check `userId + type === INVOICE + meta(invoiceId)` via
an existing unread notification before inserting.

**Actor exclusion:** The user who triggered the event never receives their
own notification for it (e.g., you don't get notified that you commented).

---

## 4. `createNotifications` Helper

File: `src/lib/notifications.ts` (new).

```ts
createNotifications(spec: NotificationSpec): Promise<void>
```

`NotificationSpec` shape:
```ts
type NotificationSpec = {
  actorId?: string;          // user who caused the event (excluded from recipients)
  type: NotificationType;
  title: string;
  body?: string;
  href: string;
  recipientIds: string[];    // already-resolved user IDs
}
```

Logic:
1. Filter out `actorId` from `recipientIds`.
2. Filter out any null/empty IDs.
3. For each remaining `userId`, insert one `Notification` row.
4. If no recipients after filtering, skip silently.

This is called from every action entry point with the fully-resolved set of
recipients. No event-bus, no async queue — synchronous `prisma.createMany`
per call.

---

## 5. @Mention Parsing

Regex: `/@([A-Z][a-z]+(?: [A-Z][a-z]+){0,2})/g` — matches `@Full Name`
(one to three space-separated capitalized words).

Resolution:
```ts
async resolveMentionedUsers(names: string[]): Promise<string[]>
```
- Fetches all users with matching `name IN (names)` in one DB query.
- Returns IDs of matches.
- Non-matching names are silently ignored (no notification).

---

## 6. Overdue Invoice Cron

**Route:** `GET /api/cron/overdue-invoices`

Protected by: `Authorization: Bearer {CRON_SECRET}` header (env var
`CRON_SECRET`). Rejects if missing or wrong.

Logic:
1. Query `Invoice` where `status !== "PAID"` AND `dueAt < now()`.
2. For each overdue invoice, check no existing `INVOICE`-type notification
   exists for that invoice ID (dedup key: stored in `Notification.body` as
   `"invoiceId:xxx"`).
3. Create one `INVOICE` notification per overdue invoice for all ADMIN users.
4. Response: `{ processed: number, sent: number }`.

**Schedule:** `vercel.json` / `vercel.ts` cron, runs daily at 06:00 UTC:
```json
{ "path": "/api/cron/overdue-invoices", "schedule": "0 6 * * *" }
```

---

## 7. API Routes

### `GET /api/notifications`
- Auth: session required.
- Query params: `?limit=20&cursor=<id>` for pagination.
- Returns: `{ notifications: Notification[], unreadCount: number, nextCursor?: string }`.
- Notification payload includes `actor: { id, name }?` (not image) and `readAt`.

### `PATCH /api/notifications`
- Auth: session required.
- Body: `{ ids?: string[] }` (mark specific) OR `{ all: true }` (mark all read).
- Action:
  - `{ ids }` → `updateMany` where `id IN ids`.
  - `{ all: true }` → `updateMany` where `userId = session.user.id AND read = false`.
- Sets `read: true, readAt: now()`.
- Returns `{ updated: number }`.

---

## 8. UI — `useNotifications` Hook

File: `src/hooks/use-notifications.ts` (new).

```ts
function useNotifications(): {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}
```

Behaviour:
- Fetches on mount via `GET /api/notifications`.
- Polls every 60 s with `setInterval`.
- Optimistic update on `markRead` / `markAllRead` (update local state immediately,
  fire API in background).
- On error, silently keeps previous state (no toast needed for notification reads).

**Integration in `header.tsx`:**
- Remove `MOCK_NOTIFICATIONS` and all related state (`notifications`, `markRead`,
  `markAllRead`, `unreadCount`).
- Import and call `useNotifications()` hook.
- Pass `notifications`, `unreadCount`, `markRead`, `markAllRead` from hook
  instead of local state. `onClick` on each notification item: `markRead(id)`,
  then `router.push(href)`.
- Bell icon and badge unchanged — wired to `unreadCount` from hook.

**Bell badge:** `<span>unreadCount > 0 ? unreadCount : null</span>`

---

## 9. Files to Create / Modify

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `Notification` model, `NotificationType` enum, `User.notifications` relations |
| `src/lib/notifications.ts` | New — `createNotifications`, `resolveMentionedUsers`, types |
| `src/hooks/use-notifications.ts` | New — `useNotifications` hook |
| `src/app/api/notifications/route.ts` | New — GET + PATCH handlers |
| `src/app/api/cron/overdue-invoices/route.ts` | New — daily cron, protected |
| `src/components/layout/header.tsx` | Replace mock state + MOCK_NOTIFICATIONS with `useNotifications` |
| `src/actions/tasks.ts` | Call `createNotifications` on create/update/comment |
| `src/actions/milestones.ts` | Call on milestone status change (completed + due-soon) |
| `src/actions/risks.ts` | Call on risk creation if high severity |
| `src/actions/issues.ts` | Call on issue creation if high severity |
| `src/actions/tasks.ts` — `addComment` | Call `createNotifications` for COMMENT + MENTION |
| `vercel.json` | Add `crons` entry for overdue-invoices |
| `.env.local` / Vercel env | Add `CRON_SECRET` |

---

## 10. Error Handling

- Auth failures → 401 on all routes.
- Cron auth failure → 403.
- DB errors on create → log + continue (fail-safe, don't block the main action).
- DB errors on read → return `{ notifications: [], unreadCount: 0 }` with 500 status.
- Poll errors → swallow (hook keeps last known state).
- Unresolved @mentions → silently ignore (no user found = no notif).

---

## 11. Migration

```bash
npx prisma migrate dev --name add_notifications
```

Review generated migration, apply. No data loss. No existing tables altered.

---

## 12. Testing

**Unit (notifications.ts):**
- `createNotifications`: assert actor is excluded, empty recipients skipped,
  `createMany` called with correct count.
- `resolveMentionedUsers`: single match, multiple matches, no match, partial match.

**API routes:**
- `GET /api/notifications` — returns 401 without session; with session, returns
  only that user's notifications ordered by `createdAt desc`.
- `PATCH` with `ids` — marks those IDs; does not touch other users'.
- `PATCH` with `{ all: true }` — marks all for current user only.

**Manual end-to-end:**
1. Log in as User A.
2. As User B, assign a task to User A. Open notification panel → item appears.
3. Badge shows count. Click → item marked read, count decrements.
4. Refresh → state persists.

---

## 13. Open Questions / Deferred

- **Notification preferences:** Not in scope. Future work could add a
  `NotificationPreference` table to let users mute certain types.
- **Push / email:** Not in scope. Vercel Email or a third-party (Resend,
  Postmark) can be added later via `vercel/marketplace`.
- **Mark as unread:** Not in scope.
- **Real-time (WebSocket/SSE):** Not in scope for v1. Poll at 60 s is
  sufficient for a PM tool. Future: upgrade to Vercel WebSockets or
  Vercel Queues + SSE.

---

*Spec self-reviewed: no TBDs, no internal contradictions, scope is a single implementation plan, no ambiguous requirements.*