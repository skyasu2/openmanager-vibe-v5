#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// 🚨 민감한 정보 패턴들
const SENSITIVE_PATTERNS = [
    // Supabase JWT 토큰들
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,

    // Google API 키들
    /AIzaSy[A-Za-z0-9_-]{33}/g,

    // Google OAuth 시크릿들
    /GOCSPX-[A-Za-z0-9_-]{28}/g,

    // Redis 패스워드들
    /AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA/g,

    // 기타 민감한 키들
    /qNzA4\/WgbksJU3xxkQJcfbCRkXhgBR7TVmI4y2XKRy59BwtRk6iuUSdkRNNQN1Yud3PGsGLTcZkdHSTZL0mhug==/g,
    /2D3DWhSl8HBlgYIm/g,
];

// 🔄 대체할 플레이스홀더들
const REPLACEMENTS = {
    // JWT 토큰들
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9': 'your_jwt_token_here',

    // Google API 키
    'AIzaSyABFUHbGGtjs6S_y756H4SYJmFNuNoo3fY': 'your_google_ai_api_key_here',

    // Google OAuth
    'GOCSPX-abcdefghijklmnopqrstuvwxyz123456': 'your_google_oauth_client_secret_here',
    '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com': 'your_google_oauth_client_id_here',

    // Redis
    'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA': 'your_redis_password_here',
    'charming-condor-46598.upstash.io': 'your_redis_host_here',

    // Supabase
    'https://vnswjnltnhpsueosfhmw.supabase.co': 'your_supabase_url_here',
    'vnswjnltnhpsueosfhmw': 'your_supabase_project_id_here',
    'qNzA4/WgbksJU3xxkQJcfbCRkXhgBR7TVmI4y2XKRy59BwtRk6iuUSdkRNNQN1Yud3PGsGLTcZkdHSTZL0mhug==': 'your_supabase_jwt_secret_here',
    '2D3DWhSl8HBlgYIm': 'your_supabase_db_password_here',
};

// 🚫 제외할 디렉토리들
const EXCLUDED_DIRS = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.vercel',
    'test-results',
];

// 📁 처리할 파일 확장자들
const INCLUDED_EXTENSIONS = [
    '.js', '.mjs', '.ts', '.tsx', '.json', '.md', '.txt', '.env', '.sh'
];

/**
 * 🔍 디렉토리 스캔 함수
 */
function scanDirectory(dir, files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!EXCLUDED_DIRS.includes(item)) {
                scanDirectory(fullPath, files);
            }
        } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (INCLUDED_EXTENSIONS.includes(ext)) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

/**
 * 🔧 파일 내용 정리 함수
 */
function cleanFileContent(content) {
    let cleanedContent = content;
    let hasChanges = false;

    // 패턴 기반 대체
    for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(cleanedContent)) {
            cleanedContent = cleanedContent.replace(pattern, 'SENSITIVE_INFO_REMOVED');
            hasChanges = true;
        }
    }

    // 구체적인 값 대체
    for (const [original, replacement] of Object.entries(REPLACEMENTS)) {
        if (cleanedContent.includes(original)) {
            cleanedContent = cleanedContent.replaceAll(original, replacement);
            hasChanges = true;
        }
    }

    return { cleanedContent, hasChanges };
}

/**
 * 🚀 메인 실행 함수
 */
async function main() {
    console.log('🚨 보안 정리 스크립트 시작...');
    console.log('📁 프로젝트 루트:', projectRoot);

    // 파일 스캔
    const files = scanDirectory(projectRoot);
    console.log(`📄 총 ${files.length}개 파일 스캔됨`);

    let processedCount = 0;
    let changedCount = 0;

    // 각 파일 처리
    for (const filePath of files) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const { cleanedContent, hasChanges } = cleanFileContent(content);

            if (hasChanges) {
                fs.writeFileSync(filePath, cleanedContent, 'utf8');
                console.log(`✅ 정리됨: ${path.relative(projectRoot, filePath)}`);
                changedCount++;
            }

            processedCount++;
        } catch (error) {
            console.error(`❌ 오류 (${path.relative(projectRoot, filePath)}):`, error.message);
        }
    }

    console.log('\n📊 결과 요약:');
    console.log(`- 처리된 파일: ${processedCount}개`);
    console.log(`- 변경된 파일: ${changedCount}개`);
    console.log(`- 오류 없음: ${processedCount - changedCount}개`);

    if (changedCount > 0) {
        console.log('\n🔐 보안 정리 완료!');
        console.log('⚠️  다음 단계:');
        console.log('1. 변경사항 확인: git diff');
        console.log('2. 실제 환경변수 설정: .env.local 파일 생성');
        console.log('3. 커밋 및 푸시: git add . && git commit -m "🔐 보안: 민감한 정보 제거"');
    } else {
        console.log('\n✅ 민감한 정보가 발견되지 않았습니다.');
    }
}

// 실행
main().catch(console.error); 