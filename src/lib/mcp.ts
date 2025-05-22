import contextData from '@/data/context.json'
import { MCPResponse } from '@/types'
import { MCPStore } from './kv'

interface MCPOptions {
  cacheResults?: boolean
  timeout?: number
}

export class MCP {
  private static defaultOptions: MCPOptions = {
    cacheResults: true,
    timeout: 3000
  }

  static async process(query: string, options?: MCPOptions): Promise<MCPResponse> {
    const opts = { ...this.defaultOptions, ...options }
    
    // 캐시 결과 확인
    if (opts.cacheResults) {
      const cachedResponse = await MCPStore.getResponse(query)
      if (cachedResponse) {
        return {
          ...cachedResponse as MCPResponse,
          cached: true,
          timestamp: new Date().toISOString()
        }
      }
    }

    // 쿼리 분석
    const category = this.analyzeQuery(query)
    
    // 응답 생성
    const response = this.generateResponse(query, category)
    
    // 응답 저장
    if (opts.cacheResults) {
      await MCPStore.saveResponse(query, response)
    }
    
    return response
  }
  
  private static analyzeQuery(query: string): string {
    // 컨텍스트 데이터에서 키워드 기반 카테고리 찾기
    const categories = Object.keys(contextData)
    
    for (const category of categories) {
      const keywords = contextData[category as keyof typeof contextData].keywords as string[]
      
      if (keywords.some(keyword => 
        query.toLowerCase().includes(keyword.toLowerCase())
      )) {
        return category
      }
    }
    
    // 기본 카테고리
    return 'help'
  }
  
  private static generateResponse(query: string, category: string): MCPResponse {
    const contextCategory = contextData[category as keyof typeof contextData]
    
    if (!contextCategory) {
      return {
        response: "죄송합니다. 질문을 이해하지 못했습니다. 다른 방식으로 질문해 주세요.",
        category: "unknown",
        confidence: 0.2,
        timestamp: new Date().toISOString(),
        queryAnalysis: {
          isQuestion: true,
          isCommand: false,
          isStatus: false,
          isPerformance: false,
          isAlert: false
        }
      }
    }
    
    // 쿼리 분석
    const isQuestion = query.includes('?') || query.includes('까') || query.includes('무엇') || query.includes('어떤')
    const isCommand = query.includes('해줘') || query.includes('실행') || query.includes('시작') || query.includes('중지')
    const isStatus = query.includes('상태') || query.includes('현황') || query.includes('status')
    const isPerformance = query.includes('성능') || query.includes('CPU') || query.includes('메모리')
    const isAlert = query.includes('경고') || query.includes('알림') || query.includes('alert') || query.includes('문제')
    
    return {
      response: contextCategory.response,
      category,
      confidence: contextCategory.confidence as number,
      timestamp: new Date().toISOString(),
      queryAnalysis: {
        isQuestion,
        isCommand,
        isStatus,
        isPerformance,
        isAlert
      }
    }
  }
}
