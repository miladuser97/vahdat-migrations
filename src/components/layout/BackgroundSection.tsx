import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Container } from "@/components/layout/Container";

export type BackgroundTone = "background" | "surface" | "muted";

export interface BackgroundSectionProps {
  tone?: BackgroundTone;
  children: ReactNode;
  className?: string;
}

const TONE_STYLES: Record<BackgroundTone, string> = {
  background: "bg-background",
  surface: "bg-surface",
  muted: "bg-muted",
};

/**
 * BackgroundSection
 * One responsibility: a full-width color band wrapping a `Container` —
 * the "alternating background" pattern used repeatedly on Home, About,
 * and Business (17 occurrences across those 3 files, found during the
 * Architecture Review) to create page rhythm without gradients or
 * animation. Replaces the hand-written
 * `<div className="bg-X"><Container>...</Container></div>` pairing
 * with one definition.
 */
export function BackgroundSection({
  tone = "background",
  children,
  className = "",
}: BackgroundSectionProps) {
  return (
    <div className={cn(TONE_STYLES[tone], className)}>
      <Container>{children}</Container>
    </div>
  );
}
