// scripts/db/audit.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  });
  return env;
}

function parseSchema() {
  const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf8');
  const models = {};
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const fields = [];
    body.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('@@') || trimmed.startsWith('//')) return;
      const fieldMatch = trimmed.match(/^(\w+)\s+(\S+)/);
      if (fieldMatch) {
        fields.push({ name: fieldMatch[1], type: fieldMatch[2] });
      }
    });
    models[modelName] = fields;
  }
  return models;
}

async function getDbTables(client) {
  const result = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows.map(r => r.table_name);
}

async function getTableColumns(client, tableName) {
  const result = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return result.rows.map(r => r.column_name);
}

async function main() {
  console.log('🔍 شروع audit...\n');
  const env = loadEnv();
  
  if (!env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }
  
  const schema = parseSchema();
  console.log(`📋 ${Object.keys(schema).length} model در schema.prisma\n`);
  
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ اتصال به DB برقرار شد\n');
    
    const dbTables = await getDbTables(client);
    console.log(`📊 ${dbTables.length} جدول در DB\n`);
    
    const schemaTables = Object.keys(schema);
    const onlyInDb = dbTables.filter(t => !schemaTables.includes(t));
    const onlyInSchema = schemaTables.filter(t => !dbTables.includes(t));
    const common = schemaTables.filter(t => dbTables.includes(t));
    
    console.log('═══════════════════════════════');
    console.log(`✅ مشترک: ${common.length}`);
    console.log(`⚠️  فقط DB: ${onlyInDb.length}`);
    console.log(`⚠️  فقط schema: ${onlyInSchema.length}`);
    
    if (onlyInDb.length > 0) {
      console.log('\n❌ فقط در DB:');
      onlyInDb.forEach(t => console.log(`   - ${t}`));
    }
    
    if (onlyInSchema.length > 0) {
      console.log('\n❌ فقط در schema:');
      onlyInSchema.forEach(t => console.log(`   - ${t}`));
    }
    
    console.log('\n═══════════════════════════════');
    console.log('🔍 بررسی ستون‌ها:');
    console.log('═══════════════════════════════');
    
    let diffCount = 0;
    for (const tableName of common) {
      const dbCols = await getTableColumns(client, tableName);
      const schemaCols = schema[tableName].map(f => f.name);
      
      const missingInDb = schemaCols.filter(c => !dbCols.includes(c));
      const missingInSchema = dbCols.filter(c => !schemaCols.includes(c));
      
      if (missingInDb.length > 0 || missingInSchema.length > 0) {
        diffCount++;
        console.log(`\n⚠️  ${tableName}:`);
        if (missingInDb.length > 0) {
          console.log(`   فقط در schema: ${missingInDb.join(', ')}`);
        }
        if (missingInSchema.length > 0) {
          console.log(`   فقط در DB: ${missingInSchema.join(', ')}`);
        }
      }
    }
    
    if (diffCount === 0) {
      console.log('\n✅ همه‌چیز هماهنگه!');
    } else {
      console.log(`\n⚠️  ${diffCount} جدول اختلاف دارن`);
    }
    
  } catch (error) {
    console.error('\n❌ خطا:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});