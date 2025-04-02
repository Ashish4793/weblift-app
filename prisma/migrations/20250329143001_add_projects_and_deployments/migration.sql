/*
  Warnings:

  - You are about to drop the column `log` on the `Deployment` table. All the data in the column will be lost.
  - The `status` column on the `Deployment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `repoUrl` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[deploymentId]` on the table `Deployment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `configMetadata` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deploymentId` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `framework` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instanceData` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repoMetaData` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('building', 'success', 'failed');

-- CreateEnum
CREATE TYPE "Framework" AS ENUM ('express', 'react', 'nextjs', 'vite', 'django');

-- DropIndex
DROP INDEX "Project_repoUrl_key";

-- AlterTable
ALTER TABLE "Deployment" DROP COLUMN "log",
ADD COLUMN     "configMetadata" JSONB NOT NULL,
ADD COLUMN     "deploymentId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "DeploymentStatus" NOT NULL DEFAULT 'building';

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "repoUrl",
ADD COLUMN     "framework" "Framework" NOT NULL,
ADD COLUMN     "instanceData" JSONB NOT NULL,
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "repoMetaData" JSONB NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_deploymentId_key" ON "Deployment"("deploymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectId_key" ON "Project"("projectId");
