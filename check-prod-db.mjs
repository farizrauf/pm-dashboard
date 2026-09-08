    import { PrismaClient } from "@prisma/client";

// Use the production DATABASE_URL from .env
const p = new PrismaClient();
const users = await p.user.findMany({
  select: { email: true, role: true, password: true, createdAt: true }
});
console.log("Total users in DB:", users.length);
users.forEach(u => console.log(" -", u.email, u.role, u.password ? "HAS_PW" : "NO_PW"));
await p.$disconnect();
