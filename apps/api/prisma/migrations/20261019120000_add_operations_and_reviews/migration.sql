-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('ACCEPTED', 'SCHEDULED', 'COLLECTING', 'EVIDENCE', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('WEIGHING_TICKET', 'PHOTO', 'SIGNATURE', 'DOCUMENT');

-- CreateTable
CREATE TABLE "operations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "proposal_id" UUID NOT NULL,
    "publication_id" UUID NOT NULL,
    "seller_user_id" UUID NOT NULL,
    "seller_organization_id" UUID,
    "buyer_user_id" UUID NOT NULL,
    "buyer_organization_id" UUID,
    "transporter_user_id" UUID,
    "transporter_organization_id" UUID,
    "material_category_id" UUID NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_id" UUID NOT NULL,
    "agreed_price_cop" DECIMAL(12,2),
    "status" "OperationStatus" NOT NULL DEFAULT 'ACCEPTED',
    "scheduled_date" TIMESTAMPTZ(6),
    "scheduled_time_slot" VARCHAR(50),
    "pickup_address" VARCHAR(255),
    "pickup_city" VARCHAR(100) DEFAULT 'Bogotá D.C.',
    "pickup_area" VARCHAR(100),
    "delivery_address" VARCHAR(255),
    "delivery_city" VARCHAR(100) DEFAULT 'Bogotá D.C.',
    "delivery_area" VARCHAR(100),
    "transport_notes" TEXT,
    "vehicle_plate" VARCHAR(20),
    "driver_name" VARCHAR(100),
    "actual_weight" DECIMAL(12,2),
    "received_notes" TEXT,
    "closed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_evidences" (
    "id" UUID NOT NULL,
    "operation_id" UUID NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "description" TEXT,
    "weight_kg" DECIMAL(12,2),
    "uploaded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_reviews" (
    "id" UUID NOT NULL,
    "operation_id" UUID NOT NULL,
    "reviewer_user_id" UUID NOT NULL,
    "target_user_id" UUID NOT NULL,
    "score" SMALLINT NOT NULL,
    "punctuality_score" SMALLINT,
    "material_quality_score" SMALLINT,
    "fulfillment_score" SMALLINT,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operations_code_key" ON "operations"("code");
CREATE UNIQUE INDEX "operations_proposal_id_key" ON "operations"("proposal_id");
CREATE INDEX "operations_status_idx" ON "operations"("status");
CREATE INDEX "operations_seller_user_id_idx" ON "operations"("seller_user_id");
CREATE INDEX "operations_buyer_user_id_idx" ON "operations"("buyer_user_id");
CREATE INDEX "operations_transporter_user_id_idx" ON "operations"("transporter_user_id");
CREATE INDEX "operations_pickup_area_idx" ON "operations"("pickup_area");
CREATE INDEX "operations_created_at_idx" ON "operations"("created_at");

-- CreateIndex
CREATE INDEX "operation_evidences_operation_id_idx" ON "operation_evidences"("operation_id");

-- CreateIndex
CREATE UNIQUE INDEX "operation_reviews_operation_id_reviewer_user_id_key" ON "operation_reviews"("operation_id", "reviewer_user_id");
CREATE INDEX "operation_reviews_operation_id_idx" ON "operation_reviews"("operation_id");
CREATE INDEX "operation_reviews_target_user_id_idx" ON "operation_reviews"("target_user_id");

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations" ADD CONSTRAINT "operations_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "material_publications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations" ADD CONSTRAINT "operations_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations" ADD CONSTRAINT "operations_seller_organization_id_fkey" FOREIGN KEY ("seller_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "operations" ADD CONSTRAINT "operations_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations" ADD CONSTRAINT "operations_buyer_organization_id_fkey" FOREIGN KEY ("buyer_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "operations" ADD CONSTRAINT "operations_transporter_user_id_fkey" FOREIGN KEY ("transporter_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "operations" ADD CONSTRAINT "operations_material_category_id_fkey" FOREIGN KEY ("material_category_id") REFERENCES "material_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations" ADD CONSTRAINT "operations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_evidences" ADD CONSTRAINT "operation_evidences_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_evidences" ADD CONSTRAINT "operation_evidences_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_reviews" ADD CONSTRAINT "operation_reviews_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_reviews" ADD CONSTRAINT "operation_reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_reviews" ADD CONSTRAINT "operation_reviews_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
