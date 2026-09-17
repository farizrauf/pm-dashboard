# Syncro

Syncro is a project management dashboard for organizing projects, tasks, milestones, teams, risks, issues, resources, invoices, and reports in one workspace.

The application is built for teams that need a practical view of their work, from project planning and task execution to financial tracking and team coordination.

## Features

- Dashboard with project progress, task status, team workload, activity, and upcoming deadlines
- Project management with grid and list views, search, filters, pagination, priorities, statuses, and color labels
- Project detail pages with overview, tasks, Kanban board, timeline, and activity
- Task management with list and board views, sorting, filters, labels, assignees, comments, and document attachments
- Milestones and calendar views for deadlines and delivery planning
- Team and resource management with workload information
- Risk and issue tracking
- Finance and invoice management with status tracking, uploaded file preview, invoice details, and downloads
- Reports for project progress, task completion, workload, and overdue work
- Notifications, global search, workspace switching, user management, and settings
- Light and dark themes

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 15 with App Router |
| Language | TypeScript |
| UI | Tailwind CSS, Radix UI, and custom UI components |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Auth.js v5 |
| Charts | Recharts |
| Drag and drop | dnd-kit |
| Validation | Zod |
| Icons and feedback | Lucide React and Sonner |

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- PostgreSQL from Neon, Supabase, or a local installation

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from the example file.

   On macOS or Linux:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Set the required environment variables:

   ```env
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   AUTH_SECRET="your-random-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Create the database tables:

   ```bash
   npm run db:push
   ```

5. Seed development data when needed:

   ```bash
   npm run db:seed
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo accounts

Demo accounts are created by the seed script.

| Email | Password | Role |
| --- | --- | --- |
| `alice@synchro.dev` | `password123` | Admin |
| `bob@synchro.dev` | `password123` | Member |
| `carol@synchro.dev` | `password123` | Member |
| `dave@synchro.dev` | `password123` | Member |
| `eva@synchro.dev` | `password123` | Member |

Do not use these credentials outside local development.

## Available scripts

```bash
npm run dev        # Start the development server
npm run build      # Build the application for production
npm run start      # Start the production server
npm run lint       # Run ESLint
npm run typecheck  # Run the TypeScript compiler without emitting files
npm run db:push    # Apply the Prisma schema to the database
npm run db:migrate # Create and run a Prisma migration
npm run db:seed    # Insert development data
npm run db:studio  # Open Prisma Studio
```

## Project structure

```text
prisma/
  schema.prisma       Database schema
  seed.ts              Development seed data
src/
  actions/             Server actions for application mutations
  app/                 Routes, layouts, API routes, and error pages
  components/          Feature components and shared UI
  hooks/               Client hooks such as locale and notifications
  lib/                 Authentication, Prisma, i18n, and shared utilities
  middleware.ts        Route protection
messages/              Translation files
docs/                  Product and design notes
```

## Database

Prisma manages the PostgreSQL schema. The main models cover users, workspaces, projects, tasks, task documents, milestones, comments, activities, labels, budgets, expenses, invoices, resources, risks, issues, notifications, and project members.

For local development, `npm run db:push` is the quickest way to apply schema changes. Use `npm run db:migrate` when you need migration history.

## Deployment

Syncro can be deployed to Vercel with a PostgreSQL provider such as Neon or Supabase.

Configure these environment variables in the Vercel project:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=your-random-secret
NEXTAUTH_URL=https://your-domain.example
```

The build command runs Prisma client generation before the Next.js build. After configuring the production database, apply the schema with:

```bash
npx prisma db push
```

Run the seed script only when you intentionally want development data in that database.

## Notes

- Keep `.env`, `.env.local`, and other environment files out of version control.
- The application currently uses `next lint`, which is deprecated in Next.js 16. Migrate to the ESLint CLI before upgrading to that version.
- Uploaded invoice files are currently stored as data URLs in the invoice record. Object storage would be a better option for larger files or production-scale usage.

## Repository description

Project management dashboard for teams to manage projects, tasks, milestones, teams, risks, issues, resources, invoices, and reports in one workspace.
