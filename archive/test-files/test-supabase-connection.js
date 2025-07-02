/**
 * 🔍 Supabase 연결 테스트
 * OpenManager Vibe v5 - 문제 해결용
 */

async function testSupabaseConnection() {
  try {
    console.log('🔍 Supabase 연결 테스트 시작...');

    const supabaseUrl = 'https://vnswjnltnhpsueosfhmw.supabase.co';
    const supabaseKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU';

    // 1. REST API 테스트
    console.log('1️⃣ REST API 연결 테스트...');
    const restResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   상태 코드: ${restResponse.status}`);
    if (restResponse.status === 200) {
      console.log('   ✅ REST API 연결 성공');
    } else {
      console.log(`   ❌ REST API 연결 실패: ${restResponse.statusText}`);
    }

    // 2. 벡터 검색 RPC 테스트
    console.log('2️⃣ 벡터 검색 RPC 테스트...');
    const rpcResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/search_documents`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_embedding: new Array(384).fill(0.1),
          match_threshold: 0.5,
          match_count: 5,
        }),
      }
    );

    console.log(`   상태 코드: ${rpcResponse.status}`);
    if (rpcResponse.status === 200) {
      console.log('   ✅ 벡터 검색 RPC 연결 성공');
      const data = await rpcResponse.json();
      console.log(`   📊 검색 결과: ${data.length || 0}개`);
    } else {
      console.log(`   ❌ 벡터 검색 RPC 실패: ${rpcResponse.statusText}`);
      const errorText = await rpcResponse.text();
      console.log(`   오류 내용: ${errorText}`);
    }

    // 3. 테이블 조회 테스트
    console.log('3️⃣ 문서 테이블 조회 테스트...');
    const tableResponse = await fetch(
      `${supabaseUrl}/rest/v1/documents?select=count`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'count=exact',
        },
      }
    );

    console.log(`   상태 코드: ${tableResponse.status}`);
    if (tableResponse.status === 200) {
      const countHeader = tableResponse.headers.get('content-range');
      console.log(`   ✅ 문서 테이블 조회 성공`);
      console.log(`   📊 문서 개수: ${countHeader || '알 수 없음'}`);
    } else {
      console.log(`   ❌ 문서 테이블 조회 실패: ${tableResponse.statusText}`);
    }
  } catch (error) {
    console.error('❌ Supabase 연결 테스트 실패:', error.message);
  }
}

// Node.js 환경에서 fetch 사용
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testSupabaseConnection();
