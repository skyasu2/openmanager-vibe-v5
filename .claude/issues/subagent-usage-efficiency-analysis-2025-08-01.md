# 서브에이전트 사용 빈도 및 효율성 분석

**생성일**: 2025-08-01
**분석자**: Claude Code

## 📊 서브에이전트 사용 빈도 분석

### 고빈도 사용 에이전트 (PROACTIVE 트리거 다수)

#### 1. **code-review-specialist** - 매우 높음

- **트리거**: 모든 TS/TSX/JS/JSX 파일 수정 시
- **자동 실행**: pre-PR, post-commit (3+ files)
- **빈도**: 개발 중 거의 매번 실행

#### 2. **test-automation-specialist** - 매우 높음

- **트리거**: 테스트 실패, 커버리지 하락, 새 컴포넌트 생성
- **자동 실행**: pre-deployment validation
- **빈도**: 코드 변경 시마다 실행

#### 3. **database-administrator** - 높음

- **트리거**: API 응답 >500ms, Redis 사용량 >80%, 쿼리 >100ms
- **자동 실행**: 성능 문제 발생 시
- **빈도**: 지속적 모니터링

#### 4. **debugger-specialist** - 높음

- **트리거**: 스택 트레이스, 에러 로그, API 타임아웃
- **자동 실행**: 런타임 예외 발생 시
- **빈도**: 에러 발생 시마다

### 중빈도 사용 에이전트

#### 5. **ux-performance-optimizer** - 중간

- **트리거**: Core Web Vitals 임계값 초과
- **조건**: LCP>2.5s, CLS>0.1, FID>100ms
- **빈도**: 성능 저하 감지 시

#### 6. **git-cicd-specialist** - 중간

- **트리거**: git/CI/CD 실패 시
- **조건**: commit/push 실패, 파이프라인 에러
- **빈도**: 배포 프로세스 중

#### 7. **documentation-manager** - 중간

- **트리거**: 새 기능 추가, JBGE 원칙 위반
- **조건**: 루트 .md 파일 4개 초과
- **빈도**: 기능 개발 완료 시

### 저빈도 사용 에이전트

#### 8. **central-supervisor** - 낮음

- **트리거**: 3+ 도메인 작업, 복잡한 요청
- **조건**: 대규모 리팩토링, 긴급 대응
- **빈도**: 복잡한 작업 시에만

#### 9. **backend-gcp-specialist** - 낮음

- **트리거**: GCP Functions 배포 필요 시
- **조건**: Python 백엔드 최적화
- **빈도**: 백엔드 작업 시에만

#### 10. **security-auditor** - 낮음

- **트리거**: 하드코딩된 시크릿 감지
- **조건**: 사용자 보안 검토 요청
- **빈도**: 특정 보안 이슈 시

## 🔍 MCP 도구 사용 효율성 분석

### 비효율적 사용 패턴

#### 1. **과도한 filesystem 접근** (11개 에이전트)

```
문제: 너무 많은 에이전트가 파일 시스템 직접 접근
영향: 동시 파일 접근 시 충돌 가능성
```

#### 2. **중복된 sequential-thinking 사용** (9개 에이전트)

```
문제: 복잡한 사고가 필요하지 않은 에이전트도 사용
영향: 불필요한 토큰 사용 및 처리 시간 증가
```

#### 3. **광범위한 context7 사용** (9개 에이전트)

```
문제: 문서 검색이 핵심이 아닌 에이전트도 사용
영향: API 할당량 낭비
```

### 효율적 사용 패턴

#### 1. **전문화된 supabase 사용** ✅

- database-administrator만 사용
- 명확한 역할 분리
- 보안 및 권한 관리 집중

#### 2. **타겟화된 playwright 사용** ✅

- test-automation-specialist
- ux-performance-optimizer
- 테스트/성능 전문 에이전트만 사용

#### 3. **적절한 time 사용** ✅

- 4개 에이전트만 사용
- 타임스탬프가 필요한 에이전트로 제한

## 📈 효율성 개선 방안

### 1. MCP 도구 접근 최소화

**filesystem 사용 제한**:

```yaml
필수 유지:
  - mcp-server-admin (MCP 관리)
  - documentation-manager (문서 관리)
  - structure-refactor-agent (구조 분석)

제거 고려:
  - code-review-specialist (Read/Grep으로 충분)
  - test-first-developer (Write로 충분)
  - quality-control-checker (Read/Grep으로 충분)
```

**sequential-thinking 사용 제한**:

```yaml
필수 유지:
  - debugger-specialist (복잡한 디버깅)
  - central-supervisor (복잡한 조율)
  - mcp-server-admin (문제 해결)

제거 고려:
  - code-review-specialist (패턴 매칭으로 충분)
  - test-first-developer (템플릿으로 충분)
  - quality-control-checker (규칙 기반 검사)
```

### 2. 에이전트별 전문화 강화

**역할별 MCP 재할당**:

```yaml
code-review-specialist:
  현재: filesystem, serena, sequential-thinking
  개선: serena만 유지 (코드 분석 전문화)

test-first-developer:
  현재: filesystem, sequential-thinking, memory
  개선: memory만 유지 (테스트 패턴 저장/조회)

quality-control-checker:
  현재: filesystem, sequential-thinking
  개선: 기본 도구만 사용 (Read, Grep)
```

### 3. 사용 빈도 기반 최적화

**고빈도 에이전트 경량화**:

- code-review-specialist: MCP 의존도 감소
- test-automation-specialist: playwright 중심으로 집중
- database-administrator: 현재 상태 유지 (이미 최적)

**저빈도 에이전트 유지**:

- central-supervisor: 모든 도구 유지 (복잡한 작업)
- security-auditor: 현재 상태 유지
- backend-gcp-specialist: 현재 상태 유지

## 💡 권장사항

### 1. 즉시 개선 가능 항목

- filesystem 접근을 5개 에이전트로 제한
- sequential-thinking을 3개 에이전트로 제한
- context7을 6개 에이전트로 제한

### 2. 단계적 개선 항목

- 고빈도 에이전트의 MCP 의존도 점진적 감소
- 중복 기능 제거 및 역할 명확화
- 성능 모니터링 후 추가 최적화

### 3. 문서화 업데이트

- CLAUDE.md의 MCP 매핑 테이블 갱신
- 각 에이전트의 MCP 사용 근거 명시
- 사용 빈도 및 중요도 표시

## 📊 예상 효과

1. **성능 개선**: MCP 연결 수 40% 감소
2. **토큰 절약**: sequential-thinking 사용 70% 감소
3. **역할 명확화**: 에이전트 간 책임 경계 명확
4. **유지보수성**: 의존성 관리 단순화
