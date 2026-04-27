const { Client } = require('pg');
require('dotenv').config();

async function resetDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'reki_db',
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    console.log('🗑️  Dropping all tables...');
    
    // Drop all tables
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    for (const row of tables.rows) {
      await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
      console.log(`   ✓ Dropped table: ${row.tablename}`);
    }

    console.log('\n🗑️  Dropping all ENUM types...');
    
    // Drop all custom types
    const types = await client.query(`
      SELECT typname FROM pg_type 
      WHERE typtype = 'e' AND typnamespace = (
        SELECT oid FROM pg_namespace WHERE nspname = 'public'
      )
    `);
    
    for (const row of types.rows) {
      await client.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
      console.log(`   ✓ Dropped type: ${row.typname}`);
    }

    console.log('\n✅ Database reset complete!');
    console.log('\n📋 Database is now empty and ready for fresh schema.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();
