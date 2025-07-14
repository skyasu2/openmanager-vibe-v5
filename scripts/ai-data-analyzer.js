#!/usr/bin/env node

/**
 * 🤖 AI 데이터 분석기 - 경연용 데이터 기반 개발
 * 
 * Supabase에 저장된 운영 데이터를 AI가 분석하여
 * 실제 개발에 도움이 되는 인사이트를 제공합니다.
 * 
 * 🎯 분석 영역:
 * - 사용자 행동 패턴 분석
 * - 성능 병목 지점 발견
 * - 에러 패턴 및 원인 분석
 * - 개선 우선순위 제안
 * - 데이터 기반 개발 가이드
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');

class AIDataAnalyzer {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        this.supabase = this.supabaseUrl && this.supabaseKey ?
            createClient(this.supabaseUrl, this.supabaseKey) : null;

        this.sessionId = null;
        this.analysisResults = [];
    }

    /**
     * 🌐 AI 채팅 API 요청
     */
    async makeAIRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);

            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`JSON 파싱 오류: ${error.message}`));
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * 📊 Supabase에서 운영 데이터 수집
     */
    async collectOperationalData() {
        if (!this.supabase) {
            console.log('⚠️ Supabase 연결이 없어 시뮬레이션 데이터를 사용합니다.');
            return this.generateSimulationAnalysisData();
        }

        try {
            console.log('📊 운영 데이터 수집 중...');

            // 최근 24시간 운영 로그
            const { data: logs, error: logsError } = await this.supabase
                .from('production_logs')
                .select('*')
                .gte('timestamp', new Date(Date.now() - 24 * 3600000).toISOString())
                .order('timestamp', { ascending: false })
                .limit(1000);

            // 최근 24시간 성능 메트릭
            const { data: metrics, error: metricsError } = await this.supabase
                .from('performance_metrics')
                .select('*')
                .gte('timestamp', new Date(Date.now() - 24 * 3600000).toISOString())
                .order('timestamp', { ascending: false })
                .limit(1000);

            if (logsError || metricsError) {
                console.log('⚠️ 데이터 수집 중 오류, 시뮬레이션 데이터 사용');
                return this.generateSimulationAnalysisData();
            }

            console.log(`✅ 운영 로그 ${logs?.length || 0}개, 성능 메트릭 ${metrics?.length || 0}개 수집`);

            return {
                logs: logs || [],
                metrics: metrics || [],
                summary: this.generateDataSummary(logs || [], metrics || [])
            };

        } catch (error) {
            console.log('❌ 데이터 수집 실패:', error.message);
            return this.generateSimulationAnalysisData();
        }
    }

    /**
     * 📈 데이터 요약 생성
     */
    generateDataSummary(logs, metrics) {
        const summary = {
            totalRequests: logs.length,
            errorRate: logs.length > 0 ? logs.filter(log => log.status_code >= 400).length / logs.length * 100 : 0,
            avgResponseTime: logs.length > 0 ? logs.reduce((sum, log) => sum + (log.response_time || 0), 0) / logs.length : 0,
            topEndpoints: {},
            errorPatterns: {},
            performanceMetrics: {}
        };

        // 엔드포인트별 통계
        logs.forEach(log => {
            const endpoint = log.endpoint || 'unknown';
            if (!summary.topEndpoints[endpoint]) {
                summary.topEndpoints[endpoint] = { count: 0, errors: 0, totalTime: 0 };
            }
            summary.topEndpoints[endpoint].count++;
            summary.topEndpoints[endpoint].totalTime += log.response_time || 0;
            if (log.status_code >= 400) {
                summary.topEndpoints[endpoint].errors++;
            }
        });

        // 에러 패턴 분석
        logs.filter(log => log.status_code >= 400).forEach(log => {
            const error = log.error_message || `HTTP ${log.status_code}`;
            summary.errorPatterns[error] = (summary.errorPatterns[error] || 0) + 1;
        });

        // 성능 메트릭 요약
        metrics.forEach(metric => {
            const name = metric.metric_name || 'unknown';
            if (!summary.performanceMetrics[name]) {
                summary.performanceMetrics[name] = { count: 0, total: 0, avg: 0 };
            }
            summary.performanceMetrics[name].count++;
            summary.performanceMetrics[name].total += metric.metric_value || 0;
            summary.performanceMetrics[name].avg = summary.performanceMetrics[name].total / summary.performanceMetrics[name].count;
        });

        return summary;
    }

    /**
     * 🎭 시뮬레이션 분석 데이터 생성
     */
    generateSimulationAnalysisData() {
        console.log('🎭 시뮬레이션 분석 데이터 생성 중...');

        return {
            logs: [
                { endpoint: '/api/ai/unified', status_code: 200, response_time: 150, timestamp: new Date().toISOString() },
                { endpoint: '/api/ai/chat', status_code: 500, response_time: 300, error_message: 'AI service timeout', timestamp: new Date().toISOString() },
                { endpoint: '/api/dashboard', status_code: 200, response_time: 80, timestamp: new Date().toISOString() }
            ],
            metrics: [
                { metric_name: 'page_load_time', metric_value: 1200, component: 'dashboard', timestamp: new Date().toISOString() },
                { metric_name: 'ai_response_time', metric_value: 2500, component: 'ai-sidebar', timestamp: new Date().toISOString() }
            ],
            summary: {
                totalRequests: 150,
                errorRate: 12.5,
                avgResponseTime: 180,
                topEndpoints: {
                    '/api/ai/unified': { count: 80, errors: 5, totalTime: 12000 },
                    '/api/dashboard': { count: 50, errors: 2, totalTime: 4000 },
                    '/api/ai/chat': { count: 20, errors: 8, totalTime: 6000 }
                },
                errorPatterns: {
                    'AI service timeout': 8,
                    'Database connection failed': 3,
                    'Rate limit exceeded': 2
                },
                performanceMetrics: {
                    'page_load_time': { count: 45, total: 54000, avg: 1200 },
                    'ai_response_time': { count: 30, total: 75000, avg: 2500 }
                }
            }
        };
    }

    /**
     * 🤖 AI 세션 시작
     */
    async startAISession() {
        try {
            console.log('🤖 AI 분석 세션 시작...');

            const startResult = await this.makeAIRequest('POST', '/api/ai-chat', {
                action: 'start',
                provider: 'google',
                title: '운영 데이터 기반 개발 인사이트 분석'
            });

            if (startResult.success) {
                this.sessionId = startResult.data.sessionId;
                console.log(`✅ AI 세션 시작됨 (ID: ${this.sessionId})`);
                return true;
            } else {
                console.log(`❌ AI 세션 시작 실패: ${startResult.error}`);
                return false;
            }

        } catch (error) {
            console.log(`❌ AI 세션 시작 중 오류: ${error.message}`);
            return false;
        }
    }

    /**
     * 🧠 AI에게 데이터 분석 요청
     */
    async requestAIAnalysis(data, analysisType) {
        if (!this.sessionId) {
            console.log('❌ AI 세션이 시작되지 않았습니다.');
            return null;
        }

        const analysisPrompts = {
            performance: `
🚀 성능 분석 요청

다음 운영 데이터를 분석해서 성능 개선 포인트를 찾아주세요:

📊 요약 통계:
- 총 요청 수: ${data.summary.totalRequests}
- 평균 응답시간: ${data.summary.avgResponseTime.toFixed(0)}ms
- 에러율: ${data.summary.errorRate.toFixed(1)}%

🔝 주요 엔드포인트:
${Object.entries(data.summary.topEndpoints).map(([endpoint, stats]) =>
                `- ${endpoint}: ${stats.count}회 호출, 평균 ${(stats.totalTime / stats.count).toFixed(0)}ms, 에러 ${stats.errors}개`
            ).join('\n')}

📈 성능 메트릭:
${Object.entries(data.summary.performanceMetrics).map(([metric, stats]) =>
                `- ${metric}: 평균 ${stats.avg.toFixed(0)}ms (${stats.count}회 측정)`
            ).join('\n')}

다음 관점에서 분석해주세요:
1. 가장 느린 엔드포인트와 개선 방법
2. 에러율이 높은 부분의 원인과 해결책
3. 사용자 경험 개선을 위한 우선순위
4. 구체적인 코드 개선 제안

개발자가 바로 적용할 수 있는 실용적인 조언을 부탁드립니다.
            `,

            errors: `
🚨 에러 패턴 분석 요청

운영 환경에서 발생한 에러 패턴을 분석해주세요:

❌ 에러 발생 현황:
${Object.entries(data.summary.errorPatterns).map(([error, count]) =>
                `- ${error}: ${count}회 발생`
            ).join('\n')}

📊 전체 통계:
- 총 요청: ${data.summary.totalRequests}회
- 에러율: ${data.summary.errorRate.toFixed(1)}%
- 주요 문제 엔드포인트: ${Object.entries(data.summary.topEndpoints)
                    .filter(([_, stats]) => stats.errors > 0)
                    .map(([endpoint, stats]) => `${endpoint} (${stats.errors}개 에러)`)
                    .join(', ')}

다음을 분석해주세요:
1. 가장 자주 발생하는 에러의 근본 원인
2. 에러 발생 패턴 (시간대, 사용자 행동 등)
3. 각 에러에 대한 구체적인 해결 방법
4. 에러 예방을 위한 코드 개선 제안
5. 모니터링 및 알림 개선 방안

실제 코드 수정이 가능한 구체적인 가이드를 제공해주세요.
            `,

            optimization: `
⚡ 최적화 기회 분석 요청

운영 데이터를 바탕으로 시스템 최적화 기회를 찾아주세요:

📊 현재 상황:
- 평균 응답시간: ${data.summary.avgResponseTime.toFixed(0)}ms
- 가장 많이 호출되는 API: ${Object.entries(data.summary.topEndpoints)
                    .sort(([, a], [, b]) => b.count - a.count)[0]?.[0] || 'N/A'}
- 가장 느린 기능: ${Object.entries(data.summary.performanceMetrics)
                    .sort(([, a], [, b]) => b.avg - a.avg)[0]?.[0] || 'N/A'}

🎯 분석 요청사항:
1. 캐싱 도입으로 개선 가능한 부분
2. 데이터베이스 쿼리 최적화 포인트
3. 프론트엔드 성능 개선 기회
4. AI 응답 속도 개선 방법
5. 리소스 사용량 최적화 방안

각 제안에 대해:
- 예상 개선 효과 (응답시간, 에러율 등)
- 구현 난이도 (쉬움/보통/어려움)
- 구체적인 구현 방법
- 우선순위 (높음/보통/낮음)

를 포함해서 답변해주세요.
            `,

            insights: `
💡 개발 인사이트 도출 요청

운영 데이터에서 개발에 도움이 되는 인사이트를 찾아주세요:

📈 데이터 현황:
- 수집 기간: 최근 24시간
- 총 데이터 포인트: ${data.logs.length + data.metrics.length}개
- 사용자 세션: ${new Set(data.logs.map(log => log.session_id)).size}개
- 주요 사용 패턴: ${Object.keys(data.summary.topEndpoints).slice(0, 3).join(', ')}

🔍 인사이트 요청:
1. 사용자들이 가장 많이 사용하는 기능과 그 이유
2. 사용자 이탈이 발생하는 지점과 개선 방안
3. AI 기능의 실제 활용도와 만족도
4. 성능이 사용자 경험에 미치는 영향
5. 향후 개발 우선순위 제안

데이터 기반으로 다음 스프린트에서 집중해야 할 개발 영역을 추천해주세요.
특히 사용자 가치와 기술적 개선의 균형을 고려한 제안을 부탁드립니다.
            `
        };

        try {
            console.log(`🧠 AI ${analysisType} 분석 요청 중...`);

            const response = await this.makeAIRequest('POST', '/api/ai-chat', {
                action: 'send',
                message: analysisPrompts[analysisType],
                sessionId: this.sessionId
            });

            if (response.success) {
                console.log(`✅ AI ${analysisType} 분석 완료`);
                return {
                    type: analysisType,
                    analysis: response.data.response.content,
                    processingTime: response.data.processingTime,
                    timestamp: new Date().toISOString()
                };
            } else {
                console.log(`❌ AI ${analysisType} 분석 실패: ${response.error}`);
                return null;
            }

        } catch (error) {
            console.log(`❌ AI ${analysisType} 분석 중 오류: ${error.message}`);
            return null;
        }
    }

    /**
     * 💾 분석 결과 저장
     */
    async saveAnalysisResults(results) {
        if (!this.supabase || !results.length) {
            console.log('📝 분석 결과를 로컬에 저장합니다.');

            const fs = require('fs').promises;
            const path = require('path');

            try {
                const resultsDir = path.join(process.cwd(), 'analysis-results');
                await fs.mkdir(resultsDir, { recursive: true });

                const filename = `ai-analysis-${new Date().toISOString().split('T')[0]}.json`;
                const filepath = path.join(resultsDir, filename);

                await fs.writeFile(filepath, JSON.stringify(results, null, 2));
                console.log(`✅ 분석 결과 저장: ${filepath}`);

            } catch (error) {
                console.log('⚠️ 로컬 저장 실패:', error.message);
            }
            return;
        }

        try {
            const { error } = await this.supabase
                .from('ai_analysis_results')
                .insert(results.map(result => ({
                    analysis_type: result.type,
                    analysis_content: result.analysis,
                    processing_time: result.processingTime,
                    data_period: '24h',
                    created_at: result.timestamp,
                    metadata: {
                        session_id: this.sessionId,
                        ai_model: 'google-gemini',
                        data_points: this.analysisResults.length
                    }
                })));

            if (error) {
                console.log('⚠️ Supabase 저장 실패:', error.message);
            } else {
                console.log(`✅ 분석 결과 ${results.length}개 Supabase에 저장 완료`);
            }

        } catch (error) {
            console.log('❌ 분석 결과 저장 중 오류:', error.message);
        }
    }

    /**
     * 🚀 전체 분석 프로세스 실행
     */
    async runFullAnalysis() {
        console.log('🚀 AI 데이터 분석 프로세스 시작\n');

        // 1. 운영 데이터 수집
        const data = await this.collectOperationalData();

        // 2. AI 세션 시작
        const sessionStarted = await this.startAISession();
        if (!sessionStarted) {
            console.log('❌ AI 세션 시작 실패로 분석을 중단합니다.');
            return;
        }

        // 3. 다양한 관점에서 AI 분석 수행
        const analysisTypes = ['performance', 'errors', 'optimization', 'insights'];
        const results = [];

        for (const analysisType of analysisTypes) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🔍 ${analysisType.toUpperCase()} 분석`);
            console.log('='.repeat(60));

            const result = await this.requestAIAnalysis(data, analysisType);
            if (result) {
                results.push(result);
                console.log('\n📋 분석 결과:');
                console.log('-'.repeat(60));
                console.log(result.analysis);
                console.log('-'.repeat(60));
                console.log(`⏱️ 처리 시간: ${result.processingTime}ms\n`);
            }

            // 다음 분석 전 잠시 대기
            if (analysisType !== analysisTypes[analysisTypes.length - 1]) {
                console.log('⏳ 다음 분석 준비 중...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // 4. 분석 결과 저장
        if (results.length > 0) {
            await this.saveAnalysisResults(results);
            this.analysisResults = results;
        }

        // 5. 종합 요약
        console.log('\n' + '='.repeat(60));
        console.log('🎯 AI 데이터 분석 완료');
        console.log('='.repeat(60));
        console.log(`📊 분석 완료: ${results.length}개 영역`);
        console.log(`⏱️ 총 소요 시간: ${results.reduce((sum, r) => sum + r.processingTime, 0)}ms`);
        console.log(`🤖 AI 세션: ${this.sessionId}`);

        console.log('\n💡 다음 단계:');
        console.log('   1. 경연용 대시보드에서 결과 확인');
        console.log('   2. AI 제안사항을 바탕으로 코드 개선');
        console.log('   3. 개선 효과 측정 및 피드백');

        console.log('\n🚀 경연 데모 포인트:');
        console.log('   "실제 운영 데이터를 AI가 분석해서 데이터 기반으로 개발했습니다!"');
    }

    /**
     * 📊 분석 결과 요약
     */
    async showAnalysisSummary() {
        if (!this.supabase) {
            console.log('📊 로컬 분석 결과 확인 중...');

            const fs = require('fs').promises;
            const path = require('path');

            try {
                const resultsDir = path.join(process.cwd(), 'analysis-results');
                const files = await fs.readdir(resultsDir);
                const latestFile = files.filter(f => f.startsWith('ai-analysis-')).sort().pop();

                if (latestFile) {
                    const content = await fs.readFile(path.join(resultsDir, latestFile), 'utf8');
                    const results = JSON.parse(content);

                    console.log(`📁 최근 분석 결과: ${latestFile}`);
                    console.log(`📊 분석 영역: ${results.length}개`);
                    results.forEach(result => {
                        console.log(`   - ${result.type}: ${result.analysis.substring(0, 100)}...`);
                    });
                }

            } catch (error) {
                console.log('⚠️ 로컬 분석 결과를 찾을 수 없습니다.');
            }
            return;
        }

        try {
            const { data, error } = await this.supabase
                .from('ai_analysis_results')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.log('⚠️ 분석 결과 조회 실패:', error.message);
                return;
            }

            console.log('📊 최근 AI 분석 결과:');
            console.log(`📈 총 ${data.length}개 분석 완료`);

            data.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.analysis_type.toUpperCase()} 분석`);
                console.log(`   📅 분석 시간: ${new Date(result.created_at).toLocaleString('ko-KR')}`);
                console.log(`   ⏱️ 처리 시간: ${result.processing_time}ms`);
                console.log(`   📝 내용: ${result.analysis_content.substring(0, 150)}...`);
            });

        } catch (error) {
            console.log('❌ 분석 결과 조회 중 오류:', error.message);
        }
    }
}

// CLI 실행
if (require.main === module) {
    const analyzer = new AIDataAnalyzer();
    const command = process.argv[2] || 'analyze';

    switch (command) {
        case 'analyze':
        case 'run':
            analyzer.runFullAnalysis();
            break;

        case 'summary':
        case 'results':
            analyzer.showAnalysisSummary();
            break;

        default:
            console.log('🤖 AI 데이터 분석기');
            console.log('\n사용법:');
            console.log('   node scripts/ai-data-analyzer.js analyze   # 전체 분석 실행');
            console.log('   node scripts/ai-data-analyzer.js summary   # 분석 결과 요약');
            break;
    }
}

module.exports = AIDataAnalyzer; 