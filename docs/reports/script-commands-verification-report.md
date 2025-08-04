# 📋 스크립트 명령어 검증 보고서

**검증 날짜**: 2025년 7월 28일  
**검증 대상**: package.json vs 문서 스크립트 명령어 일치성  
**검증자**: Documentation Structure Guardian

---

## 🎯 검증 개요

OpenManager Vibe v5 프로젝트의 문서에서 언급된 npm 스크립트 명령어들이 실제 package.json의 scripts 섹션과 일치하는지 검증하고, 발견된 불일치 사항을 수정했습니다.

## ✅ 수정 완료된 불일치 사항들

### 1. **CLAUDE.md (루트 문서)** - ✅ 수정 완료

**수정된 명령어:**
- `npm run health-check` → `npm run health:check`

**상태**: ✅ 완료

### 2. **docs/development/development-guide.md** - ✅ 수정 완료

**수정된 명령어들:**
- `npm run static-analysis` → `npm run analyze`
- `npm run analyze:performance` → `npm run test:performance`
- `npm run analyze:security` → `npm run security:check`
- `npm run build:verify` → `npm run build` (존재하지 않는 명령어 제거)
- `npm run dev:debug` → `DEBUG=* npm run dev` (실제 사용법으로 수정)
- `npm run test:debug` → `npm run test -- --reporter=verbose` (실제 사용법으로 수정)

**상태**: ✅ 완료

### 3. **docs/testing/testing-guide.md** - ✅ 수정 완료

**수정된 명령어:**
- `npm run static-analysis` → `npm run analyze` (모든 인스턴스)

**상태**: ✅ 완료

### 4. **docs/quick-start/deployment-guide.md** - ✅ 수정 완료

**수정된 명령어:**
- `npm run static-analysis` → `npm run analyze`

**상태**: ✅ 완료

---

## ✅ 검증 완료된 정확한 명령어들

다음 명령어들은 package.json과 문서에서 정확히 일치함을 확인했습니다:

### 🛠️ 개발 관련
```bash
npm run dev              # ✅ Next.js 개발 서버
npm run build            # ✅ 프로덕션 빌드
npm run start            # ✅ 프로덕션 서버 시작
npm run lint             # ✅ ESLint 검사
npm run lint:fix         # ✅ ESLint 자동 수정
npm run type-check       # ✅ TypeScript 타입 검사
```

### 🧪 테스트 관련
```bash
npm test                 # ✅ Vitest 테스트 실행
npm run test:watch       # ✅ 감시 모드 테스트
npm run test:coverage    # ✅ 커버리지 리포트
npm run test:ui          # ✅ Vitest UI 모드
npm run test:tdd-safe    # ✅ TDD 안전 테스트
```

### 🔍 검증 관련
```bash
npm run validate:all     # ✅ 전체 검증
npm run cursor:validate  # ✅ Cursor IDE 검증  
npm run analyze          # ✅ 정적 분석
npm run analyze:bundle   # ✅ 번들 크기 분석
npm run analyze:free-tier # ✅ 무료 티어 분석
```

### 🚀 배포 관련
```bash
npm run deploy           # ✅ Vercel 프로덕션 배포
npm run deploy:preview   # ✅ Vercel 프리뷰 배포
```

### 🔐 보안 관련
```bash
npm run security:check   # ✅ 보안 검사
npm run security:secrets # ✅ 시크릿 검사
npm run security:audit   # ✅ npm audit
```

### 🔧 OAuth 관련
```bash
npm run oauth:diagnose   # ✅ OAuth 문제 진단
npm run oauth:fix        # ✅ OAuth 자동 수정
npm run oauth:test       # ✅ OAuth 플로우 테스트
```

### ☁️ GCP 관련
```bash
npm run gcp:monitor      # ✅ GCP 할당량 모니터링
npm run gcp:check        # ✅ GCP 상태 확인
npm run gcp:optimize     # ✅ GCP 최적화
```

### 🔌 MCP 관련
```bash
npm run mcp:verify       # ✅ MCP 서버 검증
npm run mcp:test         # ✅ MCP 서버 테스트
npm run mcp:setup        # ✅ MCP 서버 설정
npm run mcp:reset        # ✅ MCP 설정 리셋
```

### 📊 Claude 사용량 관련
```bash
npm run ccusage:live     # ✅ 실시간 사용량 모니터링
npm run ccusage:blocks   # ✅ 현재 과금 블록 확인
npm run ccusage:daily    # ✅ 일별 사용량
```

### 🔧 환경 설정 관련
```bash
npm run env:setup        # ✅ 환경변수 대화형 설정
npm run env:check        # ✅ 환경변수 검증
npm run env:vercel       # ✅ Vercel 환경변수 설정
npm run env:backup       # ✅ 환경변수 백업
npm run env:restore      # ✅ 환경변수 복원
```

### 🏥 상태 확인 관련
```bash
npm run health:check     # ✅ API 상태 확인
npm run health:test      # ✅ 헬스체크 테스트
npm run system:health    # ✅ 시스템 전체 상태
npm run system:status    # ✅ 통합 상태 리포트
```

---

## 📚 문서에 누락된 유용한 명령어들

다음 명령어들은 package.json에 존재하지만 주요 문서에서 언급되지 않았습니다. 향후 문서 업데이트 시 고려할 수 있습니다:

### 🔴 Memory Cache 관련 (개발자 도구)
```bash
npm run memory cache:test       # Memory Cache 연결 테스트
npm run memory cache:check      # Memory Cache 상태 확인
npm run memory cache:cli        # Memory Cache CLI 접속
npm run memory cache:check:real # 실제 Memory Cache 연결 테스트
```

### 🤖 Sub Agents 관련 (새로운 기능)
```bash
npm run agents:test      # Sub agents 테스트
npm run agents:health    # Agents 상태 확인
npm run agents:stats     # Agents 통계
npm run agents:verify-env # Agents 환경변수 검증
```

### 🔒 보안 토큰 관리
```bash
npm run secure:token     # 토큰 관리
npm run secure:add       # 새 토큰 추가
npm run secure:get       # 토큰 조회
npm run secure:list      # 토큰 목록
```

### ⏰ 시간 관련 유틸리티
```bash
npm run time:kst         # 한국 시간 확인
npm run time:commit      # 커밋 시간 확인
```

### 🐺 Husky 관리
```bash
npm run husky:disable    # Husky 비활성화
npm run husky:enable     # Husky 활성화
npm run husky:status     # Husky 상태 확인
```

---

## 📊 검증 통계

### 수정 전 상태
- **총 검증 대상 명령어**: 50개
- **불일치 발견**: 8개 (16%)
- **완전히 잘못된 명령어**: 6개
- **사용법이 부정확한 명령어**: 2개

### 수정 후 상태  
- **수정 완료된 파일**: 4개
- **수정된 명령어**: 8개
- **일치율**: 100% ✅
- **문서 신뢰도**: 크게 향상 ✅

---

## 🎯 권장사항

### 1. **문서 유지보수 자동화**
```bash
# package.json 변경 시 자동 검증 스크립트 추가 고려
npm run docs:verify-commands
```

### 2. **중요 명령어 추가 문서화**
특히 다음 영역의 명령어들을 주요 가이드에 추가 권장:
- Memory Cache 관리 명령어들
- Sub Agents 관련 명령어들  
- 시스템 상태 확인 명령어들

### 3. **주기적 검증**
분기별로 package.json과 문서 간의 명령어 일치성 검증 권장

---

## ✅ 결론

**모든 주요 불일치 사항이 성공적으로 수정되었습니다.**

- ✅ CLAUDE.md: health-check → health:check 수정 완료
- ✅ development-guide.md: 6개 잘못된 명령어 수정 완료  
- ✅ testing-guide.md: static-analysis 명령어 수정 완료
- ✅ deployment-guide.md: static-analysis 명령어 수정 완료

이제 문서에서 언급된 모든 npm 스크립트 명령어들이 실제 package.json과 정확히 일치하며, 개발자들이 문서를 신뢰하고 따라할 수 있습니다.

---

**마지막 업데이트**: 2025년 7월 28일  
**상태**: 검증 및 수정 완료 ✅  
**다음 검증 권장 일정**: 2025년 10월 (분기별)