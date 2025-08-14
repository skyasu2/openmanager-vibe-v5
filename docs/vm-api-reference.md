# 📖 VM Management API v2.0 Reference

**Version**: 2.0  
**Base URL**: `http://104.154.205.25:10000`  
**Authentication**: Bearer Token (일부 엔드포인트)  
**작성일**: 2025-08-14 14:50 KST

## 📋 목차

1. [인증](#인증)
2. [공개 엔드포인트](#공개-엔드포인트)
3. [보안 엔드포인트](#보안-엔드포인트)
4. [에러 처리](#에러-처리)
5. [사용 예제](#사용-예제)

## 🔐 인증

### Bearer Token 인증

보안 엔드포인트에 접근하려면 Authorization 헤더에 Bearer Token을 포함해야 합니다.

```http
Authorization: Bearer f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00
```

### Node.js 예제

```javascript
const headers = {
  'Authorization': 'Bearer f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00',
  'Content-Type': 'application/json'
};
```

### cURL 예제

```bash
curl -H "Authorization: Bearer f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00" \
     http://104.154.205.25:10000/api/logs
```

## 🌐 공개 엔드포인트

인증 없이 접근 가능한 엔드포인트입니다.

### GET /health

기본 헬스체크 엔드포인트

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "2.0",
  "port": 10000
}
```

**Status Codes:**
- `200 OK`: 서비스 정상

---

### GET /api/health

API 서비스 헬스체크

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "api",
  "version": "2.0"
}
```

**Status Codes:**
- `200 OK`: API 서비스 정상

---

### GET /api/status

시스템 상태 정보 조회

**Request:**
```http
GET /api/status
```

**Response:**
```json
{
  "hostname": "mcp-server",
  "memory": {
    "free": 541,      // MB 단위
    "total": 976,     // MB 단위
    "used": 435       // MB 단위
  },
  "uptime": 347       // 분 단위
}
```

**Status Codes:**
- `200 OK`: 정상 응답

---

### GET /api/metrics

프로세스 메트릭 정보

**Request:**
```http
GET /api/metrics
```

**Response:**
```json
{
  "memory": {
    "rss": 52035584,        // Resident Set Size (bytes)
    "heapTotal": 7651328,   // Total heap size (bytes)
    "heapUsed": 5454600,    // Used heap size (bytes)
    "external": 1313110,    // C++ objects (bytes)
    "arrayBuffers": 25800   // ArrayBuffers (bytes)
  },
  "uptime": 1185.122,       // 프로세스 실행 시간 (초)
  "timestamp": "2025-08-14T05:40:15.685Z"
}
```

**Status Codes:**
- `200 OK`: 정상 응답

## 🔒 보안 엔드포인트

Bearer Token 인증이 필요한 엔드포인트입니다.

### GET /api/logs

애플리케이션 로그 조회

**Request:**
```http
GET /api/logs?lines=50
Authorization: Bearer {TOKEN}
```

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `lines` | number | 50 | 조회할 로그 라인 수 |

**Response:**
```json
{
  "logs": "[2025-08-14T05:40:12.786Z] GET /health - 200\n...",
  "lines": "50"
}
```

**Status Codes:**
- `200 OK`: 정상 응답
- `401 Unauthorized`: 인증 실패

---

### GET /api/pm2

PM2 프로세스 상태 조회

**Request:**
```http
GET /api/pm2
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "processes": [
    {
      "name": "mgmt-api",
      "status": "online",
      "cpu": 0.3,
      "memory": 52039680,
      "restarts": 15
    }
  ]
}
```

**Status Codes:**
- `200 OK`: 정상 응답
- `401 Unauthorized`: 인증 실패

---

### GET /api/files

디렉토리 파일 목록 조회

**Request:**
```http
GET /api/files?dir=/tmp
Authorization: Bearer {TOKEN}
```

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `dir` | string | /tmp | 조회할 디렉토리 경로 |

**허용된 디렉토리:**
- `/tmp`
- `/var/log`

**Response:**
```json
{
  "dir": "/tmp",
  "files": [
    "mgmt-api.js",
    "vm-api.log",
    "package.json"
  ]
}
```

**Status Codes:**
- `200 OK`: 정상 응답
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 허용되지 않은 디렉토리

---

### POST /api/execute

시스템 명령어 실행

**Request:**
```http
POST /api/execute
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "command": "ls -la /tmp"
}
```

**Request Body:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `command` | string | ✅ | 실행할 명령어 |

**차단된 명령어:**
- `rm -rf /`
- `mkfs`
- `dd if=`

**Response:**
```json
{
  "ok": true,
  "out": "total 1234\ndrwxrwxrwt 15 root root...",
  "err": ""
}
```

**Status Codes:**
- `200 OK`: 명령 실행 성공
- `400 Bad Request`: 명령어 누락
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 위험한 명령어

---

### POST /api/deploy

코드 배포

**Request:**
```http
POST /api/deploy
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "code": "console.log('Hello World');",
  "filename": "hello.js"
}
```

**Request Body:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `code` | string | ✅ | 배포할 코드 |
| `filename` | string | ❌ | 파일명 (기본: deployed.js) |

**Response:**
```json
{
  "success": true,
  "filepath": "/tmp/hello.js",
  "pm2": {
    "ok": true,
    "out": "[PM2] Process hello.js launched"
  }
}
```

**Status Codes:**
- `200 OK`: 배포 성공
- `400 Bad Request`: 코드 누락
- `401 Unauthorized`: 인증 실패

---

### POST /api/restart

PM2 서비스 재시작

**Request:**
```http
POST /api/restart
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "restarted": true,
  "result": "[PM2] Restarting all processes..."
}
```

**Status Codes:**
- `200 OK`: 재시작 성공
- `401 Unauthorized`: 인증 실패

## ❌ 에러 처리

### 에러 응답 형식

```json
{
  "error": "에러 메시지",
  "code": 401  // HTTP 상태 코드
}
```

### 일반적인 에러 코드

| 코드 | 설명 | 대응 방법 |
|------|------|-----------|
| `400` | Bad Request | 요청 파라미터 확인 |
| `401` | Unauthorized | Bearer Token 확인 |
| `403` | Forbidden | 권한 또는 제한사항 확인 |
| `404` | Not Found | 엔드포인트 URL 확인 |
| `500` | Internal Server Error | 서버 로그 확인 |

## 💡 사용 예제

### Node.js 클라이언트

```javascript
const http = require('http');

class VMAPIClient {
  constructor(host, port, token) {
    this.host = host;
    this.port = port;
    this.token = token;
  }

  async request(method, path, body = null, needAuth = false) {
    const options = {
      hostname: this.host,
      port: this.port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (needAuth) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch(e) {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  // 공개 API
  async getHealth() {
    return this.request('GET', '/health');
  }

  async getStatus() {
    return this.request('GET', '/api/status');
  }

  // 보안 API
  async getLogs(lines = 50) {
    return this.request('GET', `/api/logs?lines=${lines}`, null, true);
  }

  async getPM2Status() {
    return this.request('GET', '/api/pm2', null, true);
  }

  async executeCommand(command) {
    return this.request('POST', '/api/execute', { command }, true);
  }
}

// 사용 예제
const client = new VMAPIClient(
  '104.154.205.25',
  10000,
  'f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00'
);

// 헬스체크
const health = await client.getHealth();
console.log('Health:', health);

// 시스템 상태
const status = await client.getStatus();
console.log('Status:', status);

// 로그 조회 (인증 필요)
const logs = await client.getLogs(20);
console.log('Logs:', logs);
```

### cURL 예제

```bash
# 헬스체크
curl http://104.154.205.25:10000/health

# 시스템 상태
curl http://104.154.205.25:10000/api/status

# 로그 조회 (인증 필요)
curl -H "Authorization: Bearer f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00" \
     http://104.154.205.25:10000/api/logs?lines=10

# 명령 실행 (인증 필요)
curl -X POST \
     -H "Authorization: Bearer f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00" \
     -H "Content-Type: application/json" \
     -d '{"command":"uptime"}' \
     http://104.154.205.25:10000/api/execute

# PM2 상태 (인증 필요)
curl -H "Authorization: Bearer f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00" \
     http://104.154.205.25:10000/api/pm2
```

### PowerShell 예제

```powershell
# 헬스체크
Invoke-RestMethod -Uri "http://104.154.205.25:10000/health"

# 로그 조회 (인증 필요)
$headers = @{
    "Authorization" = "Bearer f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00"
}
Invoke-RestMethod -Uri "http://104.154.205.25:10000/api/logs?lines=10" -Headers $headers

# 명령 실행 (인증 필요)
$body = @{
    command = "ls -la /tmp"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
    -Uri "http://104.154.205.25:10000/api/execute" `
    -Headers $headers `
    -Body $body `
    -ContentType "application/json"
```

## 🔄 Rate Limiting

현재 Rate Limiting은 구현되어 있지 않습니다. 과도한 요청은 서버 성능에 영향을 줄 수 있으므로 주의하세요.

**권장 사항:**
- 요청 간격: 최소 100ms
- 동시 연결: 최대 10개
- 로그 조회: 분당 60회 이하

## 📚 관련 문서

- [GCP VM 프로젝트 현황](./gcp-vm-project-status.md)
- [트러블슈팅 가이드](./vm-troubleshooting-guide.md)
- [Cloud Shell 접속 가이드](../CLOUD-SHELL-VM-ACCESS.md)

---

**마지막 업데이트**: 2025-08-14 14:50 KST  
**API Version**: 2.0