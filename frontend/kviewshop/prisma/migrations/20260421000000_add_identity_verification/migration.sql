-- AlterTable
ALTER TABLE "users" ADD COLUMN "ci" VARCHAR(255),
ADD COLUMN "phone_verified_at" TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "users_ci_key" ON "users"("ci");
