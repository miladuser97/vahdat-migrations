import { ImageResponse } from "next/og";

// Next.js file convention: `opengraph-image.tsx` at the root is
// auto-detected and auto-linked as the Open Graph / Twitter image for
// every page under this layout (no manual metadata wiring needed).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Deliberately does NOT render the joined multi-letter Persian wordmark
 * ("تحریرینو") through Satori (the engine behind ImageResponse): Satori
 * has known, longstanding gaps in Arabic-script shaping/joining, so
 * connected Persian text can render as disconnected or incorrect glyphs
 * — and this can't be verified without a live build/browser, which
 * isn't available in this environment. A single isolated letter (as
 * used in icon.tsx) needs no joining and is safe; a full word does not
 * carry the same guarantee. Rather than risk shipping a broken-looking
 * social preview, this reuses the same safe monogram plus a Latin
 * transliteration (also shaping-safe) instead of the full Persian word.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F5F1",
          gap: 32,
        }}
      >
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#2F3B63",
            color: "#F7F5F1",
            fontSize: 88,
            fontWeight: 600,
          }}
        >
          ت
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, color: "#232323" }}>
          Tahririno
        </div>
        <div style={{ fontSize: 24, color: "#5B5750" }}>
          Paper &amp; Stationery
        </div>
      </div>
    ),
    { ...size },
  );
}
