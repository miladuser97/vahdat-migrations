type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private log(
    level: LogLevel,
    message: string,
    meta?: LogMeta,
    correlationId?: string
  ): void {
    const timestamp = new Date().toISOString();

    // ✅ ادغام correlationId توی meta
    const finalMeta: LogMeta | undefined =
      meta || correlationId
        ? {
            ...(meta ?? {}),
            ...(correlationId ? { correlationId } : {}),
          }
        : undefined;

    const payload = {
      level,
      message,
      timestamp,
      ...(finalMeta ? { meta: finalMeta } : {}),
    };

    if (this.isDev) {
      const emoji = {
        debug: "🔍",
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
      }[level];

      console[level === "debug" ? "log" : level](
        `${emoji} [${timestamp}] ${message}`,
        finalMeta || ""
      );
    } else {
      if (level === "error") {
        console.error(JSON.stringify(payload));
      } else if (level === "warn") {
        console.warn(JSON.stringify(payload));
      }
      // TODO: اتصال به سرویس لاگ مرکزی (Sentry / Logtail)
    }
  }

  debug(message: string, meta?: LogMeta, correlationId?: string): void {
    this.log("debug", message, meta, correlationId);
  }

  info(message: string, meta?: LogMeta, correlationId?: string): void {
    this.log("info", message, meta, correlationId);
  }

  warn(message: string, meta?: LogMeta, correlationId?: string): void {
    this.log("warn", message, meta, correlationId);
  }

  error(message: string, meta?: LogMeta, correlationId?: string): void {
    this.log("error", message, meta, correlationId);
  }
}

export const logger = new Logger();