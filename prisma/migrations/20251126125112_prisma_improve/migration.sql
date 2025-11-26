/*
  Warnings:

  - You are about to drop the `_CourseToDegree` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DegreeToStudent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DegreeToTeacher` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[courseId,studentId]` on the table `CourseStudent` will be added. If there are existing duplicate values, this will fail.
  - Made the column `isDeleted` on table `Admin` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isDeleted` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isDeleted` on table `Teacher` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."_CourseToDegree" DROP CONSTRAINT "_CourseToDegree_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_CourseToDegree" DROP CONSTRAINT "_CourseToDegree_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_DegreeToStudent" DROP CONSTRAINT "_DegreeToStudent_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_DegreeToStudent" DROP CONSTRAINT "_DegreeToStudent_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_DegreeToTeacher" DROP CONSTRAINT "_DegreeToTeacher_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_DegreeToTeacher" DROP CONSTRAINT "_DegreeToTeacher_B_fkey";

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "isDeleted" SET NOT NULL;

-- AlterTable
ALTER TABLE "CourseStudent" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "isDeleted" SET NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "isDeleted" SET NOT NULL;

-- DropTable
DROP TABLE "public"."_CourseToDegree";

-- DropTable
DROP TABLE "public"."_DegreeToStudent";

-- DropTable
DROP TABLE "public"."_DegreeToTeacher";

-- CreateTable
CREATE TABLE "_TeacherDegrees" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TeacherDegrees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StudentDegrees" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StudentDegrees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DegreeCourses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DegreeCourses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TeacherDegrees_B_index" ON "_TeacherDegrees"("B");

-- CreateIndex
CREATE INDEX "_StudentDegrees_B_index" ON "_StudentDegrees"("B");

-- CreateIndex
CREATE INDEX "_DegreeCourses_B_index" ON "_DegreeCourses"("B");

-- CreateIndex
CREATE UNIQUE INDEX "CourseStudent_courseId_studentId_key" ON "CourseStudent"("courseId", "studentId");

-- AddForeignKey
ALTER TABLE "_TeacherDegrees" ADD CONSTRAINT "_TeacherDegrees_A_fkey" FOREIGN KEY ("A") REFERENCES "Degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherDegrees" ADD CONSTRAINT "_TeacherDegrees_B_fkey" FOREIGN KEY ("B") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentDegrees" ADD CONSTRAINT "_StudentDegrees_A_fkey" FOREIGN KEY ("A") REFERENCES "Degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentDegrees" ADD CONSTRAINT "_StudentDegrees_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DegreeCourses" ADD CONSTRAINT "_DegreeCourses_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DegreeCourses" ADD CONSTRAINT "_DegreeCourses_B_fkey" FOREIGN KEY ("B") REFERENCES "Degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
