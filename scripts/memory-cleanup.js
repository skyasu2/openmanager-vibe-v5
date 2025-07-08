#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 메모리 정리 및 최적화 유틸리티
 */
class MemoryCleanupUtility {
    constructor() {
        this.isWindows = process.platform === 'win32';
        this.projectRoot = process.cwd();
    }

    /**
     * 메모리 사용량 체크
     */
    async checkMemoryUsage() {
        return new Promise((resolve, reject) => {
            const command = this.isWindows
                ? 'wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value'
                : 'free -h';

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('메모리 사용량 체크 실패:', error);
                    reject(error);
                    return;
                }

                console.log('📊 메모리 사용량:');
                console.log(stdout);
                resolve(stdout);
            });
        });
    }

    /**
     * Node.js 프로세스 정리
     */
    async cleanupNodeProcesses() {
        return new Promise((resolve, reject) => {
            const command = this.isWindows
                ? 'taskkill /f /im node.exe /t 2>nul || echo "Node.js 프로세스 없음"'
                : 'pkill -f node || echo "Node.js 프로세스 없음"';

            exec(command, (error, stdout, stderr) => {
                if (error && error.code !== 1) {
                    console.error('Node.js 프로세스 정리 실패:', error);
                    reject(error);
                    return;
                }

                console.log('🔄 Node.js 프로세스 정리 완료');
                resolve(stdout);
            });
        });
    }

    /**
     * 캐시 파일 정리
     */
    async clearCacheFiles() {
        const cacheDirs = [
            path.join(this.projectRoot, '.next'),
            path.join(this.projectRoot, 'node_modules/.cache'),
            path.join(this.projectRoot, '.cache'),
            path.join(this.projectRoot, 'dist'),
            path.join(this.projectRoot, 'build'),
            path.join(this.projectRoot, 'out'),
            path.join(this.projectRoot, 'logs'),
        ];

        for (const dir of cacheDirs) {
            try {
                if (fs.existsSync(dir)) {
                    await this.removeDirectory(dir);
                    console.log(`🗑️  캐시 디렉토리 정리 완료: ${dir}`);
                }
            } catch (error) {
                console.warn(`⚠️  캐시 디렉토리 정리 실패: ${dir}`, error.message);
            }
        }
    }

    /**
     * 디렉토리 삭제
     */
    async removeDirectory(dir) {
        return new Promise((resolve, reject) => {
            const command = this.isWindows
                ? `rmdir /s /q "${dir}" 2>nul || echo "디렉토리 없음"`
                : `rm -rf "${dir}" || echo "디렉토리 없음"`;

            exec(command, (error, stdout, stderr) => {
                if (error && error.code !== 1) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    /**
     * TypeScript 컴파일 캐시 정리
     */
    async clearTypeScriptCache() {
        const tsBuildInfoFile = path.join(this.projectRoot, '.next/cache/tsbuildinfo');
        const tsConfigTsBuildInfoFile = path.join(this.projectRoot, 'tsconfig.tsbuildinfo');

        try {
            if (fs.existsSync(tsBuildInfoFile)) {
                fs.unlinkSync(tsBuildInfoFile);
                console.log('🗑️  TypeScript 빌드 정보 파일 정리 완료');
            }
            if (fs.existsSync(tsConfigTsBuildInfoFile)) {
                fs.unlinkSync(tsConfigTsBuildInfoFile);
                console.log('🗑️  TypeScript 설정 빌드 정보 파일 정리 완료');
            }
        } catch (error) {
            console.warn('⚠️  TypeScript 캐시 정리 실패:', error.message);
        }
    }

    /**
     * 메모리 최적화 실행
     */
    async optimizeMemory() {
        console.log('🚀 메모리 최적화 시작...\n');

        try {
            // 1. 메모리 사용량 체크
            await this.checkMemoryUsage();

            // 2. Node.js 프로세스 정리
            await this.cleanupNodeProcesses();

            // 3. 캐시 파일 정리
            await this.clearCacheFiles();

            // 4. TypeScript 캐시 정리
            await this.clearTypeScriptCache();

            console.log('\n✅ 메모리 최적화 완료!');
            console.log('💡 권장사항:');
            console.log('   - Cursor IDE 재시작');
            console.log('   - 터미널 재시작');
            console.log('   - npm run dev 명령어로 개발 서버 재시작');

        } catch (error) {
            console.error('❌ 메모리 최적화 실패:', error);
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const cleanup = new MemoryCleanupUtility();
    cleanup.optimizeMemory();
}

module.exports = MemoryCleanupUtility; 