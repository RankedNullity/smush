#!/usr/bin/env bun
/**
 * Step 3: Parse new migration and remove matching queries from table
 */
import fs from "fs";
import path from "path";

interface MigrationQuery {
  query: string;
  isFilteredQuery: boolean;
  filterReason?: string;
  migrationFile: string;
}

// Parse command line arguments
const args = process.argv.slice(2);
const prismaDirArg = args.find((arg) => arg.startsWith("--prisma-dir="));
if (!prismaDirArg) {
  console.error("❌ Error: --prisma-dir argument is required");
  console.error("Usage: bun step3-parse.ts --prisma-dir=/path/to/prisma");
  process.exit(1);
}

const prismaDir = prismaDirArg.split("=")[1];
if (!prismaDir || prismaDir.trim() === "") {
  console.error("❌ Error: --prisma-dir cannot be empty");
  process.exit(1);
}

// Tool operates from its own directory
const migrationsPath = path.join(prismaDir, "migrations");
const consolidateDir = process.cwd();
const tempDir = path.join(consolidateDir, "temp");
const queryTablePath = path.join(tempDir, "query-table2.json");
const outputQueryTablePath = path.join(tempDir, "query-table3.json");

console.log("🔍 Step 3: Parsing new migration and cleaning query table...");
console.log(`📁 Using prisma directory: ${prismaDir}`);

// Load query table
if (!fs.existsSync(queryTablePath)) {
  console.error("❌ Query table not found. Run step1-backup.ts first.");
  process.exit(1);
}

let queryTable: MigrationQuery[] = JSON.parse(
  fs.readFileSync(queryTablePath, "utf-8"),
);

// Find the new migration folder
const migrationFolders = fs.readdirSync(migrationsPath).filter((item) => {
  const itemPath = path.join(migrationsPath, item);
  return fs.statSync(itemPath).isDirectory();
});

if (migrationFolders.length === 0) {
  console.log("❌ No new migration found");
  process.exit(1);
}

const newMigrationFolder = migrationFolders[0]!; // Should be only one after length check
const newMigrationPath = path.join(
  migrationsPath,
  newMigrationFolder,
  "migration.sql",
);

if (!fs.existsSync(newMigrationPath)) {
  console.log("❌ New migration.sql not found");
  process.exit(1);
}

console.log(`📄 Analyzing new migration: ${newMigrationFolder}`);

const newMigrationContent = fs.readFileSync(newMigrationPath, "utf-8");
const newQueries = newMigrationContent
  .split("\n")
  .filter(
    (line) => !line.trim().startsWith("--") && !line.trim().startsWith("/*"),
  )
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split(";")
  .map((query) => query.trim())
  .filter((query) => query.length > 0);

// Normalize query for comparison
function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim().toLowerCase();
}

// Remove queries that are in the new migration from our table
const initialCount = queryTable.length;

queryTable = queryTable.filter((tableQuery) => {
  return !newQueries.some(
    (newQuery) => normalizeQuery(tableQuery.query) === normalizeQuery(newQuery),
  );
});

const removedCount = initialCount - queryTable.length;
console.log(`✅ Removed ${removedCount} queries that are in the new migration`);
console.log(`📊 Remaining queries: ${queryTable.length}`);

// Pass query table and migration folder info to next step
const resultData = {
  queryTable: queryTable,
  migrationFolder: newMigrationFolder,
  migrationsPath: migrationsPath,
};

fs.writeFileSync(outputQueryTablePath, JSON.stringify(resultData, null, 2));
console.log(`💾 Query table saved to: ${outputQueryTablePath}`);
console.log("✅ Step 3 complete: Query table updated");
