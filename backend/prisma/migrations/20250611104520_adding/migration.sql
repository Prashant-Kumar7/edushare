/*
  Warnings:

  - A unique constraint covering the columns `[roomToken]` on the table `UserRoomManager` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roomToken` to the `UserRoomManager` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserRoomManager" ADD COLUMN     "roomToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserRoomManager_roomToken_key" ON "UserRoomManager"("roomToken");
