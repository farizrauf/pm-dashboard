import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Temporary debug endpoint — REMOVE AFTER FIXING
export async function GET() {
  // First check env vars
  const dbUrl = process.env.DATABASE_URL;
  const authSecret = process.env.AUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  if (!dbUrl) {
    return NextResponse.json({
      status: "ENV_MISSING",
      DATABASE_URL: dbUrl ?? "UNDEFINED",
      AUTH_SECRET: authSecret ? "SET" : "MISSING",
      NEXTAUTH_URL: nextAuthUrl ?? "UNDEFINED",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: "reza@nexaintegra.id" },
      select: { id: true, email: true, role: true, password: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ status: "NO_USER", dbUrlPrefix: dbUrl.substring(0, 30) });
    }

    const match = await bcrypt.compare("password123", user.password ?? "");

    return NextResponse.json({
      status: "OK",
      userFound: true,
      email: user.email,
      role: user.role,
      passwordHashPrefix: user.password?.substring(0, 7),
      bcryptMatch: match,
      dbUrlPrefix: dbUrl.substring(0, 30),
    });
  } catch (err) {
    return NextResponse.json({
      status: "DB_ERROR",
      error: String(err),
      dbUrlPrefix: dbUrl?.substring(0, 30),
      dbUrlLength: dbUrl?.length,
    }, { status: 500 });
  }
}
