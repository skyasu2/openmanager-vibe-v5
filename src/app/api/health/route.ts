import { NextResponse } from 'next/server'
import { checkRedisConnection } from '@/lib/redis'
import { checkSupabaseConnection } from '@/lib/supabase'

export async function GET() {
  try {
    const redisHealth = await checkRedisConnection()
    const supabaseHealth = await checkSupabaseConnection()
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '5.0.0',
      services: {
        redis: redisHealth,
        supabase: supabaseHealth
      }
    }
    
    return NextResponse.json(health)
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
} 