"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/Button";

/**
 * Next.js special file: the root error boundary. This is one of the
 * few files Next.js requires to be a Client Component — error.tsx must
 * be able to catch a rendering error and offer `reset()`, which needs a
 * client-side error boundary underneath, regardless of this project's
 * "Server Components by default" rule.
 *
 * Still rendered inside the root layout (Header/Footer stay visible),
 * same as not-found.tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Reserved for a future error-reporting service. No such service
    // exists yet, so this intentionally does nothing rather than
    // pretending to log somewhere real.
  }, [error]);

  return (
    <Container>
      <div className="py-section">
        <ErrorState
          action={
            <Button type="button" variant="default" size="md" onClick={reset}>
              تلاش دوباره
            </Button>
          }
        />
      </div>
    </Container>
  );
}
