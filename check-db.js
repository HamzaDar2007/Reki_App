const { Client } = require('pg');
const c = new Client({host:'localhost',port:5432,user:'postgres',password:'postgres',database:'reki_db'});

c.connect().then(async () => {
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('Tables:', r.rows.map(r => r.table_name).join(', '));
  
  try {
    const d = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='devices' ORDER BY ordinal_position");
    console.log('\ndevices columns:', d.rows.map(r => r.column_name + ':' + r.data_type).join(', '));
  } catch(e) { console.log('No devices table:', e.message); }
  
  try {
    const np = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='notification_preferences' ORDER BY ordinal_position");
    console.log('\nnotification_preferences columns:', np.rows.map(r => r.column_name + ':' + r.data_type).join(', '));
  } catch(e) { console.log('No notification_preferences table:', e.message); }

  // Check busyness lastUpdated
  try {
    const b = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='busyness'");
    console.log('\nbusyness columns:', b.rows.map(r => r.column_name).join(', '));
  } catch(e) {}

  // Check venue updatedAt
  try {
    const v = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='venues'");
    console.log('\nvenues columns:', v.rows.map(r => r.column_name).join(', '));
  } catch(e) {}

  await c.end();
}).catch(e => console.log('DB error:', e.message));
