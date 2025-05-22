import { NextRequest, NextResponse } from 'next/server'
import { MCPProcessor, MCPContext } from '@/modules/mcp/core/processor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, context } = body
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '유효한 쿼리를 제공해주세요.' },
        { status: 400 }
      )
    }
    
    // MCP 프로세서로 쿼리 처리
    const result = await MCPProcessor.processQuery(query, context as MCPContext)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('MCP Query API error:', error)
    
    return NextResponse.json(
      { 
        error: '쿼리 처리 중 오류가 발생했습니다.',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
} 