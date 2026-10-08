// scripts/media/test-custom-url.js
// تست pipeline: Custom URL → Provider → Orchestrator

// ⚠️ نکته: این اسکریپت با Node 13.6 کار نمی‌کنه چون TypeScriptه
// ولی برای اجرا، از ts-node یا tsx استفاده می‌کنیم
// یا با compile TypeScript → JavaScript

const path = require('path');

console.log('═══════════════════════════════');
console.log('🧪 تست Stage 2 — Custom URL Provider');
console.log('═══════════════════════════════\n');

// شبیه‌سازی منطق Provider (بدون TypeScript)
// فقط برای تست pipeline

const BLOCKED_PROTOCOLS = ['file:', 'data:', 'javascript:', 'ftp:', 'gopher:'];
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1', 'metadata.google.internal'];
const MAX_URL_LENGTH = 2048;

function isPrivateIp(hostname) {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (!match) return false;

  const parts = match.slice(1).map((p) => parseInt(p, 10));
  const [a, b] = parts;

  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;

  return false;
}

function validateUrl(rawUrl) {
  if (!rawUrl || rawUrl.length > MAX_URL_LENGTH) {
    return { valid: false, reason: 'URL_TOO_LONG_OR_EMPTY' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: 'INVALID_URL_FORMAT' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: `PROTOCOL_NOT_ALLOWED: ${parsed.protocol}` };
  }

  if (BLOCKED_PROTOCOLS.includes(parsed.protocol)) {
    return { valid: false, reason: `BLOCKED_PROTOCOL: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.includes(hostname)) {
    return { valid: false, reason: `BLOCKED_HOST: ${hostname}` };
  }

  if (isPrivateIp(hostname)) {
    return { valid: false, reason: `PRIVATE_IP_NOT_ALLOWED: ${hostname}` };
  }

  return { valid: true };
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

// ============================================================
// شبیه‌سازی Provider
// ============================================================
function customUrlSearch(input) {
  const validation = validateUrl(input.url);
  if (!validation.valid) {
    console.log(`❌ URL رد شد: ${validation.reason}`);
    return [];
  }

  return [{
    sourceUrl: input.url,
    previewUrl: input.url,
    downloadUrl: input.url,
    title: input.title || 'image',
    raw: { provider: 'custom-url' },
  }];
}

// ============================================================
// شبیه‌سازی Normalize
// ============================================================
function normalizeResult(result, providerSlug, providerName) {
  return {
    ...result,
    providerSlug,
    providerName,
    sourceUrl: normalizeUrl(result.sourceUrl),
    previewUrl: normalizeUrl(result.previewUrl),
    downloadUrl: result.downloadUrl ? normalizeUrl(result.downloadUrl) : undefined,
    normalizedUrl: normalizeUrl(result.sourceUrl),
  };
}

// ============================================================
// شبیه‌سازی Deduplicate
// ============================================================
function deduplicateResults(results) {
  const seen = new Set();
  const unique = [];
  for (const r of results) {
    if (seen.has(r.normalizedUrl)) continue;
    seen.add(r.normalizedUrl);
    unique.push(r);
  }
  return unique;
}

// ============================================================
// اجرای تست
// ============================================================
const tests = [
  { name: '✅ URL درست - Unsplash', url: 'https://images.unsplash.com/photo-123?w=500', expectValid: true },
  { name: '✅ URL درست - HTTP', url: 'http://example.com/image.jpg', expectValid: true },
  { name: '❌ فایل محلی', url: 'file:///etc/passwd', expectValid: false },
  { name: '❌ Data URL', url: 'data:image/png;base64,xxx', expectValid: false },
  { name: '❌ JavaScript', url: 'javascript:alert(1)', expectValid: false },
  { name: '❌ Localhost', url: 'http://localhost:3000/image.jpg', expectValid: false },
  { name: '❌ IP خصوصی', url: 'http://192.168.1.1/admin.jpg', expectValid: false },
  { name: '❌ AWS metadata', url: 'http://169.254.169.254/latest/meta-data/', expectValid: false },
  { name: '❌ URL نامعتبر', url: 'not-a-url', expectValid: false },
];

console.log('📋 تست validateUrl:\n');

let pass = 0;
let fail = 0;

for (const test of tests) {
  const result = validateUrl(test.url);
  const passed = result.valid === test.expectValid;
  
  if (passed) {
    pass++;
    console.log(`${test.name}`);
  } else {
    fail++;
    console.log(`${test.name}`);
    console.log(`   انتظار: ${test.expectValid}, نتیجه: ${result.valid}, دلیل: ${result.reason || '-'}`);
  }
}

console.log(`\n📊 نتیجه: ${pass} قبول / ${fail} رد\n`);

// ============================================================
// تست Pipeline کامل
// ============================================================
console.log('═══════════════════════════════');
console.log('🔄 تست Pipeline کامل:');
console.log('═══════════════════════════════\n');

const input = {
  url: 'https://images.unsplash.com/photo-123?w=500',
  title: 'Samsung S24 Ultra - Test',
};

console.log('📥 ورودی:', input.url);

const rawResults = customUrlSearch(input);
console.log(`📤 Provider برگردوند: ${rawResults.length} نتیجه`);

const normalized = rawResults.map((r) => normalizeResult(r, 'custom-url', 'لینک دستی'));
console.log('🔄 بعد از Normalize:');

const unique = deduplicateResults(normalized);
console.log(`🔄 بعد از Deduplicate: ${unique.length} نتیجه منحصربه‌فرد\n`);

console.log('📄 نتیجه نهایی:');
console.log(JSON.stringify(unique[0], null, 2));

console.log('\n🎉 تست کامل شد!');