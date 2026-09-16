import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Inline-safe types get previewed in the browser; everything else downloads.
const SAFE_INLINE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

function filenameSafe(name: string) {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 200);
}

// GET /api/task-documents/[docId] — serve document bytes (inline for preview, ?download=1 for attachment)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;
  const doc = await prisma.taskDocument.findFirst({
    where: {
      id: docId,
      task: {
        OR: [
          { creatorId: session.user.id },
          { project: { OR: [{ creatorId: session.user.id }, { members: { some: { userId: session.user.id } } }] } },
        ],
      },
    },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const download = req.nextUrl.searchParams.get("download") === "1";
  const inline = !download && SAFE_INLINE_TYPES.has(doc.mimeType);
  const name = filenameSafe(doc.name);

  return new NextResponse(new Uint8Array(doc.data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}

// DELETE /api/task-documents/[docId] — remove a document
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;
  const doc = await prisma.taskDocument.findFirst({
    where: {
      id: docId,
      task: {
        OR: [
          { creatorId: session.user.id },
          { project: { OR: [{ creatorId: session.user.id }, { members: { some: { userId: session.user.id } } }] } },
        ],
      },
    },
    select: { id: true },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.taskDocument.delete({ where: { id: docId } });
  return NextResponse.json({ success: true });
}
