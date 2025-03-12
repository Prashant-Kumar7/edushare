/*
  Warnings:

  - The primary key for the `Room` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `higher` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `lower` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `medium` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `videoId` on the `Room` table. All the data in the column will be lost.
  - Added the required column `description` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Room_higher_key";

-- DropIndex
DROP INDEX "Room_lower_key";

-- DropIndex
DROP INDEX "Room_medium_key";

-- DropIndex
DROP INDEX "Room_videoId_key";

-- AlterTable
ALTER TABLE "Room" DROP CONSTRAINT "Room_pkey",
DROP COLUMN "higher",
DROP COLUMN "lower",
DROP COLUMN "medium",
DROP COLUMN "roomId",
DROP COLUMN "videoId",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD CONSTRAINT "Room_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "UserRoomManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "UserRoomManager_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserRoomManager" ADD CONSTRAINT "UserRoomManager_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
