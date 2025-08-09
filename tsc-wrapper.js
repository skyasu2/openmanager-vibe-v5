#!/usr/bin/env node

// Wrapper script to debug and fix the mysterious "2" argument issue
const spawn = require('child_process').spawn;
const path = require('path');

// Get the actual tsc.js path
const tscPath = path.join(__dirname, 'node_modules', 'typescript', 'lib', 'tsc.js');

// Filter out any "2" argument that shouldn't be there
const args = process.argv.slice(2).filter(arg => arg !== '2');

// Only show debug logs if there was a "2" argument
if (process.argv.slice(2).includes('2')) {
  console.log('Original args:', process.argv.slice(2));
  console.log('Filtered args:', args);
}

// Run TypeScript compiler with filtered arguments
const tsc = spawn('node', [tscPath, ...args], {
  stdio: 'inherit',
  cwd: process.cwd()
});

tsc.on('exit', (code) => {
  process.exit(code);
});