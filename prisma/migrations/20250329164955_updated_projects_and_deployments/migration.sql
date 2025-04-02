/*
  Warnings:

  - Added the required column `commitMetaData` to the `Deployment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "commitMetaData" JSONB NOT NULL;
