/*
  Warnings:

  - You are about to drop the column `last_login` on the `emp_account` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `emp_account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "emp_account" DROP COLUMN "last_login",
DROP COLUMN "password_hash";

-- CreateTable
CREATE TABLE "login_accounts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "emp_account_id" UUID,
    "role" VARCHAR(20) NOT NULL,
    "status" VARCHAR(10) NOT NULL,
    "last_login" TIMESTAMP(3),
    "login_failure_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" VARCHAR(255),
    "mfa_backup_codes" JSONB,
    "mfa_last_used" TIMESTAMP(3),

    CONSTRAINT "login_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_accounts_emp_account_id_key" ON "login_accounts"("emp_account_id");

-- CreateIndex
CREATE INDEX "login_accounts_tenant_id_idx" ON "login_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "login_accounts_username_idx" ON "login_accounts"("username");

-- CreateIndex
CREATE INDEX "login_accounts_emp_account_id_idx" ON "login_accounts"("emp_account_id");

-- CreateIndex
CREATE INDEX "login_accounts_status_idx" ON "login_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "login_accounts_tenant_id_username_key" ON "login_accounts"("tenant_id", "username");

-- AddForeignKey
ALTER TABLE "login_accounts" ADD CONSTRAINT "login_accounts_emp_account_id_fkey" FOREIGN KEY ("emp_account_id") REFERENCES "emp_account"("emp_account_id") ON DELETE SET NULL ON UPDATE CASCADE;
