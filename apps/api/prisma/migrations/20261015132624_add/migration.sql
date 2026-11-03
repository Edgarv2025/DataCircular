-- CreateTable
CREATE TABLE "organization_material_categories" (
    "organization_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_material_categories_pkey" PRIMARY KEY ("organization_id","category_id")
);

-- CreateIndex
CREATE INDEX "organization_material_categories_category_id_idx" ON "organization_material_categories"("category_id");

-- AddForeignKey
ALTER TABLE "organization_material_categories" ADD CONSTRAINT "organization_material_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_material_categories" ADD CONSTRAINT "organization_material_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "material_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
