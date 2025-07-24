#!/usr/bin/env node

/**
 * 🧪 GitHub PAT 토큰 테스트
 * .env.local에서 토큰을 로드하여 GitHub API 호출 테스트
 */

const https = require('https');
const path = require('path');

console.log('🧪 GitHub PAT 토큰 테스트 시작...\n');

// .env.local 파일 로드
try {
    require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (error) {
    console.log('⚠️ dotenv 로드 실패');
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function testGitHubAPI() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: '/user',
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN.trim()}`,
                'User-Agent': 'OpenManager-Vibe-v5'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({ status: res.statusCode, data: response });
                } catch (error) {
                    reject(new Error(`JSON 파싱 실패: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`요청 실패: ${error.message}`));
        });

        req.end();
    });
}

async function main() {
    try {
        console.log('🔍 환경변수 확인:');
        console.log(`GITHUB_TOKEN: ${GITHUB_TOKEN ? '✅ 로드됨' : '❌ 없음'}`);

        if (!GITHUB_TOKEN) {
            throw new Error('GITHUB_TOKEN 환경변수가 설정되지 않았습니다.');
        }

        if (!GITHUB_TOKEN.startsWith('ghp_')) {
            throw new Error('올바르지 않은 GitHub PAT 토큰 형식입니다.');
        }

        console.log(`토큰 형식: ${GITHUB_TOKEN.substring(0, 10)}...${GITHUB_TOKEN.slice(-4)}`);

        console.log('\n🌐 GitHub API 호출 테스트...');
        const result = await testGitHubAPI();

        if (result.status === 200) {
            console.log('✅ GitHub API 호출 성공!');
            console.log(`사용자: ${result.data.login}`);
            console.log(`이름: ${result.data.name || 'N/A'}`);
            console.log(`이메일: ${result.data.email || 'N/A'}`);
            console.log(`공개 저장소: ${result.data.public_repos}개`);
            console.log(`팔로워: ${result.data.followers}명`);
        } else {
            console.log(`⚠️ API 호출 실패 (상태 코드: ${result.status})`);
            console.log('응답:', result.data);
        }

        console.log('\n🎉 GitHub PAT 토큰이 정상적으로 작동합니다!');

    } catch (error) {
        console.error('❌ 토큰 테스트 실패:', error.message);
        process.exit(1);
    }
}

main();