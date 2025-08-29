import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Next.js 동적 렌더링 강제
export const dynamic = 'force-dynamic';

// GCP VM 정적 데이터 (10개 서버)
const GCP_VM_STATIC_DATA = {
  "success": true,
  "data": [
    {
      "server_id": "server-1756455178476-0",
      "hostname": "web-server-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 34.38,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 2438209376,
        "disk_total_bytes": 214748364800,
        "disk_used_bytes": 115848619254,
        "uptime_seconds": 1756429123
      },
      "metadata": {
        "ip": "192.168.1.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "web",
        "role": "worker",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "disk_gb": 200
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178476-1",
      "hostname": "web-server-02",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 29.85,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 3115824828,
        "disk_total_bytes": 214748364800,
        "disk_used_bytes": 85787383921,
        "uptime_seconds": 1754389804
      },
      "metadata": {
        "ip": "192.168.1.101",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "web",
        "role": "worker",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "disk_gb": 200
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178476-2",
      "hostname": "api-server-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 47.52,
        "memory_total_bytes": 17179869184,
        "memory_used_bytes": 7126592271,
        "disk_total_bytes": 322122547200,
        "disk_used_bytes": 95283441851,
        "uptime_seconds": 1756404615
      },
      "metadata": {
        "ip": "192.168.2.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "api",
        "role": "primary",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 6,
        "memory_gb": 16,
        "disk_gb": 300
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178476-3",
      "hostname": "api-server-02",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 43.99,
        "memory_total_bytes": 17179869184,
        "memory_used_bytes": 6626593510,
        "disk_total_bytes": 322122547200,
        "disk_used_bytes": 100544609153,
        "uptime_seconds": 1756435387
      },
      "metadata": {
        "ip": "192.168.2.101",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "api",
        "role": "secondary",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 6,
        "memory_gb": 16,
        "disk_gb": 300
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178477-4",
      "hostname": "db-master-primary",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 12.51,
        "memory_total_bytes": 34359738368,
        "memory_used_bytes": 19946046061,
        "disk_total_bytes": 1073741824000,
        "disk_used_bytes": 435889319904,
        "uptime_seconds": 1755470558
      },
      "metadata": {
        "ip": "192.168.3.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "database",
        "role": "master",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 8,
        "memory_gb": 32,
        "disk_gb": 1000
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178477-5",
      "hostname": "db-replica-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 17.46,
        "memory_total_bytes": 34359738368,
        "memory_used_bytes": 15177950420,
        "disk_total_bytes": 1073741824000,
        "disk_used_bytes": 571328142108,
        "uptime_seconds": 1754173478
      },
      "metadata": {
        "ip": "192.168.3.101",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "database",
        "role": "replica",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 8,
        "memory_gb": 32,
        "disk_gb": 1000
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178477-6",
      "hostname": "redis-cache-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 42.0,
        "memory_total_bytes": 17179869184,
        "memory_used_bytes": 9964324126,
        "disk_total_bytes": 107374182400,
        "disk_used_bytes": 48318382080,
        "uptime_seconds": 1754764890
      },
      "metadata": {
        "ip": "192.168.4.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "cache",
        "role": "primary",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 16,
        "disk_gb": 100
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178478-7",
      "hostname": "monitoring-server",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 26.24,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 4120458156,
        "disk_total_bytes": 536870912000,
        "disk_used_bytes": 422756725966,
        "uptime_seconds": 1755894695
      },
      "metadata": {
        "ip": "192.168.5.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "monitoring",
        "role": "standalone",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 2,
        "memory_gb": 8,
        "disk_gb": 500
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178478-8",
      "hostname": "security-server",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 13.91,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 5578614106,
        "disk_total_bytes": 214748364800,
        "disk_used_bytes": 156557749037,
        "uptime_seconds": 1754027553
      },
      "metadata": {
        "ip": "192.168.6.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "security",
        "role": "standalone",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "disk_gb": 200
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178478-9",
      "hostname": "backup-server",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 38.28,
        "memory_total_bytes": 4294967296,
        "memory_used_bytes": 1100128893,
        "disk_total_bytes": 2147483648000,
        "disk_used_bytes": 753447563255,
        "uptime_seconds": 1755171946
      },
      "metadata": {
        "ip": "192.168.7.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "backup",
        "role": "standalone",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 2,
        "memory_gb": 4,
        "disk_gb": 2000
      },
      "status": "online"
    }
  ],
  "source": "gcp-vm-api-fallback",
  "cached": false,
  "timestamp": "2025-08-29T17:12:58.000Z"
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [GCP-VM-API] 정적 데이터 API 라우트 호출됨');
    console.log(`📊 [GCP-VM-API] ${GCP_VM_STATIC_DATA.data.length}개 서버 데이터 반환`);
    console.log('✅ [GCP-VM-API] API 라우트 정상 작동 - 베르셀 배포 트리거');
    
    return NextResponse.json(GCP_VM_STATIC_DATA);
  } catch (error) {
    console.error('❌ [GCP-VM-API] 정적 데이터 반환 실패:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Static data retrieval failed' 
    }, { status: 500 });
  }
}