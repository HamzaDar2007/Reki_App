# Database Setup Guide

## Problem
Migration failing because base tables don't exist yet.

## Solution

### Step 1: Start the server (creates base schema automatically)
```bash
npm run start:dev
```

Wait 10-15 seconds for TypeORM to create all tables.
You'll see logs like:
```
query: CREATE TABLE "users" ...
query: CREATE TABLE "venues" ...
query: CREATE TABLE "offers" ...
```

### Step 2: Stop the server
Press `Ctrl+C`

### Step 3: Verify tables were created
```bash
node setup-database.js
```

You should see ~17 tables listed.

### Step 4: Run seed data (optional)
```bash
# In a separate terminal, start server
npm run start:dev

# In another terminal, run seed
curl http://localhost:3000/seed
```

This will create:
- 15 Manchester venues
- 15 offers
- 5 demo users
- 3 business accounts

### Step 5: Test the API
```bash
# Get all venues
curl http://localhost:3000/venues

# Login as user
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"password123"}'
```

## Why This Happens

TypeORM has 2 modes:
1. **Development (synchronize: true)** - Auto-creates tables from entities
2. **Production (migrations)** - Uses migration files

Your database was empty, so migration tried to add columns to non-existent tables.

Starting the server first lets TypeORM create the base schema, then migrations can add Week 8-10 features.

## Alternative: Drop and Recreate Database

If you want a completely fresh start:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Drop and recreate
DROP DATABASE reki_db;
CREATE DATABASE reki_db;
\q
```

Then run `npm run start:dev` to create everything fresh.
