import { ImageResponse } from "next/og";

// Next.js file convention: a file named exactly `icon.tsx` in this
// folder is automatically compiled into an image route and linked as
// the site's icon — no manual <link> tag needed.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * A single-letter typographic monogram ("ت", the first letter of
 * تحریرینو) rather than a designed logo — there is no graphical logo
 * for this project, and inventing one here would be a fake asset.
 *
 * Colors are hardcoded hex, not design tokens: this file renders in an
 * isolated image-generation context (Satori, via ImageResponse) with no
 * access to the app's CSS or Tailwind config. The values match the
 * project's real primary/background tokens (see tailwind.config.ts).
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2F3B63",
          color: "#F7F5F1",
          fontSize: 20,
          fontWeight: 600,
          borderRadius: 6,
        }}
      >
        ت
      </div>
    ),
    { ...size },
  );
}
