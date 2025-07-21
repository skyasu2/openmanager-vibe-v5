#!/usr/bin/env node

/**
 * 🔍 빠른 AI 로깅 시스템 테스트
 */

import chalk from 'chalk';

const DELAY = ms => new Promise(resolve => setTimeout(resolve, ms));

async function testAILogging() {
  console.log(chalk.blue('🔍 빠른 AI 로깅 시스템 테스트\n'));

  // 1. 서버 응답 대기
  console.log(chalk.yellow('⏳ 서버 시작 대기 중...'));
  let serverReady = false;
  let attempts = 0;

  while (!serverReady && attempts < 10) {
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        serverReady = true;
        console.log(chalk.green('✅ 서버 준비됨'));
      }
    } catch (error) {
      attempts++;
      console.log(chalk.gray(`   시도 ${attempts}/10...`));
      await DELAY(3000);
    }
  }

  if (!serverReady) {
    console.log(chalk.red('❌ 서버 시작 실패'));
    return;
  }

  // 2. 로깅 API 기본 테스트
  console.log(chalk.yellow('\n📝 2. 로깅 API 테스트'));

  try {
    // 새 로그 생성
    const logResponse = await fetch('http://localhost:3000/api/ai/logging', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'info',
        category: 'ai_engine',
        engine: 'test_engine',
        message: '🧪 테스트 로그 메시지',
        data: { test: true },
        metadata: { source: 'test_script' },
      }),
    });

    if (logResponse.ok) {
      console.log(chalk.green('   ✅ 로그 생성 성공'));
    } else {
      console.log(chalk.red('   ❌ 로그 생성 실패'));
    }

    // 로그 조회
    await DELAY(1000);
    const logsResponse = await fetch(
      'http://localhost:3000/api/ai/logging?type=recent&limit=5'
    );
    const logsData = await logsResponse.json();

    if (logsData.success && logsData.data.logs.length > 0) {
      console.log(
        chalk.green(`   ✅ 로그 조회 성공 (${logsData.data.logs.length}개)`)
      );
    } else {
      console.log(chalk.red('   ❌ 로그 조회 실패'));
    }
  } catch (error) {
    console.log(chalk.red('   ❌ 로깅 API 오류:', error.message));
  }

  // 3. AI 엔진 로깅 테스트
  console.log(chalk.yellow('\n🤖 3. AI 엔진 로깅 테스트'));

  try {
    const aiResponse = await fetch('http://localhost:3000/api/ai/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '시스템 상태를 확인해주세요',
        options: {
          includeThinkingLogs: true,
          preferFastAPI: false,
        },
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      console.log(chalk.green('   ✅ AI 질의 성공'));
      console.log(
        chalk.gray(
          `   📊 응답 길이: ${aiData.answer ? aiData.answer.length : 0}자`
        )
      );
      console.log(
        chalk.gray(
          `   ⏱️  처리 시간: ${aiData.metadata?.processing_time || 0}ms`
        )
      );
    } else {
      console.log(chalk.red('   ❌ AI 질의 실패'));
    }
  } catch (error) {
    console.log(chalk.red('   ❌ AI 엔진 오류:', error.message));
  }

  // 4. 사고 과정 로그 확인
  console.log(chalk.yellow('\n🧠 4. AI 사고 과정 로그 확인'));

  try {
    const thinkingResponse = await fetch(
      'http://localhost:3000/api/ai/logging?type=thinking&limit=3'
    );
    const thinkingData = await thinkingResponse.json();

    if (thinkingData.success && thinkingData.data.logs.length > 0) {
      console.log(
        chalk.green(
          `   ✅ 사고 과정 로그 발견 (${thinkingData.data.logs.length}개)`
        )
      );
      thinkingData.data.logs.forEach((log, index) => {
        console.log(
          chalk.gray(
            `   ${index + 1}. ${log.engine}: ${log.message.substring(0, 50)}...`
          )
        );
      });
    } else {
      console.log(chalk.yellow('   ⚠️  사고 과정 로그 없음'));
    }
  } catch (error) {
    console.log(chalk.red('   ❌ 사고 과정 로그 오류:', error.message));
  }

  // 5. 성능 메트릭 확인
  console.log(chalk.yellow('\n📊 5. 성능 메트릭 확인'));

  try {
    const metricsResponse = await fetch(
      'http://localhost:3000/api/ai/logging?type=metrics'
    );
    const metricsData = await metricsResponse.json();

    if (metricsData.success) {
      console.log(chalk.green('   ✅ 성능 메트릭 조회 성공'));
      console.log(
        chalk.gray(`   📈 총 엔진 수: ${metricsData.data.summary.totalEngines}`)
      );
      console.log(
        chalk.gray(`   📝 총 로그 수: ${metricsData.data.summary.totalLogs}`)
      );
    } else {
      console.log(chalk.red('   ❌ 성능 메트릭 조회 실패'));
    }
  } catch (error) {
    console.log(chalk.red('   ❌ 성능 메트릭 오류:', error.message));
  }

  console.log(chalk.green('\n🎉 빠른 테스트 완료!'));
  console.log(chalk.blue('\n📋 로깅 시스템 사용법:'));
  console.log(
    chalk.gray('   • 로그 조회: GET /api/ai/logging?type=recent&limit=100')
  );
  console.log(chalk.gray('   • 실시간 스트리밍: GET /api/ai/logging/stream'));
  console.log(chalk.gray('   • 메트릭 조회: GET /api/ai/logging?type=metrics'));
  console.log(
    chalk.gray('   • AI 사고 과정: GET /api/ai/logging?type=thinking')
  );
}

testAILogging().catch(console.error);
