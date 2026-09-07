# Synchro — Project Management Dashboard

A production-ready fullstack Project Management SaaS built with Next.js 15, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon / Supabase) |
| ORM | Prisma |
| Auth | Auth.js v5 (NextAuth) |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Icons | Lucide React |
| Toasts | Sonner |
| Validation | Zod |

---

## Features

- **Dashboard** — KPI cards, project progress, task status charts, team workload, recent activity, upcoming deadlines
- **Projects** — Grid/list view, create/edit/delete, status & priority filters, search, pagination
- **Project Detail** — Overview, Tasks, Kanban Board, Timeline, Activity tabs
- **Kanban Board** — Drag-and-drop tasks across columns, persisted to database
- **Tasks** — Table & board views, filters, sorting, create/edit/delete
- **Calendar** — Monthly calendar with task deadlines and milestones
- **Team** — Member cards with workload visualization
- **Reports** — Charts for task completion, project progress, team workload, overdue tasks
- **Settings** — Profile, password, appearance (light/dark mode), notifications
- **Dark Mode** — Full light/dark theme support

---

## Prerequisites

Pastikan sudah terinstall:

- **Node.js** v18 atau lebih baru — [nodejs.org](https://nodejs.org)
- **npm** v9 atau lebih baru (sudah include dengan Node.js)
- **PostgreSQL database** — gunakan salah satu:
  - [Neon](https://neon.tech) ← recommended, gratis
  - [Supabase](https://supabase.com)
  - Local PostgreSQL

---

## Cara Menjalankan Lokal

### 1. Clone / masuk ke folder project

```bash
cd pm-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Copy file example dan isi dengan konfigurasi kamu:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Dari Neon / Supabase / PostgreSQL lokal
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Generate dengan: openssl rand -base64 32
AUTH_SECRET="isi-dengan-string-random-panjang"

# URL app kamu
NEXTAUTH_URL="http://localhost:3000"
```

#### Cara dapat DATABASE_URL dari Neon (gratis):
1. Buka [neon.tech](https://neon.tech) → Sign up
2. Create new project
3. Klik **Connect** → copy **Connection string**
4. Paste ke `DATABASE_URL` di `.env.local`

### 4. Push schema database

```bash
npx prisma db push
```

Perintah ini membuat semua tabel di database berdasarkan `prisma/schema.prisma`.

### 5. Seed data dummy (opsional tapi direkomendasikan)

```bash
npm run db:seed
```

Ini akan membuat:
- 5 user akun test
- 6 sample projects
- 20+ tasks
- Milestones, activities, comments, labels

### 6. Jalankan dev server

```bash
npm run dev
```

Buka **http://localhost:3000**

---

## Akun Demo (setelah seed)

| Email | Password | Role |
|-------|----------|------|
| alice@synchro.dev | password123 | Admin |
| bob@synchro.dev | password123 | Member |
| carol@synchro.dev | password123 | Member |
| dave@synchro.dev | password123 | Member |
| eva@synchro.dev | password123 | Member |

---

## Perintah yang Tersedia

```bash
# Development
npm run dev          # Jalankan dev server (http://localhost:3000)

# Build & Production
npm run build        # Build untuk production
npm run start        # Jalankan production server (setelah build)

# Code Quality
npm run lint         # Cek ESLint
npm run typecheck    # Cek TypeScript

# Database
npm run db:push      # Push schema ke database (tanpa migration history)
npm run db:migrate   # Buat migration baru
npm run db:seed      # Isi database dengan data dummy
npm run db:studio    # Buka Prisma Studio (GUI database)
```

---

## Struktur Folder

```
pm-dashboard/
├── prisma/
│   ├── schema.prisma      # Database schema & models
│   └── seed.ts            # Data dummy untuk development
├── src/
│   ├── actions/           # Server Actions (CRUD operations)
│   │   ├── dashboard.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── milestones.ts
│   │   ├── team.ts
│   │   └── settings.ts
│   ├── app/               # Next.js App Router pages
│   │   ├── (auth)/        # Login page
│   │   │   └── login/
│   │   ├── (dashboard)/   # Protected dashboard pages
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── calendar/
│   │   │   ├── team/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   └── api/auth/      # Auth.js API routes
│   ├── components/
│   │   ├── ui/            # Base UI components (Button, Card, Dialog, dll)
│   │   ├── layout/        # Sidebar, Header, UserNav
│   │   ├── dashboard/     # Dashboard components
│   │   ├── projects/      # Project list, detail, kanban, form
│   │   ├── tasks/         # Task list, form, badges
│   │   ├── calendar/      # Calendar view
│   │   ├── team/          # Team member cards
│   │   ├── reports/       # Report charts
│   │   └── settings/      # Settings forms
│   ├── lib/
│   │   ├── auth.ts        # Auth.js configuration
│   │   ├── prisma.ts      # Prisma client singleton
│   │   └── utils.ts       # Helper functions & constants
│   └── middleware.ts      # Route protection
├── .env                   # Environment variables (jangan di-commit)
├── .env.example           # Template environment variables
├── tailwind.config.ts     # Tailwind + design tokens
└── package.json
```

---

## Database Schema

Model utama:

| Model | Keterangan |
|-------|-----------|
| `User` | Akun pengguna, terhubung ke Auth.js |
| `Project` | Project dengan status, priority, tanggal |
| `ProjectMember` | Relasi user ↔ project dengan role |
| `Task` | Task dengan status, priority, assignee |
| `Milestone` | Milestone per project |
| `Comment` | Komentar pada task |
| `Activity` | Log aktivitas project/task |
| `Label` | Label untuk task |
| `Risk` | Risiko project |
| `Issue` | Issue/bug project |

---

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/username/pm-dashboard.git
git push -u origin main
```

### 2. Import di Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New Project**
2. Import repository dari GitHub
3. Tambahkan **Environment Variables**:

```
DATABASE_URL        = postgresql://... (dari Neon/Supabase)
AUTH_SECRET         = (string random, min 32 karakter)
NEXTAUTH_URL        = https://your-app.vercel.app
```

4. Klik **Deploy**

### 3. Setelah deploy, jalankan migration

Di terminal lokal dengan environment variable production:

```bash
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

---

## Troubleshooting

### Tidak bisa login
- Pastikan `DATABASE_URL` sudah benar di `.env.local`
- Pastikan sudah menjalankan `npm run db:seed`
- Restart dev server setelah mengubah `.env`

### Error "Can't reach database server"
- Cek `DATABASE_URL` di `.env.local` — pastikan bukan `localhost:5432` kalau pakai Neon
- `.env.local` punya prioritas lebih tinggi dari `.env` — pastikan keduanya berisi URL yang sama

### Prisma error saat build
- Jalankan `npx prisma generate` sebelum build
- Sudah di-handle otomatis oleh script `build` di `package.json`

### Port 3000 sudah terpakai
```bash
npm run dev -- -p 3001
```

---

## Generate AUTH_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Atau pakai npx
npx auth secret
```
