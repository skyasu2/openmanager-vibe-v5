import type { 
  ServerStatus
} from './types/index'

import type { 
  ApiResponse
} from './types/api'

import { 
  cn,
  formatBytes,
  formatPercentage,
  isValidEmail 
} from './lib/utils-functions'

// 타입 테스트
const testServer: ServerStatus = {
  id: 'test-123',
  name: 'Test Server',
  status: 'online',
  lastUpdate: new Date().toISOString(),
  location: 'Seoul',
  uptime: 3600,
  metrics: {
    cpu: 45.5,
    memory: 67.2,
    disk: 23.1,
    network: {
      bytesIn: 1024,
      bytesOut: 2048,
      packetsIn: 100,
      packetsOut: 120,
      latency: 15,
      connections: 50
    },
    processes: 85,
    loadAverage: [0.5, 0.3, 0.2] as const
  }
}

const testResponse: ApiResponse<ServerStatus> = {
  success: true,
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  data: testServer
}

// 유틸리티 함수 테스트
const className = cn('bg-blue-500', 'text-white', 'px-4')
const fileSize = formatBytes(1048576)
const percentage = formatPercentage(67.5)
const isEmail = isValidEmail('test@example.com')

console.log('타입 테스트 성공:', {
  testServer,
  testResponse,
  className,
  fileSize,
  percentage,
  isEmail
})

export {} 