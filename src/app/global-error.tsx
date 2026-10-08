"use client";

/**
 * Global Error Boundary (Next.js App Router)
 * 
 * Replaces the entire root layout when an error occurs that is not caught
 * by a more specific error.tsx boundary. Because it replaces the root
 * layout, it MUST define its own <html> and <body> tags.
 * 
 * Consistent with the project's RTL-first and styled-UI approach.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center p-lg text-center">
          <h1 className="mb-md text-2xl font-bold">متأسفانه خطای غیرمنتظره‌ای رخ داد</h1>
          <p className="mb-xl text-muted-foreground">
            در اجرای برنامه مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-primary px-lg py-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            تلاش مجدد
          </button>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-xl max-w-full overflow-auto rounded bg-muted p-md text-left text-xs text-muted-foreground">
              {error.message}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
