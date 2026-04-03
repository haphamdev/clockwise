-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE IF NOT EXISTS 'initiated';
ALTER TYPE "InvitationStatus" ADD VALUE IF NOT EXISTS 'sending';
ALTER TYPE "InvitationStatus" ADD VALUE IF NOT EXISTS 'sent';
