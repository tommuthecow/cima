-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Title" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT,
    "year" INTEGER,
    "type" TEXT NOT NULL,
    "genres" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ranking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ranking_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Watchlist_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bucket" TEXT,
    "score" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Title_tmdbId_key" ON "Title"("tmdbId");

-- CreateIndex
CREATE INDEX "Title_type_idx" ON "Title"("type");

-- CreateIndex
CREATE INDEX "Ranking_userId_bucket_rank_idx" ON "Ranking"("userId", "bucket", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_userId_titleId_key" ON "Ranking"("userId", "titleId");

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_titleId_key" ON "Watchlist"("userId", "titleId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
