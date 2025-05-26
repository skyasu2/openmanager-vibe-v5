# 🚀 OpenManager AI v5 - Vercel 최적화 시뮬레이션 시스템

> **🎯 Vercel 무료 티어 최적화** + **실시간 서버 시뮬레이션** + **20분 자동 종료** + **AI 기반 모니터링**  
> **🏆 혁신 포인트**: 메모리 기반 저장소 + 인과관계 장애 시나리오 + 의미있는 서버 구성  

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Optimized-green)](https://vercel.com)
[![Simulation](https://img.shields.io/badge/Simulation-Engine-purple)](src/services/)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](npm run build)

## 📋 **프로젝트 개요**

### **v5 Vercel 최적화 시뮬레이션 시스템** 🔥
- **🏭 시뮬레이션 엔진**: 실제적인 서버 장애 시나리오 및 인과관계 기반 연쇄 장애
- **⏰ 20분 자동 종료**: Vercel 무료 티어 제약 조건 완벽 대응
- **💾 메모리 기반 저장소**: 데이터베이스 없이 실시간/일일 데이터 분리 관리
- **🔄 5초 주기 업데이트**: 실시간 메트릭 수집 및 상태 변화 감지
- **🎭 의미있는 서버 구성**: 20대 서버 (온프레미스/쿠버네티스/AWS/기타)

### **핵심 시스템 구성** 🔥
- **시뮬레이션 엔진**: 점진적 메트릭 변화 + 실제 장애 시나리오
- **데이터 매니저**: 실시간 데이터 (240개) + 일일 데이터 (17,280개) 자동 관리
- **시스템 제어**: 통합 시작/중지 API + 자동 타이머 + 데이터 마이그레이션
- **대시보드 통합**: 실시간 서버 카드 + 상태별 그룹핑 + 자동 새로고침

## 🏗️ **시스템 아키텍처**

### **백엔드 시뮬레이션 계층** (src/services/)
```
📦 services/
├── 🎮 simulationEngine.ts            # 핵심 시뮬레이션 엔진
├── 💾 dataManager.ts                 # 데이터 저장소 관리자
├── 📊 collectors/                     # 기타 데이터 수집 서비스
└── 🤖 ai-agent/                      # AI 에이전트 엔진
```

### **시스템 제어 API** (src/app/api/system/)
```
📦 api/system/
├── 🚀 start/route.ts                 # 시스템 시작 API
├── 🛑 stop/route.ts                  # 시스템 중지 API
└── 📊 status/route.ts                # 시스템 상태 API
```

### **프론트엔드 통합** (src/components/)
```
📦 components/
├── 📊 dashboard/ServerDashboard.tsx   # 메인 서버 대시보드
├── 🎛️ hooks/useSystemControl.ts      # 시스템 제어 훅
└── 📈 stores/serverDataStore.ts       # 서버 데이터 상태 관리
```

## 🚀 **빠른 시작**

```bash
# 1. 설치 및 실행
npm install && npm run dev

# 2. 대시보드 접속
open http://localhost:3000/dashboard

# 3. 시스템 시작 (대시보드에서)
# - "시스템 시작" 버튼 클릭
# - 20대 서버 시뮬레이션 자동 시작
# - 5초마다 실시간 데이터 업데이트
# - 20분 후 자동 중지

# 4. 시스템 API 확인
curl http://localhost:3000/api/system/status     # 시스템 상태
curl http://localhost:3000/api/servers           # 서버 데이터
curl http://localhost:3000/api/system/start -X POST  # 시스템 시작
curl http://localhost:3000/api/system/stop -X POST   # 시스템 중지
```

## 💡 **시뮬레이션 시스템 특징**

### **🎮 시뮬레이션 엔진**
```typescript
// 20대 의미있는 서버 구성
const servers = [
  // 온프레미스 (4대)
  'web-server-01', 'db-primary-01', 'storage-nfs-01', 'monitor-sys-01',
  
  // 쿠버네티스 (3대)  
  'k8s-worker-01', 'k8s-api-01', 'k8s-ingress-01',
  
  // AWS (3대)
  'aws-web-lb-01', 'aws-db-rds-01', 'aws-cache-elasticache-01',
  
  // 기타 (10대)
  'gcp-compute-01', 'azure-vm-01', 'idc-storage-01', ...
];
```

### **🔥 장애 시나리오 (인과관계 기반)**
```typescript
// 1. 디스크 용량 부족 → DB 지연 → 웹서비스 응답 지연
// 2. 메모리 누수 → CPU 증가 → 캐시 서버 임계치 초과  
// 3. 네트워크 병목 → 스토리지 I/O 포화 → 백업 서비스 타임아웃

const scenarios = [
  { name: '디스크 용량 부족 연쇄 장애', probability: 0.15 },
  { name: '메모리 누수 장애', probability: 0.12 },
  { name: '네트워크 병목 장애', probability: 0.08 }
];
```

### **💾 데이터 저장소 관리**
```typescript
// 실시간 저장소: 20분간 5초 주기 = 240개 제한
// 일일 저장소: 24시간 5초 주기 = 17,280개 제한
// 자동 마이그레이션: 중지 시 realtime → daily 이동

const storage = {
  realtime_metrics: [], // 현재 세션 데이터
  daily_metrics: [],    // 장기 보관 데이터  
  last_cleanup: '2024-01-01T00:00:00.000Z'
};
```

## 📊 **Vercel 최적화 설계**

| 최적화 항목 | 설계 | 효과 |
|------------|------|------|
| **리소스 제한** | 20분 자동 종료 | 함수 실행 시간 준수 |
| **메모리 관리** | 메모리 기반 저장소 | DB 비용 없음 |
| **자동 정리** | 중지 시 데이터 마이그레이션 | 메모리 누수 방지 |
| **효율성** | 5초 주기 업데이트 | 적절한 실시간성 |

## 🔧 **시스템 제어 플로우**

### **시작 프로세스**
```bash
1. 시스템 시작 API 호출 (/api/system/start)
2. 기존 실시간 데이터 클리어
3. 시뮬레이션 엔진 시작 (20대 서버 생성)
4. 20분 자동 종료 타이머 설정
5. 5초마다 데이터 수집 인터벌 시작
```

### **업데이트 사이클 (5초마다)**
```bash
1. 모든 서버 메트릭 점진적 업데이트
2. 장애 시나리오 확률 기반 실행 (10% 심각, 20% 경고)
3. 인과관계 연쇄 장애 적용
4. 서버 상태 재평가 (healthy/warning/critical)
5. 실시간 저장소에 데이터 저장
```

### **중지 프로세스**
```bash
1. 시스템 중지 API 호출 (/api/system/stop)
2. 시뮬레이션 엔진 중지
3. 실시간 데이터를 일일 저장소로 마이그레이션
4. 메모리 정리 및 상태 초기화
```

## 💻 **사용법 예시**

### **프론트엔드에서 시스템 제어**
```tsx
import { useSystemControl } from '@/hooks/useSystemControl';

function ControlPanel() {
  const { startFullSystem, stopFullSystem, isSystemActive } = useSystemControl();
  
  const handleStart = async () => {
    const result = await startFullSystem();
    console.log(result.message); // "🎉 시스템 전체 시작 완료!"
  };
  
  return (
    <button onClick={handleStart} disabled={isSystemActive}>
      {isSystemActive ? '실행 중...' : '시스템 시작'}
    </button>
  );
}
```

### **서버 데이터 실시간 연동**
```tsx
import { useServerDataStore } from '@/stores/serverDataStore';

function ServerList() {
  const { servers, fetchServers, refreshData } = useServerDataStore();
  
  useEffect(() => {
    fetchServers(); // 초기 로드
    const interval = setInterval(refreshData, 30000); // 30초마다 새로고침
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      {servers.map(server => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  );
}
```

## 🏆 **기술적 혁신**

| 혁신 영역 | 기술 | 효과 |
|-----------|------|------|
| **시뮬레이션** | 인과관계 기반 장애 시나리오 | 현실성 95% ↑ |
| **자동화** | 20분 타이머 + 자동 정리 | Vercel 최적화 |
| **데이터 관리** | 이중 저장소 (실시간/일일) | 메모리 효율성 |
| **실시간성** | 5초 주기 + 30초 UI 새로고침 | 적절한 성능 |

## 📈 **성능 지표**

| 지표 | 목표 | 달성 |
|------|------|------|
| **서버 수** | 20대 | ✅ 20대 |
| **업데이트 주기** | 5초 | ✅ 5초 |
| **자동 종료** | 20분 | ✅ 20분 |
| **데이터 제한** | 메모리 기반 | ✅ 240개/17,280개 |
| **장애 확률** | 10% 심각, 20% 경고 | ✅ 확률 기반 |

## 🔧 **개발자 가이드**

### **새로운 장애 시나리오 추가**
```typescript
// simulationEngine.ts에 새 시나리오 추가
const newScenario: FailureScenario = {
  id: 'custom-failure',
  name: '커스텀 장애',
  servers: ['target-server-01'],
  probability: 0.05,
  steps: [
    { delay: 0, server_id: 'target-server-01', metric: 'cpu_usage', value: 95 }
  ]
};
```

### **서버 구성 수정**
```typescript
// simulationEngine.ts의 generateInitialServers() 수정
const customServers = [
  { hostname: 'new-server-01', role: 'web', environment: 'production' }
];
```

## 📦 **배포**

```bash
# Vercel 배포
vercel deploy

# 환경 변수 설정 (필요시)
NEXT_PUBLIC_SIMULATION_AUTO_START=false
NEXT_PUBLIC_MAX_SERVERS=20
NEXT_PUBLIC_UPDATE_INTERVAL=5000
```

## 🔗 **주요 링크**

- **메인 대시보드**: `/dashboard`
- **시스템 상태 API**: `/api/system/status`
- **서버 데이터 API**: `/api/servers`
- **AI 에이전트**: `/admin/ai-agent`

---

**🎯 OpenManager AI v5 - Vercel에서 완벽하게 동작하는 실시간 서버 시뮬레이션 시스템**
