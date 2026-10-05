-- DATA_CIRCULAR - Fase 8: Catálogo de Materiales y Publicaciones (Ofertas y Necesidades)
-- Creación de Enums y Tablas con Integridad Referencial

-- 1. Enums
CREATE TYPE "PublicationType" AS ENUM ('OFFER', 'NEED');
CREATE TYPE "PublicationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED', 'EXPIRED');

-- 2. Tabla material_categories (Soporte Jerárquico: Categorías y Subcategorías)
CREATE TABLE "material_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "parent_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "material_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "material_categories_parent_id_name_key" ON "material_categories"("parent_id", "name");
CREATE INDEX "material_categories_parent_id_idx" ON "material_categories"("parent_id");
CREATE INDEX "material_categories_active_idx" ON "material_categories"("active");

ALTER TABLE "material_categories"
ADD CONSTRAINT "material_categories_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "material_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Tabla units (Unidades de Medida)
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "abbreviation" VARCHAR(10) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "units_name_key" ON "units"("name");
CREATE UNIQUE INDEX "units_abbreviation_key" ON "units"("abbreviation");

-- 4. Tabla material_publications (Publicaciones de Oferta y Necesidad)
CREATE TABLE "material_publications" (
    "id" UUID NOT NULL,
    "type" "PublicationType" NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "organization_id" UUID,
    "category_id" UUID NOT NULL,
    "quantity" DECIMAL(12, 2) NOT NULL,
    "unit_id" UUID NOT NULL,
    "location_address" VARCHAR(255) NOT NULL,
    "location_city" VARCHAR(100) DEFAULT 'Bogotá D.C.',
    "location_area" VARCHAR(100),
    "condition" VARCHAR(100),
    "photo_url" TEXT,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "material_publications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "material_publications_type_idx" ON "material_publications"("type");
CREATE INDEX "material_publications_status_deleted_at_idx" ON "material_publications"("status", "deleted_at");
CREATE INDEX "material_publications_owner_user_id_idx" ON "material_publications"("owner_user_id");
CREATE INDEX "material_publications_organization_id_idx" ON "material_publications"("organization_id");
CREATE INDEX "material_publications_category_id_idx" ON "material_publications"("category_id");

ALTER TABLE "material_publications"
ADD CONSTRAINT "material_publications_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "material_publications"
ADD CONSTRAINT "material_publications_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "material_publications"
ADD CONSTRAINT "material_publications_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "material_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "material_publications"
ADD CONSTRAINT "material_publications_unit_id_fkey"
FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
