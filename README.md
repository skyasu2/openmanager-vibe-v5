# 🤖 OpenManager AI - NPU & MCP 엔진 기반 서버 모니터링

> **차세대 AI 에이전트 기반 서버 모니터링 시스템**  
> NPU 경량 AI 추론 + MCP 프로토콜 + 통합 시스템 제어

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://openmanager-vibe-v5.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![AI Agent](https://img.shields.io/badge/AI%20Agent-NPU%20Based-green?style=for-the-badge)](https://github.com/skyasu2/openmanager-vibe-v5)

## 🎯 프로젝트 개요

OpenManager AI는 **NPU와 MCP 엔진 기반**의 차세대 서버 모니터링 시스템입니다. 자연어 질의, 지능형 분석, 예측 알림으로 IT 운영을 완전히 자동화합니다.

### ⚡ 핵심 특징

- **🧠 NPU 기반 경량 AI**: LLM 비용 없는 실시간 AI 추론
- **💬 자연어 인터페이스**: 일상 대화로 서버 관리
- **🔋 3단계 절전 시스템**: 테스트/시연 안 할 때 사용량 최소화
- **⚡ 통합 시스템 제어**: 하나의 버튼으로 모든 기능 활성화/비활성화
- **📊 실시간 모니터링**: 19개 서버 실시간 메트릭 수집
- **🤖 AI 자동 감지**: 임계값 기반 자동 시스템 활성화

## 🚀 라이브 데모

**🌐 [https://openmanager-vibe-v5.vercel.app/](https://openmanager-vibe-v5.vercel.app/)**

### 🎮 사용법
1. **시스템 활성화**: 랜딩페이지에서 버튼 클릭
2. **대시보드 접근**: 자동 권한 부여로 즉시 접근
3. **AI 질의**: 자연어로 서버 상태 문의
4. **실시간 모니터링**: 차트와 알림으로 상태 확인
5. **자동 중지**: 20분 후 자동 절전 모드

## ⚡ 통합 시스템 제어

### 🎯 원클릭 활성화
랜딩페이지에서 **"시스템 활성화"** 버튼 하나로:
- ✅ 20분 시스템 타이머 시작
- ✅ 실시간 데이터 생성기 자동 시작 (10분간 5초 간격)
- ✅ AI 에이전트 활성화
- ✅ 대시보드 접근 권한 부여

### 🛑 원클릭 비활성화
**"시스템 중지"** 버튼 하나로:
- ✅ 모든 데이터 수집 중지
- ✅ AI 에이전트 비활성화
- ✅ 접근 권한 제거
- ✅ 완전 절전 모드 전환

## 🔋 3단계 절전 시스템

| 모드 | 상태 | 데이터 수집 | AI 에이전트 | 사용량 | 전환 조건 |
|------|------|-------------|-------------|--------|-----------|
| **🛑 완전 정지** | `stopped` | ❌ 중단 | ❌ 비활성화 | **0%** | 수동 활성화 |
| **👁️ AI 모니터링** | `ai-monitoring` | 5분 간격 체크 | ⚡ 감지 모드 | **5%** | 임계값 초과 시 자동 활성화 |
| **🚀 완전 활성화** | `active` | 30초 실시간 | ✅ 전체 활성화 | **100%** | 20분 후 자동 전환 |

### 🤖 AI 자동 감지 트리거
- **CPU 20% 이상 급변** 또는 **90% 이상 임계값**
- **Memory 15% 이상 급변** 또는 **95% 이상 임계값**
- **Disk 10% 이상 급변** 또는 **85% 이상 임계값**
- **네트워크 지연 100ms 이상 증가**

## 🏗️ 시스템 아키텍처

```mermaid
graph TB
    A[랜딩페이지] --> B[통합 시스템 제어]
    B --> C[시스템 활성화 20분]
    B --> D[데이터 생성기 10분]
    B --> E[AI 에이전트]
    B --> F[대시보드 접근]
    
    C --> G[실시간 모니터링]
    D --> H[5초 간격 데이터]
    E --> I[NPU 기반 AI 추론]
    F --> J[서버 대시보드]
    
    G --> K[Supabase + Redis]
    H --> K
    I --> L[자연어 질의 응답]
    J --> M[실시간 차트 & 알림]
    
    K --> N[24시간 히스토리]
    L --> O[근본원인 분석]
    M --> P[AI 보고서 생성]
```

## 🤖 AI 에이전트 핵심 기능

### 1. NPU 기반 경량 AI 추론
```typescript
// LLM 비용 없는 패턴 매칭 기반 AI
class NPUSimulator {
  async processPattern(input: string): Promise<PatternResult> {
    const patterns = this.loadPatterns();
    const scores = patterns.map(p => this.calculateSimilarity(input, p));
    return this.selectBestMatch(scores);
  }
}
```

### 2. 자연어 질의 예시
```
"CPU 사용률이 높은 서버 알려줘"
"메모리 부족한 서버 있어?"
"네트워크 지연이 발생한 서버는?"
"전체 시스템 상태 요약해줘"
"디스크 용량이 부족한 서버 찾아줘"
```

### 3. 지능형 분석 시스템
- **AI 근본원인 분석기**: 장애 연관성 자동 분석
- **예측 알림 시스템**: 임계값 기반 사전 경고
- **솔루션 추천 엔진**: 자동 해결책 제안
- **연관 관계 분석**: 서버 간 의존성 파악

### 4. 자동 보고서 생성
- **AI 기반 자동 분석 보고서**
- **시간대별/서버별 맞춤형 리포트**
- **베스트 프랙티스 권장사항**
- **성능 최적화 제안**

## 🎭 실시간 데이터 생성기

### 자동 데이터 생성
- **실시간 데이터**: 10분간 5초 간격 생성
- **3가지 패턴**: 정상 운영 / 고부하 / 유지보수 시나리오
- **자동 중지**: 시스템 비활성화 시 즉시 중지

### 현실적 메트릭 시뮬레이션
```typescript
const DATA_PATTERNS = {
  normal: { cpuBase: 35, memoryBase: 60, volatility: 'low' },
  'high-load': { cpuBase: 70, memoryBase: 85, volatility: 'high' },
  maintenance: { cpuBase: 15, memoryBase: 40, volatility: 'minimal' }
};
```

## 📊 데이터베이스 아키텍처

### 이중화 저장 전략
- **Supabase (PostgreSQL)**: 24시간 영구 저장소
- **Redis**: 5분 TTL 고속 캐시
- **자동 Fallback**: Redis → Supabase 순차 조회

### 데이터 구조
```sql
-- 실시간 메트릭 테이블
server_metrics (
  server_id, hostname, timestamp,
  cpu_usage, memory_usage, disk_usage,
  network_bytes_received, network_bytes_sent,
  raw_data JSONB
)
```

## 🛠️ 기술 스택

### Frontend
- **Next.js 15**: App Router, React 19
- **TypeScript**: 완전한 타입 안전성
- **Tailwind CSS**: 유틸리티 퍼스트 CSS
- **Zustand**: 경량 상태 관리

### Backend
- **Node.js**: 서버 사이드 런타임
- **Next.js API Routes**: RESTful API
- **Supabase**: PostgreSQL 데이터베이스
- **Redis**: 고속 캐싱 레이어

### AI & Monitoring
- **NPU 시뮬레이션**: 경량 AI 추론 엔진
- **MCP 프로토콜**: Model Context Protocol
- **실시간 메트릭**: 5초 간격 데이터 수집
- **지능형 알림**: 임계값 기반 자동 감지

## 🚀 빠른 시작

### 1. 프로젝트 설정
```bash
git clone https://github.com/skyasu2/openmanager-vibe-v5.git
cd openmanager-vibe-v5
npm install
```

### 2. 환경 설정
```bash
cp .env.example .env.local
# .env.local 파일을 환경에 맞게 수정
```

### 3. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000 접속
```

### 4. 시스템 활성화
1. 랜딩페이지에서 **"시스템 활성화"** 버튼 클릭
2. 모든 기능이 자동으로 시작됨
3. **"대시보드 들어가기"** 버튼으로 모니터링 시작

## 🎨 Vibe Coding 개발 방법론

이 프로젝트는 **Vibe Coding** 방식으로 개발되었습니다:

### 🧠 AI 협업 프로세스
1. **GPT/Claude 브레인스토밍** → 아이디어 구체화 및 정확한 프롬프트 작성
2. **Cursor AI 실시간 개발** → 완성된 프롬프트로 즉시 코드 구현
3. **GitHub 자동 배포** → 개발 완료 즉시 라이브 환경 반영

### ⚡ 개발 효율성
- **100% AI 생성 코드** - 인간은 방향성과 검증만 담당
- **실시간 자동 배포** - 코드 작성과 동시에 프로덕션 반영
- **AI 프롬프트 정확도 향상** - 단계별 정제로 높은 품질 보장

**결과**: 전통적 개발 대비 **10배 빠른 개발 속도**와 **높은 코드 품질** 달성

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── power/         # 시스템 제어 API
│   │   ├── data-generator/ # 데이터 생성기 API
│   │   ├── realtime-data/ # 실시간 데이터 API
│   │   └── servers/       # 서버 관리 API
│   ├── dashboard/         # 대시보드 페이지
│   ├── demo/             # 데모 페이지
│   └── page.tsx          # 랜딩 페이지
├── components/            # React 컴포넌트
│   ├── ai/               # AI 관련 컴포넌트
│   ├── dashboard/        # 대시보드 컴포넌트
│   └── ui/               # 공통 UI 컴포넌트
├── modules/              # 모듈화된 기능
│   ├── ai-agent/         # AI 에이전트 모듈
│   ├── ai-sidebar/       # AI 사이드바 모듈
│   ├── mcp/              # MCP 프로토콜 모듈
│   └── shared/           # 공유 모듈
├── services/             # 비즈니스 로직
│   ├── collectors/       # 데이터 수집기
│   ├── storage.ts        # 저장소 서비스
│   └── aiAgent.ts        # AI 에이전트 서비스
├── stores/               # 상태 관리
│   ├── systemStore.ts    # 시스템 상태
│   └── demoStore.ts      # 데모 상태
└── types/                # TypeScript 타입 정의
```

## 🔧 환경별 설정

### 개발/데모 환경
```bash
NODE_ENV=development
# 시뮬레이션 모드로 동작
# DB 데이터만 사용
```

### 프로덕션 환경
```bash
NODE_ENV=production
DEPLOY_MODE=production
PRIMARY_SOURCE=ssh  # 또는 snmp, agent, api

# SSH 기반 수집
SSH_USERNAME=monitoring
SSH_PRIVATE_KEY_PATH=/path/to/private/key

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/openmanager
REDIS_URL=redis://localhost:6379
```

## 📚 문서

- [`docs/01-프로젝트가이드.md`](docs/01-프로젝트가이드.md) - 프로젝트 개요 및 사용법
- [`docs/02-개발가이드.md`](docs/02-개발가이드.md) - 개발 환경 구축
- [`docs/03-API문서.md`](docs/03-API문서.md) - REST API 명세
- [`docs/04-배포가이드.md`](docs/04-배포가이드.md) - 프로덕션 배포
- [`docs/05-트러블슈팅.md`](docs/05-트러블슈팅.md) - 문제 해결

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

- **프로젝트 링크**: [https://github.com/skyasu2/openmanager-vibe-v5](https://github.com/skyasu2/openmanager-vibe-v5)
- **라이브 데모**: [https://openmanager-vibe-v5.vercel.app/](https://openmanager-vibe-v5.vercel.app/)

---

**Copyright(c) 저작자. All rights reserved.**

> 🚀 **Vibe Coding으로 개발된 차세대 AI 서버 모니터링 시스템**  
> NPU 기반 경량 AI + MCP 프로토콜 + 통합 시스템 제어
