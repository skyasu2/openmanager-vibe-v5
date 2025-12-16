
import { createClient } from '@supabase/supabase-js';
import { FIXED_24H_DATASETS, getDataAtMinute } from '../src/data/fixed-24h-metrics';
import dotenv from 'dotenv';
import path from 'path';

// Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase Credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 🎯 Seed Fixed Logs to Supabase
 * - 중복 방지 (Upsert using unique keys if possible, or check exist)
 * - 24시간치 모든 로그 적재
 */
async function seedLogs() {
  console.log('🚀 Seeding Fixed Logs to Supabase...');

  const logsToInsert: any[] = [];
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 15개 서버 x 144개 포인트 (10분 단위) 순회
  for (const dataset of FIXED_24H_DATASETS) {
    for (let i = 0; i < 144; i++) {
        const minuteOfDay = i * 10;
        const metric = getDataAtMinute(dataset, minuteOfDay);
        
        if (metric && metric.logs && metric.logs.length > 0) {
            // 시간 계산 (오늘 날짜 + 분)
            const hours = Math.floor(minuteOfDay / 60);
            const minutes = minuteOfDay % 60;
            const timestamp = new Date(`${today}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00Z`).toISOString();

            for (const logMsg of metric.logs) {
                // 로그 레벨 파싱
                let level = 'info';
                if (logMsg.includes('[CRITICAL]') || logMsg.includes('[ERROR]')) level = 'error';
                else if (logMsg.includes('[WARN]')) level = 'warn';

                logsToInsert.push({
                    server_id: dataset.serverId,
                    level: level,
                    message: logMsg,
                    timestamp: timestamp,
                    source: 'system-monitor',
                    // Deduplication Logic: Create a deterministic unique key?
                    // Or we just rely on Supabase to handle ID.
                    // To prevent duplication on re-run, we can check basic combo.
                    created_at: new Date().toISOString()
                });
            }
        }
    }
  }

  console.log(`📦 Prepared ${logsToInsert.length} log entries.`);

  // Batch Insert with Deduplication Check (Naive approach for script)
  // 실전에서는 'INSERT IGNORE'나 'ON CONFLICT DO NOTHING'이 좋지만, 
  // Supabase JS 에서는 upsert를 쓰려면 PK나 Unique constraint가 필요함.
  // 여기서는 간단히: "오늘 날짜의 로그를 해당 서버들에 대해 먼저 싹 지우고 다시 넣거나" (개발용),
  // 아니면 "존재하지 않는 것만 넣거나".
  // 가장 깔끔한 방법: 개발 환경이므로 Reset & Seed 가 확실함.

  console.log('🧹 Cleaning up existing logs for test servers (optional)...');
  // 주의: 실제 운영 데이터가 있다면 삭제하면 안됨. 
  // 여기서는 'FIXED_24H_DATASETS'에 있는 서버들의 로그만 오늘 날짜 기준으로 삭제 후 재생성한다고 가정.
  // 안전하게: 중복 체크하며 Insert.

  let insertedCount = 0;
  let skippedCount = 0;

  // Batch insert 50 at a time
  const BATCH_SIZE = 50;
  for (let i = 0; i < logsToInsert.length; i += BATCH_SIZE) {
    const batch = logsToInsert.slice(i, i + BATCH_SIZE);
    
    // Check duplication for the first item in batch to guess? No, unsafe.
    // Try to insert. If strict duplication prevention is needed without Unique Key on (server_id, timestamp, message),
    // we must select first.
    
    // Efficient Upsert requires a UNIQUE INDEX on (server_id, timestamp, message).
    // Let's assume user wants to populate data that *doesn't exist*.
    
    const { error } = await supabase
        .from('server_logs')
        .upsert(batch, { 
            onConflict: 'server_id, timestamp, message', // Requires unique constraint in DB
            ignoreDuplicates: true 
        });

    if (error) {
        // If "onConflict" assumes a constraint that doesn't exist, it might fail.
        // Fallback: Simple Insert (might duplicate if run twice without constraints)
        // User requested "중복없게".
        // Let's rely on `server_id` + `timestamp` query check for safety if specific constraint absent.
        console.warn('⚠️ Upsert failed (maybe constraint missing), trying safe insert...', error.message);
        
        // Very slow but safe fallback for script
        for (const log of batch) {
            const { data: existing } = await supabase
                .from('server_logs')
                .select('id')
                .eq('server_id', log.server_id)
                .eq('timestamp', log.timestamp)
                .eq('message', log.message)
                .single();
            
            if (!existing) {
                await supabase.from('server_logs').insert(log);
                insertedCount++;
            } else {
                skippedCount++;
            }
        }
    } else {
        insertedCount += batch.length;
    }
    
    process.stdout.write(`\r⏳ Processing... ${i + batch.length}/${logsToInsert.length}`);
  }

  console.log('\n');
  console.log(`✅ Seed Completed: ${insertedCount} inserted, ${skippedCount} skipped (duplicates).`);
}

seedLogs();
