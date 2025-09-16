#!/usr/bin/env bun
/**
 * Step 5: Save remaining queries to file
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
  console.error("Usage: bun step5-save.ts --prisma-dir=/path/to/prisma");
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
const queryTablePath = path.join(tempDir, "query-table4.json");

console.log("💾 Step 5: Saving remaining queries...");
console.log(`📁 Using prisma directory: ${prismaDir}`);

// Load query table with migration info
if (!fs.existsSync(queryTablePath)) {
  console.error("❌ Query table not found. Run step4-filter.ts first.");
  process.exit(1);
}

const stepData = JSON.parse(fs.readFileSync(queryTablePath, "utf-8"));
const queryTable: MigrationQuery[] = stepData.queryTable;
const migrationFolder: string = stepData.migrationFolder;
const migrationsPath: string = stepData.migrationsPath;

// Save missing queries to the migration folder
const outputPath = path.join(
  migrationsPath,
  migrationFolder,
  "missing-queries.sql",
);

if (queryTable.length === 0) {
  fs.writeFileSync(
    outputPath,
    "-- No missing queries found\n-- All queries were included in the new migration\n",
  );
  console.log("✅ No missing queries - empty file created");
} else {
  const content = [
    "-- Queries not included in the new consolidated migration",
    `-- Generated on: ${new Date().toISOString()}`,
    `-- Total missing queries: ${queryTable.length}`,
    "",
    ...queryTable.map((item, index) =>
      [
        `-- Query ${index + 1} (from ${item.migrationFile}):`,
        item.query + ";",
        "",
      ].join("\n"),
    ),
  ].join("\n");

  fs.writeFileSync(outputPath, content);

  console.log(
    `✅ Saved ${queryTable.length} missing queries to: ${outputPath}`,
  );
}

// Clean up temporary files only (keep filtered-queries.json)
const tempFiles = [
  "query-table1.json",
  "query-table3.json",
  "query-table4.json",
];

for (const file of tempFiles) {
  const filePath = path.join(tempDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🧹 Cleaned up ${file}`);
  }
}

// Clean up temp directory completely
try {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`🧹 Cleaned up temp directory`);
  }
} catch (error) {
  console.warn(`⚠️ Warning: Could not clean up temp directory: ${error}`);
}

console.log("✅ Step 5 complete: Remaining queries saved");
