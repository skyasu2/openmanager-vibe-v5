# 🚀 OpenManager Vibe v5 - 개발 가이드

## 📋 **개발 방법론**

### 🧪 **TDD (Test-Driven Development)**

OpenManager Vibe v5는 테스트 주도 개발 방식을 적극 도입하여 안정성과 품질을 보장합니다.

#### TDD 사이클

```
🔴 Red → 🟢 Green → 🔄 Refactor
```

1. **Red**: 실패하는 테스트 작성
2. **Green**: 최소한의 구현으로 테스트 통과
3. **Refactor**: 코드 품질 개선 및 최적화

#### 적용 원칙

- **API 라우트와 핵심 로직**은 TDD 필수 적용
- **컴포넌트 분리 작업**에 TDD 방식 사용
- **1000줄 이상 파일** 발견 시 분리 검토

### 🤖 **AI 협업 개발**

#### 개발 환경

- **Cursor IDE** + **Claude Sonnet 3.7**
- **30분 개발 + 5분 AI 검토** 사이클
- 실시간 코드 리뷰 및 최적화

#### AI 도구 역할분담

- **ChatGPT**: 기획/브레인스토밍
- **Cursor AI**: 실제 코딩/개발
- **Google Jules**: 아키텍처 분석
- **GPT Codex**: 코드 품질 검토

## 📏 **코드 분리 관리 원칙**

### 분리 기준 (논리적 분석 우선)

#### ✅ **분리해야 하는 경우**

- **1500줄 이상**이고 **SOLID 원칙** 위반
- **여러 책임**을 가진 파일
- **높은 결합도**로 유지보수 어려움
- **재사용성**이 높은 독립적 기능

#### ❌ **분리하지 말아야 하는 경우**

- **강한 응집성**을 가진 단일 기능
- **사용처가 1곳뿐**인 컴포넌트
- **Strategy Pattern** 등 의도적 통합 구조
- **성능 최적화**를 위한 통합 모듈

### 분리 작업 프로세스

1. **구조적 분석**: 분리 가치 판단
2. **의존성 분석**: `grep` 명령어로 사용처 확인
3. **이력 조사**: `git log`로 분리 의도 확인
4. **TDD 적용**: Red-Green-Refactor 사이클
5. **성능 검증**: 분리 전후 성능 비교

## 🏆 **TDD 컴포넌트 분리 성과**

### 완료된 작업

#### 1️⃣ AI 사이드바 컴포넌트 분리

**대상**: `AISidebarV2.tsx`

- **분리 전**: 1462줄
- **분리 후**: 926줄 (**-37% 감소**)
- **분리된 컴포넌트**: 4개
  - `AIEnhancedChat.tsx` (441줄)
  - `AIFunctionPages.tsx` (98줄)
  - `AIPresetQuestions.tsx` (142줄)
  - `ai-sidebar-types.ts` (타입 정의)

#### 2️⃣ UnifiedAIEngineRouter 통합 복구

**문제**: 과도한 분리로 인한 복잡성 증가

- **분리된 상태**: 1781줄 (4개 파일)
- **통합 복구**: 941줄 (**-34% 축소**)
- **테스트 통과**: 12개 중 11개 (92%)

**교훈**: 논리적 분석 없는 강제 분리는 오히려 코드 품질 저하

## 📝 **문서 관리 원칙**

### 커밋/푸시 시마다 수행

1. **기존 문서 갱신 및 정리**
2. **새로운 기능에 대한 문서 신규 작성**
3. **README, 주석, JSDoc 자동 업데이트**
4. **docs 폴더 정리** (가치 판단 기반)

### 문서 구조

```
docs/
├── project-overview.md          # 프로젝트 개요
├── development-guide.md         # 개발 가이드 (이 문서)
├── system-architecture.md       # 시스템 아키텍처
├── ai-system-guide.md          # AI 시스템 가이드
├── deployment-guide.md          # 배포 가이드
├── testing-guide.md            # 테스트 가이드
└── development-tools.md        # 개발 도구
```

## 🔍 **기존 코드 우선 분석**

### 새 기능 개발 전 필수 과정

1. **기존 코드 분석**: `@codebase` 검색으로 유사 기능 확인
2. **중복 개발 방지**: 기존 컴포넌트/함수 재사용 우선
3. **코드베이스 검토**: 전체 구조 이해 후 개발

### 검색 명령어

```bash
# 대용량 파일 찾기
find src -name "*.tsx" -o -name "*.ts" | grep -v ".test." | xargs wc -l | sort -nr | head -20

# 특정 기능 검색
grep -r "함수명" src/
```

## 🚫 **중복/난개발 방지**

### 원칙

- **같은 기능 중복 구현 금지**
- **기존 컴포넌트/함수 재사용 우선**
- **코드 작성 전 `@codebase` 검색**으로 기존 구현 확인

### 검증 과정

1. 기능 명세서 작성
2. 기존 코드 검색 및 분석
3. 재사용 가능성 검토
4. 새로운 구현 필요성 판단

## ⚡ **Vercel 최적화**

### 성능 최적화

- **Next.js Image 컴포넌트** 필수 사용
- **서버/클라이언트 컴포넌트** 적절히 분리
- **동적 임포트** 활용으로 번들 크기 최적화

### 배포 최적화

```bash
# Vercel CLI 사용
npm install -g vercel
vercel login
vercel link
vercel --prod
```

## 🧹 **코드 정리 (푸시 전)**

### 자동화된 정리

- **사용하지 않는 import 정리**
- **ESLint + Prettier** 자동 실행
- **TypeScript 컴파일** 오류 해결

### 수동 검토

- 코드 중복 제거
- 주석 정리 및 업데이트
- 함수/변수명 명확화

## 📋 **Git 커밋 품질**

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 수정
```

### 커밋 전 체크리스트

- [ ] 빌드 에러 없음
- [ ] 테스트 통과
- [ ] 린터 통과
- [ ] 문서 업데이트

## 🎯 **타입 안전성**

### TypeScript 규칙

- **`any` 타입 남용 금지**
- **기본 타입 정의 필수**
- **인터페이스 우선 사용**
- **제네릭 활용**

### 타입 정의 예시

```typescript
interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}
```

## 🏗️ **아키텍처 원칙**

### SOLID 원칙 적용

1. **Single Responsibility**: 단일 책임 원칙
2. **Open/Closed**: 개방/폐쇄 원칙
3. **Liskov Substitution**: 리스코프 치환 원칙
4. **Interface Segregation**: 인터페이스 분리 원칙
5. **Dependency Inversion**: 의존성 역전 원칙

### 디렉토리 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
├── pages/              # 페이지 컴포넌트
├── services/           # 비즈니스 로직
├── utils/              # 유틸리티 함수
├── types/              # 타입 정의
├── hooks/              # 커스텀 훅
└── stores/             # 상태 관리
```

---

*이 문서는 OpenManager Vibe v5 프로젝트의 개발 방법론과 가이드라인을 정리한 개발자 필수 가이드입니다.*
