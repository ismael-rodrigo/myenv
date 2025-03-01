/*
  Warnings:

  - You are about to drop the column `mountedPath` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Project` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "repositoryUrl" TEXT,
    "repositoryToken" TEXT
);
INSERT INTO "new_Project" ("id", "name", "repositoryUrl") SELECT "id", "name", "repositoryUrl" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
