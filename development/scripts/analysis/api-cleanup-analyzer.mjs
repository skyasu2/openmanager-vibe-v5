#!/usr/bin/env node

/**
 * 🧹 API 정리 분석기 v1.0
 * 
 * OpenManager Vibe v5 - API 최적화 도구
 * - 미사용 API 탐지
 * - 중복 API 분석  
 * - TODO/FIXME 코멘트 발견된 API
 * - 크기 최적화 제안
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class APICleanupAnalyzer {
    constructor() {
        this.apiDir = path.join(__dirname, '../../../src/app/api');
        this.results = {
            total: 0,
            unused: [],
            duplicated: [],
            incomplete: [],
            small: [],
            deprecated: [],
            totalSize: 0
        };
    }

    async analyze() {
        console.log('🧹 API 정리 분석 시작...\n');

        await this.scanAllAPIs();
        this.generateReport();
        this.generateCleanupScript();

        return this.results;
    }

    async scanAllAPIs() {
        const apiRoutes = await this.findAllRoutes(this.apiDir);

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
                issues: []
            };

            // 1. 크기가 작은 API (기본 스켈레톤만 있는 경우)
            if (stats.size < 500) {
                analysis.issues.push('매우 작은 크기 (미구현 가능성)');
                this.results.small.push(analysis);
            }

            // 2. TODO/FIXME 등 미완성 코드
            if (this.hasIncompleteCode(content)) {
                analysis.issues.push('미완성 코드 발견');
                this.results.incomplete.push(analysis);
            }

            // 3. 기본 응답만 하는 API
            if (this.isBasicResponse(content)) {
                analysis.issues.push('기본 응답만 반환');
                this.results.unused.push(analysis);
            }

            // 4. Deprecated 표시된 API
            if (content.includes('@deprecated') || content.includes('DEPRECATED')) {
                analysis.issues.push('Deprecated 표시됨');
                this.results.deprecated.push(analysis);
            }

            // 5. 중복 가능성 체크 (비슷한 로직)
            const duplicateCandidate = this.checkDuplication(content, endpoint);
            if (duplicateCandidate) {
                analysis.issues.push(`중복 가능성: ${duplicateCandidate}`);
                this.results.duplicated.push(analysis);
            }

        } catch (error) {
            console.error(`❌ 분석 실패: ${routePath}`, error.message);
        }
    }

    hasIncompleteCode(content) {
        const incompletePatterns = [
            /TODO/i,
            /FIXME/i,
            /구현 필요/,
            /구현 예정/,
            /Coming soon/i,
            /Not implemented/i,
            /throw new Error\(['"]Not implemented/,
            /return.*구현.*예정/
        ];

        return incompletePatterns.some(pattern => pattern.test(content));
    }

    isBasicResponse(content) {
        // 기본적인 응답만 하는 패턴들
        const basicPatterns = [
            /return NextResponse\.json\(\s*\{\s*success:\s*true\s*\}\s*\)/,
            /return NextResponse\.json\(\s*\{\s*message:\s*['"].*['"],?\s*\}\s*\)/,
            /return.*\{\s*status:\s*['"]ok['"],?\s*\}/
        ];

        const hasBusinessLogic = [
            /import.*Service/,
            /await.*\(/,
            /database/i,
            /redis/i,
            /supabase/i,
            /process\.env\./,
            /fetch\(/,
            /axios\(/
        ];

        const isBasic = basicPatterns.some(pattern => pattern.test(content));
        const hasBusiness = hasBusinessLogic.some(pattern => pattern.test(content));

        return isBasic && !hasBusiness;
    }

    checkDuplication(content, endpoint) {
        // 중복 가능성이 높은 엔드포인트 그룹들
        const duplicateGroups = [
            ['status', 'health', 'ping'],
            ['test', 'demo'],
            ['admin', 'management'],
            ['monitoring', 'metrics'],
            ['ai', 'ml', 'analysis']
        ];

        for (const group of duplicateGroups) {
            const matchedKeywords = group.filter(keyword =>
                endpoint.toLowerCase().includes(keyword)
            );

            if (matchedKeywords.length > 0) {
                return group.join('/');
            }
        }

        return null;
    }

    generateReport() {
        console.log('📊 API 정리 분석 결과');
        console.log('='.repeat(50));
        console.log(`📁 총 API 라우트: ${this.results.total}개`);
        console.log(`📦 총 크기: ${(this.results.totalSize / 1024).toFixed(2)} KB`);
        console.log();

        console.log('🔍 발견된 문제들:');
        console.log(`🐣 작은 크기 API: ${this.results.small.length}개`);
        console.log(`🚧 미완성 API: ${this.results.incomplete.length}개`);
        console.log(`📝 기본 응답 API: ${this.results.unused.length}개`);
        console.log(`🗑️  Deprecated API: ${this.results.deprecated.length}개`);
        console.log(`🔄 중복 가능 API: ${this.results.duplicated.length}개`);
        console.log();

        // 상위 10개 정리 대상
        const cleanupCandidates = [
            ...this.results.unused,
            ...this.results.deprecated,
            ...this.results.incomplete.filter(api => api.size < 300)
        ].sort((a, b) => a.size - b.size).slice(0, 10);

        console.log('🎯 정리 우선순위 TOP 10:');
        cleanupCandidates.forEach((api, index) => {
            console.log(`${index + 1}. ${api.endpoint} (${api.size}B) - ${api.issues.join(', ')}`);
        });

        // 예상 절약량 계산
        const potentialSavings = cleanupCandidates.reduce((sum, api) => sum + api.size, 0);
        console.log();
        console.log(`💰 예상 절약량: ${(potentialSavings / 1024).toFixed(2)} KB`);

        if (potentialSavings > 436 * 1024) {
            console.log('✅ 목표 436KB 절약 달성 가능!');
        } else {
            console.log(`⚠️  추가 분석 필요 (목표: 436KB, 현재: ${(potentialSavings / 1024).toFixed(2)}KB)`);
        }
    }

    generateCleanupScript() {
        const scriptPath = path.join(__dirname, 'cleanup-apis.mjs');
        const cleanupScript = this.createCleanupScript();

        fs.writeFileSync(scriptPath, cleanupScript);
        console.log(`\n📜 정리 스크립트 생성: ${scriptPath}`);
    }

    createCleanupScript() {
        const safeCandidates = [
            ...this.results.deprecated,
            ...this.results.unused.filter(api => api.size < 200)
        ];

        return `#!/usr/bin/env node

/**
 * 🧹 자동 생성된 API 정리 스크립트
 * 생성일: ${new Date().toISOString()}
 * 정리 대상: ${safeCandidates.length}개 API
 */

import fs from 'fs';
import path from 'path';

const APIS_TO_REMOVE = [
${safeCandidates.map(api => `  '${api.path}', // ${api.endpoint} - ${api.issues.join(', ')}`).join('\n')}
];

function cleanup() {
  console.log('🧹 API 정리 시작...');
  
  let removed = 0;
  let savedBytes = 0;
  
  for (const apiPath of APIS_TO_REMOVE) {
    try {
      if (fs.existsSync(apiPath)) {
        const stats = fs.statSync(apiPath);
        fs.unlinkSync(apiPath);
        
        // 빈 디렉토리 정리
        const dir = path.dirname(apiPath);
        const remaining = fs.readdirSync(dir);
        if (remaining.length === 0) {
          fs.rmdirSync(dir);
        }
        
        removed++;
        savedBytes += stats.size;
        console.log(\`✅ 제거: \${path.relative(process.cwd(), apiPath)}\`);
      }
    } catch (error) {
      console.error(\`❌ 제거 실패: \${apiPath}\`, error.message);
    }
  }
  
  console.log(\`\\n🎉 정리 완료: \${removed}개 파일, \${(savedBytes / 1024).toFixed(2)}KB 절약\`);
}

// 실행
const analyzer = new APICleanupAnalyzer();
analyzer.analyze().catch(console.error);

export { cleanup };
`;
    }
}


export default APICleanupAnalyzer;
