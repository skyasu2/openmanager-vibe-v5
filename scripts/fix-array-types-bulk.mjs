#!/usr/bin/env node

/**
 * 🎯 배열 타입 추론 문제 대량 해결 스크립트
 * 
 * 134개 오류 중 대부분이 배열 타입 추론 문제이므로 자동화로 해결
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🎯 배열 타입 추론 문제 대량 해결 시작...\n');

// 🔧 배열 타입 패턴 매핑
const arrayTypePatterns = [
    // 기본 배열들
    {
        search: /const (systems|reasons|resolutions|recommendations|capabilities|actions|suggestions|tips|findings|alerts|correlations|predictions|incidents|batches|missing|invalid|restored|parts|issues|healthChecks|anomalies|results) = \[\];/g,
        replace: (match, varName) => {
            const typeMap = {
                'systems': 'string[]',
                'reasons': 'string[]',
                'resolutions': 'string[]',
                'recommendations': 'string[]',
                'capabilities': 'string[]',
                'actions': 'string[]',
                'suggestions': 'string[]',
                'tips': 'string[]',
                'findings': 'string[]',
                'alerts': 'any[]',
                'correlations': 'any[]',
                'predictions': 'any[]',
                'incidents': 'any[]',
                'batches': 'any[]',
                'missing': 'string[]',
                'invalid': 'string[]',
                'restored': 'string[]',
                'parts': 'string[]',
                'issues': 'string[]',
                'healthChecks': 'any[]',
                'anomalies': 'any[]',
                'results': 'any[]'
            };
            return `const ${varName}: ${typeMap[varName] || 'any[]'} = [];`;
        }
    },

    // 숫자 배열들
    {
        search: /const (history) = \[\];/g,
        replace: 'const $1: number[] = [];'
    },

    // 특수 케이스들
    {
        search: /const converted = \[\];/g,
        replace: 'const converted: any[] = [];'
    },
    {
        search: /const vectorData = \[\];/g,
        replace: 'const vectorData: any[] = [];'
    },
    {
        search: /const servers = \[\];/g,
        replace: 'const servers: any[] = [];'
    }
];

// 🔧 파일 처리 함수
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        for (const pattern of arrayTypePatterns) {
            const originalContent = content;

            if (typeof pattern.replace === 'function') {
                content = content.replace(pattern.search, pattern.replace);
            } else {
                content = content.replace(pattern.search, pattern.replace);
            }

            if (content !== originalContent) {
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 수정됨: ${path.relative(projectRoot, filePath)}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`❌ 오류: ${filePath} - ${error.message}`);
        return false;
    }
}

// 🎯 타겟 파일들 (타입 오류가 있는 주요 파일들)
const targetFiles = [
    'src/services/ai/AutoIncidentReportService.ts',
    'src/services/ai/engines/CustomEngines.ts',
    'src/services/ai/engines/intent-handlers/IntentHandlers.ts',
    'src/services/ai/engines/metrics/MetricsCollector.ts',
    'src/services/ai/engines/OpenSourceEngines.ts',
    'src/services/ai/EnhancedDataAnalyzer.ts',
    'src/services/ai/IncidentReportService.ts',
    'src/services/ai/IntelligentMonitoringService.ts',
    'src/services/ai/korean-ai-engine.ts',
    'src/services/ai/MonitoringService.ts',
    'src/services/data-generator/AIEngineProcessor.ts',
    'src/services/mcp/real-mcp-client.ts',
    'src/services/ScalingSimulationEngine.ts',
    'src/utils/VercelPlanDetector.ts',
    'tests/unit/ai/incident-detection-engine.test.ts',
    'tests/unit/api/ai-engines.test.ts',
    'tests/unit/api/system-metrics.test.ts',
    'tests/unit/env-backup-manager.test.ts'
];

// 🚀 실행
let processedCount = 0;
let modifiedCount = 0;

for (const file of targetFiles) {
    const fullPath = path.resolve(projectRoot, file);

    if (fs.existsSync(fullPath)) {
        processedCount++;
        if (processFile(fullPath)) {
            modifiedCount++;
        }
    } else {
        console.log(`⚠️ 파일 없음: ${file}`);
    }
}

console.log(`\n📊 처리 완료:`);
console.log(`- 처리된 파일: ${processedCount}개`);
console.log(`- 수정된 파일: ${modifiedCount}개`);
console.log(`\n🎯 다음 단계: npm run type-check로 결과 확인`); 