#!/usr/bin/env bun
/**
 * Step 2: Reset database and generate consolidated migration
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Parse command line arguments
const args = process.argv.slice(2);
const prismaDirArg = args.find(arg => arg.startsWith('--prisma-dir='));
if (!prismaDirArg) {
  console.error("❌ Error: --prisma-dir argument is required");
  console.error("Usage: bun step2-reset.ts --prisma-dir=/path/to/prisma");
  process.exit(1);
}

const prismaDir = prismaDirArg.split('=')[1];
if (!prismaDir || prismaDir.trim() === "") {
  console.error("❌ Error: --prisma-dir cannot be empty");
  process.exit(1);
}

console.log(
  "🔄 Step 2: Resetting database and generating consolidated migration...",
);
console.log(`📁 Using prisma directory: ${prismaDir}`);

// Tool operates from its own directory
const consolidateDir = process.cwd();
const tempDir = path.join(consolidateDir, "temp");
const queryTablePath = path.join(tempDir, "query-table1.json");
const outputQueryTablePath = path.join(tempDir, "query-table2.json");

// Check if query table exists from step 1
if (!fs.existsSync(queryTablePath)) {
  console.error(
    "❌ Query table from step 1 not found. Please run step1-backup.ts first.",
  );
  process.exit(1);
}

// Change to the directory containing the prisma directory for commands
const projectRoot = path.dirname(prismaDir);
console.log(`📁 Project root: ${projectRoot}`);

try {
  // Reset the database and apply migrations
  console.log("🗃️  Resetting database...");
  execSync("bun prisma migrate reset --force", {
    cwd: projectRoot,
    stdio: "inherit",
  });

  console.log("🚀 Generating consolidated migration...");
  execSync("bun prisma migrate dev --name consolidated", {
    cwd: projectRoot,
    stdio: "inherit",
  });

  // Copy query table for next step
  const queryTable = JSON.parse(fs.readFileSync(queryTablePath, "utf-8"));
  fs.writeFileSync(outputQueryTablePath, JSON.stringify(queryTable, null, 2));

  console.log(
    "✅ Step 2 complete: Database reset and consolidated migration generated",
  );
} catch (error) {
  console.error("❌ Error during migration generation:", error);
  process.exit(1);
}
