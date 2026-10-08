import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("ℹ️ Seed از طریق Supabase SQL Editor انجام شده است.");
  console.log("ℹ️ این فایل برای Vercel Build لازم است.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });