#!/usr/bin/env node

/**
 * 🔍 MCP 서버 환경변수 진단 스크립트 (Modernized)
 * OpenManager VIBE v5 - Claude Code MCP 서버 환경변수 검증
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 출력 함수
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(color + message + colors.reset);
}

// 환경변수 파서 (Zero-dependency dotenv-like parser)
// dotenv가 없을 경우를 대비해 강력한 정규식 기반 파서 구현
function parseEnv(content) {
    const env = {};
    const lines = content.toString().split(/\r?\n/);
    
    for (const line of lines) {
        // 주석 및 공백 제거
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        // KEY=VALUE 파싱
        const match = trimmed.match(/^([^=:]+?)[=:](.*)/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();

            // 따옴표 제거 (Single/Double quotes)
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            // 인라인 주석 제거 (단, 따옴표 내부가 아닌 경우)
            // 간단한 구현을 위해 값 뒤의 # 이후는 주석으로 간주 (완벽하지 않을 수 있음)
            // 복잡한 케이스는 dotenv 라이브러리 권장
            
            env[key] = value;
        }
    }
    return env;
}

console.log('🔍 MCP 서버 환경변수 진단 시작...\n');

// 1. .env.local 로드 및 파싱
const envLocalPath = path.join(process.cwd(), '.env.local');
let envVars = {};

if (fs.existsSync(envLocalPath)) {
    try {
        const envContent = fs.readFileSync(envLocalPath, 'utf8');
        envVars = parseEnv(envContent);
        log(colors.blue, `📄 .env.local 파일 로드됨 (${Object.keys(envVars).length}개 변수)`);
    } catch (e) {
        log(colors.red, `❌ .env.local 읽기 실패: ${e.message}`);
    }
} else {
    log(colors.yellow, '⚠️ .env.local 파일이 없습니다. 시스템 환경변수만 확인합니다.');
}

// 2. 검증 대상 정의
const mcpRequirements = {
    'Context7 (Upstash)': {
        UPSTASH_REDIS_REST_URL: { required: true, desc: 'Redis REST URL' },
        UPSTASH_REDIS_REST_TOKEN: { required: true, desc: 'Redis 인증 토큰' }
    },
    'Supabase': {
        SUPABASE_URL: { required: true, desc: '프로젝트 URL' },
        NEXT_PUBLIC_SUPABASE_ANON_KEY: { required: true, desc: '공개 Anon 키 (MCP 사용)' },
        SUPABASE_SERVICE_ROLE_KEY: { required: true, desc: '서비스 롤 키 (관리자)' }
    },
    'Vercel': {
        VERCEL_TOKEN: { required: false, desc: '배포/연동용 토큰' }
    }
};

// 3. 진단 실행
console.log('\n📋 환경변수 상태 점검:');
console.log('========================');

let totalIssues = 0;

Object.entries(mcpRequirements).forEach(([service, vars]) => {
    console.log(`\n🔧 ${service}:`);
    let serviceIssues = 0;

    Object.entries(vars).forEach(([key, config]) => {
        // 우선순위: process.env > .env.local 파싱값
        const runtimeValue = process.env[key] || envVars[key];
        const isLoadedInProcess = !!process.env[key];
        const isInFile = !!envVars[key];

        if (!runtimeValue) {
            if (config.required) {
                log(colors.red, `  ❌ ${key}: 누락됨 [${config.desc}]`);
                serviceIssues++;
            } else {
                log(colors.yellow, `  ⚠️  ${key}: 누락됨 (선택사항)`);
            }
        } else {
            // 값 마스킹 처리 (보안)
            const masked = runtimeValue.length > 10 
                ? `${runtimeValue.substring(0, 4)}...${runtimeValue.substring(runtimeValue.length - 4)}`
                : '****';
                
            let statusIcon = '✅';
            let statusMsg = '정상';

            if (isInFile && !isLoadedInProcess) {
                // 파일에는 있는데 로드되지 않음 (dotenv 설정 문제 등)
                // 하지만 이 스크립트는 파일도 직접 읽으므로 "값은 존재함"으로 처리하되 경고
                statusIcon = '⚠️ ';
                statusMsg = '파일엔 존재하나 로드되지 않음 (스크립트 실행시 로드됨)';
            }

            console.log(`  ${statusIcon} ${key}: ${masked} (${statusMsg})`);
        }
    });

    if (serviceIssues === 0) {
        // log(colors.green, `  ✨ ${service} 준비 완료`);
    } else {
        totalIssues += serviceIssues;
    }
});

// 4. 네트워크 연결 테스트 (DNS)
console.log('\n🌐 네트워크 연결 진단:');
console.log('=======================');

function checkDns(url, serviceName) {
    if (!url) {
        log(colors.yellow, `  ⚠️  ${serviceName}: URL이 없어 테스트 건너뜀`);
        return false;
    }
    
    try {
        // http://, https:// 제거
        const hostname = url.replace(/https?:\/\//, '').split('/')[0];
        execSync(`nslookup ${hostname}`, { stdio: 'ignore', timeout: 3000 });
        log(colors.green, `  ✅ ${serviceName}: 연결 가능 (${hostname})`);
        return true;
    } catch (e) {
        log(colors.red, `  ❌ ${serviceName}: DNS 조회 실패`);
        return false;
    }
}

// Context7 연결 확인
checkDns(process.env.UPSTASH_REDIS_REST_URL || envVars.UPSTASH_REDIS_REST_URL, 'Context7 (Upstash)');

// Supabase 연결 확인
checkDns(process.env.SUPABASE_URL || envVars.SUPABASE_URL, 'Supabase');


// 5. 결과 요약
console.log('\n📊 진단 결과 요약:');
console.log('==================');

if (totalIssues === 0) {
    log(colors.green, '🎉 모든 필수 환경변수가 정상적으로 설정되어 있습니다!');
    process.exit(0);
} else {
    log(colors.red, `💥 총 ${totalIssues}개의 필수 설정이 누락되었습니다.`);
    console.log('\n💡 해결 방법:');
    console.log('1. .env.local 파일 형식을 확인하세요.');
    console.log('2. 필요한 API 키를 발급받아 채워주세요.');
    console.log('3. scripts/setup-mcp-env.sh (존재하는 경우)를 실행해보세요.');
    process.exit(1);
}