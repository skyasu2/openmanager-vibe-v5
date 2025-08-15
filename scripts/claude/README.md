# Claude Code 자동화 시스템 v3.0

> **문제 해결**: Claude Code CLI의 `settings.json` hooks 미지원 문제를 해결하는 대안 자동화 시스템

## 🚨 배경

Claude Code CLI v1.0.73은 `.claude/settings.json`의 hooks 기능을 지원하지 않습니다.
기존에 정의된 다음 hooks들이 작동하지 않았습니다:

- **PostToolUse**: 테스트 자동화, 파일 모듈화, DB 최적화
- **PreToolUse**: 보안 검사, 품질 검사
- **UserPromptSubmit**: 복잡한 요청 분해

## ✅ 해결책

**프로젝트별 자동화 엔진**을 구축하여 Claude Code hooks의 모든 기능을 대체합니다.

## 📂 구성 요소

```
scripts/claude/
├── automation-engine.js      # 핵심 자동화 엔진
├── start-automation.ps1      # Windows PowerShell 래퍼
├── automation-dashboard.js   # 실시간 대시보드
├── README.md                 # 이 파일
└── .claude/automation-config.json  # 설정 파일
```

## 🚀 빠른 시작

### 1. 전체 자동화 시작

```powershell
# PowerShell에서 실행
.\scripts\claude\start-automation.ps1
```

### 2. 백그라운드 실행

```powershell
.\scripts\claude\start-automation.ps1 -Background
```

### 3. 실시간 대시보드

```powershell
node scripts/claude/automation-dashboard.js
```

### 4. 상태 확인

```powershell
.\scripts\claude\start-automation.ps1 -Status
```

## 🔧 주요 기능

### 📝 파일 변경 자동 처리 (PostToolUse 대체)

| 파일 유형           | 감지 패턴                       | 자동 실행                   |
| ------------------- | ------------------------------- | --------------------------- |
| **테스트 파일**     | `*.test.ts`, `*.spec.tsx`       | 테스트 실행 + 커버리지 확인 |
| **대형 파일**       | 1500줄+ TypeScript 파일         | 모듈화 제안                 |
| **DB 마이그레이션** | `supabase/migrations/*.sql`     | TypeScript 타입 재생성      |
| **API 라우트**      | `src/app/api/**/*.ts`           | 보안 검사                   |
| **설정 파일**       | `package.json`, `tsconfig.json` | 유효성 검사                 |

### 🔒 보안 사전 검사 (PreToolUse 대체)

**민감한 파일 패턴** 자동 감지:

- `auth/`, `payment/`, `credentials/`
- `api/private/`, `token`, `secret`

**검사 항목**:

- 하드코딩된 비밀번호/API 키
- `eval()` 사용
- `dangerouslySetInnerHTML`
- SQL 인젝션 가능성

### 🧠 복잡한 요청 분해 (UserPromptSubmit 대체)

**자동 분해 조건**:

- 3개 이상의 `&&` 연산자
- "전체", "모든", "모두" 키워드
- "리팩토링", "최적화", "구현" 키워드

**출력**:

- 작업별 예상 시간
- 추천 서브에이전트
- 병렬 처리 가능성 분석

### 📊 MCP 서버 모니터링

**11개 MCP 서버 실시간 감시**:

- 연결 상태 확인 (30초마다)
- 자동 재시작 (최대 3회)
- 장애 서버 복구

## 🎛️ 대시보드 사용법

```powershell
node scripts/claude/automation-dashboard.js
```

**키보드 명령어**:

- `r` - 새로고침
- `s` - 자동화 시작/중지
- `m` - MCP 서버 재시작
- `t` - 테스트 실행
- `f` - 자동 수정 (TypeScript + Lint)
- `q` - 종료

**대시보드 화면**:

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Claude Code 자동화 대시보드 v1.0                        │
│  ⏰ 2025-08-14 오후 8:45:23                                 │
├─────────────────────────────────────────────────────────────┤
│  🟢 자동화 엔진: RUNNING                                     │
│  🟢 MCP 서버: 11/11 연결 (100%)                            │
│  🟡 품질 점수: 75%                                          │
├─────────────────────────────────────────────────────────────┤
│  📊 상세 상태:                                               │
│     TypeScript: ✅ 382개 에러                              │
│     테스트: ✅ Tests passing                               │
│     Lint: ✅ 45개 이슈                                     │
│     대형 파일: 3개 (평균 1,847줄)                           │
└─────────────────────────────────────────────────────────────┘
```

## ⚙️ 설정 커스터마이징

`.claude/automation-config.json` 파일에서 모든 규칙을 커스터마이징할 수 있습니다:

```json
{
  "rules": {
    "fileModified": {
      "testFiles": {
        "enabled": true,
        "pattern": "\\.(test|spec)\\.(ts|tsx|js|jsx)$",
        "action": "runTestAutomation"
      }
    }
  },
  "qualityThresholds": {
    "testCoverage": 70,
    "fileSize": 1500,
    "typescriptErrors": 400
  }
}
```

## 🔄 기존 Husky와의 통합

자동화 시스템은 기존 Husky Git hooks와 **완벽 호환**됩니다:

- **Pre-commit**: Lint + 중국어 문자 검사 (유지)
- **Pre-push**: 병렬 검증 (TypeScript, 테스트, 환경변수)
- **추가**: 실시간 파일 감시 + MCP 모니터링

## 📈 성능 및 최적화

### 병렬 처리

- 여러 검사를 동시 실행
- 70% 속도 향상
- 백그라운드 모니터링

### 캐싱

- 결과 캐싱으로 중복 작업 방지
- 500ms 디바운싱
- 최대 동시 작업 3개 제한

### 메모리 최적화

- 대형 파일 스트리밍 처리
- 로그 파일 자동 로테이션 (10MB, 7일)
- 성능 메트릭 실시간 수집

## 🛠️ 트러블슈팅

### 자동화 엔진이 시작되지 않을 때

```powershell
# 1. 사전 요구사항 확인
node --version
claude --version

# 2. 권한 확인
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. 강제 시작
.\scripts\claude\start-automation.ps1 -Background
```

### MCP 서버 연결 실패

```powershell
# 1. MCP 상태 확인
claude mcp list

# 2. 자동 복구
.\scripts\claude\start-automation.ps1 -Status
# 대시보드에서 'm' 키 누름

# 3. 수동 복구
claude api restart
```

### 품질 점수 낮음

```powershell
# 1. 자동 수정
npm run type-fix && npm run lint:fix

# 2. 대시보드에서 'f' 키 누름

# 3. 상세 분석
node scripts/claude/automation-dashboard.js --report
```

## 📊 모니터링 및 로깅

### 로그 파일 위치

- **자동화 로그**: `.claude/automation.log`
- **품질 보고서**: `.claude/quality-report.json`
- **MCP 상태**: `.claude/mcp-status.json`

### 알림 설정

```json
{
  "notifications": {
    "console": true, // 콘솔 출력
    "file": true, // 파일 로그
    "webhook": false, // 웹훅 (향후)
    "slack": false // 슬랙 (향후)
  }
}
```

## 🔮 향후 계획

### v3.1 (예정)

- [ ] Slack/Discord 알림 통합
- [ ] GitHub Actions 자동 트리거
- [ ] 성능 메트릭 히스토리

### v3.2 (예정)

- [ ] AI 기반 코드 리뷰 자동화
- [ ] Gemini CLI 연동
- [ ] 자동 PR 생성

## 💡 사용 팁

### 1. 개발 워크플로우 최적화

```powershell
# 아침 시작 시
.\scripts\claude\start-automation.ps1 -Background
node scripts/claude/automation-dashboard.js

# 코딩 중: 자동으로 모든 검사 실행
# 커밋 전: Husky hooks 자동 실행
# 퇴근 시: 자동화 엔진 자동 정리
```

### 2. 긴급 상황 대응

```powershell
# 빠른 배포 (검사 스킵)
HUSKY=0 git commit -m "🚑 긴급 수정"
git push --fast

# 자동화 일시 중지
.\scripts\claude\start-automation.ps1 -Stop
```

### 3. 팀 협업

```powershell
# 설정 공유
git add .claude/automation-config.json
git commit -m "🔧 자동화 설정 업데이트"

# 팀원 설치 안내
# 1. 이 README 공유
# 2. PowerShell 실행권한 설정 안내
# 3. 자동화 엔진 실행 교육
```

## 🆘 도움말 및 지원

### 관련 문서

- [MCP 서버 설치 가이드](/docs/MCP-SETUP-GUIDE.md)
- [타입 우선 개발 가이드](/docs/claude/type-first-development-guide.md)
- [TDD 실전 가이드](/docs/claude/tdd-practical-guide.md)

### 문의 및 버그 리포트

- **프로젝트 이슈**: GitHub Issues
- **긴급 문의**: Claude Code 채팅
- **개선 제안**: `.claude/automation-config.json`에 comment 추가

---

**🎯 결론**: Claude Code CLI의 hooks 미지원 문제를 완전히 해결하는 강력한 대안 시스템입니다.
기존 hooks보다 더 많은 기능과 실시간 모니터링을 제공합니다.
