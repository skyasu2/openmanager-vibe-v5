#!/usr/bin/env node
/**
 * 통합 AI 도구
 * 
 * 이전에 분산되어 있던 AI 관련 스크립트들의 기능을 통합:
 * - ai-chat-cli.js
 * - ai-data-analyzer.js
 * - ai-system-check.js
 * - google-ai-usage-monitor.js
 * - set-google-ai-key.mjs
 * - quick-ai-logging-test.mjs
 */

import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import https from 'https';

class UnifiedAITools {
    constructor() {
        this.config = {
            googleAIEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
            supabaseEndpoint: process.env.NEXT_PUBLIC_SUPABASE_URL,
            maxRetries: 3,
            timeout: 30000
        };
    }

    async makeAPIRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Unified-AI-Tools/1.0',
                    ...options.headers
                },
                timeout: this.config.timeout
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({
                            status: res.statusCode,
                            data: JSON.parse(data),
                            headers: res.headers
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: data,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));

            if (options.data) {
                req.write(JSON.stringify(options.data));
            }

            req.end();
        });
    }

    async checkGoogleAISetup() {
        console.log('🔍 Google AI 설정 확인 중...');
        
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            console.log('❌ GOOGLE_AI_API_KEY 환경변수가 설정되지 않았습니다.');
            return false;
        }

        try {
            const response = await this.makeAPIRequest(
                `${this.config.googleAIEndpoint}?key=${apiKey}`,
                {
                    method: 'POST',
                    data: {
                        contents: [{
                            parts: [{ text: 'Hello, this is a test message.' }]
                        }]
                    }
                }
            );

            if (response.status === 200) {
                console.log('✅ Google AI API 연결 성공');
                return true;
            } else {
                console.log(`❌ Google AI API 오류: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Google AI API 연결 실패: ${error.message}`);
            return false;
        }
    }

    async monitorAIUsage() {
        console.log('📊 AI 사용량 모니터링 시작...');
        
        try {
            // 로컬 사용량 로그 확인
            const logPath = 'logs/ai-combined.log';
            try {
                const logContent = await fs.readFile(logPath, 'utf8');
                const lines = logContent.split('\n').filter(line => line.trim());
                
                const todayStr = new Date().toISOString().split('T')[0];
                const todayUsage = lines.filter(line => line.includes(todayStr));
                
                console.log(`📅 오늘의 AI API 호출: ${todayUsage.length}회`);
                
                // 시간대별 사용량 분석
                const hourlyUsage = {};
                todayUsage.forEach(line => {
                    const hour = line.substring(11, 13);
                    hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
                });
                
                console.log('⏰ 시간대별 사용량:');
                Object.entries(hourlyUsage)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .forEach(([hour, count]) => {
                        console.log(`  ${hour}시: ${count}회`);
                    });
                    
            } catch (error) {
                console.log('⚠️ 사용량 로그 파일을 찾을 수 없습니다.');
            }

            // API 상태 체크
            const isGoogleAIWorking = await this.checkGoogleAISetup();
            
            return {
                googleAI: isGoogleAIWorking,
                usageData: todayUsage?.length || 0
            };
            
        } catch (error) {
            console.error('사용량 모니터링 오류:', error.message);
            return null;
        }
    }

    async testAIChat(message) {
        console.log(`💬 AI 채팅 테스트: "${message}"`);
        
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            console.log('❌ Google AI API 키가 설정되지 않았습니다.');
            return null;
        }

        try {
            const response = await this.makeAPIRequest(
                `${this.config.googleAIEndpoint}?key=${apiKey}`,
                {
                    method: 'POST',
                    data: {
                        contents: [{
                            parts: [{ text: message }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 150
                        }
                    }
                }
            );

            if (response.status === 200 && response.data.candidates) {
                const reply = response.data.candidates[0]?.content?.parts?.[0]?.text;
                console.log('🤖 AI 응답:', reply);
                
                // 사용량 로깅
                await this.logAIUsage('google-ai', message, reply);
                
                return reply;
            } else {
                console.log('❌ AI 응답 오류:', response.data);
                return null;
            }
        } catch (error) {
            console.error('AI 채팅 오류:', error.message);
            return null;
        }
    }

    async logAIUsage(provider, input, output) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            provider,
            inputLength: input.length,
            outputLength: output?.length || 0,
            inputHash: createHash('md5').update(input).digest('hex').substring(0, 8)
        };

        try {
            const logPath = 'logs/ai-combined.log';
            const logLine = `[${timestamp}] ${provider}: in=${logEntry.inputLength}, out=${logEntry.outputLength}, hash=${logEntry.inputHash}\n`;
            
            await fs.mkdir('logs', { recursive: true });
            await fs.appendFile(logPath, logLine);
        } catch (error) {
            console.warn('로그 작성 실패:', error.message);
        }
    }

    async analyzeAIPerformance() {
        console.log('📈 AI 성능 분석 시작...');
        
        try {
            const logPath = 'logs/ai-combined.log';
            const logContent = await fs.readFile(logPath, 'utf8');
            const lines = logContent.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                console.log('📊 분석할 로그 데이터가 없습니다.');
                return null;
            }
            
            const analysis = {
                totalRequests: lines.length,
                averageInputLength: 0,
                averageOutputLength: 0,
                providerUsage: {},
                dailyUsage: {}
            };
            
            let totalInputLength = 0;
            let totalOutputLength = 0;
            
            lines.forEach(line => {
                const match = line.match(/\[([^\]]+)\] ([^:]+): in=(\d+), out=(\d+)/);
                if (match) {
                    const [, timestamp, provider, inputLen, outputLen] = match;
                    const date = timestamp.split('T')[0];
                    
                    totalInputLength += parseInt(inputLen);
                    totalOutputLength += parseInt(outputLen);
                    
                    analysis.providerUsage[provider] = (analysis.providerUsage[provider] || 0) + 1;
                    analysis.dailyUsage[date] = (analysis.dailyUsage[date] || 0) + 1;
                }
            });
            
            analysis.averageInputLength = Math.round(totalInputLength / lines.length);
            analysis.averageOutputLength = Math.round(totalOutputLength / lines.length);
            
            console.log('📊 AI 성능 분석 결과:');
            console.log(`  총 요청 수: ${analysis.totalRequests}`);
            console.log(`  평균 입력 길이: ${analysis.averageInputLength} 문자`);
            console.log(`  평균 출력 길이: ${analysis.averageOutputLength} 문자`);
            console.log('  제공자별 사용량:');
            Object.entries(analysis.providerUsage).forEach(([provider, count]) => {
                console.log(`    ${provider}: ${count}회`);
            });
            
            return analysis;
            
        } catch (error) {
            console.error('성능 분석 오류:', error.message);
            return null;
        }
    }

    async runSystemCheck() {
        console.log('🔧 AI 시스템 전체 점검 시작...\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            googleAI: await this.checkGoogleAISetup(),
            usage: await this.monitorAIUsage(),
            performance: await this.analyzeAIPerformance()
        };
        
        console.log('\n📋 시스템 점검 완료:');
        console.log(`  Google AI: ${results.googleAI ? '✅' : '❌'}`);
        console.log(`  사용량 모니터링: ${results.usage ? '✅' : '❌'}`);
        console.log(`  성능 분석: ${results.performance ? '✅' : '❌'}`);
        
        return results;
    }
}

// CLI 실행
if (process.argv[1] === import.meta.url.replace('file://', '')) {
    const aiTools = new UnifiedAITools();
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    try {
        switch (command) {
            case 'check':
                await aiTools.runSystemCheck();
                break;
                
            case 'monitor':
                await aiTools.monitorAIUsage();
                break;
                
            case 'chat':
                const message = args.join(' ') || 'Hello, how are you?';
                await aiTools.testAIChat(message);
                break;
                
            case 'analyze':
                await aiTools.analyzeAIPerformance();
                break;
                
            default:
                console.log('🤖 통합 AI 도구 사용법:');
                console.log('  node unified-ai-tools.mjs check     # 시스템 전체 점검');
                console.log('  node unified-ai-tools.mjs monitor   # 사용량 모니터링');
                console.log('  node unified-ai-tools.mjs chat [메시지] # AI 채팅 테스트');
                console.log('  node unified-ai-tools.mjs analyze   # 성능 분석');
                break;
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 오류:', error.message);
        process.exit(1);
    }
}

export default UnifiedAITools;