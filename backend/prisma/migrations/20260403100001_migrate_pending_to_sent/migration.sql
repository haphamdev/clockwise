-- Migrate existing 'pending' invitations to 'sent'
UPDATE "invitation" SET "status" = 'sent' WHERE "status" = 'pending';

-- Change default from 'pending' to 'initiated'
ALTER TABLE "invitation" ALTER COLUMN "status" SET DEFAULT 'initiated';
