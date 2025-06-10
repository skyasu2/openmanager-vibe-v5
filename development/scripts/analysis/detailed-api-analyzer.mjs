#!/usr/bin/env node

/**
 * 🔍 상세 API 분석기 v2.0
 * 
 * OpenManager Vibe v5 - 정확한 API 최적화 분석
 * - 실제 호출되는 API vs 정의된 API 비교
 * - 빌드 크기 436B API들 집중 분석
 * - 실사용 패턴 기반 정리 제안
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DetailedAPIAnalyzer {
    constructor() {
        this.apiDir = path.join(__dirname, '../../../src/app/api');
        this.srcDir = path.join(__dirname, '../../../src');
        this.results = {
            total: 0,
            identical436B: [],
            verySmall: [],
            unreferenced: [],
            duplicateLogic: [],
            testOnly: [],
            totalSize: 0,
            potentialSavings: 0
        };
    }

    async analyze() {
        console.log('🔍 상세 API 분석 시작...\n');

        await this.scanAllAPIs();
        await this.analyzeAPIUsage();
        this.findDuplicateLogic();
        this.generateDetailedReport();

        return this.results;
    }

    async scanAllAPIs() {
        const apiRoutes = await this.findAllRoutes(this.apiDir);

        console.log(`📁 발견된 API 라우트: ${apiRoutes.length}개`);

        for (const routePath of apiRoutes) {
            await this.analyzeRoute(routePath);
        }
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

    async analyzeRoute(routePath) {
        try {
            const content = fs.readFileSync(routePath, 'utf-8');
            const stats = fs.statSync(routePath);
            const relativePath = path.relative(this.apiDir, routePath);
            const endpoint = '/' + relativePath.replace('/route.ts', '').replace(/\\/g, '/');

            this.results.total++;
            this.results.totalSize += stats.size;

            const analysis = {
                path: routePath,
                endpoint,
                size: stats.size,
                lines: content.split('\n').length,
                hasHttpMethods: this.extractHttpMethods(content),
                complexity: this.calculateComplexity(content),
                imports: this.extractImports(content),
                issues: []
            };

            // 1. 정확히 436B 크기인 API들 (빌드에서 나타난 패턴)
            if (stats.size === 436) {
                analysis.issues.push('정확히 436B - 기본 템플릿 가능성');
                this.results.identical436B.push(analysis);
            }

            // 2. 매우 작은 API (500B 미만)
            if (stats.size < 500) {
                analysis.issues.push(`매우 작음 (${stats.size}B)`);
                this.results.verySmall.push(analysis);
            }

            // 3. 테스트/데모 API
            if (this.isTestOrDemo(endpoint, content)) {
                analysis.issues.push('테스트/데모 API');
                this.results.testOnly.push(analysis);
            }

            // 4. 기본 스켈레톤만 있는 API
            if (this.isBasicSkeleton(content)) {
                analysis.issues.push('기본 스켈레톤만 존재');
                analysis.savingsPotential = stats.size;
                this.results.potentialSavings += stats.size;
            }

        } catch (error) {
            console.error(`❌ 분석 실패: ${routePath}`, error.message);
        }
    }

    extractHttpMethods(content) {
        const methods = [];
        const methodPatterns = [
            /export\s+async\s+function\s+GET/,
            /export\s+async\s+function\s+POST/,
            /export\s+async\s+function\s+PUT/,
            /export\s+async\s+function\s+DELETE/,
            /export\s+async\s+function\s+PATCH/
        ];

        methodPatterns.forEach((pattern, index) => {
            if (pattern.test(content)) {
                methods.push(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'][index]);
            }
        });

        return methods;
    }

    calculateComplexity(content) {
        let complexity = 0;

        // 기본 복잡도 지표들
        complexity += (content.match(/await/g) || []).length * 2; // async 작업
        complexity += (content.match(/if\s*\(/g) || []).length; // 조건문
        complexity += (content.match(/switch\s*\(/g) || []).length * 2; // switch문
        complexity += (content.match(/catch\s*\(/g) || []).length; // 에러 처리
        complexity += (content.match(/import\s+.*from/g) || []).length; // 의존성

        return complexity;
    }

    extractImports(content) {
        const imports = content.match(/import\s+.*from\s+['"][^'"]+['"]/g) || [];
        return imports.map(imp => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1]).filter(Boolean);
    }

    isTestOrDemo(endpoint, content) {
        const testPatterns = [
            /test/i,
            /demo/i,
            /example/i,
            /sample/i,
            /mock/i
        ];

        const endpointIsTest = testPatterns.some(pattern => pattern.test(endpoint));
        const contentIsTest = testPatterns.some(pattern => pattern.test(content));

        return endpointIsTest || contentIsTest;
    }

    isBasicSkeleton(content) {
        // 기본 스켈레톤 패턴들
        const basicPatterns = [
            // 단순한 성공 응답만
            /return\s+NextResponse\.json\(\s*\{\s*success:\s*true\s*\}\s*\)/,
            // 하드코딩된 메시지만
            /return\s+NextResponse\.json\(\s*\{\s*message:\s*['"][^'"]*['"],?\s*\}\s*\)/,
            // 상태만 반환
            /return\s+NextResponse\.json\(\s*\{\s*status:\s*['"][^'"]*['"],?\s*\}\s*\)/
        ];

        // 실제 비즈니스 로직 없음
        const hasNoBusinessLogic = [
            /import.*Service/,
            /supabase/i,
            /database/i,
            /redis/i,
            /fetch\(/,
            /axios\(/,
            /process\.env\./
        ].every(pattern => !pattern.test(content));

        const isBasic = basicPatterns.some(pattern => pattern.test(content));

        return isBasic && hasNoBusinessLogic && content.length < 800;
    }

    async analyzeAPIUsage() {
        console.log('🔍 API 사용 패턴 분석 중...');

        // 모든 TypeScript/JavaScript 파일에서 API 호출 패턴 찾기
        const usedEndpoints = new Set();
        await this.scanForAPIUsage(this.srcDir, usedEndpoints);

        // 사용되지 않는 API 찾기
        for (const api of [...this.results.verySmall, ...this.results.testOnly]) {
            const isUsed = this.checkIfAPIIsUsed(api.endpoint, usedEndpoints);
            if (!isUsed) {
                api.issues.push('코드에서 참조 없음');
                this.results.unreferenced.push(api);
            }
        }
    }

    async scanForAPIUsage(dir, usedEndpoints) {
        const scan = (currentDir) => {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
                    scan(fullPath);
                } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        // API 호출 패턴 찾기
                        const apiCalls = content.match(/['"`]\/api\/[^'"`]*['"`]/g) || [];
                        apiCalls.forEach(call => {
                            const endpoint = call.replace(/['"`]/g, '');
                            usedEndpoints.add(endpoint);
                        });
                    } catch (error) {
                        // 무시
                    }
                }
            }
        };

        scan(dir);
    }

    checkIfAPIIsUsed(endpoint, usedEndpoints) {
        // 정확한 매치
        if (usedEndpoints.has(endpoint)) return true;

        // 부분 매치 (동적 라우팅 고려)
        for (const used of usedEndpoints) {
            if (used.includes(endpoint.replace(/\/\[.*?\]/g, ''))) {
                return true;
            }
        }

        return false;
    }

    findDuplicateLogic() {
        console.log('🔄 중복 로직 분석 중...');

        // 비슷한 크기와 패턴을 가진 API들 그룹화
        const groups = new Map();

        for (const api of this.results.verySmall) {
            const key = `${Math.floor(api.size / 100) * 100}-${api.complexity}`;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(api);
        }

        // 2개 이상의 API가 있는 그룹 찾기
        for (const [key, apis] of groups) {
            if (apis.length > 1) {
                apis.forEach(api => {
                    api.issues.push(`중복 가능성 (그룹: ${key})`);
                });
                this.results.duplicateLogic.push(...apis);
            }
        }
    }

    generateDetailedReport() {
        console.log('\n📊 상세 API 분석 결과');
        console.log('='.repeat(60));
        console.log(`📁 총 API 라우트: ${this.results.total}개`);
        console.log(`📦 총 크기: ${(this.results.totalSize / 1024).toFixed(2)} KB`);
        console.log();

        console.log('🎯 주요 발견사항:');
        console.log(`🔹 436B 동일 크기 API: ${this.results.identical436B.length}개`);
        console.log(`🔹 500B 미만 작은 API: ${this.results.verySmall.length}개`);
        console.log(`🔹 참조 없는 API: ${this.results.unreferenced.length}개`);
        console.log(`🔹 테스트/데모 API: ${this.results.testOnly.length}개`);
        console.log(`🔹 중복 로직 API: ${this.results.duplicateLogic.length}개`);
        console.log();

        // TOP 15 정리 대상
        const allCandidates = [
            ...this.results.unreferenced,
            ...this.results.testOnly,
            ...this.results.verySmall.filter(api => api.complexity < 5)
        ];

        const uniqueCandidates = allCandidates.filter((api, index, arr) =>
            arr.findIndex(a => a.path === api.path) === index
        ).sort((a, b) => a.size - b.size).slice(0, 15);

        console.log('🚀 정리 우선순위 TOP 15:');
        uniqueCandidates.forEach((api, index) => {
            console.log(`${String(index + 1).padStart(2)}. ${api.endpoint.padEnd(40)} (${String(api.size).padStart(4)}B) - ${api.issues.join(', ')}`);
        });

        const totalSavings = uniqueCandidates.reduce((sum, api) => sum + api.size, 0);
        console.log();
        console.log(`💰 예상 절약량: ${(totalSavings / 1024).toFixed(2)} KB`);

        if (totalSavings >= 436 * 1024) {
            console.log('✅ 목표 436KB 절약 달성 가능!');
        } else {
            console.log(`📈 목표 대비: ${((totalSavings / (436 * 1024)) * 100).toFixed(1)}%`);
            console.log('💡 추가 최적화가 필요합니다. 중복 로직 통합을 고려해보세요.');
        }

        // 상세 통계
        console.log('\n📈 상세 통계:');
        console.log(`평균 API 크기: ${(this.results.totalSize / this.results.total).toFixed(0)}B`);
        console.log(`가장 큰 API: ${Math.max(...this.results.verySmall.map(a => a.size))}B`);
        console.log(`가장 작은 API: ${Math.min(...this.results.verySmall.map(a => a.size))}B`);
    }
}

// 실행
const analyzer = new DetailedAPIAnalyzer();
analyzer.analyze().catch(console.error);

export default DetailedAPIAnalyzer; 