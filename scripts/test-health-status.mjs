#!/usr/bin/env node

/**
 * 🏥 AI 헬스 상태 테스트 스크립트
 */

const API_URL = 'http://localhost:3003/api/ai/health';

async function testHealthStatus() {
    console.log('🏥 AI 엔진 헬스 상태 테스트 시작...\n');

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        console.log('📊 전체 상태:', result.overall);
        console.log('🕐 타임스탬프:', result.timestamp);
        console.log('');

        // MCP 상태
        console.log('🧠 MCP 엔진:');
        console.log(`   상태: ${result.mcp.status}`);
        if (result.mcp.latency) {
            console.log(`   지연시간: ${result.mcp.latency}ms`);
        }
        console.log('');

        // RAG 상태
        console.log('📚 RAG 엔진:');
        console.log(`   상태: ${result.rag.status}`);
        if (result.rag.documents) {
            console.log(`   문서 수: ${result.rag.documents}개`);
        }
        console.log('');

        // Google AI 상태
        console.log('🌐 Google AI:');
        console.log(`   상태: ${result.google_ai.status}`);
        if (result.google_ai.model) {
            console.log(`   모델: ${result.google_ai.model}`);
        }
        if (result.google_ai.responseTime) {
            console.log(`   응답시간: ${result.google_ai.responseTime}ms`);
        }
        console.log('');

        // Redis 상태
        if (result.redis) {
            console.log('🔴 Redis:');
            console.log(`   상태: ${result.redis.status}`);
            if (result.redis.responseTime) {
                console.log(`   응답시간: ${result.redis.responseTime}ms`);
            }
            console.log('');
        }

        // Supabase 상태
        if (result.supabase) {
            console.log('🟢 Supabase:');
            console.log(`   상태: ${result.supabase.status}`);
            if (result.supabase.responseTime) {
                console.log(`   응답시간: ${result.supabase.responseTime}ms`);
            }
            console.log('');
        }

        // TensorFlow 상태 (deprecated)
        if (result.tensorflow) {
            console.log('⚠️ TensorFlow:');
            console.log(`   상태: ${result.tensorflow.status}`);
            if (result.tensorflow.message) {
                console.log(`   메시지: ${result.tensorflow.message}`);
            }
            console.log('');
        }

        // 상태별 이모지 표시
        const statusEmoji = {
            'healthy': '✅',
            'degraded': '⚠️',
            'critical': '❌'
        };

        console.log(`${statusEmoji[result.overall] || '❓'} 전체 시스템 상태: ${result.overall.toUpperCase()}`);

    } catch (error) {
        console.error('❌ 헬스 체크 실패:', error.message);
    }
}

// 실행
testHealthStatus(); 