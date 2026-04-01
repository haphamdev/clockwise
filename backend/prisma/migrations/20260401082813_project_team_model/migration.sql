-- DropForeignKey
ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "project_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "project_member" DROP CONSTRAINT IF EXISTS "project_member_project_id_fkey";
ALTER TABLE "project_member" DROP CONSTRAINT IF EXISTS "project_member_user_id_fkey";

-- AlterTable
ALTER TABLE "project" DROP COLUMN "owner_id";

-- DropTable
DROP TABLE "project_member";

-- CreateTable
CREATE TABLE "project_team" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_team_project_id_team_id_key" ON "project_team"("project_id", "team_id");

-- AddForeignKey
ALTER TABLE "project_team" ADD CONSTRAINT "project_team_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team" ADD CONSTRAINT "project_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex (partial unique: only active projects must have unique names per org)
CREATE UNIQUE INDEX "project_org_name_active_unique" ON "project" ("org_id", "name") WHERE status = 'active';
