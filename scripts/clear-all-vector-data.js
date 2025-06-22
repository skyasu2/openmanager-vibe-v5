#!/usr/bin/env node

/**
 * 🗑️ 모든 벡터 데이터 삭제 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// 환경변수 로드
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllVectorData() {
    console.log('🗑️ 모든 벡터 데이터 삭제 시작...\n');

    try {
        // 1. 현재 데이터 확인
        const { count: beforeCount } = await supabase
            .from('command_vectors')
            .select('*', { count: 'exact', head: true });

        console.log(`📊 삭제 전 데이터 개수: ${beforeCount || 0}개`);

        if (!beforeCount || beforeCount === 0) {
            console.log('✅ 이미 테이블이 비어있습니다');
            return;
        }

        // 2. 모든 데이터 개별 삭제
        console.log('🔄 개별 삭제 시작...');

        const { data: allData } = await supabase
            .from('command_vectors')
            .select('id');

        if (allData && allData.length > 0) {
            console.log(`📋 총 ${allData.length}개 항목 개별 삭제 중...`);

            for (let i = 0; i < allData.length; i++) {
                const { error } = await supabase
                    .from('command_vectors')
                    .delete()
                    .eq('id', allData[i].id);

                if (error) {
                    console.error(`❌ ${allData[i].id} 삭제 실패:`, error.message);
                } else {
                    console.log(`✅ ${allData[i].id} 삭제 완료 (${i + 1}/${allData.length})`);
                }
            }
        } else {
            console.log('📋 삭제할 데이터가 없습니다');
        }

        // 3. 삭제 확인
        const { count: afterCount } = await supabase
            .from('command_vectors')
            .select('*', { count: 'exact', head: true });

        console.log(`\n📊 삭제 후 데이터 개수: ${afterCount || 0}개`);

        if (afterCount === 0) {
            console.log('🎉 모든 벡터 데이터가 성공적으로 삭제되었습니다!');
        } else {
            console.log(`⚠️ ${afterCount}개 데이터가 남아있습니다`);
        }

    } catch (error) {
        console.error('❌ 삭제 과정에서 오류 발생:', error.message);
    }
}

// 실행
clearAllVectorData(); 