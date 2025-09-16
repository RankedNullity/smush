#!/usr/bin/env bun
/**
 * Step 1: Backup migrations and extract queries
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface MigrationQuery {
  query: string;
  isFilteredQuery: boolean;
  filterReason?: string;
  migrationFile: string;
}

interface FilterConfig {
  name: string;
  patterns: string[];
  reason: string;
  enabled: boolean;
}

interface FiltersConfig {
  filters: FilterConfig[];
}

// Parse command line arguments
const args = process.argv.slice(2);
const prismaDirArg = args.find((arg) => arg.startsWith("--prisma-dir="));
if (!prismaDirArg) {
  console.error("❌ Error: --prisma-dir argument is required");
  console.error("Usage: bun step1-backup.ts --prisma-dir=/path/to/prisma");
  process.exit(1);
}

const prismaDir = prismaDirArg.split("=")[1];
if (!prismaDir || prismaDir.trim() === "") {
  console.error("❌ Error: --prisma-dir cannot be empty");
  process.exit(1);
}

// Tool operates from its own directory
const migrationsPath = path.join(prismaDir, "migrations");
const backupPath = path.join(prismaDir, "migrations-backup");
const consolidateDir = process.cwd();
const tempDir = path.join(consolidateDir, "temp");
const queryTablePath = path.join(tempDir, "query-table1.json");
const filtersConfigPath = path.join(consolidateDir, "filters.json");

console.log("📦 Step 1: Backing up migrations and extracting queries...");
console.log(`📁 Using prisma directory: ${prismaDir}`);
console.log(`📁 Migrations path: ${migrationsPath}`);
console.log(`📁 Backup path: ${backupPath}`);

// Load filters configuration
let filtersConfig: FiltersConfig;
try {
  filtersConfig = JSON.parse(fs.readFileSync(filtersConfigPath, "utf-8"));
} catch (error) {
  console.error(
    `❌ Failed to load filters config from ${filtersConfigPath}:`,
    error,
  );
  process.exit(1);
}

// Create directories
if (!fs.existsSync(backupPath)) {
  fs.mkdirSync(backupPath, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const queryTable: MigrationQuery[] = [];

// Helper function to check if a query should be filtered and get the reason
function getFilterInfo(query: string): {
  shouldFilter: boolean;
  reason?: string;
} {
  const upperQuery = query.toUpperCase().trim();

  for (const filter of filtersConfig.filters) {
    if (!filter.enabled) continue;

    for (const pattern of filter.patterns) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(upperQuery)) {
        return { shouldFilter: true, reason: filter.reason };
      }
    }
  }

  return { shouldFilter: false };
}

// Helper function to extract queries from a migration file
function extractQueriesFromFile(
  filePath: string,
  migrationFolder: string,
): void {
  const content = fs.readFileSync(filePath, "utf-8");

  // Remove both single-line and multi-line comments more thoroughly
  let cleanedContent = content
    // First remove multi-line comments (/* ... */)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Then remove single-line comments (-- ...)
    .split('\n')
    .map(line => {
      // Remove single-line comments but preserve the rest of the line
      const commentIndex = line.indexOf('--');
      if (commentIndex !== -1) {
        return line.substring(0, commentIndex);
      }
      return line;
    })
    .join('\n')
    // Remove any remaining empty lines and normalize whitespace
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // Split by semicolons and filter out empty queries
  const queries = cleanedContent
    .split(';')
    .map(query => query.trim())
    .filter(query => query.length > 0 && !/^\s*$/.test(query));

  for (const query of queries) {
    if (query.trim()) {
      const filterInfo = getFilterInfo(query);
      queryTable.push({
        query: query.trim(),
        isFilteredQuery: filterInfo.shouldFilter,
        filterReason: filterInfo.reason,
        migrationFile: migrationFolder,
      });
    }
  }
}

// Get all migration folders
const migrationFolders = fs.readdirSync(migrationsPath).filter((item) => {
  const itemPath = path.join(migrationsPath, item);
  return fs.statSync(itemPath).isDirectory();
});

console.log(`Found ${migrationFolders.length} migration folders`);

// Process each migration folder
for (const folder of migrationFolders) {
  const sourcePath = path.join(migrationsPath, folder);
  const destPath = path.join(backupPath, folder);

  // Extract queries before moving
  const migrationSqlPath = path.join(sourcePath, "migration.sql");
  if (fs.existsSync(migrationSqlPath)) {
    extractQueriesFromFile(migrationSqlPath, folder);
  }

  // Move folder to backup
  fs.renameSync(sourcePath, destPath);
  console.log(`✅ Moved ${folder} to backup`);
}

// Keep migration_lock.toml
const lockFile = path.join(migrationsPath, "migration_lock.toml");
if (fs.existsSync(lockFile)) {
  const backupLockFile = path.join(backupPath, "migration_lock.toml");
  fs.copyFileSync(lockFile, backupLockFile);
  console.log("✅ Backed up migration_lock.toml");
}

// Save query table for next steps
fs.writeFileSync(queryTablePath, JSON.stringify(queryTable, null, 2));

console.log(`\n📊 Extracted ${queryTable.length} queries total`);
console.log(
  `📊 Filtered queries: ${queryTable.filter((q) => q.isFilteredQuery).length}`,
);
console.log(`💾 Query table saved to: ${queryTablePath}`);
console.log("✅ Step 1 complete: Migrations backed up and queries extracted");
