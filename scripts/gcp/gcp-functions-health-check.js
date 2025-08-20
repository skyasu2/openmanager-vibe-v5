/**
 * 🔍 GCP Functions 상태 점검 스크립트
 * Week 1 - 기존 GCP Functions 상태 분석용
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GCP_FUNCTIONS = {
  'ai-gateway':
    'https://asia-northeast3-openmanager-ai.cloudfunctions.net/ai-gateway',
  'korean-nlp-python':
    'https://asia-northeast3-openmanager-ai.cloudfunctions.net/korean-nlp-python',
  'rule-engine':
    'https://asia-northeast3-openmanager-ai.cloudfunctions.net/rule-engine',
  'basic-ml-python':
    'https://asia-northeast3-openmanager-ai.cloudfunctions.net/basic-ml-python',
};

const VM_CONTEXT_SERVER = 'http://34.64.213.108:10001';

async function checkFunctionHealth(name, url) {
  console.log(`🔍 Checking ${name}...`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'GCP-Health-Check/1.0',
      },
    });

    clearTimeout(timeoutId);

    const status = response.ok ? '✅ ONLINE' : '⚠️ ERROR';
    const statusCode = response.status;

    console.log(`   ${status} - ${statusCode} - ${url}`);

    return {
      name,
      url,
      status: response.ok ? 'online' : 'error',
      statusCode,
      responseTime: Date.now(),
    };
  } catch (error) {
    const status = error.name === 'AbortError' ? '⏰ TIMEOUT' : '❌ OFFLINE';
    console.log(`   ${status} - ${error.message} - ${url}`);

    return {
      name,
      url,
      status: 'offline',
      error: error.message,
      responseTime: null,
    };
  }
}

async function testFunctionWithPayload(name, url) {
  console.log(`🧪 Testing ${name} with sample payload...`);

  try {
    const testPayload = {
      query: '서버 상태 확인',
      mode: 'test',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Request': 'true',
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000),
    });

    const responseText = await response.text();
    console.log(
      `   Response: ${response.status} - ${responseText.substring(0, 100)}...`
    );

    return {
      name,
      testStatus: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      responsePreview: responseText.substring(0, 200),
    };
  } catch (error) {
    console.log(`   Test failed: ${error.message}`);
    return {
      name,
      testStatus: 'error',
      error: error.message,
    };
  }
}

async function checkVMContextServer() {
  console.log(`🖥️ Checking VM Context Server...`);

  try {
    const response = await fetch(`${VM_CONTEXT_SERVER}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'VM-Health-Check/1.0',
      },
    });

    const status = response.ok ? '✅ ONLINE' : '⚠️ ERROR';
    console.log(`   ${status} - ${response.status} - ${VM_CONTEXT_SERVER}`);

    return {
      name: 'vm-context-server',
      url: VM_CONTEXT_SERVER,
      status: response.ok ? 'online' : 'error',
      statusCode: response.status,
    };
  } catch (error) {
    console.log(`   ❌ OFFLINE - ${error.message} - ${VM_CONTEXT_SERVER}`);
    return {
      name: 'vm-context-server',
      url: VM_CONTEXT_SERVER,
      status: 'offline',
      error: error.message,
    };
  }
}

async function analyzeGCPInfrastructure() {
  console.log('🚀 GCP Functions 인프라 상태 분석 시작...\n');

  const results = {
    timestamp: new Date().toISOString(),
    functions: [],
    vmServer: null,
    summary: {
      total: Object.keys(GCP_FUNCTIONS).length,
      online: 0,
      offline: 0,
      errors: 0,
    },
  };

  // 1. GCP Functions Health Check
  console.log('📦 GCP Functions Health Check:');
  for (const [name, url] of Object.entries(GCP_FUNCTIONS)) {
    const result = await checkFunctionHealth(name, url);
    results.functions.push(result);

    if (result.status === 'online') results.summary.online++;
    else if (result.status === 'offline') results.summary.offline++;
    else results.summary.errors++;
  }

  // 2. VM Context Server Check
  console.log('\n🖥️ VM Context Server Check:');
  results.vmServer = await checkVMContextServer();

  // 3. Function Payload Testing (온라인인 것들만)
  console.log('\n🧪 Function Payload Testing:');
  const onlineFunctions = results.functions.filter(f => f.status === 'online');

  if (onlineFunctions.length > 0) {
    for (const func of onlineFunctions) {
      const testResult = await testFunctionWithPayload(func.name, func.url);
      func.testResult = testResult;
    }
  } else {
    console.log('   ⚠️ No online functions to test');
  }

  // 4. 결과 요약
  console.log('\n📊 분석 결과 요약:');
  console.log(`   총 Functions: ${results.summary.total}`);
  console.log(`   온라인: ${results.summary.online}`);
  console.log(`   오프라인: ${results.summary.offline}`);
  console.log(`   에러: ${results.summary.errors}`);
  console.log(`   VM 서버: ${results.vmServer.status}`);

  // 5. 권장사항
  console.log('\n💡 권장사항:');
  if (results.summary.online === 0) {
    console.log('   🔥 모든 GCP Functions가 비활성화되어 있습니다');
    console.log('   📝 새로운 Functions 배포가 필요합니다');
    console.log('   🏗️ Python 환경 설정부터 시작해야 합니다');
  } else {
    console.log(`   ✅ ${results.summary.online}개 Functions 활성화됨`);
    console.log('   🔧 비활성화된 Functions 재배포 필요');
    console.log('   📈 활성화된 Functions 업그레이드 고려');
  }

  return results;
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeGCPInfrastructure()
    .then(results => {
      console.log('\n📁 결과를 JSON 파일로 저장...');
      const reportPath = path.join(
        __dirname,
        '..',
        'gcp-functions-health-report.json'
      );
      fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
      console.log('✅ 저장 완료: gcp-functions-health-report.json');
    })
    .catch(error => {
      console.error('❌ 분석 실패:', error);
      process.exit(1);
    });
}

export { analyzeGCPInfrastructure, checkFunctionHealth };
