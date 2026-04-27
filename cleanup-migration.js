const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function cleanupMigration() {
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
    console.log('✅ Connected');

    console.log('🧹 Running cleanup script...');
    
    const sqlPath = path.join(__dirname, 'cleanup-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Cleanup completed successfully');
    console.log('');
    console.log('Now run: npm run migration:run');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanupMigration();
