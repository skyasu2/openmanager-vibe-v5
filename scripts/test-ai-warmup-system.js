#!/usr/bin/env node

const fetch = require('node-fetch');

class AIWarmupTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.pythonServiceUrl = process.env.AI_ENGINE_URL || 'https://openmanager-vibe-v5.onrender.com';
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 AI 시스템 온/오프 및 웜업 테스트 시작...\n');

    try {
      await this.testPythonServiceStatus();
      await this.testPythonServiceWarmup();
      await this.testMCPSystemWarmup();
      await this.testMCPAnalysis();
      await this.testSystemOnOff();
      
      this.printSummary();
    } catch (error) {
      console.error('❌ 테스트 실행 중 오류:', error);
    }
  }

  async testPythonServiceStatus() {
    console.log('🔍 1. Python 서비스 상태 확인...');
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.pythonServiceUrl}/health`, {
        timeout: 30000
      });
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Python 서비스 활성화 (${responseTime}ms)`);
        console.log(`   상태: ${data.status}, 메시지: ${data.message}`);
        this.addResult('Python 서비스 상태', true, `${responseTime}ms`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Python 서비스 응답 없음: ${error.message}`);
      this.addResult('Python 서비스 상태', false, error.message);
    }
    console.log('');
  }

  async testPythonServiceWarmup() {
    console.log('🔥 2. Python 서비스 웜업 테스트...');
    
    try {
      // 첫 번째 요청 (콜드 스타트)
      const coldStart = Date.now();
      const coldResponse = await fetch(`${this.pythonServiceUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'warmup test - cold start',
          metrics: this.generateTestMetrics()
        }),
        timeout: 30000
      });
      const coldTime = Date.now() - coldStart;
      
      if (coldResponse.ok) {
        console.log(`✅ 콜드 스타트 분석 완료 (${coldTime}ms)`);
      }
      
      // 두 번째 요청 (웜 상태)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const warmStart = Date.now();
      const warmResponse = await fetch(`${this.pythonServiceUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'warmup test - warm start',
          metrics: this.generateTestMetrics()
        }),
        timeout: 15000
      });
      const warmTime = Date.now() - warmStart;
      
      if (warmResponse.ok) {
        console.log(`✅ 웜 상태 분석 완료 (${warmTime}ms)`);
        console.log(`   성능 개선: ${Math.round((coldTime - warmTime) / coldTime * 100)}%`);
        this.addResult('Python 웜업', true, `콜드: ${coldTime}ms, 웜: ${warmTime}ms`);
      }
    } catch (error) {
      console.log(`❌ Python 웜업 테스트 실패: ${error.message}`);
      this.addResult('Python 웜업', false, error.message);
    }
    console.log('');
  }

  async testMCPSystemWarmup() {
    console.log('🧠 3. MCP 시스템 웜업 테스트...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/mcp?action=status`, {
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ MCP 시스템 상태: ${data.status}`);
        
        if (data.engines) {
          console.log(`   Python 웜업 상태: ${data.engines.pythonWarmedUp ? '완료' : '대기중'}`);
          console.log(`   TensorFlow.js: ${data.engines.tensorflow ? '준비' : '대기'}`);
          console.log(`   Transformers.js: ${data.engines.transformers ? '준비' : '대기'}`);
          console.log(`   ONNX.js: ${data.engines.onnx ? '준비' : '대기'}`);
        }
        
        this.addResult('MCP 시스템 웜업', true, data.status);
      }
    } catch (error) {
      console.log(`❌ MCP 시스템 상태 확인 실패: ${error.message}`);
      this.addResult('MCP 시스템 웜업', false, error.message);
    }
    console.log('');
  }

  async testMCPAnalysis() {
    console.log('🎯 4. MCP 분석 기능 테스트...');
    
    const testCases = [
      {
        name: '서버 성능 예측',
        query: '서버 CPU 사용률이 높아지고 있어요',
        expectEngines: ['timeseries', 'anomaly_detection']
      },
      {
        name: '이상 탐지',
        query: '시스템에 문제가 있는지 확인해주세요',
        expectEngines: ['anomaly_detection']
      },
      {
        name: '로그 분석',
        query: '최근 에러 로그를 분석해주세요',
        expectEngines: ['nlp']
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`   🔍 ${testCase.name} 테스트...`);
        const startTime = Date.now();
        
        const response = await fetch(`${this.baseUrl}/api/ai/mcp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: testCase.query,
            context: {
              serverMetrics: this.generateTestMetrics(),
              timeRange: {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                end: new Date()
              }
            }
          }),
          timeout: 20000
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log(`   ✅ ${testCase.name} 성공 (${responseTime}ms)`);
            console.log(`      신뢰도: ${Math.round(result.data.confidence * 100)}%`);
            console.log(`      사용 엔진: ${result.data.enginesUsed.join(', ')}`);
            console.log(`      작업 수행: ${result.data.metadata.tasksExecuted}개`);
            this.addResult(`MCP ${testCase.name}`, true, `${responseTime}ms, 신뢰도: ${Math.round(result.data.confidence * 100)}%`);
          } else {
            throw new Error('분석 결과 없음');
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${testCase.name} 실패: ${error.message}`);
        this.addResult(`MCP ${testCase.name}`, false, error.message);
      }
    }
    console.log('');
  }

  async testSystemOnOff() {
    console.log('🔄 5. 시스템 온/오프 기능 테스트...');
    
    try {
      // 헬스체크
      const healthResponse = await fetch(`${this.baseUrl}/api/health`, {
        timeout: 5000
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log(`✅ 시스템 헬스체크: ${healthData.status}`);
        this.addResult('시스템 헬스체크', true, healthData.status);
      }
      
      // MCP 헬스체크
      const mcpHealthResponse = await fetch(`${this.baseUrl}/api/ai/mcp?action=health`, {
        timeout: 10000
      });
      
      if (mcpHealthResponse.ok) {
        const mcpHealthData = await mcpHealthResponse.json();
        console.log(`✅ MCP 헬스체크: ${mcpHealthData.status}`);
        console.log(`   전체 응답시간: ${mcpHealthData.totalResponseTime}ms`);
        
        if (mcpHealthData.checks) {
          for (const check of mcpHealthData.checks) {
            console.log(`   ${check.name}: ${check.status} (${check.responseTime}ms)`);
          }
        }
        
        this.addResult('MCP 헬스체크', true, `${mcpHealthData.status}, ${mcpHealthData.totalResponseTime}ms`);
      }
    } catch (error) {
      console.log(`❌ 시스템 온/오프 테스트 실패: ${error.message}`);
      this.addResult('시스템 온/오프', false, error.message);
    }
    console.log('');
  }

  generateTestMetrics() {
    return [
      {
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        cpu: 65, memory: 70, disk: 45, networkIn: 1500, networkOut: 2500
      },
      {
        timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        cpu: 72, memory: 75, disk: 46, networkIn: 1800, networkOut: 2800
      },
      {
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        cpu: 68, memory: 73, disk: 47, networkIn: 1600, networkOut: 2600
      },
      {
        timestamp: new Date().toISOString(),
        cpu: 75, memory: 78, disk: 48, networkIn: 2000, networkOut: 3000
      }
    ];
  }

  addResult(test, success, details) {
    this.testResults.push({ test, success, details });
  }

  printSummary() {
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(50));
    
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    
    console.log(`전체 테스트: ${totalCount}개`);
    console.log(`성공: ${successCount}개`);
    console.log(`실패: ${totalCount - successCount}개`);
    console.log(`성공률: ${Math.round(successCount / totalCount * 100)}%`);
    console.log('');
    
    for (const result of this.testResults) {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.details}`);
    }
    
    console.log('');
    if (successCount === totalCount) {
      console.log('🎉 모든 테스트 통과! AI 시스템이 정상 동작합니다.');
    } else {
      console.log('⚠️ 일부 테스트 실패. 위 결과를 확인하세요.');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const tester = new AIWarmupTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AIWarmupTester; 