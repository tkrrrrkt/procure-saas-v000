-- CreateTable
CREATE TABLE "test_users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_orders" (
    "id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomaly_logs" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "user_id" UUID,
    "details" JSONB NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "notes" TEXT,

    CONSTRAINT "anomaly_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "test_users_email_key" ON "test_users"("email");

-- CreateIndex
CREATE INDEX "test_users_role_idx" ON "test_users"("role");

-- CreateIndex
CREATE INDEX "test_users_is_active_idx" ON "test_users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "test_orders_order_number_key" ON "test_orders"("order_number");

-- CreateIndex
CREATE INDEX "test_orders_user_id_idx" ON "test_orders"("user_id");

-- CreateIndex
CREATE INDEX "test_orders_status_idx" ON "test_orders"("status");

-- CreateIndex
CREATE INDEX "test_orders_created_at_idx" ON "test_orders"("created_at");

-- CreateIndex
CREATE INDEX "anomaly_logs_type_idx" ON "anomaly_logs"("type");

-- CreateIndex
CREATE INDEX "anomaly_logs_severity_idx" ON "anomaly_logs"("severity");

-- CreateIndex
CREATE INDEX "anomaly_logs_user_id_idx" ON "anomaly_logs"("user_id");

-- CreateIndex
CREATE INDEX "anomaly_logs_detected_at_idx" ON "anomaly_logs"("detected_at");

-- CreateIndex
CREATE INDEX "anomaly_logs_is_resolved_idx" ON "anomaly_logs"("is_resolved");

-- AddForeignKey
ALTER TABLE "test_orders" ADD CONSTRAINT "test_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "test_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
