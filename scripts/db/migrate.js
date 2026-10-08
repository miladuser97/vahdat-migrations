// scripts/db/migrate.js
// اجرای migration SQL + ثبت در _prisma_migrations
// سازگار با Node 13.6

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const crypto = require('crypto');

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

function computeChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function generateUuid() {
  // جایگزین crypto.randomUUID برای Node 13.6
  return crypto.randomBytes(16).toString('hex');
}

async function isMigrationApplied(client, name) {
  const result = await client.query(
    'SELECT id FROM "_prisma_migrations" WHERE migration_name = $1',
    [name]
  );
  return result.rows.length > 0;
}

async function applyMigration(client, name, sqlContent) {
  const checksum = computeChecksum(sqlContent);
  const id = generateUuid();
  
  console.log(`\n📦 اجرای migration: ${name}`);
  console.log(`   Checksum: ${checksum.slice(0, 16)}...`);
  
  // ۱. شروع تراکنش
  await client.query('BEGIN');
  
  try {
    // ۲. اجرای SQL
    console.log(`   ⏳ اجرای SQL...`);
    await client.query(sqlContent);
    console.log(`   ✅ SQL اجرا شد`);
    
    // ۳. ثبت در _prisma_migrations
    await client.query(
      `INSERT INTO "_prisma_migrations" 
       (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)`,
      [id, checksum, name]
    );
    console.log(`   ✅ رکورد ثبت شد`);
    
    // ۴. commit
    await client.query('COMMIT');
    console.log(`   ✅ تراکنش commit شد`);
    
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`   ❌ خطا! rollback شد`);
    throw error;
  }
}

async function main() {
  // اسم فایل SQL از آرگومان
  const sqlFileName = process.argv[2];
  if (!sqlFileName) {
    console.error('❌ استفاده: node migrate.js <migration-folder-name>');
    console.error('   مثال: node migrate.js 20261008_add_variant_media');
    process.exit(1);
  }
  
  const migrationsDir = path.join(__dirname, '..', '..', 'prisma', 'migrations');
  const migrationPath = path.join(migrationsDir, sqlFileName, 'migration.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ فایل پیدا نشد: ${migrationPath}`);
    process.exit(1);
  }
  
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('🚀 شروع migration');
  console.log(`📄 فایل: ${sqlFileName}/migration.sql`);
  console.log(`📊 حجم SQL: ${sqlContent.length} کاراکتر`);
  
  const env = loadEnv();
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ اتصال به DB');
    
    // چک: قبلاً اجرا شده؟
    const alreadyApplied = await isMigrationApplied(client, sqlFileName);
    if (alreadyApplied) {
      console.log(`\n⚠️  این migration قبلاً اجرا شده: ${sqlFileName}`);
      console.log(`   اگه می‌خوای دوباره اجرا کنی، اول از _prisma_migrations پاکش کن.`);
      process.exit(0);
    }
    
    // اجرا
    await applyMigration(client, sqlFileName, sqlContent);
    
    console.log(`\n🎉 migration با موفقیت اجرا شد!`);
    
  } catch (error) {
    console.error(`\n❌ خطا:`, error.message);
    if (error.position) {
      console.error(`   موقعیت: ${error.position}`);
    }
    if (error.hint) {
      console.error(`   راهنما: ${error.hint}`);
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