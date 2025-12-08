const { spawn } = require('child_process');
const readline = require('readline');

const gitLog = spawn('git', ['log', '--pretty=format:%cd', '--date=iso', '--name-only']);
const rl = readline.createInterface({ input: gitLog.stdout });

let currentDate = null;
const fileDates = new Map();

rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;

  // Check if line is a date (ISO format starts with YYYY-MM-DD)
  // Git ISO date: 2024-12-04 01:04:05 +0900
  if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
    currentDate = line;
  } else if (currentDate) {
    // It's a file path
    if (!fileDates.has(line)) {
      fileDates.set(line, currentDate);
    }
  }
});

rl.on('close', () => {
  // Sort by date ascending (oldest first)
  const sorted = Array.from(fileDates.entries()).sort((a, b) => {
    return new Date(a[1]) - new Date(b[1]);
  });

  // Check if file still exists (git log shows deleted files too)
  const fs = require('fs');
  const existingFiles = [];
  
  for (const [file, date] of sorted) {
    if (fs.existsSync(file)) {
      existingFiles.push({ file, date });
    }
    if (existingFiles.length >= 10) break;
  }

  fs.writeFileSync('oldest_files_utf8.json', JSON.stringify(existingFiles, null, 2), 'utf8');
  console.log('Done writing to oldest_files_utf8.json');
});
