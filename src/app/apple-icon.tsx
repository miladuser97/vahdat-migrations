import { ImageResponse } from "next/og";

// Next.js file convention: `apple-icon.tsx` is compiled into the
// apple-touch-icon route/link automatically.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Same monogram as icon.tsx, at Apple's recommended 180x180 size.
 * No rounded corners here on purpose — iOS applies its own corner mask
 * to apple-touch-icons, so a plain square is the correct source image.
 */
export default function AppleIcon() {
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
          fontSize: 96,
          fontWeight: 600,
        }}
      >
        ت
      </div>
    ),
    { ...size },
  );
}
