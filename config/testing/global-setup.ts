/**
 * Vitest Global Setup
 * Starts test server before running tests and stops it after
 */

import { spawn, ChildProcess } from 'child_process';

let testServer: ChildProcess | null = null;
const TEST_PORT = 3002;
const TEST_TIMEOUT = 30000; // 30 seconds

function waitForServer(port: number, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    function checkServer() {
      const now = Date.now();
      if (now - startTime > timeout) {
        resolve(false);
        return;
      }

      // Try to connect to the server
      const http = require('http');
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 1000
      }, (res: any) => {
        resolve(true);
      });

      req.on('error', () => {
        // Server not ready yet, try again
        setTimeout(checkServer, 500);
      });

      req.on('timeout', () => {
        req.destroy();
        setTimeout(checkServer, 500);
      });

      req.end();
    }

    checkServer();
  });
}

export async function setup() {
  console.log('🚀 Starting test server on port', TEST_PORT);
  
  // Check if server is already running
  const isRunning = await waitForServer(TEST_PORT, 1000);
  if (isRunning) {
    console.log('✅ Test server already running on port', TEST_PORT);
    return;
  }

  // Start the test server
  testServer = spawn('npm', ['run', 'test:e2e:server'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: TEST_PORT.toString(),
      NODE_ENV: 'test',
      SKIP_ENV_VALIDATION: 'true'
    },
    detached: false
  });

  if (testServer.stdout) {
    testServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('started')) {
        console.log('📡 Test server output:', output.trim());
      }
    });
  }

  if (testServer.stderr) {
    testServer.stderr.on('data', (data) => {
      console.error('❌ Test server error:', data.toString().trim());
    });
  }

  // Wait for server to be ready
  const serverReady = await waitForServer(TEST_PORT, TEST_TIMEOUT);
  
  if (!serverReady) {
    console.error('❌ Test server failed to start within', TEST_TIMEOUT / 1000, 'seconds');
    if (testServer) {
      testServer.kill();
      testServer = null;
    }
    throw new Error('Test server startup failed');
  }

  console.log('✅ Test server ready on port', TEST_PORT);
}

export async function teardown() {
  if (testServer) {
    console.log('🛑 Stopping test server');
    testServer.kill();
    testServer = null;
    
    // Give it a moment to clean up
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Test server stopped');
  }
}