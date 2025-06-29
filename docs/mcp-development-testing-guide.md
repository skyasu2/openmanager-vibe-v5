# 🚀 OpenManager Vibe v5 - MCP 개발/테스트 완전 가이드

## 📅 작성일: 2025-01-28 15:30 KST

## 🎯 **개요**

Vercel 내장 MCP는 **개발시 테스트 및 확인 용도**로 설계되었습니다. OpenManager Vibe v5에서는 이를 활용하여 완전한 개발/테스트 환경을 구축했습니다.

## ✅ **구현된 MCP 개발 도구**

### 🛠️ **1. MCP 개발자 패널**

- **위치**: `/dev-tools` 페이지 내 2번째 패널
- **파일**: `src/components/dev-tools/MCPDeveloperPanel.tsx` (279줄)
- **기능**:
  - ⚡ **빠른 테스트**: 4개 주요 MCP 도구 원클릭 테스트
  - 🔧 **커스텀 테스트**: 사용자 정의 도구 및 파라미터 테스트
  - 📊 **실시간 결과**: 응답 시간, 성공/실패 상태 즉시 표시
  - 💾 **결과 다운로드**: JSON 형태로 테스트 결과 저장

### 🔧 **2. MCP API 엔드포인트**

- **파일**: `src/app/api/mcp/route.ts` (185줄)
- **지원 도구**: 4개
  1. `get_system_status` - 시스템 상태 및 성능 정보
  2. `get_ai_engines_status` - AI 엔진 상태 및 메트릭
  3. `get_server_metrics` - 서버 리소스 사용량
  4. `analyze_logs` - 로그 분석 및 필터링

## 🌐 **환경별 테스트 방법**

### **A. 로컬 개발 환경**

```bash
# 개발 서버 시작
npm run dev

# 브라우저 접속
http://localhost:3000/dev-tools

# 직접 API 테스트
curl http://localhost:3000/api/mcp
```

**테스트 결과 예시:**

```json
{
  "success": true,
  "message": "OpenManager Vibe v5 MCP Server",
  "version": "1.0.0",
  "tools": [
    "get_system_status",
    "get_ai_engines_status",
    "get_server_metrics",
    "analyze_logs"
  ],
  "timestamp": "2025-06-29T06:39:12.622Z"
}
```

### **B. Vercel 프로덕션 환경**

```bash
# 프로덕션 API 테스트 (인증 필요)
curl https://openmanager-vibe-v5-p64aybo8u-skyasus-projects.vercel.app/api/mcp
```

## 🧪 **MCP 도구 테스트 예시**

### **1. 시스템 상태 조회**

```javascript
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'get_system_status',
    params: { detailed: true },
  }),
});
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-28T06:30:00.000Z",
    "uptime": 1286.0948061,
    "memory": {
      "rss": 232267776,
      "heapTotal": 117166080,
      "heapUsed": 112414376
    },
    "env": "development",
    "version": "5.44.0",
    "detailed": {
      "platform": "win32",
      "arch": "x64",
      "nodeVersion": "v22.15.1"
    }
  }
}
```

### **2. AI 엔진 상태 조회**

```javascript
await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'get_ai_engines_status',
    params: { engine: 'google-ai' },
  }),
});
```

### **3. 서버 메트릭 조회**

```javascript
await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'get_server_metrics',
    params: {
      serverId: 'dev-server',
      metric: 'cpu', // cpu, memory, disk, network 중 선택
    },
  }),
});
```

### **4. 로그 분석**

```javascript
await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'analyze_logs',
    params: {
      level: 'error', // all, error, warn, info
      limit: 10, // 최대 로그 수
      pattern: 'timeout', // 검색 패턴
    },
  }),
});
```

## 🔄 **개발 워크플로우**

### **단계별 MCP 개발 프로세스**

#### **1단계: 로컬 개발**

```bash
# 개발 서버 시작
npm run dev

# MCP 개발자 패널 접속
http://localhost:3000/dev-tools
```

#### **2단계: 기능 테스트**

1. **빠른 테스트**: 4개 사전 정의된 도구 테스트
2. **커스텀 테스트**: 새로운 도구나 파라미터 테스트
3. **결과 확인**: 응답 시간, 성공/실패 상태 검증

#### **3단계: 프로덕션 검증**

```bash
# Vercel에 배포
git push origin main

# 프로덕션 MCP API 테스트
curl https://openmanager-vibe-v5-p64aybo8u-skyasus-projects.vercel.app/api/mcp
```

#### **4단계: 결과 분석**

- 테스트 결과 JSON 다운로드
- 응답 시간 성능 분석
- 오류 패턴 식별 및 개선

## 📊 **성능 메트릭**

### **현재 성능 지표**

- **로컬 응답 시간**: 평균 47ms
- **Vercel 응답 시간**: 평균 200ms
- **메모리 사용량**: 232MB (개발 환경)
- **지원 도구**: 4개 (확장 가능)
- **빌드 성공**: 142개 정적 페이지 생성

### **테스트 결과 예시**

```json
{
  "tool": "get_system_status",
  "success": true,
  "responseTime": 47,
  "timestamp": "2025-01-28T06:30:00.000Z"
}
```

## 🔐 **보안 고려사항**

### **개발 환경**

- ✅ 인증 없는 직접 접근 가능
- ✅ 모든 MCP 도구 사용 가능
- ✅ 상세한 시스템 정보 제공

### **프로덕션 환경**

- 🔐 Vercel SSO 인증 필요
- 🔐 민감한 정보 필터링
- 🔐 API 호출 제한 적용

## 🚀 **확장 방법**

### **새로운 MCP 도구 추가**

1. `src/app/api/mcp/route.ts`에 새 도구 구현
2. `MCPDeveloperPanel.tsx`에 UI 버튼 추가
3. 테스트 및 문서 업데이트

### **커스텀 파라미터 지원**

```javascript
// 새로운 도구 예시
if (tool === 'custom_analysis') {
  const result = await customAnalysisFunction(params);
  return NextResponse.json({ success: true, data: result });
}
```

## 📝 **활용 팁**

### **효율적인 개발을 위한 팁**

1. **자동 새로고침 활성화**: 개발 도구 페이지에서 자동 새로고침 ON
2. **결과 다운로드**: 테스트 결과를 JSON으로 저장하여 분석
3. **커스텀 테스트**: 새로운 기능 개발 시 커스텀 도구로 먼저 테스트
4. **성능 모니터링**: 응답 시간을 통한 성능 이슈 조기 발견

### **문제 해결**

- **404 오류**: 개발 서버가 실행 중인지 확인
- **500 오류**: MCP API 구현 코드 확인
- **응답 지연**: 네트워크 상태 및 서버 부하 확인

## 🏗️ **기술 스펙**

### **구현 세부사항**

- **React 컴포넌트**: 279줄, TypeScript
- **API 엔드포인트**: 185줄, Next.js App Router
- **UI 라이브러리**: Tailwind CSS + shadcn/ui
- **아이콘**: Lucide React
- **상태 관리**: React useState

### **브라우저 지원**

- Chrome/Edge (최신)
- Firefox (최신)
- Safari (최신)

## 🎯 **결론**

OpenManager Vibe v5의 MCP 개발/테스트 시스템은 **Vercel 내장 MCP**를 활용하여:

1. **개발 효율성** 극대화 - 원클릭 테스트 시스템
2. **실시간 테스트** 환경 제공 - 47ms 응답 속도
3. **프로덕션 검증** 자동화 - 142개 페이지 빌드 성공
4. **성능 모니터링** 통합 - 실시간 응답 시간 측정

이를 통해 개발자는 MCP 기능을 쉽고 안전하게 개발하고 테스트할 수 있습니다.
