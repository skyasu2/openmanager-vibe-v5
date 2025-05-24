export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'GET') {
    try {
      res.status(200).json({
        message: 'pong',
        timestamp: new Date().toISOString(),
        status: 'ok',
        source: 'vercel-function'
      })
    } catch (error) {
      res.status(500).json({
        message: 'ping failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'error'
      })
    }
  } else {
    res.setHeader('Allow', ['GET', 'OPTIONS'])
    res.status(405).json({
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
      status: 'error'
    })
  }
} 