// scripts/verify-test-project.mjs
// Verify Supabase test project URL (no network requests)

const EXPECTED_HOST = "whrfzvzysehggsqovqqj.supabase.co";
const FORBIDDEN_HOST = "bcmhykiruwbgovaxnwzr.supabase.co";
const FORBIDDEN_FRAGMENT = "bcmhykiruwbgovaxnwzr";

function main() {
  const url = process.env.TEST_SUPABASE_URL;

  if (!url || url.trim() === "") {
    console.error("Error [URL_MISSING]");
    process.exit(1);
  }

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    console.error("Error [URL_FORMAT_INVALID]");
    process.exit(1);
  }

  if (parsed.protocol !== "https:") {
    console.error("Error [URL_PROTOCOL_INVALID]");
    process.exit(1);
  }

  if (parsed.username !== "" || parsed.password !== "") {
    console.error("Error [URL_HAS_CREDENTIALS]");
    process.exit(1);
  }

  if (parsed.port !== "" && parsed.port !== "443") {
    console.error("Error [URL_HAS_CUSTOM_PORT]");
    process.exit(1);
  }

  if (parsed.search !== "") {
    console.error("Error [URL_HAS_QUERY]");
    process.exit(1);
  }

  if (parsed.hash !== "") {
    console.error("Error [URL_HAS_FRAGMENT]");
    process.exit(1);
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname === FORBIDDEN_HOST || hostname.includes(FORBIDDEN_FRAGMENT)) {
    console.error("Error [URL_IS_PRODUCTION]");
    process.exit(1);
  }

  if (hostname !== EXPECTED_HOST) {
    console.error("Error [URL_HOST_MISMATCH]");
    process.exit(1);
  }

  console.log("URL verified: test project only");
  process.exit(0);
}

main();