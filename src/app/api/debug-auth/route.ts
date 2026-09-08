import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Temporary debug endpoint — REMOVE AFTER FIXING
export async function GET() {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: "reza@nexaintegra.id" },
      select: { id: true, email: true, role: true, password: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ status: "NO_USER", message: "User reza@nexaintegra.id not found in DB" });
    }

    // Test bcrypt compare
    const match = await bcrypt.compare("password123", user.password ?? "");

    return NextResponse.json({
      status: "OK",
      userFound: true,
      email: user.email,
      role: user.role,
      passwordHashPrefix: user.password?.substring(0, 10),
      bcryptMatch: match,
      createdAt: user.createdAt,
    });
  } catch (err) {
    return NextResponse.json({ status: "ERROR", error: String(err) }, { status: 500 });
  }
}
