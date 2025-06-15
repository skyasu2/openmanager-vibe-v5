#!/usr/bin/env node

/**
 * 🔥 MCP 웜업 테스트 스크립트
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testMCPWarmup() {
    console.log('🔥 MCP 웜업 테스트 시작...\n');

    try {
        // 1. MCP 웜업 실행
        console.log('1️⃣ MCP 웜업 실행...');
        const warmupResponse = await fetch(`${API_BASE}/mcp/warmup`);

        if (warmupResponse.ok) {
            const warmupData = await warmupResponse.json();
            console.log('✅ MCP 웜업 결과:', JSON.stringify(warmupData, null, 2));
        } else {
            console.error('❌ MCP 웜업 실패:', warmupResponse.status, warmupResponse.statusText);
        }

        // 2. 웜업 후 MCP 쿼리 테스트
        console.log('\n2️⃣ 웜업 후 MCP 쿼리 테스트...');
        const queryResponse = await fetch(`${API_BASE}/mcp/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: '웜업 후 테스트 쿼리',
                sessionId: `warmup_test_${Date.now()}`
            })
        });

        if (queryResponse.ok) {
            const queryData = await queryResponse.json();
            console.log('✅ 웜업 후 MCP 쿼리 성공:', {
                success: queryData.success,
                responseLength: queryData.response?.length || 0,
                confidence: queryData.confidence,
                source: queryData.source,
                processingTime: queryData.processingTime
            });
        } else {
            console.error('❌ 웜업 후 MCP 쿼리 실패:', queryResponse.status);
        }

        // 3. 벡터 DB 상태 확인
        console.log('\n3️⃣ 벡터 DB 상태 확인...');
        const ragResponse = await fetch(`${API_BASE}/ai/hybrid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: '벡터 DB 상태 확인 테스트',
                mode: 'rag-only'
            })
        });

        if (ragResponse.ok) {
            const ragData = await ragResponse.json();
            console.log('✅ 벡터 DB 상태:', {
                success: ragData.success,
                hasResponse: !!ragData.response,
                responseLength: ragData.response?.length || 0,
                confidence: ragData.data?.confidence || 0
            });
        } else {
            console.error('❌ 벡터 DB 상태 확인 실패:', ragResponse.status);
        }

    } catch (error) {
        console.error('❌ MCP 웜업 테스트 실패:', error.message);
    }
}

testMCPWarmup(); 