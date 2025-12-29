import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const url = process.env.DATABASE_URL || "";
const authToken = process.env.DATABASE_AUTH_TOKEN;

let client: PrismaClient;

if (url.startsWith("libsql")) {
  const libsql = createClient({
    url,
    authToken,
  });
  const adapter = new PrismaLibSQL(libsql);
  client = new PrismaClient({ adapter });
} else {
  client = new PrismaClient({
    log: ["query"],
  });
}

export const prisma = globalForPrisma.prisma || client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
