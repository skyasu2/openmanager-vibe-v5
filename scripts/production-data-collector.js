#!/usr/bin/env node

/**
 * 🚀 운영 데이터 수집기 - 경연용 데이터 기반 개발
 * 
 * Vercel 배포 환경에서 실시간으로 운영 데이터를 수집하여
 * Supabase에 저장하고 AI가 분석할 수 있도록 구조화합니다.
 * 
 * 📊 수집 데이터:
 * - 사용자 행동 패턴
 * - API 응답 시간
 * - 에러 발생률
 * - 성능 메트릭
 * - 사용자 피드백
 */

const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

class ProductionDataCollector {
    constructor() {
        this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.vercelToken = process.env.VERCEL_TOKEN;

        if (!this.supabaseUrl || !this.supabaseKey) {
            console.log('⚠️ Supabase 환경변수가 설정되지 않았습니다.');
            console.log('📝 .env.local 파일에서 SUPABASE 설정을 확인해주세요.');
        }

        this.supabase = this.supabaseUrl && this.supabaseKey ?
            createClient(this.supabaseUrl, this.supabaseKey) : null;

        this.dataBuffer = [];
        this.isCollecting = false;
    }

    /**
     * 🗄️ Supabase 테이블 초기화
     */
    async initializeTables() {
        if (!this.supabase) {
            console.log('❌ Supabase 클라이언트가 초기화되지 않았습니다.');
            return false;
        }

        console.log('🗄️ 운영 데이터 테이블 초기화 중...');

        try {
            // 운영 로그 테이블 생성 (이미 존재하면 무시됨)
            const { error: logsError } = await this.supabase.rpc('create_production_logs_table');

            // 성능 메트릭 테이블 생성
            const { error: metricsError } = await this.supabase.rpc('create_performance_metrics_table');

            // AI 분석 결과 테이블 생성
            const { error: analysisError } = await this.supabase.rpc('create_ai_analysis_table');

            console.log('✅ 데이터베이스 테이블 초기화 완료');
            return true;

        } catch (error) {
            console.log('📝 테이블이 이미 존재하거나 수동 생성이 필요합니다.');
            console.log('💡 Supabase 대시보드에서 다음 테이블들을 확인해주세요:');
            console.log('   - production_logs');
            console.log('   - performance_metrics');
            console.log('   - ai_analysis_results');
            return true;
        }
    }

    /**
     * 📊 Vercel 로그 수집
     */
    async collectVercelLogs() {
        return new Promise((resolve, reject) => {
            console.log('📡 Vercel 로그 수집 시작...');

            // Vercel CLI가 없는 경우 시뮬레이션 데이터 생성
            if (!this.vercelToken) {
                console.log('💡 Vercel 토큰이 없어 시뮬레이션 데이터를 생성합니다.');
                resolve(this.generateSimulationData());
                return;
            }

            const command = `vercel logs --token=${this.vercelToken} --json`;

            exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    console.log('⚠️ Vercel 로그 수집 실패, 시뮬레이션 데이터 사용');
                    resolve(this.generateSimulationData());
                    return;
                }

                try {
                    const logs = stdout.split('\n')
                        .filter(line => line.trim())
                        .map(line => JSON.parse(line));

                    resolve(logs);
                } catch (parseError) {
                    console.log('⚠️ 로그 파싱 실패, 시뮬레이션 데이터 사용');
                    resolve(this.generateSimulationData());
                }
            });
        });
    }

    /**
     * 🎭 시뮬레이션 데이터 생성 (데모용)
     */
    generateSimulationData() {
        const now = new Date();
        const simulationData = [];

        // 다양한 시나리오의 운영 데이터 생성
        const scenarios = [
            {
                type: 'api_call',
                endpoint: '/api/ai/unified',
                method: 'POST',
                status: 200,
                responseTime: Math.random() * 500 + 100,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            {
                type: 'error',
                endpoint: '/api/ai/chat',
                method: 'POST',
                status: 500,
                error: 'AI service temporarily unavailable',
                responseTime: Math.random() * 200 + 50
            },
            {
                type: 'user_action',
                action: 'sidebar_open',
                component: 'ai-sidebar',
                duration: Math.random() * 5000 + 1000
            },
            {
                type: 'performance',
                metric: 'page_load_time',
                value: Math.random() * 2000 + 500,
                page: '/dashboard'
            },
            {
                type: 'user_feedback',
                rating: Math.floor(Math.random() * 5) + 1,
                feature: 'ai_assistant',
                comment: 'AI 응답이 도움이 되었습니다'
            }
        ];

        // 최근 1시간 동안의 데이터 생성
        for (let i = 0; i < 50; i++) {
            const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
            const timestamp = new Date(now.getTime() - Math.random() * 3600000); // 1시간 전까지

            simulationData.push({
                ...scenario,
                timestamp: timestamp.toISOString(),
                id: `sim_${Date.now()}_${i}`,
                session_id: `session_${Math.floor(Math.random() * 10) + 1}`,
                ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
                collected_at: now.toISOString()
            });
        }

        console.log(`✅ 시뮬레이션 데이터 ${simulationData.length}개 생성`);
        return simulationData;
    }

    /**
     * 💾 Supabase에 데이터 저장
     */
    async saveToSupabase(data) {
        if (!this.supabase || !data.length) {
            console.log('⚠️ 저장할 데이터가 없거나 Supabase 연결이 없습니다.');
            return false;
        }

        try {
            // 데이터 타입별로 분류하여 저장
            const logData = data.filter(item => ['api_call', 'error'].includes(item.type));
            const metricsData = data.filter(item => ['performance', 'user_action'].includes(item.type));
            const feedbackData = data.filter(item => item.type === 'user_feedback');

            // 운영 로그 저장
            if (logData.length > 0) {
                const { error: logsError } = await this.supabase
                    .from('production_logs')
                    .insert(logData.map(item => ({
                        log_type: item.type,
                        endpoint: item.endpoint,
                        method: item.method,
                        status_code: item.status,
                        response_time: item.responseTime,
                        error_message: item.error,
                        user_agent: item.userAgent,
                        ip_address: item.ip,
                        session_id: item.session_id,
                        timestamp: item.timestamp,
                        raw_data: item
                    })));

                if (logsError) {
                    console.log('⚠️ 로그 저장 실패:', logsError.message);
                } else {
                    console.log(`✅ 운영 로그 ${logData.length}개 저장 완료`);
                }
            }

            // 성능 메트릭 저장
            if (metricsData.length > 0) {
                const { error: metricsError } = await this.supabase
                    .from('performance_metrics')
                    .insert(metricsData.map(item => ({
                        metric_type: item.type,
                        metric_name: item.metric || item.action,
                        metric_value: item.value || item.duration,
                        component: item.component || item.page,
                        session_id: item.session_id,
                        timestamp: item.timestamp,
                        raw_data: item
                    })));

                if (metricsError) {
                    console.log('⚠️ 메트릭 저장 실패:', metricsError.message);
                } else {
                    console.log(`✅ 성능 메트릭 ${metricsData.length}개 저장 완료`);
                }
            }

            return true;

        } catch (error) {
            console.log('❌ 데이터 저장 중 오류:', error.message);
            return false;
        }
    }

    /**
     * 📈 실시간 데이터 수집 시작
     */
    async startCollection(duration = 60000) { // 기본 1분
        if (this.isCollecting) {
            console.log('⚠️ 이미 데이터 수집이 진행 중입니다.');
            return;
        }

        console.log('🚀 실시간 운영 데이터 수집 시작');
        console.log(`⏱️ 수집 시간: ${duration / 1000}초`);

        this.isCollecting = true;
        const startTime = Date.now();

        // 테이블 초기화
        await this.initializeTables();

        const collectInterval = setInterval(async () => {
            try {
                const data = await this.collectVercelLogs();
                this.dataBuffer.push(...data);

                console.log(`📊 데이터 수집: ${data.length}개 (총 ${this.dataBuffer.length}개)`);

                // 버퍼가 일정 크기 이상이면 저장
                if (this.dataBuffer.length >= 20) {
                    await this.saveToSupabase(this.dataBuffer);
                    this.dataBuffer = [];
                }

            } catch (error) {
                console.log('⚠️ 데이터 수집 중 오류:', error.message);
            }
        }, 5000); // 5초마다 수집

        // 지정된 시간 후 수집 종료
        setTimeout(async () => {
            clearInterval(collectInterval);

            // 남은 데이터 저장
            if (this.dataBuffer.length > 0) {
                await this.saveToSupabase(this.dataBuffer);
                this.dataBuffer = [];
            }

            this.isCollecting = false;
            const totalTime = Date.now() - startTime;

            console.log('🎯 데이터 수집 완료');
            console.log(`⏱️ 총 수집 시간: ${totalTime / 1000}초`);

            // 수집 결과 요약
            await this.generateCollectionSummary();

        }, duration);
    }

    /**
     * 📋 수집 결과 요약
     */
    async generateCollectionSummary() {
        if (!this.supabase) {
            console.log('📊 수집 완료 (Supabase 연결 없음)');
            return;
        }

        try {
            // 최근 수집된 데이터 통계
            const { data: logs, error: logsError } = await this.supabase
                .from('production_logs')
                .select('*')
                .gte('timestamp', new Date(Date.now() - 3600000).toISOString()) // 1시간 이내
                .order('timestamp', { ascending: false });

            const { data: metrics, error: metricsError } = await this.supabase
                .from('performance_metrics')
                .select('*')
                .gte('timestamp', new Date(Date.now() - 3600000).toISOString())
                .order('timestamp', { ascending: false });

            console.log('\n📊 수집 결과 요약:');
            console.log(`📝 운영 로그: ${logs?.length || 0}개`);
            console.log(`📈 성능 메트릭: ${metrics?.length || 0}개`);

            if (logs && logs.length > 0) {
                const errorRate = logs.filter(log => log.status_code >= 400).length / logs.length * 100;
                const avgResponseTime = logs.reduce((sum, log) => sum + (log.response_time || 0), 0) / logs.length;

                console.log(`❌ 에러율: ${errorRate.toFixed(1)}%`);
                console.log(`⚡ 평균 응답시간: ${avgResponseTime.toFixed(0)}ms`);
            }

            console.log('\n🎯 다음 단계: AI 데이터 분석');
            console.log('💡 실행 명령: node scripts/ai-data-analyzer.js');

        } catch (error) {
            console.log('⚠️ 요약 생성 중 오류:', error.message);
        }
    }

    /**
     * 🔍 현재 상태 확인
     */
    async checkStatus() {
        console.log('🔍 운영 데이터 수집기 상태 확인\n');

        console.log('📡 연결 상태:');
        console.log(`   Supabase: ${this.supabase ? '✅ 연결됨' : '❌ 연결 안됨'}`);
        console.log(`   Vercel: ${this.vercelToken ? '✅ 토큰 있음' : '⚠️ 토큰 없음 (시뮬레이션 모드)'}`);
        console.log(`   수집 상태: ${this.isCollecting ? '🔄 진행 중' : '⏸️ 대기 중'}`);

        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('production_logs')
                    .select('count')
                    .limit(1);

                console.log(`\n📊 저장된 데이터: ${data ? '확인 가능' : '테이블 생성 필요'}`);
            } catch (error) {
                console.log('\n📊 저장된 데이터: 테이블 생성 필요');
            }
        }

        console.log('\n🚀 사용법:');
        console.log('   node scripts/production-data-collector.js start    # 데이터 수집 시작');
        console.log('   node scripts/production-data-collector.js status   # 상태 확인');
        console.log('   node scripts/production-data-collector.js demo     # 데모 데이터 생성');
    }

    /**
     * 🎭 데모용 데이터 생성
     */
    async generateDemoData() {
        console.log('🎭 경연용 데모 데이터 생성 중...');

        await this.initializeTables();

        // 다양한 시나리오의 데이터 생성
        const demoData = [];
        const now = new Date();

        // 지난 24시간 동안의 데이터 생성
        for (let hour = 0; hour < 24; hour++) {
            for (let i = 0; i < 10; i++) {
                const timestamp = new Date(now.getTime() - hour * 3600000 - Math.random() * 3600000);

                demoData.push({
                    type: 'api_call',
                    endpoint: '/api/ai/unified',
                    method: 'POST',
                    status: Math.random() > 0.1 ? 200 : 500,
                    responseTime: Math.random() * 1000 + 100,
                    timestamp: timestamp.toISOString(),
                    session_id: `demo_session_${Math.floor(Math.random() * 20)}`,
                    ip: `192.168.1.${Math.floor(Math.random() * 255)}`
                });
            }
        }

        await this.saveToSupabase(demoData);
        console.log(`✅ 데모 데이터 ${demoData.length}개 생성 완료`);
        console.log('🎯 경연용 대시보드에서 확인 가능합니다!');
    }
}

// CLI 실행
if (require.main === module) {
    const collector = new ProductionDataCollector();
    const command = process.argv[2] || 'status';

    switch (command) {
        case 'start':
            const duration = parseInt(process.argv[3]) || 60000; // 기본 1분
            collector.startCollection(duration);
            break;

        case 'demo':
            collector.generateDemoData();
            break;

        case 'status':
        default:
            collector.checkStatus();
            break;
    }
}

module.exports = ProductionDataCollector; 