import { kv } from '@vercel/kv'

export class MCPStore {
  static async getResponse(query: string) {
    try {
      return await kv.get(`mcp:${query}`)
    } catch (error) {
      console.error('KV get error:', error)
      return null
    }
  }

  static async saveResponse(query: string, response: any) {
    try {
      await kv.setex(`mcp:${query}`, 3600, response)
      await kv.hincrby('stats', 'total_queries', 1)
      await kv.hincrby('stats', `date:${new Date().toDateString()}`, 1)
      const currentScore = await kv.get(`query_count:${query}`) as number || 0
      await kv.set(`query_count:${query}`, currentScore + 1)
    } catch (error) {
      console.error('KV save error:', error)
    }
  }

  static async updateServerStatus(serverId: string, status: any) {
    try {
      await kv.hset(`server:${serverId}`, {
        ...status,
        lastUpdate: new Date().toISOString()
      })
      await kv.expire(`server:${serverId}`, 3600)
    } catch (error) {
      console.error('Server status update error:', error)
    }
  }

  static async getServerStatus(serverId: string) {
    try {
      return await kv.hgetall(`server:${serverId}`)
    } catch (error) {
      console.error('Server status get error:', error)
      return null
    }
  }

  static async getStats() {
    try {
      const stats = await kv.hgetall('stats') || {}
      
      const keys = await kv.keys('query_count:*')
      
      const popularQueries: Array<[string, number]> = []
      
      for (const key of keys) {
        const queryName = key.replace('query_count:', '')
        const count = await kv.get(key) as number || 0
        popularQueries.push([queryName, count])
      }
      
      popularQueries.sort((a, b) => b[1] - a[1])
      const topQueries = popularQueries.slice(0, 10)

      return { 
        stats, 
        popularQueries: topQueries 
      }
    } catch (error) {
      console.error('Stats get error:', error)
      return { stats: {}, popularQueries: [] }
    }
  }
}
