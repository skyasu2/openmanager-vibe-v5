#!/usr/bin/env node

/**
 * Serena MCP Server Node.js Wrapper
 * This wrapper ensures proper stdio communication for MCP protocol
 */

const { spawn } = require('child_process');
const path = require('path');

const projectRoot = '/mnt/d/cursor/openmanager-vibe-v5';

// Launch serena MCP server
const serena = spawn('uvx', [
  '--from', 'git+https://github.com/oraios/serena',
  'serena-mcp-server',
  '--project', projectRoot,
  '--context', 'ide-assistant',
  '--transport', 'stdio'
], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    PYTHONUNBUFFERED: '1'
  }
});

// Pipe stdin to serena
process.stdin.pipe(serena.stdin);

// Pipe serena output to stdout
serena.stdout.pipe(process.stdout);

// Pipe serena stderr to stderr
serena.stderr.pipe(process.stderr);

// Handle process termination
process.on('SIGINT', () => {
  serena.kill('SIGINT');
});

process.on('SIGTERM', () => {
  serena.kill('SIGTERM');
});

// Handle serena exit
serena.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle errors
serena.on('error', (err) => {
  console.error('Failed to start serena MCP server:', err);
  process.exit(1);
});