#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function ensureAdmin({ username, email, password }) {
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin with email ${email} already exists (username: ${existing.username}).`);
    return existing;
  }

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.create({
    data: {
      username,
      email,
      password: hashed,
    },
  });

  console.log(`Created admin ${username} (${email}).`);
  return admin;
}

async function main() {
  const username = process.env.ADMIN_USERNAME || "Bondhon";
  const email = process.env.ADMIN_EMAIL || "bd@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "Bd123456@";

  if (!password || password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be provided and at least 8 characters long.");
  }

  await ensureAdmin({ username, email, password });
}

main()
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
