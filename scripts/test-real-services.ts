#!/usr/bin/env node
/**
 * 🧪 실제 서비스 연결 테스트
 * 
 * Mock 제거 전에 실제 서비스들이 정상 작동하는지 확인
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 환경변수 로드
config({ path: '.env.local' });

interface TestResult {
  service: string;
  status: 'success' | 'error';
  message: string;
  details?: any;
}

class RealServiceTester {
  private results: TestResult[] = [];

  async testAll(): Promise<TestResult[]> {
    console.log('🔍 실제 서비스 연결 테스트 시작...\n');

    await this.testSupabase();
    await this.testGoogleAI();
    await this.testOpenAI();

    return this.results;
  }

  private async testSupabase(): Promise<void> {
    console.log('📊 Supabase 연결 테스트...');
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase 환경변수가 설정되지 않았습니다');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. 기본 연결 테스트
      const { data, error } = await supabase
        .from('command_vectors')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      // 2. RPC 함수 테스트 (pgvector 확장)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_knowledge_stats');

      this.results.push({
        service: 'Supabase',
        status: 'success',
        message: '연결 성공',
        details: {
          basicQuery: data !== null,
          rpcFunction: rpcError === null,
          url: supabaseUrl.substring(0, 30) + '...'
        }
      });

      console.log('✅ Supabase 연결 성공');

    } catch (error) {
      this.results.push({
        service: 'Supabase',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        details: { error }
      });

      console.log('❌ Supabase 연결 실패:', error);
    }
  }

  private async testGoogleAI(): Promise<void> {
    console.log('🤖 Google AI 연결 테스트...');
    
    try {
      const apiKey = process.env.GOOGLE_AI_API_KEY;

      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({ model: modelName });

      // 간단한 테스트 쿼리
      const result = await model.generateContent('Hello, this is a test. Please respond with "Test successful".');
      const response = await result.response;
      const text = response.text();

      this.results.push({
        service: 'Google AI',
        status: 'success',
        message: '연결 성공',
        details: {
          model: modelName,
          responseLength: text.length,
          apiKeyPrefix: apiKey.substring(0, 10) + '...'
        }
      });

      console.log('✅ Google AI 연결 성공');
      console.log('   응답:', text.substring(0, 50) + '...');

    } catch (error) {
      this.results.push({
        service: 'Google AI',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        details: { error }
      });

      console.log('❌ Google AI 연결 실패:', error);
    }
  }

  private async testOpenAI(): Promise<void> {
    console.log('🔍 OpenAI 설정 확인...');
    
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.results.push({
        service: 'OpenAI',
        status: 'error',
        message: 'API 키가 설정되지 않음 (사용하지 않는 서비스)',
        details: { configured: false }
      });

      console.log('⚠️  OpenAI API 키 없음 (정상 - 사용하지 않는 서비스)');
      return;
    }

    // API 키가 있다면 테스트 시도
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      this.results.push({
        service: 'OpenAI',
        status: 'success',
        message: '연결 성공 (하지만 프로젝트에서 사용하지 않음)',
        details: {
          modelsCount: data.data?.length || 0,
          configured: true
        }
      });

      console.log('✅ OpenAI 연결 성공 (하지만 사용하지 않음)');

    } catch (error) {
      this.results.push({
        service: 'OpenAI',
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        details: { error, configured: true }
      });

      console.log('❌ OpenAI 연결 실패:', error);
    }
  }

  printSummary(): void {
    console.log('\n📋 테스트 결과 요약:');
    console.log('='.repeat(50));

    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`${icon} ${result.service}: ${result.message}`);
      
      if (result.details && result.status === 'success') {
        // 성공한 경우 간단한 정보만 표시
        const { error, ...cleanDetails } = result.details;
        console.log(`   세부사항:`, JSON.stringify(cleanDetails, null, 2));
      } else if (result.details && result.status === 'error') {
        // 실패한 경우 에러 정보 표시 (단순화)
        const errorMsg = result.details.error?.message || result.details.error || '알 수 없는 오류';
        console.log(`   오류: ${errorMsg}`);
      }
    });

    const successCount = this.results.filter(r => r.status === 'success').length;
    const totalCount = this.results.length;
    const criticalServices = this.results.filter(r => 
      r.service === 'Supabase' || r.service === 'Google AI'
    );
    const criticalSuccessCount = criticalServices.filter(r => r.status === 'success').length;

    console.log('\n📊 전체 결과:');
    console.log(`   성공: ${successCount}/${totalCount}`);
    console.log(`   실패: ${totalCount - successCount}/${totalCount}`);
    console.log(`   핵심 서비스 성공: ${criticalSuccessCount}/${criticalServices.length}`);

    if (criticalSuccessCount === criticalServices.length) {
      console.log('\n🎉 핵심 서비스 연결 성공! 실제 서비스 사용 가능합니다.');
      console.log('   다음 명령어로 실제 서비스를 사용한 테스트를 실행하세요:');
      console.log('   $env:USE_REAL_SERVICES=\'true\'; npm run test:performance');
    } else {
      console.log('\n⚠️  핵심 서비스 연결 실패. 문제를 해결하거나 Mock을 사용하세요.');
    }
  }
}

/**
 * 환경변수 상태 확인
 */
function checkEnvironmentStatus(): void {
  console.log('🔍 환경변수 상태 확인:');
  console.log(`   GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '⚠️  설정됨 (사용안함)' : '✅ 없음 (정상)'}`);
  console.log('');
}

// CLI 실행
async function main() {
  checkEnvironmentStatus();
  
  const tester = new RealServiceTester();
  
  try {
    await tester.testAll();
    tester.printSummary();
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
    process.exit(1);
  }
}

// 직접 실행시에만 main 함수 호출
if (require.main === module) {
  main();
}

export { RealServiceTester };
