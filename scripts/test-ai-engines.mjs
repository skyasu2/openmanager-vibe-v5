#!/usr/bin/env node

/**
 * 🤖 AI 엔진 동작 상태 테스트 스크립트
 * 
 * MCP → RAG → Google AI 순서로 각 엔진의 실제 동작을 테스트
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

async function testAIEngines() {
    console.log('🚀 AI 엔진 동작 상태 테스트 시작...\n');

    // 1. AI 헬스 체크
    console.log('1️⃣ AI 엔진 헬스 체크...');
    try {
        const healthResponse = await fetch(`${API_BASE}/ai/health`);
        const healthData = await healthResponse.json();
        console.log('✅ AI 헬스 상태:', JSON.stringify(healthData, null, 2));
    } catch (error) {
        console.error('❌ AI 헬스 체크 실패:', error.message);
    }

    // 2. MCP 엔진 테스트
    console.log('\n2️⃣ MCP 엔진 테스트...');
    try {
        const mcpResponse = await fetch(`${API_BASE}/mcp/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: '현재 서버 상태를 알려주세요',
                sessionId: `test_${Date.now()}`
            })
        });

        if (mcpResponse.ok) {
            const mcpData = await mcpResponse.json();
            console.log('✅ MCP 응답:', mcpData.response?.substring(0, 100) + '...');
        } else {
            console.log('⚠️ MCP 응답 실패:', mcpResponse.status);
        }
    } catch (error) {
        console.error('❌ MCP 테스트 실패:', error.message);
    }

    // 3. RAG 엔진 테스트
    console.log('\n3️⃣ RAG 엔진 테스트...');
    try {
        const ragResponse = await fetch(`${API_BASE}/ai/hybrid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: '서버 모니터링 방법을 알려주세요',
                mode: 'rag-only'
            })
        });

        if (ragResponse.ok) {
            const ragData = await ragResponse.json();
            console.log('✅ RAG 응답:', ragData.response?.substring(0, 100) + '...');
        } else {
            console.log('⚠️ RAG 응답 실패:', ragResponse.status);
        }
    } catch (error) {
        console.error('❌ RAG 테스트 실패:', error.message);
    }

    // 4. Google AI 테스트
    console.log('\n4️⃣ Google AI 엔진 테스트...');
    try {
        const googleResponse = await fetch(`${API_BASE}/ai/google-ai/status`);

        if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            console.log('✅ Google AI 상태:', googleData);
        } else {
            console.log('⚠️ Google AI 상태 확인 실패:', googleResponse.status);
        }
    } catch (error) {
        console.error('❌ Google AI 테스트 실패:', error.message);
    }

    console.log('\n🏁 AI 엔진 테스트 완료');
}

testAIEngines().catch(console.error); 