-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN', 'TEACHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "roomId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "lower" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "higher" TEXT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("roomId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Room_videoId_key" ON "Room"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_lower_key" ON "Room"("lower");

-- CreateIndex
CREATE UNIQUE INDEX "Room_medium_key" ON "Room"("medium");

-- CreateIndex
CREATE UNIQUE INDEX "Room_higher_key" ON "Room"("higher");
