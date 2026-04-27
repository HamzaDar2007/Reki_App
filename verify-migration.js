const { Client } = require('pg');
require('dotenv').config();

async function verifyMigration() {
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

    // Check new tables
    console.log('📋 Checking new tables...');
    const tables = ['sync_actions', 'geofence_logs', 'area_analytics', 'notification_preferences', 'devices'];
    
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    // Check new columns in users table
    console.log('\n📋 Checking new columns in users table...');
    const columns = ['currentLat', 'currentLng', 'locationUpdatedAt', 'locationEnabled', 'backgroundLocationEnabled', 'appState'];
    
    for (const column of columns) {
      const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = $1)`,
        [column]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} users.${column}`);
    }

    // Check ENUM types
    console.log('\n📋 Checking ENUM types...');
    const enums = ['sync_actions_type_enum', 'sync_actions_status_enum', 'devices_platform_enum'];
    
    for (const enumType of enums) {
      const result = await client.query(
        `SELECT EXISTS (SELECT FROM pg_type WHERE typname = $1)`,
        [enumType]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${enumType}`);
    }

    // Check indexes
    console.log('\n📋 Checking indexes...');
    const indexes = [
      'IDX_sync_status',
      'IDX_sync_userId', 
      'IDX_sync_deviceId',
      'IDX_geofence_user_notified',
      'IDX_geofence_user_venue',
      'IDX_area_city_date',
      'IDX_device_fcmToken',
      'IDX_device_userId',
      'IDX_venue_lat_lng'
    ];
    
    for (const index of indexes) {
      const result = await client.query(
        `SELECT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = $1)`,
        [index]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${index}`);
    }

    // Check migration record
    console.log('\n📋 Checking migration record...');
    const migrationResult = await client.query(
      `SELECT * FROM migrations WHERE name = 'Migration1776535397596'`
    );
    if (migrationResult.rows.length > 0) {
      console.log('  ✅ Migration1776535397596 recorded');
      console.log(`     Timestamp: ${migrationResult.rows[0].timestamp}`);
    } else {
      console.log('  ❌ Migration record not found');
    }

    console.log('\n✅ Migration verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyMigration();
