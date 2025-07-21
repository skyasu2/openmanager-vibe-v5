#!/usr/bin/env node

/**
 * 🤖 AI 시스템 상태 점검 도구
 * 현재 배포된 AI 시스템과 대화해서 상태 및 컨텍스트 구조를 점검합니다.
 */

const http = require('http');

class AISystemChecker {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.sessionId = null;
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, res => {
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

  async checkSystemStatus() {
    console.log('🔍 AI 시스템 상태 점검 시작...\n');

    try {
      // 1. 시스템 상태 확인
      console.log('1️⃣ 시스템 상태 확인');
      const status = await this.makeRequest(
        'GET',
        '/api/ai-chat?action=status'
      );

      if (status.success) {
        console.log(`✅ AI 시스템 정상 작동`);
        console.log(
          `📊 사용 가능한 AI: ${status.data.availableProviders.length}개`
        );
        console.log(
          `🕐 확인 시간: ${new Date(status.data.timestamp).toLocaleString('ko-KR')}`
        );

        status.data.availableProviders.forEach((provider, index) => {
          console.log(`   ${index + 1}. ${provider.name} (${provider.model})`);
        });
      } else {
        console.log(`❌ 시스템 상태 확인 실패: ${status.error}`);
        return;
      }

      console.log('\n');

      // 2. 새 대화 세션 시작
      console.log('2️⃣ AI와 대화 세션 시작');
      const startResult = await this.makeRequest('POST', '/api/ai-chat', {
        action: 'start',
        provider: 'google',
        title: 'OpenManager Vibe v5 시스템 점검',
      });

      if (startResult.success) {
        this.sessionId = startResult.data.sessionId;
        console.log(`✅ 대화 세션 시작됨 (ID: ${this.sessionId})`);
      } else {
        console.log(`❌ 대화 세션 시작 실패: ${startResult.error}`);
        return;
      }

      console.log('\n');

      // 3. AI 시스템 구조 점검 질문들
      const questions = [
        {
          title: '현재 시스템 아키텍처 확인',
          question: `안녕하세요! 저는 OpenManager Vibe v5 프로젝트의 개발자입니다. 
                    
현재 시스템의 AI 엔진 구조와 상태를 점검하고 싶습니다. 다음 정보를 간단히 알려주세요:

1. 현재 활성화된 AI 엔진들
2. 메인 AI 처리 흐름
3. 컨텍스트 관리 방식
4. 성능 상태

간단하고 구체적으로 답변해주세요.`,
        },
        {
          title: '컨텍스트 구조 분석',
          question: `현재 시스템의 컨텍스트 구조에 대해 분석해주세요:

1. 컨텍스트 크기 제한은 어떻게 되나요?
2. 메모리 사용량은 적절한가요?
3. 시연용으로 최적화할 부분이 있나요?
4. 개선 권장사항이 있다면?

개발 효율성 관점에서 답변해주세요.`,
        },
        {
          title: '시스템 최적화 제안',
          question: `개발 환경에서 AI 시스템을 더 효율적으로 사용하기 위한 제안을 해주세요:

1. 응답 속도 개선 방법
2. 리소스 사용량 최적화
3. 디버깅 편의성 향상
4. 시연 시 주의사항

실용적인 조언을 부탁드립니다.`,
        },
      ];

      // 질문별로 AI와 대화
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        console.log(`${i + 3}️⃣ ${q.title}`);
        console.log('질문 전송 중...');

        try {
          const response = await this.makeRequest('POST', '/api/ai-chat', {
            action: 'send',
            message: q.question,
            sessionId: this.sessionId,
          });

          if (response.success) {
            console.log('✅ AI 응답 받음');
            console.log('─'.repeat(60));
            console.log(response.data.response.content);
            console.log('─'.repeat(60));
            console.log(`⏱️ 처리 시간: ${response.data.processingTime}ms`);
          } else {
            console.log(`❌ 응답 실패: ${response.error}`);
          }
        } catch (error) {
          console.log(`❌ 네트워크 오류: ${error.message}`);
        }

        console.log('\n');

        // 다음 질문 전 잠시 대기
        if (i < questions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // 4. 세션 정보 확인
      console.log('🔍 최종 세션 상태 확인');
      const sessionInfo = await this.makeRequest(
        'GET',
        `/api/ai-chat?action=session&sessionId=${this.sessionId}`
      );

      if (sessionInfo.success) {
        const session = sessionInfo.data.session;
        console.log(`✅ 세션 정보:`);
        console.log(`   📝 제목: ${session.title}`);
        console.log(`   🤖 AI: ${session.provider}`);
        console.log(`   💬 메시지 수: ${session.messages.length}`);
        console.log(
          `   🕐 생성 시간: ${new Date(session.createdAt).toLocaleString('ko-KR')}`
        );
      }
    } catch (error) {
      console.log(`❌ 시스템 점검 중 오류: ${error.message}`);
    }

    console.log('\n🎯 AI 시스템 점검 완료!');
  }
}

// 실행
if (require.main === module) {
  const checker = new AISystemChecker();
  checker.checkSystemStatus().catch(error => {
    console.error('❌ 실행 오류:', error.message);
    process.exit(1);
  });
}

module.exports = AISystemChecker;
