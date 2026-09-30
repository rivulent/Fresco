-- AlterTable
ALTER TABLE "User" ADD COLUMN "networkId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_networkId_key" ON "User"("networkId");
