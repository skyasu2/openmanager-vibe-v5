import { StorageStrategy } from '@/modules/storage/hybrid/storage-strategy'
import { createMCPQueryKey } from '@/config/redis'
import contextData from '@/data/context.json'

export interface MCPQueryResult {
  query: string
  intent: string
  entities: Record<string, string>[]
  response: string
  confidence: number
  category?: string
  timestamp: string
  cached?: boolean
}

export interface MCPContext {
  userId?: string
  sessionId?: string
  previousQueries?: string[]
  serverContext?: Record<string, unknown>
}

export class MCPProcessor {
  /**
   * MCP 쿼리 처리 메인 함수
   */
  static async processQuery(query: string, context?: MCPContext): Promise<MCPQueryResult> {
    try {
      const queryKey = createMCPQueryKey(query)
      
      // 캐시된 응답 확인
      const cachedResult = await StorageStrategy.get<MCPQueryResult>(queryKey)
      if (cachedResult) {
        return {
          ...cachedResult,
          cached: true,
          timestamp: new Date().toISOString()
        }
      }
      
      // 새로운 쿼리 처리
      const intent = await this.classifyIntent(query)
      const entities = await this.extractEntities(query)
      const category = this.determineCategory(query, intent)
      const response = await this.generateResponse(intent, entities, category)
      const confidence = this.calculateConfidence(intent, entities)
      
      const result: MCPQueryResult = {
        query,
        intent,
        entities,
        response,
        confidence,
        category,
        timestamp: new Date().toISOString()
      }
      
      // 결과 저장
      await StorageStrategy.set(queryKey, result)
      
      return result
    } catch (error) {
      console.error('[MCPProcessor] Error processing query:', error)
      
      // 오류 발생 시 기본 응답
      return {
        query,
        intent: 'unknown',
        entities: [],
        response: '처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        confidence: 0.1,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  /**
   * 사용자 의도 분류
   */
  private static async classifyIntent(query: string): Promise<string> {
    // 질문 유형 식별 로직
    if (query.includes('상태') || query.includes('현황') || query.includes('status')) {
      return 'server_status'
    }
    
    if (query.includes('성능') || query.includes('CPU') || query.includes('메모리') || 
        query.includes('performance')) {
      return 'system_performance'
    }
    
    if (query.includes('경고') || query.includes('알림') || query.includes('문제') || 
        query.includes('alert') || query.includes('issue')) {
      return 'system_alerts'
    }
    
    if (query.includes('도움') || query.includes('help') || query.includes('사용법')) {
      return 'help'
    }
    
    // 기본 의도
    return 'general_query'
  }
  
  /**
   * 개체(엔티티) 추출
   */
  private static async extractEntities(query: string): Promise<Record<string, string>[]> {
    const entities: Record<string, string>[] = []
    
    // 서버 이름 추출
    const serverMatches = query.match(/서버[\s-]*([\w-]+)|([a-zA-Z0-9-]+)[\s-]*서버/)
    if (serverMatches) {
      const serverName = serverMatches[1] || serverMatches[2]
      entities.push({ type: 'server', value: serverName })
    }
    
    // 시간 범위 추출
    const timeMatches = query.match(/(오늘|어제|일주일|한달|([0-9]+)일|([0-9]+)시간)/)
    if (timeMatches) {
      entities.push({ type: 'time_range', value: timeMatches[0] })
    }
    
    // 자원 유형 추출
    const resourceMatches = query.match(/(CPU|메모리|디스크|네트워크)/)
    if (resourceMatches) {
      entities.push({ type: 'resource', value: resourceMatches[0] })
    }
    
    return entities
  }
  
  /**
   * 카테고리 결정
   */
  private static determineCategory(query: string, intent: string): string {
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
    
    // 의도 기반 카테고리 매핑
    const intentToCategory: Record<string, string> = {
      'server_status': 'servers',
      'system_performance': 'monitoring',
      'system_alerts': 'monitoring',
      'help': 'help',
      'general_query': 'help'
    }
    
    return intentToCategory[intent] || 'help'
  }
  
  /**
   * 응답 생성
   */
  private static async generateResponse(
    intent: string,
    entities: Record<string, string>[],
    category: string
  ): Promise<string> {
    const contextCategory = contextData[category as keyof typeof contextData]
    
    if (!contextCategory) {
      return "죄송합니다. 질문을 이해하지 못했습니다. 다른 방식으로 질문해 주세요."
    }
    
    // 기본 응답 가져오기
    let response = contextCategory.response as string
    
    // 엔티티 기반 응답 강화
    if (entities.length > 0) {
      response += " 요청하신 "
      
      // 엔티티 정보 추가
      entities.forEach((entity, index) => {
        if (entity.type === 'server') {
          response += `'${entity.value}' 서버`
        } else if (entity.type === 'time_range') {
          response += `${entity.value} 기간 동안의`
        } else if (entity.type === 'resource') {
          response += `${entity.value} 자원`
        }
        
        if (index < entities.length - 1) {
          response += "와 "
        }
      })
      
      response += "에 대한 정보를 확인해드리겠습니다."
    }
    
    return response
  }
  
  /**
   * 신뢰도 계산
   */
  private static calculateConfidence(intent: string, entities: Record<string, string>[]): number {
    // 기본 신뢰도
    let confidence = 0.5
    
    // 의도에 따른 신뢰도 조정
    if (intent !== 'general_query' && intent !== 'unknown') {
      confidence += 0.2
    }
    
    // 엔티티가 추출될수록 신뢰도 상승
    confidence += Math.min(entities.length * 0.1, 0.3)
    
    // 최대 1.0, 최소 0.1
    return Math.min(Math.max(confidence, 0.1), 1.0)
  }
} 