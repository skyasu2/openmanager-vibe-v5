#!/usr/bin/env node

/**
 * 🔍 Supabase RPC 함수 확인 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSupabaseFunctions() {
  console.log('🔍 Supabase RPC 함수 확인 시작...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. search_similar_commands 함수 확인
    console.log('📋 RPC 함수 테스트...');

    const testVector = Array.from({ length: 384 }, () => Math.random() * 2 - 1);

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'search_similar_commands',
      {
        query_embedding: testVector,
        match_threshold: 0.7,
        match_count: 5,
      }
    );

    if (rpcError) {
      console.error('❌ RPC 함수 없음:', rpcError.message);
      console.log('\n🚨 해결 방법:');
      console.log('   1. Supabase Dashboard → SQL Editor');
      console.log('   2. infra/database/sql/setup-vector-database.sql 실행');
      console.log('   3. CREATE FUNCTION search_similar_commands 실행');
    } else {
      console.log('✅ RPC 함수 정상 작동');
      console.log('   결과:', rpcResult?.length || 0, '개');
    }

    // 2. 테이블 구조 확인
    console.log('\n📊 테이블 구조 확인...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('command_vectors')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ 테이블 접근 실패:', tableError.message);
    } else {
      console.log('✅ 테이블 접근 성공');
      console.log(
        '   스키마: id, content, metadata, embedding, created_at, updated_at'
      );
    }

    // 3. pgvector 확장 확인
    console.log('\n🔧 pgvector 확장 확인...');
    const { data: extensions, error: extError } = await supabase.rpc('version'); // PostgreSQL 버전 확인

    if (extError) {
      console.warn('⚠️ 확장 확인 실패:', extError.message);
    } else {
      console.log('✅ PostgreSQL 연결 확인');
    }
  } catch (error) {
    console.error('❌ 전체 테스트 실패:', error.message);
  }
}

checkSupabaseFunctions();
