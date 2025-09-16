#!/usr/bin/env bun
/**
 * // Load query table with migration info
if (!fs.existsSync(queryTablePath)) {
  console.error('❌ Query table not found. Run step3-parse.ts first.');
  process.exit(1);
}

const stepData = JSON.parse(fs.readFileSync(queryTablePath, 'utf-8'));
let queryTable: MigrationQuery[] = stepData.queryTable;
const migrationFolder: string = stepData.migrationFolder;
const migrationsPath: string = stepData.migrationsPath;

// Save filtered queries to the migration folder
const filteredQueriesPath = path.join(migrationsPath, migrationFolder, 'filtered-queries.json'); Filter out queries
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
  console.error("Usage: bun step4-filter.ts --prisma-dir=/path/to/prisma");
  process.exit(1);
}

const prismaDir = prismaDirArg.split("=")[1];
if (!prismaDir || prismaDir.trim() === "") {
  console.error("❌ Error: --prisma-dir cannot be empty");
  process.exit(1);
}

// Tool operates from its own directory
const consolidateDir = process.cwd();
const tempDir = path.join(consolidateDir, "temp");
const queryTablePath = path.join(tempDir, "query-table3.json");
const outputQueryTablePath = path.join(tempDir, "query-table4.json");

console.log("🗑️  Step 4: Filtering out queries...");
console.log(`📁 Using prisma directory: ${prismaDir}`);

// Load query table with migration info
if (!fs.existsSync(queryTablePath)) {
  console.error("❌ Query table not found. Run step3-parse.ts first.");
  process.exit(1);
}

const stepData = JSON.parse(fs.readFileSync(queryTablePath, "utf-8"));
let queryTable: MigrationQuery[] = stepData.queryTable;
const migrationFolder: string = stepData.migrationFolder;
const migrationsPath: string = stepData.migrationsPath;

// Save filtered queries to the migration folder
const filteredQueriesPath = path.join(
  migrationsPath,
  migrationFolder,
  "filtered-queries.json",
);

const filteredQueries = queryTable.filter((q) => q.isFilteredQuery);
queryTable = queryTable.filter((q) => !q.isFilteredQuery);

console.log(`✅ Filtered out ${filteredQueries.length} queries`);
console.log(`📊 Breakdown by filter reason:`);
const filterReasons = filteredQueries.reduce(
  (acc, q) => {
    const reason = q.filterReason || "Unknown";
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>,
);

for (const [reason, count] of Object.entries(filterReasons)) {
  console.log(`   - ${reason}: ${count}`);
}
console.log(`📊 Remaining non-filtered queries: ${queryTable.length}`);

// Save filtered queries with reasons
fs.writeFileSync(filteredQueriesPath, JSON.stringify(filteredQueries, null, 2));
console.log(`💾 Filtered queries saved to: ${filteredQueriesPath}`);

// Pass remaining queries and migration info to next step
const resultData = {
  queryTable: queryTable,
  migrationFolder: migrationFolder,
  migrationsPath: migrationsPath,
};

fs.writeFileSync(outputQueryTablePath, JSON.stringify(resultData, null, 2));
console.log(`💾 Query table saved to: ${outputQueryTablePath}`);
console.log("✅ Step 4 complete: Queries filtered and saved");
