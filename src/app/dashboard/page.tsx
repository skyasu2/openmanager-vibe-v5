import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">서버 대시보드</h1>
        <p className="text-gray-600">
          서버 상태와 성능 지표를 한눈에 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="전체 서버" value="12" trend="up" change="+2" />
        <StatCard title="정상 서버" value="9" trend="up" change="+1" color="green" />
        <StatCard title="경고 상태" value="2" trend="down" change="-1" color="yellow" />
        <StatCard title="오류 서버" value="1" trend="neutral" change="0" color="red" />
      </div>

      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">서버 현황</h2>
          <div className="overflow-x-auto">
            <ServerTable />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">CPU 사용률</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">CPU 사용률 차트</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">메모리 사용률</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">메모리 사용률 차트</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">최근 알림</h2>
          <div className="space-y-3">
            <AlertItem 
              type="error" 
              message="Cache-01 서버 CPU 사용률 90% 초과" 
              time="10분 전" 
            />
            <AlertItem 
              type="warning" 
              message="API-01 서버 메모리 사용률 80% 초과" 
              time="35분 전" 
            />
            <AlertItem 
              type="info" 
              message="시스템 백업 완료" 
              time="2시간 전" 
            />
          </div>
          <div className="mt-4 text-center">
            <Link 
              href="/alerts"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              모든 알림 보기
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">서버 위치</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">서버 위치 지도</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">MCP 활동</h2>
          <div className="space-y-3">
            <MCPItem 
              query="API 서버 상태 어때?" 
              time="15분 전" 
            />
            <MCPItem 
              query="오늘 서버 성능 분석해줘" 
              time="1시간 전" 
            />
            <MCPItem 
              query="캐시 서버 문제 원인 분석" 
              time="3시간 전" 
            />
          </div>
          <div className="mt-4 text-center">
            <Link 
              href="/chat"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              MCP 채팅으로 이동
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  change: string
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

function StatCard({ title, value, trend, change, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700'
  }
  
  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  }
  
  return (
    <div className={`${colorClasses[color]} rounded-xl border p-4`}>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold">{value}</p>
        <div className="text-sm">
          <span>{trendIcons[trend]}</span> {change}
        </div>
      </div>
    </div>
  )
}

function ServerTable() {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">서버</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모리</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">위치</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최근 업데이트</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <ServerRow 
          name="웹서버-01 (Nginx)" 
          status="running" 
          cpu={45} 
          memory={67} 
          location="Seoul-DC-A" 
          lastUpdate="2분 전" 
        />
        <ServerRow 
          name="DB서버-01 (MySQL)" 
          status="running" 
          cpu={32} 
          memory={78} 
          location="Seoul-DC-B" 
          lastUpdate="5분 전" 
        />
        <ServerRow 
          name="API서버-01 (Node.js)" 
          status="warning" 
          cpu={75} 
          memory={85} 
          location="Busan-DC-A" 
          lastUpdate="3분 전" 
        />
        <ServerRow 
          name="캐시서버-01 (Redis)" 
          status="error" 
          cpu={89} 
          memory={91} 
          location="Seoul-DC-A" 
          lastUpdate="1분 전" 
        />
      </tbody>
    </table>
  )
}

interface ServerRowProps {
  name: string
  status: 'running' | 'warning' | 'error' | 'stopped'
  cpu: number
  memory: number
  location: string
  lastUpdate: string
}

function ServerRow({ name, status, cpu, memory, location, lastUpdate }: ServerRowProps) {
  const statusColors = {
    running: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    stopped: 'bg-gray-100 text-gray-800'
  }
  
  const statusLabels = {
    running: '정상',
    warning: '경고',
    error: '오류',
    stopped: '중지'
  }
  
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{name}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${cpu > 80 ? 'bg-red-500' : cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
            style={{ width: `${cpu}%` }}
          ></div>
        </div>
        <span className="text-xs">{cpu}%</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${memory > 80 ? 'bg-red-500' : memory > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
            style={{ width: `${memory}%` }}
          ></div>
        </div>
        <span className="text-xs">{memory}%</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lastUpdate}</td>
    </tr>
  )
}

interface AlertItemProps {
  type: 'error' | 'warning' | 'info'
  message: string
  time: string
}

function AlertItem({ type, message, time }: AlertItemProps) {
  const typeStyles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  }
  
  return (
    <div className={`${typeStyles[type]} rounded-lg border p-3 text-sm`}>
      <div className="font-medium">{message}</div>
      <div className="text-xs opacity-70 mt-1">{time}</div>
    </div>
  )
}

interface MCPItemProps {
  query: string
  time: string
}

function MCPItem({ query, time }: MCPItemProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-sm">
      <div className="font-medium">"{query}"</div>
      <div className="text-xs text-gray-500 mt-1">{time}</div>
    </div>
  )
} 