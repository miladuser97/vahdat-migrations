import "server-only";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

// ✅ تعریف تایپ برای globalThis
declare global {
  var prisma: PrismaClient | undefined;
}

// ✅ Prisma Client Singleton
export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

// ✅ لاگ کوئری‌ها در حالت توسعه
// (cast به any برای دور زدن تایپ‌های dynamically generated در Prisma)
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on("query", (e: { query: string; duration: number }) => {
    logger.debug("Prisma Query", {
      query: e.query,
      duration: `${e.duration}ms`,
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on("error", (e: { message: string }) => {
  logger.error("Prisma Error", { message: e.message });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on("warn", (e: { message: string }) => {
  logger.warn("Prisma Warning", { message: e.message });
});

// ✅ جلوگیری از ساخت چند instance در حالت development
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;