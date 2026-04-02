-- CreateEnum
CREATE TYPE "TimeLogStatus" AS ENUM ('active', 'archived');

-- AlterTable: Add status column to time_log (default active)
ALTER TABLE "time_log" ADD COLUMN "status" "TimeLogStatus" NOT NULL DEFAULT 'active';

-- Migrate existing data: soft-deleted logs become archived
UPDATE "time_log" SET "status" = 'archived' WHERE "is_deleted" = true;

-- CreateTable: time_log_task join table
CREATE TABLE "time_log_task" (
    "id" TEXT NOT NULL,
    "time_log_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_log_task_pkey" PRIMARY KEY ("id")
);

-- Migrate existing task relationships into join table
INSERT INTO "time_log_task" ("id", "time_log_id", "task_id", "created_at")
SELECT gen_random_uuid(), "id", "task_id", "created_at" FROM "time_log" WHERE "task_id" IS NOT NULL;

-- DropIndex: old indexes that reference is_deleted and task_id
DROP INDEX IF EXISTS "time_log_user_id_date_is_deleted_idx";
DROP INDEX IF EXISTS "time_log_project_id_date_is_deleted_idx";
DROP INDEX IF EXISTS "time_log_task_id_idx";

-- DropForeignKey: task_id FK from time_log
ALTER TABLE "time_log" DROP CONSTRAINT IF EXISTS "time_log_task_id_fkey";

-- AlterTable: Drop old columns from time_log
ALTER TABLE "time_log" DROP COLUMN "is_deleted";
ALTER TABLE "time_log" DROP COLUMN "task_id";

-- CreateIndex: new indexes on time_log using status
CREATE INDEX "time_log_user_id_date_status_idx" ON "time_log"("user_id", "date", "status");
CREATE INDEX "time_log_project_id_date_status_idx" ON "time_log"("project_id", "date", "status");

-- CreateIndex: time_log_task unique constraint and indexes
CREATE UNIQUE INDEX "time_log_task_time_log_id_task_id_key" ON "time_log_task"("time_log_id", "task_id");

-- AddForeignKey: time_log_task relations
ALTER TABLE "time_log_task" ADD CONSTRAINT "time_log_task_time_log_id_fkey" FOREIGN KEY ("time_log_id") REFERENCES "time_log"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_log_task" ADD CONSTRAINT "time_log_task_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Add description to task
ALTER TABLE "task" ADD COLUMN "description" TEXT;

-- AlterTable: Add reason to audit_log
ALTER TABLE "audit_log" ADD COLUMN "reason" TEXT;

-- AlterTable: Add settings to project
ALTER TABLE "project" ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}';
