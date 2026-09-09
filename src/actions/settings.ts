"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const existing = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: session.user.id } },
  });
  if (existing) return { error: "Email already in use" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updatePassword(data: z.infer<typeof passwordSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = passwordSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return { error: "Cannot change password for OAuth accounts" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) return { error: "Current password is incorrect" };

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return { success: true };
}

export async function updateAvatar(imageDataUrl: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Validate it's a base64 image (data URL)
  if (!imageDataUrl.startsWith("data:image/")) {
    return { error: "Invalid image format" };
  }

  // Limit: ~2MB base64 ≈ ~1.5MB actual
  if (imageDataUrl.length > 2_500_000) {
    return { error: "Image too large. Please use an image under 1.5 MB." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageDataUrl },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
