/*
  Warnings:

  - Made the column `tgUsername` on table `Admin` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "tgUsername" SET NOT NULL;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "tgUsername" DROP NOT NULL;
