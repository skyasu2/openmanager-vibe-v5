#!/usr/bin/env node

/**
 * 🚀 Vercel 환경변수 자동 설정 스크립트
 * 
 * 로컬에서 성공한 AI 자연어 질의 기능을 Vercel 배포에서도 동작하도록
 * 필요한 모든 환경변수를 설정합니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel AI 자연어 질의 기능 환경변수 설정 시작...\n');

// 필수 환경변수 목록 (로컬 테스트에서 성공한 설정)
// 실제 값은 .env.local에서 읽어옵니다
const requiredEnvVars = {
    // 🌍 기본 환경 설정
    'NODE_ENV': 'production',
    'NEXT_TELEMETRY_DISABLED': '1',
    'SKIP_ENV_VALIDATION': 'true',

    // 🗄️ Supabase 설정 (필수 - 로컬에서 검증됨)
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnswjnltnhpsueosfhmw.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    'SUPABASE_URL': process.env.SUPABASE_URL || 'https://vnswjnltnhpsueosfhmw.supabase.co',
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    'SUPABASE_JWT_SECRET': process.env.SUPABASE_JWT_SECRET || '',

    // 🔴 Redis 설정 (Upstash - 로컬에서 검증됨)
    'REDIS_URL': process.env.REDIS_URL || '',
    'UPSTASH_REDIS_REST_URL': process.env.UPSTASH_REDIS_REST_URL || 'https://charming-condor-46598.upstash.io',
    'UPSTASH_REDIS_REST_TOKEN': process.env.UPSTASH_REDIS_REST_TOKEN || '',
    'KV_REST_API_URL': process.env.KV_REST_API_URL || 'https://charming-condor-46598.upstash.io',
    'KV_REST_API_TOKEN': process.env.KV_REST_API_TOKEN || '',

    // 🤖 AI 엔진 설정 (자연어 질의 핵심)
    'AI_ASSISTANT_ENABLED': 'true',
    'AI_ENGINE_TIMEOUT': '8000',
    'AI_CACHE_ENABLED': 'true',
    'AI_CACHE_TTL': '300000',

    // 🚀 Vercel 최적화 설정 (로컬/Vercel 통일)
    'DATA_GENERATOR_ENABLED': 'true',
    'MAX_SERVERS': '15',
    'UPDATE_INTERVAL': '30000',
    'SERVER_MONITORING_ENABLED': 'true',
    'AUTO_REPORTING_ENABLED': 'true',

    // 🔐 보안 설정
    'JWT_SECRET': 'openmanager-vibe-v5-secret-key-production',
    'VERCEL_AUTOMATION_BYPASS_SECRET': process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '',

    // 📊 Google AI (선택적)
    'GOOGLE_AI_API_KEY': process.env.GOOGLE_AI_API_KEY || '',
    'GOOGLE_AI_ENABLED': 'false', // 무료 모델 전용 모드
    'GOOGLE_AI_MODEL': 'gemini-1.5-flash',

    // 📧 알림 설정 (Slack)
    'SLACK_WEBHOOK_URL': process.env.SLACK_WEBHOOK_URL || '',

    // 🔄 MCP 서버
    'MCP_REMOTE_URL': process.env.MCP_REMOTE_URL || 'https://openmanager-vibe-v5.gcp.run'
};

/**
 * .env.local 파일에서 환경변수 로드
 */
function loadLocalEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const envLines = envContent.split('\n');

            envLines.forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    process.env[key.trim()] = value;
                }
            });

            console.log('✅ .env.local 파일에서 환경변수 로드됨');
        } else {
            console.log('⚠️ .env.local 파일이 없습니다. 기본값을 사용합니다.');
        }
    } catch (error) {
        console.log('⚠️ .env.local 로드 실패:', error.message);
    }
}

/**
 * Vercel CLI가 설치되어 있는지 확인
 */
function checkVercelCLI() {
    try {
        execSync('vercel --version', { stdio: 'pipe' });
        console.log('✅ Vercel CLI 확인됨');
        return true;
    } catch (error) {
        console.log('❌ Vercel CLI가 설치되지 않았습니다.');
        console.log('📦 설치 명령어: npm i -g vercel');
        return false;
    }
}

/**
 * 현재 Vercel 프로젝트 확인
 */
function checkVercelProject() {
    try {
        const projectConfig = fs.readFileSync('.vercel/project.json', 'utf8');
        const project = JSON.parse(projectConfig);
        console.log(`✅ Vercel 프로젝트 확인됨: ${project.projectId}`);
        return true;
    } catch (error) {
        console.log('❌ Vercel 프로젝트가 연결되지 않았습니다.');
        console.log('🔗 연결 명령어: vercel link');
        return false;
    }
}

/**
 * 환경변수 설정
 */
async function setEnvironmentVariables() {
    console.log('\n🔧 환경변수 설정 시작...\n');

    let successCount = 0;
    let failCount = 0;

    for (const [key, value] of Object.entries(requiredEnvVars)) {
        // 빈 값이면 건너뛰기
        if (!value || value === '') {
            console.log(`  ⏭️ ${key} 건너뛰기 (값 없음)`);
            continue;
        }

        try {
            // Production, Preview, Development 환경 모두에 설정
            const environments = ['production', 'preview', 'development'];

            for (const env of environments) {
                const command = `vercel env add ${key} ${env} --force`;
                console.log(`  📝 ${key} (${env})...`);

                // 환경변수 값을 stdin으로 전달
                execSync(command, {
                    input: value,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
            }

            console.log(`  ✅ ${key} 설정 완료`);
            successCount++;
        } catch (error) {
            console.log(`  ❌ ${key} 설정 실패`);
            failCount++;
        }
    }

    console.log(`\n📊 환경변수 설정 결과:`);
    console.log(`  ✅ 성공: ${successCount}개`);
    console.log(`  ❌ 실패: ${failCount}개`);

    return { successCount, failCount };
}

/**
 * 배포 트리거
 */
function triggerDeployment() {
    console.log('\n🚀 배포 트리거 중...');

    try {
        execSync('vercel --prod', { stdio: 'inherit' });
        console.log('✅ 배포 완료');
        return true;
    } catch (error) {
        console.log(`❌ 배포 실패`);
        return false;
    }
}

/**
 * 테스트 페이지 생성
 */
function createTestPage() {
    console.log('\n🔄 테스트 페이지 확인 중...');

    const testPagePath = path.join('public', 'test-vercel-ai-natural-query.html');

    if (fs.existsSync(testPagePath)) {
        console.log('✅ 테스트 페이지가 이미 존재합니다.');
        return true;
    }

    console.log('⚠️ 테스트 페이지가 없습니다. 수동으로 생성해주세요.');
    console.log(`📍 테스트 URL: https://your-vercel-domain.vercel.app/test-vercel-ai-natural-query.html`);

    return false;
}

/**
 * 메인 실행 함수
 */
async function main() {
    console.log('🎯 목표: 로컬에서 성공한 AI 자연어 질의 기능을 Vercel에서도 동작하게 하기\n');

    // 0. 로컬 환경변수 로드
    loadLocalEnv();

    // 1. 사전 확인
    if (!checkVercelCLI()) {
        process.exit(1);
    }

    if (!checkVercelProject()) {
        process.exit(1);
    }

    // 2. 환경변수 설정
    const { successCount, failCount } = await setEnvironmentVariables();

    if (failCount > 0) {
        console.log('\n⚠️ 일부 환경변수 설정에 실패했습니다.');
        console.log('수동으로 Vercel 대시보드에서 설정해주세요:');
        console.log('https://vercel.com/dashboard/project-name/settings/environment-variables');
    }

    // 3. 테스트 페이지 확인
    createTestPage();

    // 4. 배포 트리거 (선택적)
    const shouldDeploy = process.argv.includes('--deploy');
    if (shouldDeploy) {
        const deploySuccess = triggerDeployment();

        if (deploySuccess) {
            console.log('\n🎉 설정 완료! 다음 단계:');
            console.log('1. 배포가 완료될 때까지 기다리세요 (약 2-3분)');
            console.log('2. https://your-vercel-domain.vercel.app/test-vercel-ai-natural-query.html 에서 테스트');
            console.log('3. "자연어 질의 실행" 버튼으로 기능 확인');
        }
    } else {
        console.log('\n✅ 환경변수 설정 완료!');
        console.log('🚀 배포하려면: node scripts/vercel-env-setup.js --deploy');
    }
}

// 스크립트 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { requiredEnvVars, setEnvironmentVariables }; 