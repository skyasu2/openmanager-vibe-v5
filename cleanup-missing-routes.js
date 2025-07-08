#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔍 누락된 API 라우트 자동 정리 시작...');

function findMissingRoutes() {
    return new Promise((resolve, reject) => {
        exec('npm run build 2>&1', (error, stdout, stderr) => {
            const output = stdout + stderr;

            // "Cannot find module for page: /api/..." 패턴 찾기
            const missingRoutes = [];
            const routePattern = /Cannot find module for page: (\/api\/[^\/\s]+(?:\/[^\/\s]+)*)/g;
            let match;

            while ((match = routePattern.exec(output)) !== null) {
                const routePath = match[1];
                // 중복 제거
                if (!missingRoutes.includes(routePath)) {
                    missingRoutes.push(routePath);
                }
            }

            resolve(missingRoutes);
        });
    });
}

function deleteRouteFile(routePath) {
    const filePath = path.join('src/app', routePath, 'route.ts');

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✅ 삭제됨: ${filePath}`);
            return true;
        } catch (error) {
            console.log(`❌ 삭제 실패: ${filePath} - ${error.message}`);
            return false;
        }
    } else {
        console.log(`⚠️  파일 없음: ${filePath}`);
        return false;
    }
}

function removeEmptyDirectories(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    try {
        const files = fs.readdirSync(dirPath);

        if (files.length === 0) {
            fs.rmdirSync(dirPath);
            console.log(`🗑️  빈 디렉토리 삭제: ${dirPath}`);

            // 부모 디렉토리도 확인
            const parentDir = path.dirname(dirPath);
            if (parentDir !== dirPath && parentDir.includes('src/app/api')) {
                removeEmptyDirectories(parentDir);
            }
        }
    } catch (error) {
        // 디렉토리가 비어있지 않거나 다른 오류
    }
}

async function main() {
    let iteration = 0;
    const maxIterations = 20;

    while (iteration < maxIterations) {
        iteration++;
        console.log(`\n🔄 반복 ${iteration}/${maxIterations}: 누락된 라우트 검색 중...`);

        const missingRoutes = await findMissingRoutes();

        if (missingRoutes.length === 0) {
            console.log('✅ 누락된 API 라우트가 없습니다!');
            break;
        }

        console.log(`📋 발견된 누락된 라우트 (${missingRoutes.length}개):`);
        missingRoutes.forEach(route => console.log(`   - ${route}`));

        // 파일 삭제
        let deletedCount = 0;
        for (const route of missingRoutes) {
            if (deleteRouteFile(route)) {
                deletedCount++;

                // 빈 디렉토리 정리
                const dirPath = path.join('src/app', route);
                removeEmptyDirectories(dirPath);
            }
        }

        console.log(`📊 ${deletedCount}개 파일 삭제됨`);

        if (deletedCount === 0) {
            console.log('⚠️  더 이상 삭제할 파일이 없습니다.');
            break;
        }

        // 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (iteration >= maxIterations) {
        console.log('⚠️  최대 반복 횟수에 도달했습니다.');
    }

    // 최종 빌드 테스트
    console.log('\n🏗️  최종 빌드 테스트...');
    exec('npm run build', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ 빌드 실패:');
            console.log(stdout + stderr);
        } else {
            console.log('✅ 빌드 성공!');
        }
    });
}

main().catch(console.error); 