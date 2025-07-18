#!/usr/bin/env node

/**
 * 🎯 Gemini 시스템 명령 처리기
 * 
 * Gemini CLI의 인터랙티브 명령(/stats, /clear, /memory 등)을
 * 자체적으로 구현하여 TTY 환경 없이도 동작하도록 함
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GeminiSystemCommands {
  constructor(options = {}) {
    this.dataDir = options.dataDir || join(homedir(), '.gemini-dev-tools');
    this.usageFile = join(this.dataDir, 'usage.json');
    this.memoryFile = join(this.dataDir, 'memory.json');
    this.contextFile = join(this.dataDir, 'context.json');
    
    // 데이터 디렉토리 생성
    this.ensureDataDir();
  }

  /**
   * 데이터 디렉토리 생성
   */
  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error.message);
    }
  }

  /**
   * 사용량 통계 관리
   */
  async getStats() {
    try {
      const usage = await this.loadUsage();
      const today = new Date().toISOString().split('T')[0];
      const todayUsage = usage.daily[today] || { requests: 0, tokens: 0 };
      
      return `📊 **Gemini 사용량 통계**
      
🗓️ 오늘 (${today})
- 요청 횟수: ${todayUsage.requests}회
- 토큰 사용량: ${todayUsage.tokens.toLocaleString()} 토큰
- 남은 요청: ${Math.max(0, 1000 - todayUsage.requests)}회

📈 이번 달 총계
- 총 요청: ${usage.monthly.requests}회
- 총 토큰: ${usage.monthly.tokens.toLocaleString()} 토큰

💡 일일 제한: 1,000회
⏰ 마지막 업데이트: ${new Date(usage.lastUpdated).toLocaleString('ko-KR')}`;
    } catch (error) {
      return '❌ 사용량 통계를 불러올 수 없습니다. 아직 기록된 데이터가 없을 수 있습니다.';
    }
  }

  /**
   * 사용량 기록
   */
  async recordUsage(tokens = 0) {
    try {
      const usage = await this.loadUsage();
      const today = new Date().toISOString().split('T')[0];
      const month = today.substring(0, 7);
      
      // 일일 사용량 업데이트
      if (!usage.daily[today]) {
        usage.daily[today] = { requests: 0, tokens: 0 };
      }
      usage.daily[today].requests += 1;
      usage.daily[today].tokens += tokens;
      
      // 월간 사용량 업데이트
      if (usage.currentMonth !== month) {
        usage.monthly = { requests: 0, tokens: 0 };
        usage.currentMonth = month;
      }
      usage.monthly.requests += 1;
      usage.monthly.tokens += tokens;
      
      usage.lastUpdated = new Date().toISOString();
      
      await this.saveUsage(usage);
    } catch (error) {
      console.error('Failed to record usage:', error.message);
    }
  }

  /**
   * 컨텍스트 초기화
   */
  async clearContext() {
    try {
      await fs.writeFile(this.contextFile, JSON.stringify({
        messages: [],
        clearedAt: new Date().toISOString()
      }, null, 2));
      
      return `✅ 컨텍스트가 초기화되었습니다.
      
🧹 초기화된 항목:
- 대화 기록
- 임시 컨텍스트
- 캐시된 응답

💡 메모리에 저장된 정보는 유지됩니다.`;
    } catch (error) {
      return `❌ 컨텍스트 초기화 실패: ${error.message}`;
    }
  }

  /**
   * 메모리 관리
   */
  async memoryCommand(subCommand, ...args) {
    switch (subCommand) {
      case 'list':
        return await this.listMemory();
      case 'add':
        return await this.addMemory(args.join(' '));
      case 'remove':
        return await this.removeMemory(args[0]);
      case 'clear':
        return await this.clearMemory();
      default:
        return this.getMemoryHelp();
    }
  }

  /**
   * 메모리 목록 조회
   */
  async listMemory() {
    try {
      const memory = await this.loadMemory();
      
      if (memory.facts.length === 0) {
        return '📝 저장된 메모리가 없습니다.';
      }
      
      let result = '📝 **저장된 메모리**\n\n';
      memory.facts.forEach((fact, index) => {
        result += `${index + 1}. ${fact.content}\n   📅 ${new Date(fact.createdAt).toLocaleString('ko-KR')}\n\n`;
      });
      
      return result;
    } catch (error) {
      return '❌ 메모리를 불러올 수 없습니다.';
    }
  }

  /**
   * 메모리 추가
   */
  async addMemory(content) {
    if (!content || content.trim() === '') {
      return '❌ 저장할 내용을 입력해주세요.';
    }
    
    try {
      const memory = await this.loadMemory();
      memory.facts.push({
        id: Date.now().toString(),
        content: content.trim(),
        createdAt: new Date().toISOString()
      });
      
      await this.saveMemory(memory);
      return `✅ 메모리에 저장되었습니다: "${content.trim()}"`;
    } catch (error) {
      return `❌ 메모리 저장 실패: ${error.message}`;
    }
  }

  /**
   * 메모리 제거
   */
  async removeMemory(index) {
    try {
      const memory = await this.loadMemory();
      const idx = parseInt(index) - 1;
      
      if (isNaN(idx) || idx < 0 || idx >= memory.facts.length) {
        return '❌ 유효하지 않은 번호입니다.';
      }
      
      const removed = memory.facts.splice(idx, 1)[0];
      await this.saveMemory(memory);
      
      return `✅ 메모리에서 제거되었습니다: "${removed.content}"`;
    } catch (error) {
      return `❌ 메모리 제거 실패: ${error.message}`;
    }
  }

  /**
   * 전체 메모리 초기화
   */
  async clearMemory() {
    try {
      await fs.writeFile(this.memoryFile, JSON.stringify({
        facts: [],
        clearedAt: new Date().toISOString()
      }, null, 2));
      
      return '✅ 모든 메모리가 초기화되었습니다.';
    } catch (error) {
      return `❌ 메모리 초기화 실패: ${error.message}`;
    }
  }

  /**
   * 메모리 도움말
   */
  getMemoryHelp() {
    return `📝 **메모리 명령어**

사용법:
- \`memory list\` - 저장된 메모리 목록 보기
- \`memory add "내용"\` - 새로운 정보 저장
- \`memory remove <번호>\` - 특정 메모리 제거
- \`memory clear\` - 모든 메모리 초기화

예시:
- \`memory add "프로젝트는 Next.js 15를 사용합니다"\`
- \`memory remove 3\``;
  }

  /**
   * 도움말
   */
  getHelp() {
    return `🚀 **Gemini 개발 도구 시스템 명령어**

📊 사용량 관리
- \`stats\` - 사용량 통계 확인

🧹 컨텍스트 관리
- \`clear\` - 대화 컨텍스트 초기화

📝 메모리 관리
- \`memory list\` - 저장된 메모리 보기
- \`memory add "내용"\` - 정보 저장
- \`memory remove <번호>\` - 메모리 제거
- \`memory clear\` - 전체 초기화

💡 참고: 이 명령어들은 Gemini CLI의 인터랙티브 명령을 대체하는 자체 구현입니다.`;
  }

  /**
   * 사용량 데이터 로드
   */
  async loadUsage() {
    try {
      const data = await fs.readFile(this.usageFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // 파일이 없으면 초기 데이터 생성
      return {
        daily: {},
        monthly: { requests: 0, tokens: 0 },
        currentMonth: new Date().toISOString().substring(0, 7),
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * 사용량 데이터 저장
   */
  async saveUsage(usage) {
    await fs.writeFile(this.usageFile, JSON.stringify(usage, null, 2));
  }

  /**
   * 메모리 데이터 로드
   */
  async loadMemory() {
    try {
      const data = await fs.readFile(this.memoryFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // 파일이 없으면 초기 데이터 생성
      return {
        facts: [],
        createdAt: new Date().toISOString()
      };
    }
  }

  /**
   * 메모리 데이터 저장
   */
  async saveMemory(memory) {
    await fs.writeFile(this.memoryFile, JSON.stringify(memory, null, 2));
  }
}

export default GeminiSystemCommands;

// CLI로 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  const commands = new GeminiSystemCommands();
  const [command, ...args] = process.argv.slice(2);
  
  (async () => {
    let result;
    
    switch (command) {
      case 'stats':
        result = await commands.getStats();
        break;
      case 'clear':
        result = await commands.clearContext();
        break;
      case 'memory':
        result = await commands.memoryCommand(...args);
        break;
      case 'help':
      default:
        result = commands.getHelp();
    }
    
    console.log(result);
  })();
}