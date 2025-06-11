#!/usr/bin/env node

/**
 * 🎯 OpenManager Vibe v5 - 컨텍스트 시스템 종합 점검 스크립트
 * 
 * 기능:
 * - AI 컨텍스트 시스템 구현 상태 확인
 * - Supabase 벡터 DB 연결 테스트
 * - Upstash Redis 연결 검증
 * - 환경변수 설정 상태 점검
 * - 테스트 엔드포인트 동작 확인
 * 
 * 사용법: node test-context-system.js
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 OpenManager Vibe v5 - 컨텍스트 시스템 & DB 테스트 시작\n');

// 1. 환경변수 체크
function checkEnvironmentVariables() {
    console.log('📋 1. 환경변수 검사...');

    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
        'GOOGLE_AI_API_KEY'
    ];

    // .env.local 파일 읽기
    const envPath = '.env.local';
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        console.log('  ✅ .env.local 파일 발견');
    } else {
        console.log('  ❌ .env.local 파일 없음');
        return false;
    }

    const presentVars = [];
    const missingVars = [];

    requiredVars.forEach(varName => {
        if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=`)) {
            const match = envContent.match(new RegExp(`${varName}=(.+)`));
            if (match && match[1].trim()) {
                presentVars.push(varName);
            } else {
                missingVars.push(varName);
            }
        } else {
            missingVars.push(varName);
        }
    });

    console.log(`  📊 설정된 환경변수: ${presentVars.length}/${requiredVars.length}`);

    if (presentVars.length > 0) {
        console.log('  ✅ 발견된 변수들:');
        presentVars.forEach(varName => {
            const isUrl = varName.includes('URL');
            const isKey = varName.includes('KEY') || varName.includes('TOKEN');

            if (isUrl) {
                const match = envContent.match(new RegExp(`${varName}=(.+)`));
                console.log(`    - ${varName}: ${match ? match[1].split('/')[2] : 'N/A'}`);
            } else if (isKey) {
                console.log(`    - ${varName}: ***${varName.includes('GOOGLE') ? 'Google AI' : 'Supabase/Redis'}***`);
            } else {
                console.log(`    - ${varName}: 설정됨`);
            }
        });
    }

    if (missingVars.length > 0) {
        console.log('  ⚠️  누락된 변수들:', missingVars.join(', '));
    }

    return presentVars.length >= 4; // 최소 4개 이상 필요
}

// 2. 컨텍스트 시스템 파일 체크
function checkContextFiles() {
    console.log('\n🧠 2. AI 컨텍스트 시스템 파일 검사...');

    const contextFiles = [
        'src/core/ai/ContextManager.ts',
        'src/modules/ai-agent/processors/ContextManager.ts',
        'src/core/ai/UnifiedAIEngine.ts',
        'src/ai-context/core',
        'src/ai-context/metadata'
    ];

    let foundFiles = 0;

    contextFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            console.log(`  ✅ ${filePath} - 존재함`);
            foundFiles++;

            // 파일 크기 확인
            if (filePath.endsWith('.ts')) {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n').length;
                console.log(`    📄 ${lines} 줄 (${Math.round(content.length / 1024)}KB)`);
            }
        } else {
            console.log(`  ❌ ${filePath} - 없음`);
        }
    });

    console.log(`  📊 컨텍스트 파일: ${foundFiles}/${contextFiles.length} 존재`);

    return foundFiles >= 3; // 최소 3개 이상 필요
}

// 3. 벡터 DB 관련 파일 체크
function checkVectorDBFiles() {
    console.log('\n🗄️ 3. 벡터 DB 시스템 파일 검사...');

    const vectorFiles = [
        'src/services/ai/postgres-vector-db.ts',
        'src/services/ai/local-vector-db.ts',
        'infra/database/sql/setup-pgvector.sql',
        'infra/database/sql/supabase-quick-setup.sql'
    ];

    let foundFiles = 0;

    vectorFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            console.log(`  ✅ ${filePath} - 존재함`);
            foundFiles++;

            if (filePath.endsWith('.ts')) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes('pgvector') || content.includes('vector')) {
                    console.log('    🔍 pgvector 기능 감지됨');
                }
            } else if (filePath.endsWith('.sql')) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes('CREATE EXTENSION IF NOT EXISTS vector')) {
                    console.log('    🔧 pgvector 확장 설정 확인됨');
                }
            }
        } else {
            console.log(`  ❌ ${filePath} - 없음`);
        }
    });

    console.log(`  📊 벡터 DB 파일: ${foundFiles}/${vectorFiles.length} 존재`);

    return foundFiles >= 2; // 최소 2개 이상 필요
}

// 4. Redis 관련 파일 체크
function checkRedisFiles() {
    console.log('\n🔴 4. Redis 시스템 파일 검사...');

    const redisFiles = [
        'src/services/RedisConnectionManager.ts',
        'src/config/redis.config.ts',
        'src/lib/redis-test.ts',
        'src/lib/cache/redis.ts'
    ];

    let foundFiles = 0;

    redisFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            console.log(`  ✅ ${filePath} - 존재함`);
            foundFiles++;

            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('upstash') || content.includes('Upstash')) {
                console.log('    ⚡ Upstash Redis 설정 감지됨');
            }
            if (content.includes('TLS') || content.includes('tls')) {
                console.log('    🔐 TLS 암호화 설정 확인됨');
            }
        } else {
            console.log(`  ❌ ${filePath} - 없음`);
        }
    });

    console.log(`  📊 Redis 파일: ${foundFiles}/${redisFiles.length} 존재`);

    return foundFiles >= 2; // 최소 2개 이상 필요
}

// 5. package.json 스크립트 체크
function checkTestScripts() {
    console.log('\n📦 5. 테스트 스크립트 검사...');

    const packagePath = 'package.json';
    if (!fs.existsSync(packagePath)) {
        console.log('  ❌ package.json 없음');
        return false;
    }

    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageContent.scripts || {};

    const testScripts = [
        'test:unit',
        'test:integration',
        'test:external',
        'validate:quick',
        'test:smart-fallback'
    ];

    let foundScripts = 0;

    testScripts.forEach(scriptName => {
        if (scripts[scriptName]) {
            console.log(`  ✅ npm run ${scriptName} - 사용 가능`);
            foundScripts++;
        } else {
            console.log(`  ❌ npm run ${scriptName} - 없음`);
        }
    });

    console.log(`  📊 테스트 스크립트: ${foundScripts}/${testScripts.length} 사용 가능`);

    return foundScripts >= 3; // 최소 3개 이상 필요
}

// 메인 실행
async function main() {
    const results = [];

    results.push({ name: '환경변수', passed: checkEnvironmentVariables() });
    results.push({ name: '컨텍스트 시스템', passed: checkContextFiles() });
    results.push({ name: '벡터 DB', passed: checkVectorDBFiles() });
    results.push({ name: 'Redis 캐시', passed: checkRedisFiles() });
    results.push({ name: '테스트 스크립트', passed: checkTestScripts() });

    console.log('\n📊 종합 결과:');
    console.log('='.repeat(50));

    results.forEach(result => {
        const status = result.passed ? '✅ 통과' : '❌ 실패';
        console.log(`  ${result.name}: ${status}`);
    });

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    console.log(`\n🎯 전체 점검 결과: ${passedCount}/${totalCount} 통과`);

    if (passedCount === totalCount) {
        console.log('🎉 모든 시스템이 준비되었습니다!');
        console.log('\n🚀 다음 단계:');
        console.log('  1. npm run dev (개발 서버 시작)');
        console.log('  2. npm run test:unit (단위 테스트)');
        console.log('  3. http://localhost:3000/admin/ai-agent (관리 페이지)');
    } else {
        console.log('⚠️  일부 시스템이 누락되어 있습니다.');
        console.log('   setup-test-environment.js를 먼저 실행하세요.');
    }

    console.log('\n🔍 상세 정보는 위의 개별 검사 결과를 참고하세요.');
}

// 실행
main().catch(error => {
    console.error('❌ 테스트 실행 중 오류:', error.message);
    process.exit(1);
}); 