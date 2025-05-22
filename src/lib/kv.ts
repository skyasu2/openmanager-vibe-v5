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
      await kv.zincrby('popular_queries', 1, query)
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
      const [stats, popularQueries] = await Promise.all([
        kv.hgetall('stats'),
        kv.zrevrange('popular_queries', 0, 9, { withScores: true })
      ])

      return { 
        stats: stats || {}, 
        popularQueries: popularQueries || [] 
      }
    } catch (error) {
      console.error('Stats get error:', error)
      return { stats: {}, popularQueries: [] }
    }
  }
}
