import { NextRequest, NextResponse } from 'next/server'
import { MCP } from '@/lib/mcp'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '유효한 쿼리를 제공해주세요.' },
        { status: 400 }
      )
    }
    
    const response = await MCP.process(query)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('MCP API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 