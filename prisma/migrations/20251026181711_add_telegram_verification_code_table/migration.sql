-- CreateTable
CREATE TABLE "TelegramVerificationCode" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "telegramUsername" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelegramVerificationCode_username_userType_idx" ON "TelegramVerificationCode"("username", "userType");

-- CreateIndex
CREATE INDEX "TelegramVerificationCode_expiresAt_idx" ON "TelegramVerificationCode"("expiresAt");
