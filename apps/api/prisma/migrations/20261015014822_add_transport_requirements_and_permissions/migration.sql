-- AlterTable
ALTER TABLE "material_publications" ADD COLUMN     "requires_transport" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "transport_material_categories" (
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "transport_material_categories_pkey" PRIMARY KEY ("user_id","category_id")
);

-- CreateIndex
CREATE INDEX "transport_material_categories_category_id_idx" ON "transport_material_categories"("category_id");

-- AddForeignKey
ALTER TABLE "transport_material_categories" ADD CONSTRAINT "transport_material_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_material_categories" ADD CONSTRAINT "transport_material_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "material_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
