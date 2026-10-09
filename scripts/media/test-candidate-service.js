// scripts/media/test-candidate-service.js
// تست کمکی logic Candidate Service با pg
//
// ⚠️ این تست فقط logic رو چک می‌کنه، نه Prisma واقعی.
//    تأیید نهایی Stage 3A در Vercel Preview انجام می‌شه.
//
// ⚠️ این تست به DB وصل می‌شه.
//    ولی فقط یه productId تستی استفاده می‌کنه و رکوردهای test رو حذف می‌کنه.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const crypto = require('crypto');

// ============================================================
// Load env
// ============================================================
function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  });
  return env;
}

// ============================================================
// Helper: تولید UUID
// ============================================================
function generateUuid() {
  return crypto.randomBytes(16).toString('hex');
}

// ============================================================
// Helper: پیدا کردن یه productId واقعی از DB
// ============================================================
async function getTestProductId(client) {
  const result = await client.query(
    `SELECT id FROM "Product" WHERE "isEnabled" = true LIMIT 1`
  );
  if (result.rows.length === 0) {
    throw new Error('No enabled product found in DB');
  }
  return result.rows[0].id;
}

// ============================================================
// شبیه‌سازی createCandidate
// ============================================================
async function createCandidatePg(client, input) {
  // Duplicate check
  const existing = await client.query(
    `SELECT id, "productId", source, "sourceUrl", "previewUrl", status, "createdAt"
     FROM "MediaCandidate"
     WHERE "productId" = $1 AND source = $2 AND "sourceUrl" = $3
     LIMIT 1`,
    [input.productId, input.source, input.sourceUrl]
  );

  if (existing.rows.length > 0) {
    return { ...existing.rows[0], isNew: false };
  }

  // Create
  const id = generateUuid();
  const insert = await client.query(
    `INSERT INTO "MediaCandidate"
       (id, "productId", source, "sourceUrl", "previewUrl", "downloadUrl",
        title, creator, "licenseType", "licenseUrl", attribution,
        width, height, "relevanceScore", metadata, status, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, NOW())
     RETURNING id, "productId", source, "sourceUrl", "previewUrl", status, "createdAt"`,
    [
      id,
      input.productId,
      input.source,
      input.sourceUrl,
      input.previewUrl,
      input.downloadUrl || null,
      input.title || null,
      input.creator || null,
      input.licenseType || null,
      input.licenseUrl || null,
      input.attribution || null,
      input.width || null,
      input.height || null,
      input.relevanceScore || null,
      JSON.stringify(input.metadata || {}),
      'PENDING',
    ]
  );

  return { ...insert.rows[0], isNew: true };
}

// ============================================================
// پاک کردن رکوردهای تست
// ============================================================
async function cleanup(client, testUrls) {
  if (testUrls.length === 0) return 0;
  const result = await client.query(
    `DELETE FROM "MediaCandidate" WHERE "sourceUrl" = ANY($1)`,
    [testUrls]
  );
  return result.rowCount;
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('═══════════════════════════════');
  console.log('🧪 تست Stage 3A — Candidate Service');
  console.log('═══════════════════════════════\n');

  const env = loadEnv();
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const testUrls = [];
  let testProductId = null;

  try {
    await client.connect();
    console.log('✅ اتصال به DB\n');

    // ۱. یه product واقعی پیدا کن
    testProductId = await getTestProductId(client);
    console.log(`📦 محصول تست: ${testProductId}\n`);

    // ============================================================
    // تست ۱: ایجاد Candidate جدید
    // ============================================================
    console.log('═══════════════════════════════');
    console.log('📝 تست ۱: ایجاد Candidate جدید');
    console.log('═══════════════════════════════\n');

    const testUrl1 = `https://test-candidate-service.example.com/img-${Date.now()}.jpg`;
    testUrls.push(testUrl1);

    const input1 = {
      productId: testProductId,
      source: 'OTHER',
      sourceUrl: testUrl1,
      previewUrl: testUrl1,
      downloadUrl: testUrl1,
      title: 'Test image 1',
      metadata: { provider: 'custom-url', test: true },
    };

    const result1 = await createCandidatePg(client, input1);
    console.log(`📌 نتیجه:`);
    console.log(`   isNew: ${result1.isNew}`);
    console.log(`   status: ${result1.status}`);
    console.log(`   id: ${result1.id}`);

    if (!result1.isNew) {
      console.log(`❌ FAIL: باید isNew=true باشه`);
      process.exit(1);
    }
    if (result1.status !== 'PENDING') {
      console.log(`❌ FAIL: status باید PENDING باشه`);
      process.exit(1);
    }
    console.log(`✅ PASS\n`);

    // ============================================================
    // تست ۲: Duplicate check
    // ============================================================
    console.log('═══════════════════════════════');
    console.log('📝 تست ۲: Duplicate check');
    console.log('═══════════════════════════════\n');

    const result2 = await createCandidatePg(client, input1);
    console.log(`📌 نتیجه:`);
    console.log(`   isNew: ${result2.isNew}`);
    console.log(`   id: ${result2.id}`);

    if (result2.isNew) {
      console.log(`❌ FAIL: نباید رکورد جدید بسازه`);
      process.exit(1);
    }
    if (result2.id !== result1.id) {
      console.log(`❌ FAIL: باید همون id قبلی رو برگردونه`);
      process.exit(1);
    }
    console.log(`✅ PASS\n`);

    // ============================================================
    // تست ۳: URL متفاوت → Candidate جدید
    // ============================================================
    console.log('═══════════════════════════════');
    console.log('📝 تست ۳: URL متفاوت');
    console.log('═══════════════════════════════\n');

    const testUrl2 = `https://test-candidate-service.example.com/img-${Date.now()}-2.jpg`;
    testUrls.push(testUrl2);

    const input2 = {
      ...input1,
      sourceUrl: testUrl2,
      previewUrl: testUrl2,
    };

    const result3 = await createCandidatePg(client, input2);
    console.log(`📌 نتیجه:`);
    console.log(`   isNew: ${result3.isNew}`);

    if (!result3.isNew) {
      console.log(`❌ FAIL: باید رکورد جدید بسازه`);
      process.exit(1);
    }
    if (result3.id === result1.id) {
      console.log(`❌ FAIL: نباید همون id قبلی باشه`);
      process.exit(1);
    }
    console.log(`✅ PASS\n`);

    // ============================================================
    // تست ۴: شمارش رکوردها
    // ============================================================
    console.log('═══════════════════════════════');
    console.log('📝 تست ۴: شمارش رکوردها');
    console.log('═══════════════════════════════\n');

    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM "MediaCandidate" WHERE "sourceUrl" = ANY($1)`,
      [testUrls]
    );
    const count = parseInt(countResult.rows[0].count, 10);
    console.log(`📌 تعداد رکورد: ${count}`);

    if (count !== 2) {
      console.log(`❌ FAIL: باید 2 باشه`);
      process.exit(1);
    }
    console.log(`✅ PASS\n`);

    // ============================================================
    // Cleanup
    // ============================================================
    console.log('═══════════════════════════════');
    console.log('🧹 پاک‌سازی رکوردهای تست');
    console.log('═══════════════════════════════\n');

    const deleted = await cleanup(client, testUrls);
    console.log(`🗑️  ${deleted} رکورد حذف شد`);

    console.log('\n🎉 همه‌ی تست‌ها موفق!');

  } catch (error) {
    console.error('\n❌ خطا:', error.message);
    // تلاش برای cleanup حتی در صورت خطا
    try {
      await cleanup(client, testUrls);
      console.log('🧹 cleanup بعد از خطا انجام شد');
    } catch (e) {
      console.error('⚠️ cleanup هم fail شد:', e.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});