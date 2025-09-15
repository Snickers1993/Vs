-- AlterTable
ALTER TABLE "public"."Section" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Section" ADD COLUMN "isStarred" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Section_isPublic_idx" ON "public"."Section"("isPublic");

-- CreateIndex
CREATE INDEX "Section_isStarred_idx" ON "public"."Section"("isStarred");
