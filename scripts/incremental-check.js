const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function getChangedFiles() {
  try {
    // Get staged and unstaged changes
    const diffCommand = 'git diff --name-only HEAD';
    const output = execSync(diffCommand, { encoding: 'utf-8' });
    return output.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    log(colors.red, 'Failed to get changed files from git.');
    console.error(error);
    process.exit(1);
  }
}

function filterLintableFiles(files) {
  return files.filter(file => {
    return /\.(ts|tsx|js|jsx)$/.test(file) && fs.existsSync(file);
  });
}

function runCommand(command, args, name) {
  return new Promise((resolve, reject) => {
    log(colors.blue, `\nRunning ${name}...`);
    
    const proc = spawn(command, args, { stdio: 'inherit', shell: true });

    proc.on('close', (code) => {
      if (code === 0) {
        log(colors.green, `✅ ${name} passed.`);
        resolve();
      } else {
        log(colors.red, `❌ ${name} failed.`);
        reject(new Error(`${name} failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      log(colors.red, `❌ ${name} failed to start.`);
      reject(err);
    });
  });
}

async function main() {
  log(colors.cyan, '🔍 Starting incremental check...');

  const allChangedFiles = getChangedFiles();
  const lintableFiles = filterLintableFiles(allChangedFiles);

  if (lintableFiles.length === 0) {
    log(colors.green, '✅ No lintable files changed.');
    // Still run TSC if requested? Usually incremental check implies checking what changed.
    // But TSC incremental check is fast enough to run always if we want to be safe,
    // but if no files changed, maybe skip?
    // Let's skip TSC too if no JS/TS files changed.
    return;
  }

  log(colors.yellow, `Found ${lintableFiles.length} changed file(s) to check:`);
  lintableFiles.forEach(f => console.log(` - ${f}`));

  try {
    // Run ESLint on changed files
    // We pass the file list to eslint
    await runCommand('npx', ['eslint', '--fix', '--max-warnings=0', ...lintableFiles], 'ESLint');

    // Run TSC (Incremental)
    // We don't pass files to TSC, we let it use the incremental cache
    await runCommand('npx', ['tsc', '--noEmit', '--incremental'], 'TypeScript Check');

    log(colors.green, '\n✨ All incremental checks passed!');
  } catch (error) {
    log(colors.red, '\n💥 Some checks failed.');
    process.exit(1);
  }
}

main();
