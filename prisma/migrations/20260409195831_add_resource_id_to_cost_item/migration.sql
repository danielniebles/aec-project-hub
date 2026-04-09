-- AlterTable
ALTER TABLE "CostItem" ADD COLUMN     "resourceId" TEXT;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
