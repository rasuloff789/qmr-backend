-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "CourseStudent" ADD COLUMN     "lastBilledDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "courseStudentId" INTEGER NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" INTEGER NOT NULL,
    "daysInPeriod" INTEGER NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceChangeHistory" (
    "id" SERIAL NOT NULL,
    "courseStudentId" INTEGER NOT NULL,
    "oldPrice" INTEGER NOT NULL,
    "newPrice" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_courseStudentId_idx" ON "Invoice"("courseStudentId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_billingPeriodStart_billingPeriodEnd_idx" ON "Invoice"("billingPeriodStart", "billingPeriodEnd");

-- CreateIndex
CREATE INDEX "PriceChangeHistory_courseStudentId_idx" ON "PriceChangeHistory"("courseStudentId");

-- CreateIndex
CREATE INDEX "PriceChangeHistory_changedAt_idx" ON "PriceChangeHistory"("changedAt");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_courseStudentId_fkey" FOREIGN KEY ("courseStudentId") REFERENCES "CourseStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceChangeHistory" ADD CONSTRAINT "PriceChangeHistory_courseStudentId_fkey" FOREIGN KEY ("courseStudentId") REFERENCES "CourseStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
