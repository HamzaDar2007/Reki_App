const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
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

    console.log('📊 Checking existing tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️  No tables found. Database is empty.\n');
      console.log('✨ Solution: Start the NestJS server to auto-create tables.');
      console.log('   Run: npm run start:dev\n');
      console.log('   TypeORM will automatically create all tables (synchronize: true in dev mode)');
    } else {
      console.log(`✅ Found ${result.rows.length} tables:\n`);
      result.rows.forEach(row => console.log(`   - ${row.table_name}`));
      
      // Check if users table exists
      const hasUsers = result.rows.some(r => r.table_name === 'users');
      if (hasUsers) {
        console.log('\n✅ Base schema exists. You can run migrations now:');
        console.log('   npm run migration:run');
      } else {
        console.log('\n⚠️  Base tables missing. Start server first:');
        console.log('   npm run start:dev');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
