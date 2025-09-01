#!/usr/bin/env node

/**
 * TypeScript Compiler Wrapper
 * 
 * Wrapper script to debug and fix the mysterious "2" argument issue
 * Filters out unwanted "2" arguments and provides debug information
 */

import { spawn } from 'child_process';
import path from 'path';

// Get the actual tsc.js path from project root
const projectRoot = path.join(__dirname, '..', '..');
const tscPath = path.join(projectRoot, 'node_modules', 'typescript', 'lib', 'tsc.js');

// Filter out any "2" argument that shouldn't be there
const args: string[] = process.argv.slice(2).filter(arg => arg !== '2');

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

tsc.on('exit', (code: number | null) => {
  process.exit(code || 0);
});