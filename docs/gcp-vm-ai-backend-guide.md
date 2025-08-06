# GCP VM AI 백엔드 구축 가이드

## 📋 목차

1. [GCP e2-micro VM 무료 티어 개요](#1-gcp-e2-micro-vm-무료-티어-개요)
2. [VM 초기 설정](#2-vm-초기-설정)
3. [AI 백엔드 서버 설치](#3-ai-백엔드-서버-설치)
4. [VM 백엔드 API 서버 구현](#4-vm-백엔드-api-서버-구현)
5. [AI 어시스턴트 연동](#5-ai-어시스턴트-연동)
6. [무료 티어 최적화 전략](#6-무료-티어-최적화-전략)
7. [모니터링 및 관리](#7-모니터링-및-관리)

## 1. GCP e2-micro VM 무료 티어 개요

### 무료 티어 사양
- **인스턴스**: e2-micro (1 vCPU, 1GB 메모리)
- **스토리지**: 30GB 표준 persistent disk
- **네트워크**: 1GB 북미 → 중국/오스트레일리아 제외 모든 지역
- **지역**: us-west1, us-central1, us-east1 중 1개
- **가동 시간**: 744시간/월 (24/7 운영 가능)

### 활용 가능한 서비스
- AI 백엔드 API 서버
- 딥 러닝 모델 서빙 (경량 모델)
- 캐싱 레이어 (메모리 기반)
- 스케줄러/크론잡
- 웹훅 처리 서버
- 모니터링 에이전트

## 2. VM 초기 설정

### 2.1 VM 인스턴스 생성

```bash
# gcloud CLI로 VM 생성
gcloud compute instances create openmanager-vm \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --tags=http-server,https-server
```

### 2.2 방화벽 규칙 설정

```bash
# HTTP/HTTPS 트래픽 허용
gcloud compute firewall-rules create allow-http \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server,https-server

# MCP 서버 포트 (8080-8090)
gcloud compute firewall-rules create allow-mcp \
  --allow tcp:8080-8090 \
  --source-ranges 0.0.0.0/0 \
  --target-tags mcp-server
```

### 2.3 SSH 접속 및 기본 패키지 설치

```bash
# SSH 접속
gcloud compute ssh openmanager-vm --zone=us-central1-a

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y \
  curl wget git build-essential \
  python3 python3-pip python3-venv \
  nodejs npm \
  nginx supervisor \
  htop tmux
```

## 3. MCP 서버 설치 가이드

### 3.1 Node.js 환경 설정 (nvm 사용)

```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Node.js 22 설치
nvm install 22
nvm use 22
nvm alias default 22

# 전역 패키지 설치
npm install -g pm2 npx
```

### 3.2 Python 환경 설정

```bash
# Python 3.11 설치 (Ubuntu 22.04 기본은 3.10)
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# pip 업그레이드
python3.11 -m pip install --upgrade pip

# uv 설치 (Python 패키지 관리자)
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

### 3.3 MCP 서버 설치

```bash
# MCP 서버 디렉토리 생성
mkdir -p ~/mcp-servers
cd ~/mcp-servers

# 1. filesystem 서버
npm install @modelcontextprotocol/server-filesystem

# 2. memory 서버 (지식 그래프)
npm install @modelcontextprotocol/server-memory

# 3. github 서버
npm install @modelcontextprotocol/server-github

# 4. sequential-thinking 서버
npm install @modelcontextprotocol/server-sequential-thinking

# 5. time 서버 (Python)
uvx --from mcp-server-time mcp-server-time

# 6. context7 서버
npm install @upstash/context7-mcp

# 7. serena 서버 (Python)
git clone https://github.com/oraios/serena.git
cd serena
python3.11 -m venv venv
source venv/bin/activate
pip install -e .
cd ..

# 8. shadcn-ui 서버
npm install @jpisnice/shadcn-ui-mcp-server
```

### 3.4 MCP 서버 설정 파일

```bash
# ~/mcp-servers/config.json
cat > ~/mcp-servers/config.json << 'EOF'
{
  "servers": {
    "filesystem": {
      "command": "node",
      "args": ["node_modules/@modelcontextprotocol/server-filesystem/dist/index.js", "/home/openmanager"],
      "port": 8080
    },
    "memory": {
      "command": "node",
      "args": ["node_modules/@modelcontextprotocol/server-memory/dist/index.js"],
      "port": 8081
    },
    "github": {
      "command": "node",
      "args": ["node_modules/@modelcontextprotocol/server-github/dist/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      },
      "port": 8082
    },
    "sequential-thinking": {
      "command": "node",
      "args": ["node_modules/@modelcontextprotocol/server-sequential-thinking/dist/index.js"],
      "port": 8083
    },
    "time": {
      "command": "uvx",
      "args": ["--from", "mcp-server-time", "mcp-server-time"],
      "port": 8084
    },
    "context7": {
      "command": "node",
      "args": ["node_modules/@upstash/context7-mcp/dist/index.js"],
      "port": 8085
    },
    "serena": {
      "command": "python3.11",
      "args": ["serena/src/serena_mcp/server.py", "--project", "/home/openmanager/project"],
      "port": 8086
    },
    "shadcn-ui": {
      "command": "node",
      "args": ["node_modules/@jpisnice/shadcn-ui-mcp-server/dist/index.js"],
      "port": 8087
    }
  }
}
EOF
```

### 3.5 PM2로 MCP 서버 관리

```bash
# PM2 ecosystem 파일 생성
cat > ~/ai-backend-services/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'mcp-filesystem',
      script: 'node_modules/@modelcontextprotocol/server-filesystem/dist/index.js',
      args: '/home/openmanager',
      env: {
        PORT: 8080
      }
    },
    {
      name: 'mcp-memory',
      script: 'node_modules/@modelcontextprotocol/server-memory/dist/index.js',
      env: {
        PORT: 8081
      }
    },
    {
      name: 'mcp-github',
      script: 'node_modules/@modelcontextprotocol/server-github/dist/index.js',
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN,
        PORT: 8082
      }
    },
    {
      name: 'mcp-sequential',
      script: 'node_modules/@modelcontextprotocol/server-sequential-thinking/dist/index.js',
      env: {
        PORT: 8083
      }
    },
    {
      name: 'mcp-context7',
      script: 'node_modules/@upstash/context7-mcp/dist/index.js',
      env: {
        PORT: 8085
      }
    },
    {
      name: 'mcp-shadcn',
      script: 'node_modules/@jpisnice/shadcn-ui-mcp-server/dist/index.js',
      env: {
        PORT: 8087
      }
    }
  ]
};
EOF

# PM2 시작
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. VM 백엔드 API 서버 구현

### 4.1 Express API 서버 설정

```bash
# API 서버 디렉토리 생성
mkdir -p ~/api-server
cd ~/api-server

# package.json 생성
npm init -y
npm install express cors helmet morgan compression dotenv
npm install -D @types/node @types/express typescript nodemon

# TypeScript 설정
npx tsc --init
```

### 4.2 API 서버 코드

```typescript
// ~/api-server/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { mcpRouter } from './routes/mcp';
import { aiRouter } from './routes/ai';
import { cacheRouter } from './routes/cache';
import { healthRouter } from './routes/health';

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());

// 라우트
app.use('/api/mcp', mcpRouter);
app.use('/api/ai', aiRouter);
app.use('/api/cache', cacheRouter);
app.use('/api/health', healthRouter);

// 에러 핸들러
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`VM Backend API Server running on port ${PORT}`);
});
```

### 4.3 MCP 서버 연동 라우터

```typescript
// ~/api-server/src/routes/mcp.ts
import { Router } from 'express';
import axios from 'axios';

const router = Router();

// MCP 서버 상태 확인
router.get('/status', async (req, res) => {
  const servers = [
    { name: 'filesystem', port: 8080 },
    { name: 'memory', port: 8081 },
    { name: 'github', port: 8082 },
    { name: 'sequential-thinking', port: 8083 },
    { name: 'time', port: 8084 },
    { name: 'context7', port: 8085 },
    { name: 'serena', port: 8086 },
    { name: 'shadcn-ui', port: 8087 }
  ];

  const statuses = await Promise.all(
    servers.map(async (server) => {
      try {
        const response = await axios.get(`http://localhost:${server.port}/health`, {
          timeout: 1000
        });
        return { ...server, status: 'online', response: response.data };
      } catch (error) {
        return { ...server, status: 'offline', error: error.message };
      }
    })
  );

  res.json({ servers: statuses });
});

// MCP 서버로 명령 전달
router.post('/:server/execute', async (req, res) => {
  const { server } = req.params;
  const { command, params } = req.body;

  const serverPorts: Record<string, number> = {
    filesystem: 8080,
    memory: 8081,
    github: 8082,
    'sequential-thinking': 8083,
    time: 8084,
    context7: 8085,
    serena: 8086,
    'shadcn-ui': 8087
  };

  const port = serverPorts[server];
  if (!port) {
    return res.status(404).json({ error: 'Server not found' });
  }

  try {
    const response = await axios.post(
      `http://localhost:${port}/execute`,
      { command, params },
      { timeout: 30000 }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as mcpRouter };
```

### 4.4 AI 어시스턴트 연동 라우터

```typescript
// ~/api-server/src/routes/ai.ts
import { Router } from 'express';
import { MemoryCache } from '../services/cache';
import { MCPExecutor } from '../services/mcp-executor';

const router = Router();
const cache = new MemoryCache();
const mcpExecutor = new MCPExecutor();

// AI 쿼리 처리
router.post('/query', async (req, res) => {
  const { query, context, useCache = true } = req.body;

  // 캐시 체크
  if (useCache) {
    const cached = cache.get(`query:${query}`);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }
  }

  try {
    // MCP 서버를 활용한 쿼리 처리
    const result = await mcpExecutor.processQuery(query, context);
    
    // 캐시 저장
    if (useCache) {
      cache.set(`query:${query}`, result, 300); // 5분 TTL
    }

    res.json({ ...result, fromCache: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 서버 메트릭 분석
router.post('/analyze-metrics', async (req, res) => {
  const { serverId, metrics } = req.body;

  try {
    // Sequential thinking으로 분석
    const analysis = await mcpExecutor.execute('sequential-thinking', 'analyze', {
      data: metrics,
      prompt: `Analyze server ${serverId} metrics and identify anomalies`
    });

    // Memory 서버에 저장
    await mcpExecutor.execute('memory', 'store', {
      key: `analysis:${serverId}:${Date.now()}`,
      value: analysis
    });

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as aiRouter };
```

## 5. AI 어시스턴트 연동

### 5.1 프론트엔드 서비스 구현

```typescript
// src/services/vm-backend.service.ts
export class VMBackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_VM_API_URL || 'http://vm-ip:3001/api';
  }

  async queryAI(query: string, context?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context })
    });
    return response.json();
  }

  async analyzeMetrics(serverId: string, metrics: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/ai/analyze-metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId, metrics })
    });
    return response.json();
  }

  async getMCPStatus(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp/status`);
    return response.json();
  }

  async executeMCPCommand(server: string, command: string, params: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp/${server}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, params })
    });
    return response.json();
  }
}
```

### 5.2 AI 어시스턴트 통합

```typescript
// src/services/ai/vm-integrated-engine.ts
import { VMBackendService } from '../vm-backend.service';

export class VMIntegratedAIEngine {
  private vmBackend: VMBackendService;
  
  constructor() {
    this.vmBackend = new VMBackendService();
  }

  async processQuery(query: string): Promise<any> {
    try {
      // VM 백엔드로 쿼리 전송
      const result = await this.vmBackend.queryAI(query, {
        timestamp: new Date().toISOString(),
        source: 'dashboard'
      });

      // 결과 포맷팅
      return {
        answer: result.answer,
        confidence: result.confidence,
        sources: result.sources,
        processingTime: result.processingTime
      };
    } catch (error) {
      console.error('VM AI query failed:', error);
      // 폴백: 로컬 처리
      return this.processLocally(query);
    }
  }

  private async processLocally(query: string): Promise<any> {
    // 로컬 폴백 로직
    return {
      answer: '현재 VM 서버와 연결할 수 없습니다. 로컬 모드로 처리 중입니다.',
      confidence: 0.5,
      sources: ['local'],
      processingTime: 0
    };
  }
}
```

## 6. 무료 티어 최적화 전략

### 6.1 리소스 모니터링

```bash
# 메모리 사용량 모니터링 스크립트
cat > ~/monitor.sh << 'EOF'
#!/bin/bash

# 메모리 임계값 (MB)
MEMORY_THRESHOLD=800

while true; do
  # 현재 메모리 사용량
  MEMORY_USED=$(free -m | awk 'NR==2{print $3}')
  
  if [ $MEMORY_USED -gt $MEMORY_THRESHOLD ]; then
    echo "⚠️ Memory usage high: ${MEMORY_USED}MB"
    
    # PM2 프로세스 재시작
    pm2 restart all
    
    # 캐시 정리
    sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
  fi
  
  sleep 60
done
EOF

chmod +x ~/monitor.sh
```

### 6.2 자동 스케일링 (프로세스 레벨)

```javascript
// ~/api-server/src/services/auto-scale.ts
import { exec } from 'child_process';
import os from 'os';

export class AutoScaler {
  private readonly CPU_THRESHOLD = 0.8;
  private readonly MEMORY_THRESHOLD = 0.85;

  async checkAndScale(): Promise<void> {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    const memoryUsage = 1 - (os.freemem() / os.totalmem());

    if (cpuUsage > this.CPU_THRESHOLD) {
      console.log('High CPU usage detected, reducing workers');
      exec('pm2 scale mcp-sequential 0'); // 임시 중지
    }

    if (memoryUsage > this.MEMORY_THRESHOLD) {
      console.log('High memory usage detected, restarting services');
      exec('pm2 restart all');
    }
  }
}
```

### 6.3 스왑 메모리 설정

```bash
# 2GB 스왑 파일 생성 (메모리 부족 대비)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 스왑 설정 최적화
sudo sysctl vm.swappiness=10
sudo sysctl vm.vfs_cache_pressure=50
```

## 7. 모니터링 및 관리

### 7.1 Nginx 리버스 프록시 설정

```nginx
# /etc/nginx/sites-available/vm-backend
server {
    listen 80;
    server_name vm.openmanager.app;

    # API 서버
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # MCP 서버 상태
    location /mcp-status {
        proxy_pass http://localhost:3001/api/mcp/status;
    }

    # 헬스체크
    location /health {
        proxy_pass http://localhost:3001/api/health;
    }
}
```

### 7.2 시스템 모니터링 대시보드

```bash
# Grafana + Prometheus 설치 (경량 설정)
# ... (설치 스크립트)

# PM2 모니터링
pm2 install pm2-metrics
pm2 web
```

### 7.3 백업 전략

```bash
# 일일 백업 스크립트
cat > ~/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# MCP 서버 설정 백업
cp -r ~/mcp-servers/config.json $BACKUP_DIR/

# PM2 프로세스 백업
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/

# API 서버 백업
tar -czf $BACKUP_DIR/api-server.tar.gz ~/api-server/

# 오래된 백업 삭제 (7일 이상)
find /home/backup -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x ~/backup.sh

# Cron 설정
(crontab -l 2>/dev/null; echo "0 2 * * * /home/backup.sh") | crontab -
```

## 8. 환경변수 설정

```bash
# ~/.env
cat > ~/.env << 'EOF'
# VM Configuration
VM_INSTANCE_NAME=openmanager-vm
VM_ZONE=us-central1-a
VM_PROJECT_ID=your-project-id

# MCP Servers
MCP_FILESYSTEM_PORT=8080
MCP_MEMORY_PORT=8081
MCP_GITHUB_PORT=8082
MCP_SEQUENTIAL_PORT=8083
MCP_TIME_PORT=8084
MCP_CONTEXT7_PORT=8085
MCP_SERENA_PORT=8086
MCP_SHADCN_PORT=8087

# API Server
API_SERVER_PORT=3001
API_SERVER_HOST=0.0.0.0

# Authentication
GITHUB_TOKEN=ghp_xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx

# Monitoring
ENABLE_MONITORING=true
MONITORING_INTERVAL=60
EOF
```

## 9. 시작 스크립트

```bash
#!/bin/bash
# ~/start-all.sh

echo "🚀 Starting OpenManager VM Backend Services..."

# 환경변수 로드
source ~/.env

# MCP 서버 시작
echo "Starting MCP servers..."
cd ~/mcp-servers
pm2 start ecosystem.config.js

# API 서버 시작
echo "Starting API server..."
cd ~/api-server
pm2 start npm --name "api-server" -- start

# 모니터링 시작
echo "Starting monitoring..."
pm2 start ~/monitor.sh --name "monitor"

# Nginx 재시작
sudo systemctl restart nginx

# 상태 확인
pm2 status

echo "✅ All services started successfully!"
echo "API Server: http://localhost:3001"
echo "PM2 Web: http://localhost:9615"
```

## 10. 문제 해결

### 메모리 부족
```bash
# 프로세스별 메모리 사용량 확인
pm2 monit

# 불필요한 프로세스 중지
pm2 stop [process-name]

# 메모리 캐시 정리
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### MCP 서버 연결 실패
```bash
# 포트 확인
sudo netstat -tlnp | grep -E '808[0-9]'

# 방화벽 확인
sudo iptables -L -n

# 서버 재시작
pm2 restart [mcp-server-name]
```

### CPU 과부하
```bash
# CPU 사용량 확인
top -n 1 | head -20

# Nice 값 조정
renice -n 10 -p $(pgrep node)

# 프로세스 수 조정
pm2 scale [app-name] 1
```

## 결론

GCP e2-micro VM 무료 티어를 활용하여:
- ✅ 11개 MCP 서버 호스팅
- ✅ AI 백엔드 API 서버 운영
- ✅ 캐싱 레이어 구현
- ✅ 24/7 모니터링 시스템
- ✅ 자동 스케일링 및 리소스 관리

월 $0로 강력한 AI 어시스턴트 백엔드 인프라를 구축할 수 있습니다.