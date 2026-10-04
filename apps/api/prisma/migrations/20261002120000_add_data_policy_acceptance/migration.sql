CREATE TYPE "DataPolicyAcceptanceStatus" AS ENUM ('ACCEPTED', 'WITHDRAWN');

CREATE TABLE "data_policy_acceptances" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policy_version" VARCHAR(100) NOT NULL,
    "policy_url" TEXT,
    "status" "DataPolicyAcceptanceStatus" NOT NULL DEFAULT 'ACCEPTED',

    CONSTRAINT "data_policy_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "data_policy_acceptances_user_id_key" ON "data_policy_acceptances"("user_id");

ALTER TABLE "data_policy_acceptances"
ADD CONSTRAINT "data_policy_acceptances_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
