#!/usr/bin/env node

/**
 * 🚀 API 최적화 실행기 v3.0
 * 
 * OpenManager Vibe v5 - 안전한 API 정리 및 최적화
 * - 미사용 API 제거
 * - 중복 로직 통합
 * - 백업 및 복원 지원
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class APIOptimizer {
    constructor() {
        this.apiDir = path.join(__dirname, '../../../src/app/api');
        this.srcDir = path.join(__dirname, '../../../src');
        this.backupDir = path.join(__dirname, '../backups/api-cleanup');
        this.results = {
            analyzed: 0,
            toRemove: [],
            totalSavings: 0
        };
    }

    async optimize() {
        console.log('🚀 API 최적화 실행기 시작...\n');

        // 1. 전체 분석
        await this.analyzeAllAPIs();

        // 2. 결과 보고
        this.generateReport();

        // 3. 사용자 확인
        const shouldProceed = await this.confirmOptimization();

        if (shouldProceed) {
            // 4. 백업 생성
            await this.createBackup();

            // 5. 최적화 실행
            await this.executeOptimization();

            // 6. 결과 검증
            await this.verifyOptimization();
        }

        return this.results;
    }

    async analyzeAllAPIs() {
        console.log('🔍 전체 API 분석 중...');

        const apiRoutes = await this.findAllRoutes(this.apiDir);
        const usedEndpoints = new Set();

        // API 사용 패턴 스캔
        await this.scanForAPIUsage(this.srcDir, usedEndpoints);

        for (const routePath of apiRoutes) {
            await this.analyzeRoute(routePath, usedEndpoints);
        }

        console.log(`✅ ${this.results.analyzed}개 API 분석 완료`);
    }

    async findAllRoutes(dir) {
        const routes = [];

        const scan = (currentDir) => {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scan(fullPath);
                } else if (item === 'route.ts') {
                    routes.push(fullPath);
                }
            }
        };

        scan(dir);
        return routes;
    }

    async scanForAPIUsage(dir, usedEndpoints) {
        const scan = (currentDir) => {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
                    scan(fullPath);
                } else if ((item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js')) && !fullPath.includes('/api/')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');

                        // 다양한 API 호출 패턴
                        const patterns = [
                            /['"`]\/api\/[^'"`]*['"`]/g,
                            /fetch\s*\(\s*['"`]\/api\/[^'"`]*['"`]/g,
                            /axios\.[get|post|put|delete|patch]*\s*\(\s*['"`]\/api\/[^'"`]*['"`]/g,
                            /api\/[a-z-\/]+/g
                        ];

                        patterns.forEach(pattern => {
                            const matches = content.match(pattern) || [];
                            matches.forEach(match => {
                                const endpoint = match.replace(/['"`]/g, '').replace(/^\/api/, '').replace(/fetch\s*\(\s*/, '').replace(/axios\.[a-z]*\s*\(\s*/, '');
                                if (endpoint.startsWith('/')) {
                                    usedEndpoints.add(endpoint);
                                }
                            });
                        });

                    } catch (error) {
                        // 무시
                    }
                }
            }
        };

        scan(dir);

        // 기본적으로 사용되는 것으로 간주할 API들
        const alwaysUsed = [
            '/health',
            '/ping',
            '/status',
            '/dashboard',
            '/data-generator',
            '/servers/next',
            '/keep-alive'
        ];

        alwaysUsed.forEach(endpoint => usedEndpoints.add(endpoint));
    }

    async analyzeRoute(routePath, usedEndpoints) {
        try {
            const content = fs.readFileSync(routePath, 'utf-8');
            const stats = fs.statSync(routePath);
            const relativePath = path.relative(this.apiDir, routePath);
            const endpoint = '/' + relativePath.replace('/route.ts', '').replace(/\\/g, '/');

            this.results.analyzed++;

            const analysis = {
                path: routePath,
                endpoint,
                size: stats.size,
                relativePath,
                reasons: []
            };

            // 1. 테스트/데모 API
            if (this.isTestOrDemo(endpoint, content)) {
                analysis.reasons.push('테스트/데모 API');
            }

            // 2. 사용되지 않는 API
            if (!this.checkIfAPIIsUsed(endpoint, usedEndpoints)) {
                analysis.reasons.push('코드에서 참조 없음');
            }

            // 3. 개발용 API
            if (this.isDevelopmentOnly(endpoint, content)) {
                analysis.reasons.push('개발용 API');
            }

            // 4. 빈 스켈레톤 API
            if (this.isEmptySkeleton(content)) {
                analysis.reasons.push('빈 스켈레톤');
            }

            // 제거 대상 판정
            if (analysis.reasons.length > 0 && !this.isCriticalAPI(endpoint)) {
                this.results.toRemove.push(analysis);
                this.results.totalSavings += stats.size;
            }

        } catch (error) {
            console.error(`❌ 분석 실패: ${routePath}`, error.message);
        }
    }

    isTestOrDemo(endpoint, content) {
        const patterns = [
            /\/test($|\/)/,
            /\/demo($|\/)/,
            /\/example($|\/)/,
            /\/sample($|\/)/,
            /\/mock($|\/)/
        ];

        return patterns.some(pattern => pattern.test(endpoint)) ||
            /test|demo|example|sample|mock/i.test(content);
    }

    isDevelopmentOnly(endpoint, content) {
        const devPatterns = [
            /development/i,
            /debug/i,
            /NODE_ENV.*development/,
            /development.*only/i
        ];

        return devPatterns.some(pattern => pattern.test(endpoint) || pattern.test(content));
    }

    isEmptySkeleton(content) {
        const lines = content.split('\n').filter(line => line.trim()).length;

        // 매우 짧고 기본 응답만
        if (lines < 15) {
            const hasBasicResponse = /return\s+NextResponse\.json\(\s*\{\s*[^}]*\}\s*\)/.test(content);
            const hasNoBusinessLogic = !/import.*Service|supabase|database|redis|fetch|axios/.test(content);

            return hasBasicResponse && hasNoBusinessLogic;
        }

        return false;
    }

    checkIfAPIIsUsed(endpoint, usedEndpoints) {
        // 정확한 매치
        if (usedEndpoints.has(endpoint)) return true;

        // 부분 매치
        for (const used of usedEndpoints) {
            if (used.includes(endpoint.replace(/\/\[.*?\]/g, '')) ||
                endpoint.includes(used)) {
                return true;
            }
        }

        return false;
    }

    isCriticalAPI(endpoint) {
        const critical = [
            '/health',
            '/ping',
            '/status',
            '/dashboard',
            '/data-generator',
            '/servers',
            '/keep-alive',
            '/ai/unified',
            '/ai/hybrid',
            '/admin/monitoring'
        ];

        return critical.some(c => endpoint.startsWith(c));
    }

    generateReport() {
        console.log('\n📊 API 최적화 분석 결과');
        console.log('='.repeat(60));
        console.log(`📁 분석된 API: ${this.results.analyzed}개`);
        console.log(`🗑️ 제거 대상: ${this.results.toRemove.length}개`);
        console.log(`💰 절약 가능 크기: ${(this.results.totalSavings / 1024).toFixed(2)} KB`);
        console.log();

        if (this.results.totalSavings >= 436 * 1024) {
            console.log('✅ 목표 436KB 절약 달성!');
        } else {
            console.log(`📈 목표 달성률: ${((this.results.totalSavings / (436 * 1024)) * 100).toFixed(1)}%`);
        }

        console.log('\n🎯 제거 대상 API (상위 20개):');
        const sorted = this.results.toRemove
            .sort((a, b) => b.size - a.size)
            .slice(0, 20);

        sorted.forEach((api, index) => {
            console.log(`${String(index + 1).padStart(2)}. ${api.endpoint.padEnd(35)} ${String(api.size).padStart(5)}B - ${api.reasons.join(', ')}`);
        });

        if (this.results.toRemove.length > 20) {
            console.log(`    ... 그리고 ${this.results.toRemove.length - 20}개 더`);
        }
    }

    async confirmOptimization() {
        console.log('\n⚠️  API 최적화를 실행하시겠습니까?');
        console.log('   이 작업은 다음을 수행합니다:');
        console.log(`   - ${this.results.toRemove.length}개 API 파일 제거`);
        console.log(`   - ${(this.results.totalSavings / 1024).toFixed(2)} KB 절약`);
        console.log('   - 자동 백업 생성');
        console.log('\n[y/N] ');

        return new Promise((resolve) => {
            process.stdin.once('data', (data) => {
                const answer = data.toString().trim().toLowerCase();
                resolve(answer === 'y' || answer === 'yes');
            });
        });
    }

    async createBackup() {
        console.log('\n💾 백업 생성 중...');

        // 백업 디렉토리 생성
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `api-backup-${timestamp}`);

        // API 디렉토리 전체 백업
        this.copyDirectory(this.apiDir, backupPath);

        // 백업 정보 저장
        const backupInfo = {
            timestamp,
            originalSize: this.results.totalSavings + (this.results.analyzed - this.results.toRemove.length) * 1000, // 추정
            toRemove: this.results.toRemove.map(api => ({
                endpoint: api.endpoint,
                path: api.relativePath,
                size: api.size,
                reasons: api.reasons
            }))
        };

        fs.writeFileSync(
            path.join(backupPath, 'backup-info.json'),
            JSON.stringify(backupInfo, null, 2)
        );

        console.log(`✅ 백업 완료: ${backupPath}`);
    }

    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const items = fs.readdirSync(src);

        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const stat = fs.statSync(srcPath);

            if (stat.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    async executeOptimization() {
        console.log('\n🚀 API 최적화 실행 중...');

        let removed = 0;
        let savedBytes = 0;

        for (const api of this.results.toRemove) {
            try {
                if (fs.existsSync(api.path)) {
                    fs.unlinkSync(api.path);
                    removed++;
                    savedBytes += api.size;

                    // 빈 디렉토리 정리
                    const dir = path.dirname(api.path);
                    try {
                        const remaining = fs.readdirSync(dir);
                        if (remaining.length === 0) {
                            fs.rmdirSync(dir);
                        }
                    } catch (e) {
                        // 디렉토리가 비어있지 않음
                    }

                    console.log(`✅ 제거: ${api.endpoint}`);
                }
            } catch (error) {
                console.error(`❌ 제거 실패: ${api.endpoint}`, error.message);
            }
        }

        console.log(`\n🎉 최적화 완료: ${removed}개 파일 제거, ${(savedBytes / 1024).toFixed(2)}KB 절약`);
    }

    async verifyOptimization() {
        console.log('\n🔍 최적화 결과 검증 중...');

        // 빌드 테스트는 별도 실행 필요
        console.log('💡 다음 명령으로 빌드를 테스트해보세요:');
        console.log('   npm run build');
        console.log('\n💡 문제가 있다면 백업에서 복원할 수 있습니다:');
        console.log(`   ${this.backupDir}`);
    }
}

// 실행
if (process.argv.includes('--execute')) {
    const optimizer = new APIOptimizer();
    optimizer.optimize().catch(console.error);
} else {
    console.log('🚀 API 최적화 도구');
    console.log('실행하려면: node api-optimizer.mjs --execute');
}

export default APIOptimizer; 