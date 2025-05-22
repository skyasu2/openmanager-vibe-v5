import { useState } from 'react'
import { MCP } from '@/lib/mcp'
import { MCPResponse } from '@/types'

export function useMCP() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<MCPResponse | null>(null)
  const [history, setHistory] = useState<Array<{ query: string; response: MCPResponse }>>([])

  async function processQuery(query: string) {
    if (!query.trim()) {
      setError('질문을 입력해주세요.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await MCP.process(query)
      setResponse(result)
      
      // 히스토리에 추가
      setHistory(prev => [
        { query, response: result },
        ...prev.slice(0, 9) // 최근 10개만 저장
      ])
      
      return result
    } catch (err) {
      setError('처리 중 오류가 발생했습니다. 다시 시도해주세요.')
      console.error('MCP processing error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  function clearHistory() {
    setHistory([])
  }

  function clearResponse() {
    setResponse(null)
  }

  return {
    processQuery,
    clearHistory,
    clearResponse,
    isLoading,
    error,
    response,
    history
  }
}
