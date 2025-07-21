const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 MCP 서버 직접 테스트');
console.log('========================');

// Filesystem MCP 테스트
const fsServer = spawn(
  'node',
  [
    path.join(
      __dirname,
      '../node_modules/@modelcontextprotocol/server-filesystem/dist/index.js'
    ),
  ],
  {
    env: {
      ...process.env,
      ALLOWED_DIRECTORIES: '/mnt/d/cursor/openmanager-vibe-v5',
    },
  }
);

fsServer.stdout.on('data', data => {
  console.log(`[FS MCP] ${data}`);
});

fsServer.stderr.on('data', data => {
  console.error(`[FS MCP Error] ${data}`);
});

// 테스트 메시지 전송
setTimeout(() => {
  const testMessage = JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '1.0.0',
      capabilities: {},
    },
    id: 1,
  });

  console.log('테스트 메시지 전송:', testMessage);
  fsServer.stdin.write(testMessage + '\n');
}, 1000);

// 5초 후 종료
setTimeout(() => {
  fsServer.kill();
  process.exit(0);
}, 5000);
