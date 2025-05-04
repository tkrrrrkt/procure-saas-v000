/*
  Warnings:

  - You are about to drop the column `settings` on the `organizations` table. All the data in the column will be lost.
  - Added the required column `currency` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timezone` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "settings",
ADD COLUMN     "currency" VARCHAR(10) NOT NULL,
ADD COLUMN     "language" VARCHAR(10) NOT NULL,
ADD COLUMN     "timezone" VARCHAR(50) NOT NULL;
