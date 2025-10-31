import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession } from "next-auth/next";
import type { AuthOptions } from "next-auth/core/types";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./hash";

type AuthenticatedUser = AdapterUser & {
  role?: string | null;
  isAdmin?: boolean | null;
  image?: string | null;
};

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  isAdmin?: boolean;
  image?: string | null;
};

const credentialsSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(6),
});

const adminCredentialsSchema = z.object({
  email: z.string().email().or(z.literal("root")),
  password: z.string().min(6),
});

const prismaAdapter = PrismaAdapter(prisma);

async function generateUniqueUsername(email?: string | null, name?: string | null) {
  const baseFromEmail = email?.split("@")[0] ?? "";
  const baseFromName = name?.replace(/\s+/g, "") ?? "";
  const fallback = `member${randomUUID().slice(0, 6)}`;
  const raw = (baseFromEmail || baseFromName || fallback).toLowerCase();
  const sanitized = raw.replace(/[^a-z0-9]/g, "");
  const base = sanitized.length >= 3 ? sanitized.slice(0, 20) : fallback;

  let attempt = base;
  let suffix = 0;

  // ensure uniqueness by appending an incrementing suffix when necessary
  while (await prisma.user.findUnique({ where: { username: attempt } })) {
    suffix += 1;
    const baseSlice = base.slice(0, Math.max(1, 20 - String(suffix).length));
    attempt = `${baseSlice}${suffix}`;
  }

  return attempt;
}

const enhancedAdapter: Adapter = {
  ...prismaAdapter,
  async createUser(data) {
    const email = data.email?.toLowerCase();
    if (!email) {
      throw new Error("OAuth account is missing an email address");
    }

    const username = await generateUniqueUsername(email, data.name);
    const hashed = await hashPassword(randomUUID().replace(/-/g, ""));

    try {
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashed,
          name: data.name ?? username,
          emailVerified: data.emailVerified ?? new Date(),
        },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          name: true,
        },
      });

      return {
        id: String(user.id),
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: null,
      } satisfies AdapterUser;
    } catch (error) {
      if (
        typeof error === "object"
        && error !== null
        && "code" in error
        && (error as { code?: string }).code === "P2002"
      ) {
        const existing = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            name: true,
          },
        });

        if (existing) {
          return {
            id: String(existing.id),
            email: existing.email,
            emailVerified: existing.emailVerified,
            name: existing.name,
            image: null,
          } satisfies AdapterUser;
        }
      }

      throw error;
    }
  },
};

export const authOptions: AuthOptions = {
  adapter: enhancedAdapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "user-credentials",
      name: "Credentials",
      credentials: {
        emailOrUsername: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { emailOrUsername, password } = parsed.data;
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: emailOrUsername.toLowerCase() },
              { username: emailOrUsername.toLowerCase() },
            ],
          },
        });

        if (!user) {
          return null;
        }

        const valid = await verifyPassword(password, user.password);
        if (!valid) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.username,
          role: user.role,
          emailVerified: user.emailVerified?.toISOString() ?? null,
        };
      },
    }),
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Admin Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = adminCredentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const admin = await prisma.admin.findFirst({
          where: {
            OR: [
              { email: email.toLowerCase() },
              { username: email.toLowerCase() },
            ],
          },
        });

        if (!admin) {
          return null;
        }

        const valid = await verifyPassword(password, admin.password);
        if (!valid) {
          return null;
        }

        return {
          id: `admin:${admin.id}`,
          email: admin.email,
          name: admin.username,
          role: "ADMIN" as const,
          isAdmin: true,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        const enrichedUser = user as AuthenticatedUser;
        token.sub = enrichedUser.id;
        token.role = enrichedUser.role ?? token.role ?? "USER";
        token.isAdmin = Boolean(enrichedUser.isAdmin);
        token.accountProvider = account?.provider ?? token.accountProvider;
        if (typeof enrichedUser.image === "string" && enrichedUser.image.length > 0) {
          token.picture = enrichedUser.image;
        }
      }

      if (!token.picture && profile && typeof (profile as { picture?: string }).picture === "string") {
        token.picture = (profile as { picture?: string }).picture;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as SessionUser;
        sessionUser.id = token.sub ?? sessionUser.id ?? "";
        sessionUser.role = (token.role as string) ?? "USER";
        sessionUser.isAdmin = Boolean(token.isAdmin) || sessionUser.role === "ADMIN";
        if (typeof token.picture === "string") {
          sessionUser.image = token.picture;
        }
      }
      return session;
    },
  },
};

export const auth = () => getServerSession(authOptions);

export type { SessionUser };
