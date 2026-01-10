#!/usr/bin/env tsx
/**
 * Console to Logger Migration Script
 *
 * Migrates console.log/error/warn/debug to logger.info/error/warn/debug
 *
 * Usage:
 *   npx tsx scripts/migrate-console-to-logger.ts [options]
 *
 * Options:
 *   --dry-run     Show changes without modifying files
 *   --dir=<path>  Target directory (default: src/app/api)
 *   --file=<path> Target single file
 */

import * as fs from 'fs';
import * as path from 'path';

interface MigrationResult {
  file: string;
  changes: number;
  added_import: boolean;
}

const CONSOLE_PATTERNS = [
  { pattern: /console\.log\(/g, replacement: 'logger.info(' },
  { pattern: /console\.error\(/g, replacement: 'logger.error(' },
  { pattern: /console\.warn\(/g, replacement: 'logger.warn(' },
  { pattern: /console\.debug\(/g, replacement: 'logger.debug(' },
  { pattern: /console\.info\(/g, replacement: 'logger.info(' },
];

const LOGGER_IMPORT = "import { logger } from '@/lib/logging';";

const EXCLUDED_PATHS = [
  'src/lib/logging/', // Logger implementation itself
  'scripts/', // Scripts directory
  'node_modules/',
  '.next/',
  'dist/',
  '__tests__/',
  '.test.ts',
  '.test.tsx',
  '.spec.ts',
  '.spec.tsx',
];

function shouldExclude(filePath: string): boolean {
  return EXCLUDED_PATHS.some((excluded) => filePath.includes(excluded));
}

function hasLoggerImport(content: string): boolean {
  return (
    content.includes("from '@/lib/logging'") ||
    content.includes('from "@/lib/logging"') ||
    content.includes("from '../lib/logging'") ||
    content.includes("from '../../lib/logging'")
  );
}

/**
 * Find the end of all import statements in the file.
 * Handles multi-line imports correctly.
 */
function findImportBlockEnd(lines: string[]): number {
  let lastImportEnd = -1;
  let insideImport = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    const trimmed = line.trim();

    // Skip empty lines and comments at the start
    if (lastImportEnd === -1 && (trimmed === '' || trimmed.startsWith('/') || trimmed.startsWith('*'))) {
      continue;
    }

    // Track if we're inside an import statement
    if (trimmed.startsWith('import ')) {
      insideImport = true;
      braceDepth = 0;
    }

    if (insideImport) {
      // Count braces to handle multi-line imports
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      // Check if import ends on this line
      if (trimmed.endsWith(';') && braceDepth === 0) {
        lastImportEnd = i;
        insideImport = false;
      } else if (trimmed.includes(') from ') && trimmed.endsWith(';')) {
        lastImportEnd = i;
        insideImport = false;
      } else if (!trimmed.startsWith('import') && braceDepth === 0 && trimmed.endsWith("';")) {
        lastImportEnd = i;
        insideImport = false;
      }
    }

    // If we hit non-import code, stop
    if (!insideImport && lastImportEnd >= 0 && trimmed !== '' && !trimmed.startsWith('import') && !trimmed.startsWith('/') && !trimmed.startsWith('*')) {
      break;
    }
  }

  return lastImportEnd;
}

function addLoggerImport(content: string): string {
  const lines = content.split('\n');
  const importBlockEnd = findImportBlockEnd(lines);

  if (importBlockEnd >= 0) {
    // Insert after the last import
    lines.splice(importBlockEnd + 1, 0, LOGGER_IMPORT);
  } else {
    // No imports found, add at the beginning after any comments/empty lines
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('/') || trimmed.startsWith('*')) {
        insertIndex = i + 1;
      } else {
        break;
      }
    }
    lines.splice(insertIndex, 0, LOGGER_IMPORT);
  }

  return lines.join('\n');
}

function migrateFile(filePath: string, dryRun: boolean): MigrationResult | null {
  if (shouldExclude(filePath)) {
    return null;
  }

  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return null;
  }

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  let newContent = content;
  let totalChanges = 0;

  // Apply console replacements
  for (const { pattern, replacement } of CONSOLE_PATTERNS) {
    const matches = newContent.match(pattern);
    if (matches) {
      totalChanges += matches.length;
      newContent = newContent.replace(pattern, replacement);
    }
  }

  if (totalChanges === 0) {
    return null;
  }

  // Add import if needed
  let addedImport = false;
  if (!hasLoggerImport(newContent)) {
    newContent = addLoggerImport(newContent);
    addedImport = true;
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return {
    file: filePath,
    changes: totalChanges,
    added_import: addedImport,
  };
}

function walkDirectory(dir: string, results: MigrationResult[], dryRun: boolean): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!shouldExclude(fullPath)) {
        walkDirectory(fullPath, results, dryRun);
      }
    } else if (entry.isFile()) {
      const result = migrateFile(fullPath, dryRun);
      if (result) {
        results.push(result);
      }
    }
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  let targetDir = 'src/app/api';
  let targetFile: string | null = null;

  for (const arg of args) {
    if (arg.startsWith('--dir=')) {
      targetDir = arg.substring(6);
    } else if (arg.startsWith('--file=')) {
      targetFile = arg.substring(7);
    }
  }

  console.log('🔄 Console to Logger Migration');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('');

  const results: MigrationResult[] = [];

  if (targetFile) {
    const result = migrateFile(targetFile, dryRun);
    if (result) results.push(result);
  } else {
    const fullPath = path.resolve(process.cwd(), targetDir);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Directory not found: ${fullPath}`);
      process.exit(1);
    }
    walkDirectory(fullPath, results, dryRun);
  }

  if (results.length === 0) {
    console.log('✅ No console statements found to migrate');
    return;
  }

  console.log(`📊 Migration ${dryRun ? 'Preview' : 'Results'}:`);
  console.log('');

  let totalChanges = 0;
  let totalImports = 0;

  for (const result of results) {
    const relativePath = path.relative(process.cwd(), result.file);
    console.log(
      `   ${relativePath}: ${result.changes} change(s)${result.added_import ? ' (+import)' : ''}`
    );
    totalChanges += result.changes;
    if (result.added_import) totalImports++;
  }

  console.log('');
  console.log(`📈 Summary:`);
  console.log(`   Files: ${results.length}`);
  console.log(`   Changes: ${totalChanges}`);
  console.log(`   Imports added: ${totalImports}`);

  if (dryRun) {
    console.log('');
    console.log('💡 Run without --dry-run to apply changes');
  } else {
    console.log('');
    console.log('✅ Migration complete');
  }
}

main();
