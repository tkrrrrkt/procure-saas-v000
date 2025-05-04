/*
  Warnings:

  - The primary key for the `emp_account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `registration_account_cd` on the `emp_account` table. All the data in the column will be lost.
  - You are about to drop the column `registration_date` on the `emp_account` table. All the data in the column will be lost.
  - You are about to drop the column `update_account_cd` on the `emp_account` table. All the data in the column will be lost.
  - You are about to drop the column `update_date` on the `emp_account` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenant_id,emp_account_cd]` on the table `emp_account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,email]` on the table `emp_account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `emp_account` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `emp_account_id` on the `emp_account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tenant_id` on the `emp_account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "emp_account" DROP CONSTRAINT "emp_account_pkey",
DROP COLUMN "registration_account_cd",
DROP COLUMN "registration_date",
DROP COLUMN "update_account_cd",
DROP COLUMN "update_date",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by_id" UUID,
DROP COLUMN "emp_account_id",
ADD COLUMN     "emp_account_id" UUID NOT NULL,
DROP COLUMN "tenant_id",
ADD COLUMN     "tenant_id" UUID NOT NULL,
ADD CONSTRAINT "emp_account_pkey" PRIMARY KEY ("emp_account_id");

-- CreateTable
CREATE TABLE "org_history" (
    "org_history_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "org_history_cd" VARCHAR(20),
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "org_change_name" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" UUID,

    CONSTRAINT "org_history_pkey" PRIMARY KEY ("org_history_id")
);

-- CreateTable
CREATE TABLE "departments" (
    "department_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "department_cd" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "department_versions" (
    "department_version_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "org_history_id" UUID,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "department_name" VARCHAR(30) NOT NULL,
    "department_short_name" VARCHAR(15) NOT NULL,
    "department_kana_name" VARCHAR(30) NOT NULL,
    "department_level" INTEGER NOT NULL,
    "department_symbol" VARCHAR(3) NOT NULL,
    "parent_department_id" UUID,
    "budget_target_flg" VARCHAR(1) NOT NULL,
    "prefectures" VARCHAR(20),
    "municipality" VARCHAR(20),
    "place_name" VARCHAR(20),
    "bldg_name" VARCHAR(20),
    "phone" VARCHAR(20),
    "fax" VARCHAR(20),
    "version_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version_created_by_id" UUID,

    CONSTRAINT "department_versions_pkey" PRIMARY KEY ("department_version_id")
);

-- CreateTable
CREATE TABLE "employee_departments" (
    "employee_department_id" UUID NOT NULL,
    "emp_account_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "valid_flg" VARCHAR(1) NOT NULL,
    "assignment_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignment_created_by_id" UUID,

    CONSTRAINT "employee_departments_pkey" PRIMARY KEY ("employee_department_id")
);

-- CreateIndex
CREATE INDEX "org_history_tenant_id_idx" ON "org_history"("tenant_id");

-- CreateIndex
CREATE INDEX "org_history_tenant_id_valid_from_idx" ON "org_history"("tenant_id", "valid_from");

-- CreateIndex
CREATE INDEX "org_history_tenant_id_valid_to_idx" ON "org_history"("tenant_id", "valid_to");

-- CreateIndex
CREATE UNIQUE INDEX "org_history_tenant_cd_unique" ON "org_history"("tenant_id", "org_history_cd");

-- CreateIndex
CREATE INDEX "departments_tenant_id_idx" ON "departments"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_tenant_cd_unique" ON "departments"("tenant_id", "department_cd");

-- CreateIndex
CREATE INDEX "department_versions_department_id_idx" ON "department_versions"("department_id");

-- CreateIndex
CREATE INDEX "department_versions_tenant_id_idx" ON "department_versions"("tenant_id");

-- CreateIndex
CREATE INDEX "department_versions_org_history_id_idx" ON "department_versions"("org_history_id");

-- CreateIndex
CREATE INDEX "department_versions_parent_department_id_idx" ON "department_versions"("parent_department_id");

-- CreateIndex
CREATE INDEX "department_versions_department_id_valid_from_idx" ON "department_versions"("department_id", "valid_from");

-- CreateIndex
CREATE INDEX "department_versions_department_id_valid_to_idx" ON "department_versions"("department_id", "valid_to");

-- CreateIndex
CREATE INDEX "employee_departments_emp_account_id_idx" ON "employee_departments"("emp_account_id");

-- CreateIndex
CREATE INDEX "employee_departments_department_id_idx" ON "employee_departments"("department_id");

-- CreateIndex
CREATE INDEX "employee_departments_tenant_id_idx" ON "employee_departments"("tenant_id");

-- CreateIndex
CREATE INDEX "employee_departments_emp_account_id_valid_from_idx" ON "employee_departments"("emp_account_id", "valid_from");

-- CreateIndex
CREATE INDEX "employee_departments_emp_account_id_valid_to_idx" ON "employee_departments"("emp_account_id", "valid_to");

-- CreateIndex
CREATE INDEX "employee_departments_department_id_valid_from_idx" ON "employee_departments"("department_id", "valid_from");

-- CreateIndex
CREATE INDEX "employee_departments_department_id_valid_to_idx" ON "employee_departments"("department_id", "valid_to");

-- CreateIndex
CREATE INDEX "emp_account_tenant_id_idx" ON "emp_account"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "emp_account_tenant_cd_unique" ON "emp_account"("tenant_id", "emp_account_cd");

-- CreateIndex
CREATE UNIQUE INDEX "emp_account_tenant_email_unique" ON "emp_account"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "emp_account" ADD CONSTRAINT "emp_account_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "emp_account"("emp_account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emp_account" ADD CONSTRAINT "emp_account_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "emp_account"("emp_account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_history" ADD CONSTRAINT "org_history_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "emp_account"("emp_account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_history" ADD CONSTRAINT "org_history_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "emp_account"("emp_account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "emp_account"("emp_account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_versions" ADD CONSTRAINT "department_versions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_versions" ADD CONSTRAINT "department_versions_org_history_id_fkey" FOREIGN KEY ("org_history_id") REFERENCES "org_history"("org_history_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_versions" ADD CONSTRAINT "department_versions_parent_department_id_fkey" FOREIGN KEY ("parent_department_id") REFERENCES "departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_versions" ADD CONSTRAINT "department_versions_version_created_by_id_fkey" FOREIGN KEY ("version_created_by_id") REFERENCES "emp_account"("emp_account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_departments" ADD CONSTRAINT "employee_departments_emp_account_id_fkey" FOREIGN KEY ("emp_account_id") REFERENCES "emp_account"("emp_account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_departments" ADD CONSTRAINT "employee_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_departments" ADD CONSTRAINT "employee_departments_assignment_created_by_id_fkey" FOREIGN KEY ("assignment_created_by_id") REFERENCES "emp_account"("emp_account_id") ON DELETE SET NULL ON UPDATE CASCADE;
