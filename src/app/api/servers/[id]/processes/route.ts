import { NextResponse } from 'next/server';
import debug from '@/utils/debug';

// 프로세스 타입 정의
interface ServerProcess {
  pid: number;
  name: string;
  cpu: string;
  memory: string;
  status: 'running' | 'stopped';
  uptime: number;
  user: string;
}

// 메모리 기반 서버 프로세스 데이터 스토어
const serverProcessesStore = new Map<string, ServerProcess[]>();

// 모의 프로세스 데이터 생성기
function generateMockProcesses(serverId: string): ServerProcess[] {
  const processNames = [
    'nginx', 'node', 'postgres', 'redis-server', 'pm2', 'systemd', 
    'docker', 'kubernetes', 'apache2', 'mysql', 'mongodb', 'elasticsearch'
  ];

  const processes: ServerProcess[] = processNames.slice(0, Math.floor(Math.random() * 8) + 3).map((name, index) => ({
    pid: 1000 + index,
    name,
    cpu: (Math.random() * 50).toFixed(1),
    memory: (Math.random() * 20).toFixed(1),
    status: (Math.random() > 0.1 ? 'running' : 'stopped'),
    uptime: Math.floor(Math.random() * 86400),
    user: 'root',
  }));

  return processes;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const serverId = params.id;

  if (!serverId) {
    return NextResponse.json(
      { error: 'Server ID is required' },
      { status: 400 }
    );
  }

  try {
    // 메모리 스토어에서 프로세스 데이터 조회
    let processes = serverProcessesStore.get(serverId);
    
    if (!processes) {
      // 프로세스 데이터가 없으면 모의 데이터 생성
      processes = generateMockProcesses(serverId);
      serverProcessesStore.set(serverId, processes);
      debug.log(`🧠 메모리 기반 프로세스 데이터 생성: ${serverId}`);
    }

    return NextResponse.json({ 
      processes,
      timestamp: new Date().toISOString(),
      source: 'memory-based',
      serverId,
    }, {
      headers: {
        'X-Storage': 'Memory-based',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error) {
    debug.error(
      `[API Error] Failed to fetch processes for server ${serverId}:`,
      error
    );
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        source: 'memory-based',
      },
      { status: 500 }
    );
  }
}
