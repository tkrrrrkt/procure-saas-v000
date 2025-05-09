-- AlterTable
ALTER TABLE "test_users" ADD COLUMN     "mfa_backup_codes" JSONB,
ADD COLUMN     "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfa_last_used" TIMESTAMP(3),
ADD COLUMN     "mfa_secret" VARCHAR(255);
