#!/usr/bin/env node

/**
 * 🌐 Fetch MCP CLI 도구
 *
 * 공식 Fetch MCP Server를 명령줄에서 사용할 수 있는 도구
 *
 * 사용법:
 *   node fetch-mcp-cli.js health
 *   node fetch-mcp-cli.js fetch-html https://example.com
 *   node fetch-mcp-cli.js fetch-json https://api.github.com
 *   node fetch-mcp-cli.js batch urls.txt
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec } = require('child_process');

class FetchMCPCLI {
  constructor() {
    this.mcpUrl = process.env.MCP_URL || 'http://localhost:3000';
    this.fetchMcpUrl = process.env.FETCH_MCP_URL || 'http://localhost:3001';
    this.timeout = parseInt(process.env.FETCH_TIMEOUT) || 30000;
  }

  async main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0];

    try {
      switch (command) {
        case 'health':
        case 'h':
          await this.checkHealth();
          break;

        case 'tools':
        case 't':
          await this.listTools();
          break;

        case 'fetch-html':
        case 'html':
          await this.fetchContent(
            'fetch_html',
            args[1],
            this.parseHeaders(args[2])
          );
          break;

        case 'fetch-json':
        case 'json':
          await this.fetchContent(
            'fetch_json',
            args[1],
            this.parseHeaders(args[2])
          );
          break;

        case 'fetch-txt':
        case 'text':
          await this.fetchContent(
            'fetch_txt',
            args[1],
            this.parseHeaders(args[2])
          );
          break;

        case 'fetch-markdown':
        case 'md':
          await this.fetchContent(
            'fetch_markdown',
            args[1],
            this.parseHeaders(args[2])
          );
          break;

        case 'batch':
        case 'b':
          await this.batchFetch(args[1]);
          break;

        case 'test':
          await this.runTests();
          break;

        case 'setup':
          await this.setupServer();
          break;

        case 'start':
          await this.startServer();
          break;

        default:
          console.log(`❌ 알 수 없는 명령어: ${command}`);
          this.showHelp();
      }
    } catch (error) {
      console.error('❌ 오류:', error.message);
      process.exit(1);
    }
  }

  async checkHealth() {
    console.log('🔍 서버 헬스 체크 중...\n');

    // 기본 MCP 서버 체크
    try {
      const response = await this.fetch(`${this.mcpUrl}/api/mcp/health`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ 기본 MCP 서버: 연결됨');
        console.log(`   - 상태: ${data.status}`);
        console.log(`   - 서버 수: ${data.summary?.totalServers || 'N/A'}`);
      } else {
        console.log('❌ 기본 MCP 서버: 연결 실패');
      }
    } catch (error) {
      console.log('❌ 기본 MCP 서버: 연결 불가');
      console.log(`   - 오류: ${error.message}`);
    }

    console.log('');

    // Fetch MCP 서버 체크
    try {
      const response = await this.fetch(`${this.fetchMcpUrl}/health`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Fetch MCP 서버: 연결됨');
        console.log(`   - 상태: ${data.status || 'healthy'}`);
        console.log(`   - 버전: ${data.version || 'N/A'}`);
      } else {
        console.log('❌ Fetch MCP 서버: 연결 실패');
      }
    } catch (error) {
      console.log('❌ Fetch MCP 서버: 연결 불가');
      console.log(`   - 오류: ${error.message}`);
      console.log('   - 힌트: ./start-server.sh로 서버를 시작하세요');
    }

    console.log('\n🔗 서버 주소:');
    console.log(`   - 기본 MCP: ${this.mcpUrl}`);
    console.log(`   - Fetch MCP: ${this.fetchMcpUrl}`);
  }

  async listTools() {
    console.log('🛠️ 사용 가능한 도구 목록:\n');

    try {
      const response = await this.fetch(`${this.fetchMcpUrl}/tools`);
      const data = await response.json();

      if (response.ok && data.tools) {
        data.tools.forEach((tool, index) => {
          console.log(`${index + 1}. ${tool.name}`);
          console.log(`   설명: ${tool.description || '설명 없음'}`);
          console.log(`   입력: ${JSON.stringify(tool.inputSchema || {})}`);
          console.log('');
        });
      } else {
        console.log('❌ 도구 목록을 가져올 수 없습니다.');
      }
    } catch (error) {
      console.log('❌ 연결 오류:', error.message);
    }
  }

  async fetchContent(tool, url, headers = {}) {
    if (!url) {
      console.log('❌ URL이 필요합니다.');
      console.log(
        `사용법: node fetch-mcp-cli.js ${tool.replace('fetch_', '')} <URL> [headers.json]`
      );
      return;
    }

    console.log(`🌐 ${tool} 실행 중...`);
    console.log(`📍 URL: ${url}`);

    if (Object.keys(headers).length > 0) {
      console.log(`📋 헤더: ${JSON.stringify(headers, null, 2)}`);
    }

    console.log('');

    const startTime = Date.now();

    try {
      const response = await this.fetch(`${this.fetchMcpUrl}/call-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tool,
          arguments: { url, headers },
        }),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (result.success !== false) {
        console.log(`✅ 성공 (${duration}ms)`);
        console.log(`📊 상태 코드: ${result.statusCode || 'N/A'}`);
        console.log(`📏 콘텐츠 크기: ${result.content?.length || 0} 문자`);
        console.log(`🗂️ 콘텐츠 타입: ${result.contentType || 'N/A'}`);

        if (result.headers) {
          console.log('📋 응답 헤더:');
          Object.entries(result.headers).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        }

        console.log('\n📄 콘텐츠:');
        console.log('='.repeat(50));

        if (result.content) {
          // 콘텐츠가 너무 길면 일부만 표시
          const content = result.content;
          if (content.length > 2000) {
            console.log(content.substring(0, 2000));
            console.log(`\n... (${content.length - 2000}자 더 있음)`);
          } else {
            console.log(content);
          }
        }

        console.log('='.repeat(50));
      } else {
        console.log('❌ 실패');
        console.log(`🚨 오류: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.log('❌ 네트워크 오류:', error.message);
    }
  }

  async batchFetch(filePath) {
    if (!filePath) {
      console.log('❌ 파일 경로가 필요합니다.');
      console.log('사용법: node fetch-mcp-cli.js batch <file.txt|file.json>');
      return;
    }

    if (!fs.existsSync(filePath)) {
      console.log(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let requests = [];

    try {
      if (filePath.endsWith('.json')) {
        // JSON 형식
        requests = JSON.parse(content);
      } else {
        // 텍스트 형식 (한 줄에 하나씩 URL)
        const urls = content.split('\n').filter(line => line.trim());
        requests = urls.map((url, index) => ({
          name: `request_${index + 1}`,
          tool: 'fetch_html',
          url: url.trim(),
        }));
      }
    } catch (error) {
      console.log('❌ 파일 형식 오류:', error.message);
      return;
    }

    console.log(`🔥 배치 실행: ${requests.length}개 요청\n`);

    const results = {};
    const startTime = Date.now();

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      console.log(`📍 [${i + 1}/${requests.length}] ${req.name}: ${req.url}`);

      try {
        const response = await this.fetch(`${this.fetchMcpUrl}/call-tool`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: req.tool,
            arguments: { url: req.url, headers: req.headers || {} },
          }),
        });

        const result = await response.json();
        results[req.name] = result;

        if (result.success !== false) {
          console.log(`   ✅ 성공 (${result.content?.length || 0} 문자)`);
        } else {
          console.log(`   ❌ 실패: ${result.error || '알 수 없는 오류'}`);
        }
      } catch (error) {
        console.log(`   ❌ 네트워크 오류: ${error.message}`);
        results[req.name] = { error: error.message };
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n🎉 배치 완료 (${duration}ms)`);

    // 결과 요약
    const successful = Object.values(results).filter(
      r => r.success !== false
    ).length;
    const failed = requests.length - successful;

    console.log(`📊 결과: ${successful}개 성공, ${failed}개 실패`);

    // 결과를 파일로 저장
    const outputFile = `batch_results_${Date.now()}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`💾 결과 저장: ${outputFile}`);
  }

  async runTests() {
    console.log('🧪 기본 테스트 실행 중...\n');

    const tests = [
      {
        name: 'JSON 테스트',
        tool: 'fetch_json',
        url: 'https://httpbin.org/json',
      },
      {
        name: 'HTML 테스트',
        tool: 'fetch_html',
        url: 'https://httpbin.org/html',
      },
      {
        name: 'Text 테스트',
        tool: 'fetch_txt',
        url: 'https://httpbin.org/robots.txt',
      },
    ];

    for (const test of tests) {
      console.log(`🔍 ${test.name} 실행 중...`);

      try {
        const response = await this.fetch(`${this.fetchMcpUrl}/call-tool`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: test.tool,
            arguments: { url: test.url },
          }),
        });

        const result = await response.json();

        if (result.success !== false) {
          console.log(`✅ ${test.name} 성공`);
        } else {
          console.log(`❌ ${test.name} 실패: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} 오류: ${error.message}`);
      }

      console.log('');
    }
  }

  async setupServer() {
    console.log('⚙️ Fetch MCP Server 설정 중...\n');

    const setupScriptPath = path.join(__dirname, 'setup-fetch-mcp-server.sh');

    if (!fs.existsSync(setupScriptPath)) {
      console.log('❌ 설정 스크립트를 찾을 수 없습니다.');
      console.log(`예상 위치: ${setupScriptPath}`);
      return;
    }

    return new Promise((resolve, reject) => {
      exec(`bash "${setupScriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.log('❌ 설정 실패:', error.message);
          reject(error);
        } else {
          console.log(stdout);
          if (stderr) {
            console.log('⚠️ 경고:', stderr);
          }
          resolve();
        }
      });
    });
  }

  async startServer() {
    console.log('🚀 Fetch MCP Server 시작 중...\n');

    const serverPath = path.join(process.cwd(), 'fetch-mcp-server');
    const startScriptPath = path.join(serverPath, 'start-server.sh');

    if (!fs.existsSync(startScriptPath)) {
      console.log('❌ 서버 시작 스크립트를 찾을 수 없습니다.');
      console.log('먼저 setup 명령을 실행하세요: node fetch-mcp-cli.js setup');
      return;
    }

    console.log('서버를 시작합니다...');
    console.log('종료하려면 Ctrl+C를 누르세요.\n');

    exec(`cd "${serverPath}" && ./start-server.sh`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ 서버 시작 실패:', error.message);
      } else {
        console.log(stdout);
        if (stderr) {
          console.log(stderr);
        }
      }
    });
  }

  parseHeaders(headersArg) {
    if (!headersArg) return {};

    try {
      if (headersArg.startsWith('{')) {
        return JSON.parse(headersArg);
      } else if (fs.existsSync(headersArg)) {
        return JSON.parse(fs.readFileSync(headersArg, 'utf8'));
      } else {
        return {};
      }
    } catch (error) {
      console.log('⚠️ 헤더 파싱 실패:', error.message);
      return {};
    }
  }

  async fetch(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    return fetch(url, {
      timeout: this.timeout,
      ...options,
    });
  }

  showHelp() {
    console.log(`
🌐 Fetch MCP CLI 도구

사용법:
  node fetch-mcp-cli.js <명령어> [옵션]

명령어:
  health, h              서버 헬스 체크
  tools, t               사용 가능한 도구 목록
  
  fetch-html <URL>       HTML 페이지 가져오기
  fetch-json <URL>       JSON 데이터 가져오기
  fetch-txt <URL>        텍스트 파일 가져오기
  fetch-markdown <URL>   Markdown 파일 가져오기
  
  batch <file>           배치 요청 실행
  test                   기본 테스트 실행
  
  setup                  Fetch MCP Server 설정
  start                  Fetch MCP Server 시작

예시:
  node fetch-mcp-cli.js health
  node fetch-mcp-cli.js fetch-json https://api.github.com
  node fetch-mcp-cli.js fetch-html https://example.com
  node fetch-mcp-cli.js batch urls.txt

환경 변수:
  MCP_URL              기본 MCP 서버 URL (기본값: http://localhost:3000)
  FETCH_MCP_URL        Fetch MCP 서버 URL (기본값: http://localhost:3001)
  FETCH_TIMEOUT        요청 타임아웃 (기본값: 30000ms)
`);
  }
}

// 🚀 CLI 실행
if (require.main === module) {
  const cli = new FetchMCPCLI();
  cli.main().catch(console.error);
}

module.exports = FetchMCPCLI;
