-- Cleanup script for partial migration state
-- Run this to reset the database to a clean state before running migrations

-- Drop tables created by the failed migration (in reverse order of dependencies)
DROP TABLE IF EXISTS "devices" CASCADE;
DROP TABLE IF EXISTS "notification_preferences" CASCADE;
DROP TABLE IF EXISTS "area_analytics" CASCADE;
DROP TABLE IF EXISTS "geofence_logs" CASCADE;
DROP TABLE IF EXISTS "sync_actions" CASCADE;

-- Drop indexes that might exist
DROP INDEX IF EXISTS "IDX_device_userId";
DROP INDEX IF EXISTS "IDX_device_fcmToken";
DROP INDEX IF EXISTS "IDX_area_city_date";
DROP INDEX IF EXISTS "IDX_geofence_user_venue";
DROP INDEX IF EXISTS "IDX_geofence_user_notified";
DROP INDEX IF EXISTS "IDX_sync_deviceId";
DROP INDEX IF EXISTS "IDX_sync_userId";
DROP INDEX IF EXISTS "IDX_sync_status";
DROP INDEX IF EXISTS "IDX_venue_lat_lng";

-- Drop ENUM types
DROP TYPE IF EXISTS "sync_actions_type_enum" CASCADE;
DROP TYPE IF EXISTS "sync_actions_status_enum" CASCADE;
DROP TYPE IF EXISTS "devices_platform_enum" CASCADE;

-- Remove columns added to users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "currentLat";
ALTER TABLE "users" DROP COLUMN IF EXISTS "currentLng";
ALTER TABLE "users" DROP COLUMN IF EXISTS "locationUpdatedAt";
ALTER TABLE "users" DROP COLUMN IF EXISTS "locationEnabled";
ALTER TABLE "users" DROP COLUMN IF EXISTS "backgroundLocationEnabled";
ALTER TABLE "users" DROP COLUMN IF EXISTS "appState";

-- Note: We're NOT reverting the notifications_type_enum change
-- because that might break existing data

SELECT 'Cleanup completed. You can now run: npm run migration:run' as status;
