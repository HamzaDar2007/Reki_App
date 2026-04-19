import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776535397596 implements MigrationInterface {
    name = 'Migration1776535397596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."sync_actions_type_enum" AS ENUM('BUSYNESS_UPDATE', 'VIBE_UPDATE', 'OFFER_TOGGLE', 'NOTIFICATION_READ', 'VENUE_SAVE', 'VENUE_VIEW')`);
        await queryRunner.query(`CREATE TYPE "public"."sync_actions_status_enum" AS ENUM('success', 'conflict', 'rejected', 'pending')`);
        await queryRunner.query(`CREATE TABLE "sync_actions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientActionId" character varying NOT NULL, "deviceId" character varying NOT NULL, "userId" character varying NOT NULL, "type" "public"."sync_actions_type_enum" NOT NULL, "status" "public"."sync_actions_status_enum" NOT NULL DEFAULT 'pending', "data" jsonb, "venueId" character varying, "notificationId" character varying, "offerId" character varying, "offlineTimestamp" TIMESTAMP NOT NULL, "conflictMessage" character varying, "serverData" jsonb, "conflictOptions" text, "syncedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d4c95e8c30dea7300e90e00838" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_sync_status" ON "sync_actions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_sync_userId" ON "sync_actions" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_sync_deviceId" ON "sync_actions" ("deviceId") `);
        await queryRunner.query(`CREATE TABLE "geofence_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "venueId" character varying NOT NULL, "distance" numeric(10,2) NOT NULL, "offerId" character varying, "notifiedAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c3f90bf10b9c26484e756594373" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_geofence_user_notified" ON "geofence_logs" ("userId", "notifiedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_geofence_user_venue" ON "geofence_logs" ("userId", "venueId") `);
        await queryRunner.query(`CREATE TABLE "area_analytics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "areaName" character varying NOT NULL, "city" character varying NOT NULL DEFAULT 'Manchester', "activeVenues" integer NOT NULL DEFAULT '0', "totalUsers" integer NOT NULL DEFAULT '0', "avgBusyness" integer NOT NULL DEFAULT '0', "date" character varying NOT NULL, "hour" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c51e592830d0c6227f53a308509" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_area_city_date" ON "area_analytics" ("city", "date") `);
        await queryRunner.query(`CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "vibeAlerts" boolean NOT NULL DEFAULT true, "livePerformance" boolean NOT NULL DEFAULT true, "socialCheckins" boolean NOT NULL DEFAULT true, "offerAlerts" boolean NOT NULL DEFAULT true, "weeklyRecap" boolean NOT NULL DEFAULT true, "proximityAlerts" boolean NOT NULL DEFAULT true, "quietHoursStart" character varying, "quietHoursEnd" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b70c44e8b00757584a393225593" UNIQUE ("userId"), CONSTRAINT "REL_b70c44e8b00757584a39322559" UNIQUE ("userId"), CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."devices_platform_enum" AS ENUM('ios', 'android', 'web')`);
        await queryRunner.query(`CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "fcmToken" character varying NOT NULL, "platform" "public"."devices_platform_enum" NOT NULL DEFAULT 'ios', "deviceId" character varying NOT NULL, "appVersion" character varying, "isActive" boolean NOT NULL DEFAULT true, "lastActiveAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_device_fcmToken" ON "devices" ("fcmToken") `);
        await queryRunner.query(`CREATE INDEX "IDX_device_userId" ON "devices" ("userId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "currentLat" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "currentLng" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "locationUpdatedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "locationEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "backgroundLocationEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "appState" jsonb`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('vibe_alert', 'live_performance', 'social_checkin', 'offer_confirmation', 'welcome', 'weekly_recap', 'ticket_secured', 'proximity_offer')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_venue_lat_lng" ON "venues" ("lat", "lng") `);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b70c44e8b00757584a393225593" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_e8a5d59f0ac3040395f159507c6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_e8a5d59f0ac3040395f159507c6"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_b70c44e8b00757584a393225593"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_venue_lat_lng"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('vibe_alert', 'live_performance', 'social_checkin', 'offer_confirmation', 'welcome', 'weekly_recap', 'ticket_secured')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "appState"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "backgroundLocationEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationUpdatedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "currentLng"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "currentLat"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_device_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_device_fcmToken"`);
        await queryRunner.query(`DROP TABLE "devices"`);
        await queryRunner.query(`DROP TYPE "public"."devices_platform_enum"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_area_city_date"`);
        await queryRunner.query(`DROP TABLE "area_analytics"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_geofence_user_venue"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_geofence_user_notified"`);
        await queryRunner.query(`DROP TABLE "geofence_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sync_deviceId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sync_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sync_status"`);
        await queryRunner.query(`DROP TABLE "sync_actions"`);
        await queryRunner.query(`DROP TYPE "public"."sync_actions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sync_actions_type_enum"`);
    }

}
