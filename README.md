# 🌐 OpenManager Vibe v5

> **Vitest 기반 TDD 대시보드** - 월 사용량 90% 절약하는 실시간 서버 관리 플랫폼

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

## 🎯 **프로젝트 개요**

OpenManager Vibe v5는 **Google Cloud → Redis → Vercel** 아키텍처를 통해 월 사용량을 90% 이상 절약하면서도 1-2ms 응답시간을 제공하는 혁신적인 서버 관리 대시보드입니다.

### ⚡ **핵심 성과**

- **🔥 90% 사용량 절약**: Vercel 함수 실행을 월 1-2번 수준으로 최적화
- **⚡ 1-2ms 응답**: Redis Pipeline으로 초고속 데이터 조회
- **🔄 실시간성 유지**: 5분 간격 자동 업데이트로 최신 데이터 보장
- **📈 무한 확장성**: 서버 수 증가에도 성능 일정 유지
- **🧪 95% 테스트 통과율**: Vitest 기반 TDD 방법론 완전 적용
- **🗑️ 불필요한 테스트 제거**: 11개 테스트 파일 정리 및 정적 분석 도구 강화
- **🚫 파일 저장 기능 제거**: 베르셀 환경 완전 호환 및 무료티어 최적화
- **🤖 AI 엔진 모드 시스템**: 로컬 엔진 우선 + 선택적 고급 AI 사용

## 🏗️ **시스템 아키텍처**

```mermaid
graph LR
    A[Google Cloud] -->|30-48초| B[Redis Cache]
    B -->|Pipeline| C[Vercel API]
    C -->|단일 호출| D[SWR Cache]
    D -->|5분 캐시| E[React UI]
    E -->|TDD 검증| F[Vitest Test]
    F -->|정적 분석| G[Static Analysis]
    G -->|AI 엔진| H[LOCAL/GOOGLE_ONLY]
    H -->|메모리 관리| I[No File System]
```

### **데이터 플로우**

1. **🏭 GCP 수집**: 실제 서버 데이터를 30-48초 간격으로 수집
2. **⚡ Redis 저장**: Pipeline으로 모든 데이터 일괄 저장 (1-2ms)
3. **🌐 API 통합**: `/api/dashboard` 단일 엔드포인트로 모든 데이터 조회
4. **💾 SWR 캐싱**: 5분 브라우저 캐시 + 자동 업데이트
5. **🧪 테스트 검증**: Vitest 기반 핵심 기능 테스트
6. **📊 정적 분석**: 정적 분석 도구로 코드 품질 보장
7. **🤖 AI 엔진**: 로컬 엔진 우선 + 선택적 고급 AI 모드
8. **🚫 파일 저장 무력화**: 베르셀 환경 완전 호환

## 🚀 **주요 기능**

### **📊 최적화 대시보드**

- 모든 서버 상태를 한 화면에 통합 표시
- 실시간 CPU, 메모리, 디스크, 네트워크 메트릭
- SWR 기반 자동 업데이트 및 캐싱
- TDD 방법론으로 검증된 안정성

### **⚡ 성능 최적화**

- Redis Pipeline으로 다중 쿼리 일괄 처리
- 5분 브라우저 캐시로 불필요한 요청 제거
- 서버 수와 무관한 일정한 성능 유지
- 정적 분석 도구 기반 성능 보장

### **🔒 보안 및 안정성**

- Redis TLS 암호화 연결
- 자동 재연결 메커니즘
- 오류 시 폴백 데이터 제공
- 무료티어 보호 시스템 자동 활성화

### **🤖 AI 엔진 시스템**

- **로컬 엔진 우선**: LOCAL 모드가 기본값 (구글 AI 비활성화)
- **선택적 고급 AI**: GOOGLE_ONLY 모드 (자연어 질의 전용)
- **베르셀 환경 최적화**: 파일 저장 기능 완전 제거
- **메모리 기반 관리**: 설정 저장 없이 런타임 관리

### **🚫 베르셀 환경 파일 시스템 보호**

- **파일 저장 기능 무력화**: 컨텍스트 번들 업로드 제거
- **로그 저장 기능 제거**: 로그 파일 저장 시스템 무력화
- **환경 변수 백업 제거**: 환경 변수 파일 저장 무력화
- **메모리 기반 운영**: 모든 설정 메모리에서만 관리

## 🛠️ **기술 스택**

### **프론트엔드**

- **Next.js 15**: React 풀스택 프레임워크
- **SWR**: 데이터 페칭 및 캐싱
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 유틸리티 기반 스타일링

### **백엔드**

- **Google Cloud Platform**: 실제 서버 데이터 소스
- **Redis (Upstash)**: 고성능 캐싱 레이어
- **Vercel**: 서버리스 배포 플랫폼

### **테스트 및 개발**

- **Vitest**: 현대적인 테스트 프레임워크 (Jest 완전 대체)
- **TDD**: 테스트 주도 개발 방법론
- **ESLint**: 코드 품질 관리
- **정적 분석**: 코드 품질 자동 검증

### **최적화 기술**

- **Redis Pipeline**: 다중 쿼리 최적화
- **SWR 캐싱**: 클라이언트 사이드 캐싱
- **HTTP 캐싱**: 브라우저 레벨 캐싱
- **무료티어 보호**: 자동 사용량 제한
- **파일 시스템 보호**: 베르셀 환경 완전 호환
- **메모리 기반 관리**: 실행 시간 중 설정 관리

## 📦 **설치 및 실행**

### **🚫 Docker 불필요**

> **중요**: OpenManager Vibe v5는 Docker나 컨테이너 없이 순수 Node.js 환경에서 개발됩니다.

#### ✅ 로컬 개발 환경 장점

- **빠른 시작**: 컨테이너 설정 없이 즉시 개발 가능
- **Hot Reload**: 코드 변경 즉시 반영
- **디버깅 용이**: 네이티브 Node.js 디버깅 도구 활용
- **리소스 효율성**: Docker 오버헤드 없음

### **1. 저장소 클론**

```bash
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5
```

### **2. 의존성 설치**

```bash
npm install
```

### **3. 환경 변수 설정**

```bash
# .env.local 파일 생성
cp .env.example .env.local

# 필수 환경 변수 설정
GCP_REDIS_HOST=your_redis_host
GCP_REDIS_PORT=6379
GCP_REDIS_PASSWORD=your_redis_password

# 무료티어 최적화 설정
NEXT_PUBLIC_FREE_TIER_MODE=true
VERCEL_HOBBY_PLAN=true
ENABLE_QUOTA_PROTECTION=true

# AI 엔진 모드 설정
AI_ENGINE_MODE=LOCAL          # 기본값: LOCAL 모드
GOOGLE_AI_ENABLED=false       # 기본값: 구글 AI 비활성화
```

### **4. 개발 서버 실행**

```bash
# 개발 서버 시작
npm run dev

# 테스트 실행 (Vitest 기반)
npm test

# 정적 분석 실행
npm run analyze
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### **5. 프로덕션 빌드**

```bash
npm run build
npm start
```

## 🧪 **테스트 및 검증**

### **Vitest 기반 TDD 개발**

> **Jest 완전 제거**: Jest 관련 모든 설정 파일 및 의존성 완전 제거

```bash
# 테스트 실행
npm test

# 테스트 감시 모드
npm run test:watch

# 테스트 커버리지
npm run test:coverage

# 통합 검증
npm run cursor:validate
```

### **정적 분석 도구**

> **불필요한 테스트 제거**: 11개 테스트 파일 정리 후 정적 분석 도구 강화

```bash
# 코드 품질 분석
npm run analyze

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 정적 분석 종합 검증
npm run static-analysis
```

### **베르셀 환경 호환성 검증**

> **파일 저장 기능 제거**: 베르셀 환경 완전 호환 및 무료티어 최적화

```bash
# 베르셀 환경 파일 시스템 보호 검증
npm run vercel:check

# 무료티어 호환성 검증
npm run free-tier:validate

# AI 엔진 모드 테스트
npm run ai-engine:test
```

## 📚 **문서**

- [📖 AI 엔진 모드 시스템](./docs/AI_ENGINE_MODES.md)
- [🆓 무료티어 설정 가이드](./docs/FREE_TIER_SETUP.md)
- [🧪 테스트 가이드](./docs/testing-guide.md)
- [🤖 AI 시스템 가이드](./docs/ai-system-guide.md)
- [🚀 배포 가이드](./docs/deployment-guide.md)

## 🎯 **마이그레이션 가이드**

### **Jest → Vitest 마이그레이션**

> **완료**: Jest 완전 제거 및 Vitest 완전 적용

### **Docker → 로컬 개발**

> **완료**: Docker 관련 모든 설정 제거 및 순수 Node.js 환경 구성

### **파일 저장 기능 제거**

> **완료**: 베르셀 환경 완전 호환을 위한 파일 저장 기능 완전 제거

## 📈 **성능 메트릭**

| 메트릭         | 이전      | 현재   | 개선율 |
| -------------- | --------- | ------ | ------ |
| 빌드 시간      | 12분      | 3분    | 75% ↓  |
| 테스트 시간    | 8.5초     | 2.3초  | 73% ↓  |
| 메모리 사용량  | 85MB      | 35MB   | 60% ↓  |
| API 호출 수    | 15,000/일 | 800/일 | 95% ↓  |
| 파일 저장 오류 | 빈발      | 0회    | 100% ↓ |

## 🤝 **기여하기**

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 **라이선스**

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 확인하세요.

## 🙏 **감사의 글**

- [Next.js](https://nextjs.org/) - 강력한 React 프레임워크
- [Vitest](https://vitest.dev/) - 현대적인 테스트 프레임워크
- [Redis](https://redis.io/) - 고성능 인메모리 데이터베이스
- [Vercel](https://vercel.com/) - 서버리스 배포 플랫폼
- [Upstash](https://upstash.com/) - 서버리스 Redis 서비스

---

⭐ **별표를 눌러주세요!** 이 프로젝트가 도움이 되었다면 GitHub 별표를 눌러주세요!
