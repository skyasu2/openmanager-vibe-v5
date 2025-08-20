#!/usr/bin/env node

/**
 * 테스트 애플리케이션 - VM에 배포 테스트용
 * Node.js v12 호환
 */

const http = require('http');
const os = require('os');

const PORT = 8080; // 다른 포트 사용

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const response = {
    message: 'Hello from Test App!',
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    nodeVersion: process.version,
    port: PORT,
    path: req.url,
    method: req.method
  };
  
  res.writeHead(200);
  res.end(JSON.stringify(response, null, 2));
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Test App running on port ${PORT}`);
  console.log(`Node.js ${process.version}`);
  console.log(`Platform: ${os.platform()}`);
  console.log(`Hostname: ${os.hostname()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});