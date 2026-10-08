// scripts/db/audit-v2.js
// نسخه دقیق‌تر: relationها رو درست تشخیص می‌ده

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

// تشخیص: relation field یا ستون واقعی؟
function isScalarField(typeStr) {
  // اگه شامل [] یا relation نباشه، scalar هست
  if (typeStr.includes('[]')) return false;
  // اگه با حرف بزرگ شروع بشه و به مدل دیگه اشاره کنه، relation هست
  const primitiveTypes = ['String', 'Int', 'Boolean', 'Float', 'DateTime', 'Json', 'Decimal', 'BigInt', 'Bytes'];
  // type ممکنه String? یا String[] یا String باشه
  const baseType = typeStr.replace(/[?\[\]]/g, '');
  if (primitiveTypes.includes(baseType)) return true;
  // در غیر این صورت، relation هست
  return false;
}

function parseSchema() {
  const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf8');
  const models = {};
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const scalarFields = [];
    const relationFields = [];
    const attributes = [];
    
    body.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) return;
      
      if (trimmed.startsWith('@@')) {
        attributes.push(trimmed);
        return;
      }
      
      const fieldMatch = trimmed.match(/^(\w+)\s+(\S+)/);
      if (fieldMatch) {
        const [, fieldName, fieldType] = fieldMatch;
        if (isScalarField(fieldType)) {
          scalarFields.push({ name: fieldName, type: fieldType });
        } else {
          relationFields.push({ name: fieldName, type: fieldType });
        }
      }
    });
    
    models[modelName] = { scalarFields, relationFields, attributes };
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
  console.log('🔍 Audit دقیق v2\n');
  const env = loadEnv();
  
  const schema = parseSchema();
  console.log(`📋 ${Object.keys(schema).length} model در schema.prisma\n`);
  
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ اتصال به DB\n');
    
    const dbTables = await getDbTables(client);
    const schemaTables = Object.keys(schema);
    
    const onlyInDb = dbTables.filter(t => !schemaTables.includes(t));
    const onlyInSchema = schemaTables.filter(t => !dbTables.includes(t));
    const common = schemaTables.filter(t => dbTables.includes(t));
    
    console.log('═══════════════════════════════');
    console.log('📊 خلاصه جدول‌ها:');
    console.log(`   ✅ مشترک: ${common.length}`);
    console.log(`   ⚠️  فقط DB: ${onlyInDb.length}`);
    console.log(`   ⚠️  فقط schema: ${onlyInSchema.length}`);
    
    if (onlyInDb.length > 0) {
      console.log('\n   فقط در DB:', onlyInDb.join(', '));
    }
    if (onlyInSchema.length > 0) {
      console.log('\n   فقط در schema:', onlyInSchema.join(', '));
    }
    
    console.log('\n═══════════════════════════════');
    console.log('🔍 بررسی ستون‌ها (فقط scalar):');
    console.log('═══════════════════════════════');
    
    let totalDiff = 0;
    const report = [];
    
    for (const tableName of common.sort()) {
      const dbCols = await getTableColumns(client, tableName);
      const schemaScalars = schema[tableName].scalarFields.map(f => f.name);
      
      const missingInDb = schemaScalars.filter(c => !dbCols.includes(c));
      const missingInSchema = dbCols.filter(c => !schemaScalars.includes(c));
      
      if (missingInDb.length > 0 || missingInSchema.length > 0) {
        totalDiff++;
        console.log(`\n⚠️  ${tableName}:`);
        if (missingInDb.length > 0) {
          console.log(`   schema داری، DB نداره: ${missingInDb.join(', ')}`);
        }
        if (missingInSchema.length > 0) {
          console.log(`   DB داری، schema نداره: ${missingInSchema.join(', ')}`);
        }
        report.push({ table: tableName, missingInDb, missingInSchema });
      }
    }
    
    if (totalDiff === 0) {
      console.log('\n✅ همه‌ی ستون‌ها هماهنگ هستن!');
    } else {
      console.log(`\n📊 خلاصه: ${totalDiff} جدول اختلاف دارن`);
    }
    
    // ذخیره گزارش
    const reportPath = path.join(__dirname, '..', '..', 'audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        dbTables: dbTables.length,
        schemaTables: schemaTables.length,
        common: common.length,
        onlyInDb,
        onlyInSchema,
        totalDiff
      },
      differences: report
    }, null, 2));
    
    console.log(`\n📄 گزارش ذخیره شد: audit-report.json`);
    
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