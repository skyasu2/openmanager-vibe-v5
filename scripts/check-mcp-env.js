#!/usr/bin/env node

/**
 * 🔍 MCP 서버 환경변수 진단 스크립트
 * OpenManager VIBE v5 - Claude Code MCP 서버 환경변수 검증
 */

const fs = require('fs');
const path = require('path');

// 색상 출력 함수
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(color + message + colors.reset);
}

console.log('🔍 MCP 서버 환경변수 진단 시작...\n');

// .env.local 파일 로드
const envLocalPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envLocalPath)) {
    log(colors.red, '❌ .env.local 파일을 찾을 수 없습니다!');
    process.exit(1);
}

// .env.local 파일 파싱
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...values] = trimmed.split('=');
        envVars[key] = values.join('=');
    }
});

// 필수 환경변수 정의
const mcpRequirements = {
    'Context7 (Upstash)': {
        UPSTASH_REDIS_REST_URL: envVars.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: envVars.UPSTASH_REDIS_REST_TOKEN
    },
    'Supabase': {
        SUPABASE_URL: envVars.SUPABASE_URL,
        SUPABASE_ANON_KEY: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY, // MCP가 읽을 실제 키
        SUPABASE_SERVICE_ROLE_KEY: envVars.SUPABASE_SERVICE_ROLE_KEY
    },
    'Vercel': {
        VERCEL_TOKEN: envVars.VERCEL_TOKEN
    }
};

// 현재 프로세스 환경변수 확인
console.log('📋 .env.local 파일 분석:');
console.log('========================');

let totalIssues = 0;

Object.entries(mcpRequirements).forEach(([service, vars]) => {
    console.log(`\n🔧 ${service}:`);
    
    let serviceIssues = 0;
    Object.entries(vars).forEach(([key, value]) => {
        const processValue = process.env[key];
        const fileValue = value;
        
        if (!fileValue) {
            log(colors.red, `  ❌ ${key}: .env.local에서 누락`);
            serviceIssues++;
        } else if (!processValue) {
            log(colors.yellow, `  ⚠️  ${key}: .env.local에 있으나 프로세스에서 읽지 못함`);
            log(colors.blue, `     파일값: ${fileValue.substring(0, 20)}...`);
            serviceIssues++;
        } else {
            log(colors.green, `  ✅ ${key}: 정상 로드됨`);
        }
    });
    
    if (serviceIssues === 0) {
        log(colors.green, `  🎉 ${service} 모든 환경변수 정상!`);
    } else {
        log(colors.red, `  💥 ${service}: ${serviceIssues}개 문제 발견`);
        totalIssues += serviceIssues;
    }
});

// DNS 테스트 (Context7용)
console.log('\n🌐 네트워크 연결 테스트:');
console.log('=======================');

const { execSync } = require('child_process');

// Upstash 도메인 DNS 테스트
try {
    const upstashUrl = envVars.UPSTASH_REDIS_REST_URL;
    if (upstashUrl) {
        const hostname = upstashUrl.replace('https://', '').replace('http://', '');
        execSync(`nslookup ${hostname}`, { stdio: 'ignore' });
        log(colors.green, `✅ Context7 DNS 해석 성공: ${hostname}`);
    }
} catch (error) {
    log(colors.red, '❌ Context7 DNS 해석 실패: charming-condor-46598.upstash.io');
    totalIssues++;
}

// Supabase 연결 테스트
try {
    const supabaseUrl = envVars.SUPABASE_URL;
    if (supabaseUrl) {
        const hostname = supabaseUrl.replace('https://', '').replace('http://', '');
        execSync(`nslookup ${hostname}`, { stdio: 'ignore' });
        log(colors.green, `✅ Supabase DNS 해석 성공: ${hostname}`);
    }
} catch (error) {
    log(colors.red, '❌ Supabase DNS 해석 실패');
    totalIssues++;
}

// 최종 요약
console.log('\n📊 진단 결과 요약:');
console.log('==================');

if (totalIssues === 0) {
    log(colors.green, '🎉 모든 환경변수가 정상적으로 설정되어 있습니다!');
} else {
    log(colors.red, `💥 총 ${totalIssues}개의 문제가 발견되었습니다.`);
    console.log('\n🔧 권장 해결 방법:');
    console.log('1. scripts/setup-mcp-env.sh 스크립트 실행');
    console.log('2. ~/.bashrc에 환경변수 자동 로드 설정 추가');
    console.log('3. 누락된 VERCEL_TOKEN 생성 및 추가');
}

process.exit(totalIssues > 0 ? 1 : 0);