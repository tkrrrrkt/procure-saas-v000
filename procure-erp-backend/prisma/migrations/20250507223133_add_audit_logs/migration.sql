-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" VARCHAR(100),
    "user_role" VARCHAR(50) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" VARCHAR(100),
    "ip_address" VARCHAR(50) NOT NULL,
    "user_agent" VARCHAR(255),
    "request_params" JSONB,
    "request_query" JSONB,
    "request_body" JSONB,
    "response_status" INTEGER NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "log_type" VARCHAR(50) NOT NULL,
    "execution_time" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_privileged" BOOLEAN NOT NULL DEFAULT false,
    "privilege_details" VARCHAR(255),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_log_type_idx" ON "audit_logs"("log_type");

-- CreateIndex
CREATE INDEX "audit_logs_is_privileged_idx" ON "audit_logs"("is_privileged");
