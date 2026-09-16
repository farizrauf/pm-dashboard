import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per document
const MAX_DOCS_PER_TASK = 10;

function taskAccessWhere(taskId: string, userId: string) {
  return {
    id: taskId,
    OR: [
      { creatorId: userId },
      { project: { OR: [{ creatorId: userId }, { members: { some: { userId } } }] } },
    ],
  };
}

// GET /api/tasks/[taskId]/documents — list documents for a task (metadata only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const task = await prisma.task.findFirst({ where: taskAccessWhere(taskId, session.user.id), select: { id: true } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const documents = await prisma.taskDocument.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, mimeType: true, size: true, createdAt: true },
  });

  return NextResponse.json({ documents });
}

// POST /api/tasks/[taskId]/documents — upload one or more documents (multipart FormData, field "files")
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const task = await prisma.task.findFirst({ where: taskAccessWhere(taskId, session.user.id), select: { id: true } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const existing = await prisma.taskDocument.count({ where: { taskId } });
  if (existing + files.length > MAX_DOCS_PER_TASK) {
    return NextResponse.json(
      { error: `Maximum ${MAX_DOCS_PER_TASK} documents per task` },
      { status: 400 }
    );
  }

  const oversize = files.find((f) => f.size > MAX_FILE_SIZE);
  if (oversize) {
    return NextResponse.json(
      { error: `"${oversize.name}" is too large. Max 10 MB per document.` },
      { status: 400 }
    );
  }

  const payloads = await Promise.all(
    files.map(async (file) => ({
      name: file.name.slice(0, 200),
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      data: Buffer.from(await file.arrayBuffer()),
    }))
  );

  const created = await prisma.$transaction(
    payloads.map((p) =>
      prisma.taskDocument.create({
        data: { taskId, ...p },
        select: { id: true, name: true, mimeType: true, size: true, createdAt: true },
      })
    )
  );

  return NextResponse.json({ documents: created }, { status: 201 });
}
