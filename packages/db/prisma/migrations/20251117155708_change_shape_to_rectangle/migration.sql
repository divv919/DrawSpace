/*
  Warnings:

  - The values [square] on the enum `Shape` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Shape_new" AS ENUM ('ellipse', 'rectangle', 'pencil', 'line', 'arrow', 'text');
ALTER TABLE "Content" ALTER COLUMN "type" TYPE "Shape_new" USING ("type"::text::"Shape_new");
ALTER TYPE "Shape" RENAME TO "Shape_old";
ALTER TYPE "Shape_new" RENAME TO "Shape";
DROP TYPE "Shape_old";
COMMIT;
