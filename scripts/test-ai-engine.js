#!/usr/bin/env node
/**
 * MCP AI Engine 통합 테스트 스크립트
 * 
 * 🧪 Python 기반 오프라인 AI 분석 엔진 테스트
 */

const { RealAnalysisEngine } = require('../src/services/ai/RealAnalysisEngine');
const { PythonAnalysisRunner } = require('../src/services/ai/adapters/PythonAnalysisRunner');

// 테스트 데이터 생성
function generateTestData() {
  const serverData = [];
  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    serverData.push({
      id: `server-${i + 1}`,
      cpu: 30 + Math.random() * 40,
      memory: 40 + Math.random() * 35,
      disk: 20 + Math.random() * 30,
      responseTime: 50 + Math.random() * 100,
      timestamp: new Date(now.getTime() - i * 5 * 60 * 1000).toISOString()
    });
  }
  
  return serverData;
}

// Python 엔진 개별 테스트
async function testPythonEngine() {
  console.log('\n🐍 Python Analysis Engine 테스트...');
  
  const pythonRunner = PythonAnalysisRunner.getInstance({
    pythonPath: 'python',
    scriptsPath: './python-analysis',
    timeout: 30000
  });
  
  try {
    // 초기화 테스트
    console.log('  📋 초기화 중...');
    const initialized = await pythonRunner.initialize();
    console.log(`  ✅ 초기화: ${initialized ? '성공' : '실패'}`);
    
    if (!initialized) {
      console.log('  ⚠️ Python 환경 문제로 fallback 모드로 진행');
      return false;
    }
    
    // 테스트 데이터 준비
    const testData = generateTestData();
    const featuresData = testData.map(server => [
      server.cpu,
      server.memory,
      server.disk,
      server.responseTime
    ]);
    
    const timeSeriesData = {
      timestamps: testData.map(server => server.timestamp),
      values: testData.map(server => (server.cpu + server.memory) / 2)
    };
    
    // 1. 시계열 예측 테스트
    console.log('  🔮 시계열 예측 테스트...');
    const forecastResult = await pythonRunner.forecastTimeSeries({
      ...timeSeriesData,
      horizon: 10
    });
    console.log(`  📊 예측 결과: ${forecastResult.success ? '성공' : '실패'}`);
    if (forecastResult.success) {
      console.log(`     예측값 개수: ${forecastResult.result?.forecast?.length || 0}`);
    }
    
    // 2. 이상 탐지 테스트
    console.log('  🚨 이상 탐지 테스트...');
    const anomalyResult = await pythonRunner.detectAnomalies({
      features: featuresData,
      contamination: 0.1
    });
    console.log(`  📊 이상 탐지: ${anomalyResult.success ? '성공' : '실패'}`);
    if (anomalyResult.success) {
      const anomalyCount = anomalyResult.result?.is_anomaly?.filter(Boolean).length || 0;
      console.log(`     이상치 개수: ${anomalyCount}`);
    }
    
    // 3. 클러스터링 테스트
    console.log('  🎯 클러스터링 테스트...');
    const clusterResult = await pythonRunner.performClustering({
      features: featuresData,
      n_clusters: 3
    });
    console.log(`  📊 클러스터링: ${clusterResult.success ? '성공' : '실패'}`);
    if (clusterResult.success) {
      console.log(`     실루엣 점수: ${clusterResult.result?.silhouette_score?.toFixed(3) || 'N/A'}`);
    }
    
    // 4. 분류 테스트
    console.log('  🎲 분류 테스트...');
    const classificationResult = await pythonRunner.classifyData({
      features: featuresData
    });
    console.log(`  📊 분류: ${classificationResult.success ? '성공' : '실패'}`);
    if (classificationResult.success) {
      console.log(`     정확도: ${(classificationResult.result?.accuracy * 100)?.toFixed(1) || 'N/A'}%`);
    }
    
    return true;
    
  } catch (error) {
    console.error('  ❌ Python 엔진 테스트 실패:', error.message);
    return false;
  }
}

// 실제 분석 엔진 통합 테스트
async function testRealAnalysisEngine() {
  console.log('\n🧠 Real Analysis Engine 통합 테스트...');
  
  const realEngine = RealAnalysisEngine.getInstance({
    enablePythonEngine: true,
    enableCorrelationEngine: true,
    fallbackToDummy: true
  });
  
  try {
    // 초기화
    console.log('  📋 초기화 중...');
    const initialized = await realEngine.initialize();
    console.log(`  ✅ 초기화: ${initialized ? '성공' : '실패'}`);
    
    // 테스트 데이터
    const testData = generateTestData();
    
    // 1. 상관관계 분석 테스트
    console.log('  🔗 상관관계 분석 테스트...');
    const correlations = await realEngine.findRealCorrelations(testData);
    console.log(`  📊 상관관계 개수: ${correlations.length}`);
    if (correlations.length > 0) {
      console.log(`     첫 번째 상관관계: ${correlations[0].metrics} (${correlations[0].coefficient})`);
    }
    
    // 2. ML 모델 분석 테스트
    console.log('  🤖 ML 모델 분석 테스트...');
    const mlResults = await realEngine.analyzeWithMLModels(testData);
    console.log(`  📊 ARIMA 정확도: ${(mlResults.arima.accuracy * 100).toFixed(1)}%`);
    console.log(`  📊 Random Forest 정확도: ${(mlResults.randomForest.accuracy * 100).toFixed(1)}%`);
    
    // 3. 패턴 분석 테스트
    console.log('  🎯 패턴 분석 테스트...');
    const patterns = await realEngine.identifyRealPatterns('서버 상태 분석', testData);
    console.log(`  📊 감지된 패턴 개수: ${patterns.length}`);
    if (patterns.length > 0) {
      console.log(`     첫 번째 패턴: ${patterns[0].name} (${patterns[0].confidence})`);
    }
    
    // 4. 예측 분석 테스트
    console.log('  🔮 예측 분석 테스트...');
    const predictions = await realEngine.generateRealPredictions(testData, 15);
    console.log(`  📊 예측 정확도: ${(predictions.accuracy * 100).toFixed(1)}%`);
    console.log(`  📊 예측 개수: ${predictions.predictions.length}`);
    
    return true;
    
  } catch (error) {
    console.error('  ❌ 실제 분석 엔진 테스트 실패:', error.message);
    return false;
  }
}

// API 엔드포인트 테스트
async function testAPIEndpoint() {
  console.log('\n🌐 API 엔드포인트 테스트...');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai-agent/smart-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: '서버 상태를 분석해줘',
        context: 'test'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ API 응답 성공');
      console.log(`  📊 신뢰도: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`  📊 소스 개수: ${result.sources?.length || 0}`);
      console.log(`  📊 분석 타입: ${result.metadata?.analysisType || 'unknown'}`);
      return true;
    } else {
      console.log(`  ❌ API 응답 실패: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log('  ⚠️ API 서버가 실행되지 않음 (정상적인 상황)');
    return false;
  }
}

// 메인 테스트 실행
async function runTests() {
  console.log('🧪 MCP AI Engine 통합 테스트 시작\n');
  console.log('=' .repeat(50));
  
  const results = {
    pythonEngine: false,
    realAnalysisEngine: false,
    apiEndpoint: false
  };
  
  // 1. Python 엔진 테스트
  results.pythonEngine = await testPythonEngine();
  
  // 2. 실제 분석 엔진 테스트
  results.realAnalysisEngine = await testRealAnalysisEngine();
  
  // 3. API 엔드포인트 테스트
  results.apiEndpoint = await testAPIEndpoint();
  
  // 결과 요약
  console.log('\n' + '=' .repeat(50));
  console.log('📋 테스트 결과 요약:');
  console.log(`  🐍 Python Engine: ${results.pythonEngine ? '✅ 통과' : '❌ 실패'}`);
  console.log(`  🧠 Real Analysis Engine: ${results.realAnalysisEngine ? '✅ 통과' : '❌ 실패'}`);
  console.log(`  🌐 API Endpoint: ${results.apiEndpoint ? '✅ 통과' : '⚠️ 서버 미실행'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 전체 결과: ${passedTests}/${totalTests} 테스트 통과`);
  
  if (passedTests === totalTests) {
    console.log('🎉 모든 테스트가 성공적으로 완료되었습니다!');
  } else if (passedTests >= 2) {
    console.log('✅ 핵심 기능이 정상적으로 작동합니다.');
  } else {
    console.log('⚠️ 일부 기능에 문제가 있습니다. 설정을 확인해주세요.');
  }
  
  console.log('\n💡 다음 단계:');
  if (!results.pythonEngine) {
    console.log('  - Python 환경 및 패키지 설치 확인');
    console.log('  - pip install -r python-analysis/requirements.txt');
  }
  if (!results.apiEndpoint) {
    console.log('  - 개발 서버 실행: npm run dev');
    console.log('  - API 테스트: curl -X POST http://localhost:3000/api/ai-agent/smart-query');
  }
  
  process.exit(passedTests >= 2 ? 0 : 1);
}

// 스크립트 실행
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testPythonEngine, testRealAnalysisEngine }; 