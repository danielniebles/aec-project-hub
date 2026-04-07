-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('material', 'labor', 'equipment', 'transport', 'subcontract');

-- CreateEnum
CREATE TYPE "PriceSourceType" AS ENUM ('internal', 'camacol', 'gobernacion', 'supplier', 'manual');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('architecture', 'construction', 'civil', 'design_build');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('prospect', 'design', 'permitting', 'execution', 'closeout', 'closed');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('labor', 'materials', 'equipment', 'subcontractor', 'design_fees', 'admin_permits', 'transport', 'other');

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "category" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourcePrice" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "sourceType" "PriceSourceType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourcePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APUItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "outputUnit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "aiuAdminPct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "aiuContingencyPct" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "aiuProfitPct" DECIMAL(5,2) NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "APUItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APULine" (
    "id" TEXT NOT NULL,
    "apuItemId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "wasteFactorPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APULine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'prospect',
    "description" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "apuItemId" TEXT,
    "category" "CostCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantityBudgeted" DECIMAL(12,4) NOT NULL,
    "unitCostBudgeted" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExpense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "costItemId" TEXT NOT NULL,
    "resourceId" TEXT,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(12,4),
    "unit" TEXT,
    "unitCost" DECIMAL(15,2),
    "total" DECIMAL(15,2) NOT NULL,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resource_code_key" ON "Resource"("code");

-- CreateIndex
CREATE UNIQUE INDEX "APUItem_code_key" ON "APUItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- AddForeignKey
ALTER TABLE "ResourcePrice" ADD CONSTRAINT "ResourcePrice_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APULine" ADD CONSTRAINT "APULine_apuItemId_fkey" FOREIGN KEY ("apuItemId") REFERENCES "APUItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APULine" ADD CONSTRAINT "APULine_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_apuItemId_fkey" FOREIGN KEY ("apuItemId") REFERENCES "APUItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_costItemId_fkey" FOREIGN KEY ("costItemId") REFERENCES "CostItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
