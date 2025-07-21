#!/usr/bin/env node

/**
 * 🤖 AI 대화 CLI 도구
 * 터미널에서 다양한 AI와 직접 대화할 수 있는 명령줄 도구
 */

const readline = require('readline');
const https = require('https');
const http = require('http');

class AIChatCLI {
  constructor() {
    this.baseUrl = process.env.AI_CHAT_API_URL || 'http://localhost:3001';
    this.currentSessionId = null;
    this.currentProvider = null;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 AI Chat> ',
    });
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = client.request(options, res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (error) {
            reject(new Error(`JSON 파싱 오류: ${error.message}`));
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async start() {
    console.log('🚀 AI 대화 CLI 시작!');
    console.log('사용 가능한 명령어:');
    console.log('  /help     - 도움말 보기');
    console.log('  /providers - AI 제공자 목록');
    console.log('  /start <provider> - 새 대화 시작');
    console.log('  /sessions - 세션 목록');
    console.log('  /switch <sessionId> - 세션 전환');
    console.log('  /export <sessionId> - 대화 내보내기');
    console.log('  /quit     - 종료');
    console.log('');

    // 초기 상태 확인
    try {
      const status = await this.makeRequest(
        'GET',
        '/api/ai-chat?action=status'
      );
      if (status.success) {
        console.log(
          `✅ 서버 연결 성공! (${status.data.availableProviders.length}개 AI 제공자 사용 가능)`
        );
      }
    } catch (error) {
      console.log(`❌ 서버 연결 실패: ${error.message}`);
      console.log('로컬 서버가 실행 중인지 확인해주세요.');
    }

    this.rl.prompt();
    this.rl.on('line', this.handleInput.bind(this));
    this.rl.on('close', () => {
      console.log('\n👋 AI 대화 CLI를 종료합니다.');
      process.exit(0);
    });
  }

  async handleInput(input) {
    const trimmed = input.trim();

    if (trimmed.startsWith('/')) {
      await this.handleCommand(trimmed);
    } else if (trimmed) {
      await this.sendMessage(trimmed);
    }

    this.rl.prompt();
  }

  async handleCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      switch (cmd) {
        case '/help':
          this.showHelp();
          break;

        case '/providers':
          await this.showProviders();
          break;

        case '/start':
          if (args.length === 0) {
            console.log('❌ 사용법: /start <provider>');
            console.log('예: /start google');
          } else {
            await this.startConversation(args[0], args.slice(1).join(' '));
          }
          break;

        case '/sessions':
          await this.showSessions();
          break;

        case '/switch':
          if (args.length === 0) {
            console.log('❌ 사용법: /switch <sessionId>');
          } else {
            await this.switchSession(args[0]);
          }
          break;

        case '/export':
          if (args.length === 0) {
            console.log('❌ 사용법: /export <sessionId>');
          } else {
            await this.exportSession(args[0]);
          }
          break;

        case '/quit':
        case '/exit':
          this.rl.close();
          break;

        default:
          console.log(`❌ 알 수 없는 명령어: ${cmd}`);
          console.log('도움말을 보려면 /help를 입력하세요.');
      }
    } catch (error) {
      console.log(`❌ 명령어 실행 오류: ${error.message}`);
    }
  }

  showHelp() {
    console.log('\n📖 AI 대화 CLI 도움말');
    console.log('==================');
    console.log('/help              - 이 도움말 표시');
    console.log('/providers         - 사용 가능한 AI 제공자 목록');
    console.log('/start <provider>  - 새로운 대화 세션 시작');
    console.log('/sessions          - 모든 대화 세션 목록');
    console.log('/switch <id>       - 다른 세션으로 전환');
    console.log('/export <id>       - 대화 기록 내보내기');
    console.log('/quit              - CLI 종료');
    console.log('');
    console.log('💬 일반 메시지를 입력하면 현재 활성 AI와 대화합니다.');
    console.log('');
  }

  async showProviders() {
    try {
      const result = await this.makeRequest(
        'GET',
        '/api/ai-chat?action=providers'
      );
      if (result.success) {
        console.log('\n🤖 사용 가능한 AI 제공자:');
        result.data.providers.forEach((provider, index) => {
          console.log(`  ${index + 1}. ${provider.name} (${provider.model})`);
          console.log(
            `     키워드: ${provider.name.toLowerCase().split(' ')[0]}`
          );
        });
        console.log('');
      } else {
        console.log(`❌ 제공자 목록 조회 실패: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
  }

  async startConversation(provider, title) {
    try {
      const result = await this.makeRequest('POST', '/api/ai-chat', {
        action: 'start',
        provider: provider,
        title: title || undefined,
      });

      if (result.success) {
        this.currentSessionId = result.data.sessionId;
        this.currentProvider = provider;
        console.log(`🚀 ${result.message}`);
        console.log(`세션 ID: ${this.currentSessionId}`);
        console.log('이제 메시지를 입력하여 AI와 대화할 수 있습니다.');
      } else {
        console.log(`❌ 대화 시작 실패: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
  }

  async sendMessage(message) {
    if (!this.currentSessionId) {
      console.log(
        '❌ 활성 세션이 없습니다. /start 명령어로 대화를 시작하세요.'
      );
      return;
    }

    try {
      console.log(`\n👤 사용자: ${message}`);
      console.log('🤖 AI가 응답을 생성 중...');

      const startTime = Date.now();
      const result = await this.makeRequest('POST', '/api/ai-chat', {
        action: 'send',
        message: message,
        sessionId: this.currentSessionId,
      });

      const responseTime = Date.now() - startTime;

      if (result.success) {
        const response = result.data.response;
        console.log(`\n🤖 ${this.currentProvider} AI: ${response.content}`);

        if (response.metadata) {
          console.log(
            `📊 토큰: ${response.metadata.tokensUsed || 0}, 시간: ${responseTime}ms, 신뢰도: ${Math.round((response.metadata.confidence || 0) * 100)}%`
          );
        }
        console.log('');
      } else {
        console.log(`❌ 메시지 전송 실패: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
  }

  async showSessions() {
    try {
      const result = await this.makeRequest(
        'GET',
        '/api/ai-chat?action=sessions'
      );
      if (result.success) {
        const sessions = result.data.sessions;
        if (sessions.length === 0) {
          console.log('📝 저장된 세션이 없습니다.');
          return;
        }

        console.log('\n📝 대화 세션 목록:');
        sessions.forEach((session, index) => {
          const current = session.id === this.currentSessionId ? ' (현재)' : '';
          const status = session.isActive ? '🟢' : '🔴';
          console.log(`  ${index + 1}. ${status} ${session.title}${current}`);
          console.log(`     ID: ${session.id}`);
          console.log(`     제공자: ${session.provider}`);
          console.log(`     메시지: ${session.messages.length}개`);
          console.log(
            `     수정: ${new Date(session.updatedAt).toLocaleString('ko-KR')}`
          );
          console.log('');
        });
      } else {
        console.log(`❌ 세션 목록 조회 실패: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
  }

  async switchSession(sessionId) {
    try {
      const result = await this.makeRequest('POST', '/api/ai-chat', {
        action: 'switch',
        sessionId: sessionId,
      });

      if (result.success) {
        this.currentSessionId = sessionId;
        this.currentProvider = result.data.currentSession.provider;
        console.log(
          `✅ 세션을 전환했습니다: ${result.data.currentSession.title}`
        );
      } else {
        console.log(`❌ 세션 전환 실패: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
  }

  async exportSession(sessionId) {
    try {
      const result = await this.makeRequest('POST', '/api/ai-chat', {
        action: 'export',
        sessionId: sessionId,
        format: 'text',
      });

      if (result.success) {
        console.log('\n📄 대화 기록:');
        console.log('='.repeat(50));
        console.log(result.data.exportData);
        console.log('='.repeat(50));
      } else {
        console.log(`❌ 대화 기록 내보내기 실패: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ 네트워크 오류: ${error.message}`);
    }
  }
}

// CLI 실행
if (require.main === module) {
  const cli = new AIChatCLI();
  cli.start().catch(console.error);
}

module.exports = AIChatCLI;
