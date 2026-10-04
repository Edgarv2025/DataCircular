-- DATA_CIRCULAR - Fase 7: Organizaciones, Membresías, Roles y Permisos
-- Creación de Enums y Tablas con Integridad Referencial

-- 1. Enums
CREATE TYPE "OrganizationType" AS ENUM ('COMPANY', 'ASSOCIATION', 'FOUNDATION', 'COOPERATIVE', 'INSTITUTION');
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'INACTIVE');

-- 2. Tabla organizations
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "legal_name" VARCHAR(200),
    "tax_id" VARCHAR(50),
    "org_type" "OrganizationType" NOT NULL DEFAULT 'COMPANY',
    "activity_type" "UserType" NOT NULL DEFAULT 'GENERATOR',
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "address" VARCHAR(255),
    "locality" VARCHAR(100),
    "city" VARCHAR(100) NOT NULL DEFAULT 'Bogotá D.C.',
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verified_at" TIMESTAMPTZ(6),
    "verification_notes" TEXT,
    "certificate_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_tax_id_key" ON "organizations"("tax_id");
CREATE INDEX "organizations_status_deleted_at_idx" ON "organizations"("status", "deleted_at");
CREATE INDEX "organizations_org_type_idx" ON "organizations"("org_type");
CREATE INDEX "organizations_locality_idx" ON "organizations"("locality");

-- 3. Tabla roles
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_organization_id_name_key" ON "roles"("organization_id", "name");

ALTER TABLE "roles"
ADD CONSTRAINT "roles_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Tabla permissions
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "module" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- 5. Tabla role_permissions
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

ALTER TABLE "role_permissions"
ADD CONSTRAINT "role_permissions_role_id_fkey"
FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions"
ADD CONSTRAINT "role_permissions_permission_id_fkey"
FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Tabla organization_members
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "invited_by_id" UUID,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members"("organization_id");

ALTER TABLE "organization_members"
ADD CONSTRAINT "organization_members_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_members"
ADD CONSTRAINT "organization_members_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_members"
ADD CONSTRAINT "organization_members_invited_by_id_fkey"
FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "organization_members"
ADD CONSTRAINT "organization_members_role_id_fkey"
FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
