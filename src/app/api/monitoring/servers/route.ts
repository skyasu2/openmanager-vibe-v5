import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { redis } from '@/lib/redis'
import { DB_TABLES } from '@/config/database'
import { REDIS_PREFIXES, REDIS_TTL } from '@/config/redis'
import { ServerSchema } from '@/config/database'

// 서버 목록 조회
export async function GET() {
  try {
    // 캐시된 서버 목록 확인
    const cachedServers = await redis.get(`${REDIS_PREFIXES.CACHE}servers_list`)
    
    if (cachedServers) {
      return NextResponse.json({
        servers: JSON.parse(cachedServers as string),
        cached: true,
        timestamp: new Date().toISOString()
      })
    }
    
    // DB에서 서버 목록 조회
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.SERVERS)
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    
    // 결과 캐싱
    await redis.setex(
      `${REDIS_PREFIXES.CACHE}servers_list`,
      REDIS_TTL.CACHE_SHORT,
      JSON.stringify(data)
    )
    
    return NextResponse.json({
      servers: data,
      cached: false,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Servers API error:', error)
    
    return NextResponse.json(
      { error: '서버 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 서버 상태 업데이트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, metrics } = body
    
    if (!id) {
      return NextResponse.json(
        { error: '서버 ID가 필요합니다.' },
        { status: 400 }
      )
    }
    
    // 업데이트할 데이터 준비
    const updateData: Partial<ServerSchema> = {
      last_updated: new Date().toISOString()
    }
    
    // 상태 정보가 있으면 추가
    if (status) {
      updateData.status = status
    }
    
    // 리소스 메트릭이 있으면 추가
    if (metrics) {
      if (metrics.cpu) updateData.cpu = metrics.cpu
      if (metrics.memory) updateData.memory = metrics.memory
    }
    
    // 데이터베이스 업데이트
    const { error } = await supabaseAdmin
      .from(DB_TABLES.SERVERS)
      .update(updateData)
      .eq('id', id)
    
    if (error) throw error
    
    // Redis 캐시 갱신
    await redis.hset(`${REDIS_PREFIXES.SERVER}${id}`, updateData)
    await redis.expire(`${REDIS_PREFIXES.SERVER}${id}`, REDIS_TTL.SERVER_STATUS)
    
    // 서버 목록 캐시 무효화
    await redis.del(`${REDIS_PREFIXES.CACHE}servers_list`)
    
    return NextResponse.json({
      success: true,
      id,
      timestamp: updateData.last_updated
    })
  } catch (error) {
    console.error('Server update API error:', error)
    
    return NextResponse.json(
      { error: '서버 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 