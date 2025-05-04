-- CreateTable
CREATE TABLE "emp_account" (
    "emp_account_id" TEXT NOT NULL,
    "emp_account_cd" VARCHAR(20) NOT NULL,
    "emp_name" VARCHAR(15) NOT NULL,
    "emp_kana_name" VARCHAR(15) NOT NULL,
    "email" VARCHAR(50),
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "valid_flg" VARCHAR(1) NOT NULL,
    "last_login" TIMESTAMP(3),
    "registration_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "registration_account_cd" VARCHAR(20),
    "update_date" TIMESTAMP(3),
    "update_account_cd" VARCHAR(20),
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "emp_account_pkey" PRIMARY KEY ("emp_account_id")
);
