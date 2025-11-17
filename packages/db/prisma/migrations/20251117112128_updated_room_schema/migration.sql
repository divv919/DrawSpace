/*
  Warnings:

  - You are about to drop the column `invite_link` on the `Room` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Room_invite_link_key";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "invite_link";
