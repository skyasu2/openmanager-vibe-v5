# Multi-AI MCP Server

**통합 AI 교차검증 시스템** - Codex, Gemini, Qwen을 단일 MCP 서버로 통합

---

## 📋 개요

Claude Code와 통합되어 3개 AI(Codex, Gemini, Qwen)의 응답을 병렬로 수집하고 합의점을 자동으로 분석하는 MCP 서버입니다.

### 핵심 특징

- ✅ **3-AI 교차검증**: Codex(실무) + Gemini(설계) + Qwen(성능) 통합 분석
- ✅ **자동 합의 탐지**: 2개 이상 AI가 동의하는 항목 자동 추출
- ✅ **충돌 감지**: AI 간 의견 차이 자동 식별
- ✅ **보안 강화**: Command Injection 방지, 입력 검증, 설정 외부화
- ✅ **성능 최적화**: 병렬 실행, 적응형 타임아웃, 메모리 누수 방지
- ✅ **100% 테스트 커버리지**: Vitest 기반 자동화 테스트

---

## 🚨 중요 공지 (2025-10-05)

**프로젝트 로컬 `.mcp.json`은 Claude Code에서 인식되지 않습니다!**

→ **[상세 설정 가이드](./SETUP-GUIDE.md)** 필독

**요약**:
- ✅ **글로벌 설정 필수**: `~/.claude/settings.json`에 추가
- ✅ **절대 경로 사용**: `/mnt/d/cursor/openmanager-vibe-v5/...`
- ✅ **Claude Code 재시작**: 설정 변경 후 필수

---

## 🚀 빠른 시작

### 1. 사전 요구사항

다음 AI CLI 도구들이 WSL 환경에 설치되어 있어야 합니다:

```bash
# 설치 확인
codex --version    # v0.44.0+
gemini --version   # v0.7.0+
qwen --version     # v0.0.14+
```

### 2. 설치

```bash
cd packages/multi-ai-mcp
npm install
npm run build
```

### 3. 환경 설정

```bash
# .env 파일 생성 (선택사항)
cp .env.example .env

# 필요시 작업 경로 설정
MULTI_AI_CWD=/your/project/path
```

### 4. Claude Code에 연결

`~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "multi-ai": {
      "command": "node",
      "args": ["/path/to/packages/multi-ai-mcp/dist/index.js"]
    }
  }
}
```

### 5. 사용 예시

Claude Code에서:

```
"이 코드를 3개 AI로 교차검증해줘"
```

---

## 🏗️ 아키텍처

### 시스템 구조

```
Claude (Claude Code)
  ↓
Multi-AI MCP Server (이 프로젝트)
  ├→ Codex CLI (실무 검증)
  ├→ Gemini CLI (아키텍처 분석)
  └→ Qwen CLI (성능 최적화)
  ↓
Synthesizer (합의 분석)
```

### 디렉토리 구조

```
packages/multi-ai-mcp/
├── src/
│   ├── ai-clients/      # AI CLI 클라이언트
│   │   ├── codex.ts     # Codex 통합
│   │   ├── gemini.ts    # Gemini 통합
│   │   └── qwen.ts      # Qwen 통합
│   ├── utils/           # 유틸리티
│   │   ├── timeout.ts   # 타임아웃 관리
│   │   └── validation.ts # 입력 검증
│   ├── config.ts        # 설정 관리
│   ├── synthesizer.ts   # 합의 분석
│   ├── types.ts         # TypeScript 타입
│   └── index.ts         # MCP 서버 진입점
├── tests/               # Vitest 테스트
│   ├── validation.test.ts
│   ├── synthesizer.test.ts
│   └── timeout.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md (이 파일)
```

---

## 🔧 설정

### 환경변수

`.env` 파일 또는 환경변수로 설정:

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `MULTI_AI_CWD` | AI CLI 실행 경로 | `process.cwd()` |
| `MULTI_AI_MAX_BUFFER` | CLI 출력 버퍼 크기 | `10485760` (10MB) |
| `MULTI_AI_CODEX_TIMEOUT_SIMPLE` | Codex 단순 쿼리 타임아웃 | `30000` (30초) |
| `MULTI_AI_CODEX_TIMEOUT_MEDIUM` | Codex 중간 쿼리 타임아웃 | `90000` (90초) |
| `MULTI_AI_CODEX_TIMEOUT_COMPLEX` | Codex 복잡 쿼리 타임아웃 | `120000` (120초) |
| `MULTI_AI_GEMINI_TIMEOUT` | Gemini 타임아웃 | `30000` (30초) |
| `MULTI_AI_QWEN_TIMEOUT_NORMAL` | Qwen 일반 모드 타임아웃 | `30000` (30초) |
| `MULTI_AI_QWEN_TIMEOUT_PLAN` | Qwen Plan 모드 타임아웃 | `60000` (60초) |

---

## 🛡️ 보안

### 구현된 보안 기능

1. **Command Injection 방지**
   - `exec` 대신 `execFile` 사용
   - 인자 배열로 전달 (shell 해석 방지)

2. **입력 검증**
   - 쿼리 길이 제한 (1000자)
   - 위험 문자 차단 (`$`, `` ` ``, `;`, `&`, `|`, null byte)

3. **설정 외부화**
   - 하드코딩 경로 제거
   - 환경변수 기반 설정

4. **메모리 누수 방지**
   - Timer 자동 정리 (`clearTimeout`)
   - Request-scoped 실행

---

## 🧪 테스트

### 테스트 실행

```bash
# 전체 테스트
npm test

# Watch 모드
npm run test:watch

# 커버리지
npm run test:coverage
```

### 테스트 구성

- **validation.test.ts**: 입력 검증 테스트
- **synthesizer.test.ts**: 합의 분석 테스트 (NaN 버그 검증 포함)
- **timeout.test.ts**: 타임아웃 및 메모리 누수 테스트

---

## 📊 성능

### 적응형 타임아웃

쿼리 복잡도에 따라 타임아웃 자동 조절:

- **단순** (< 50자): 30초
- **중간** (50-200자): 90초
- **복잡** (> 200자): 120초

### 재시도 메커니즘

타임아웃 시 자동 재시도 (최대 2회):

- 1차 재시도: 타임아웃 +50%
- 2차 재시도: 타임아웃 +100%

---

## 🔍 사용 가이드

### MCP 도구 사용

Claude Code에서 다음 명령어 사용 가능:

```typescript
// 3-AI 교차검증
mcp__multi_ai__queryAllAIs({
  query: "이 코드의 버그를 찾아주세요"
})

// 우선순위 기반 선택적 실행
mcp__multi_ai__queryWithPriority({
  query: "성능 최적화 방법",
  includeCodex: true,
  includeGemini: true,
  includeQwen: false
})

// 성능 통계 확인
mcp__multi_ai__getPerformanceStats()
```

### 응답 구조

```typescript
{
  query: string;
  timestamp: string;
  results: {
    codex?: AIResponse;
    gemini?: AIResponse;
    qwen?: AIResponse;
  };
  synthesis: {
    consensus: string[];      // 2+ AI 합의 항목
    conflicts: Conflict[];    // AI 간 의견 충돌
    recommendation: string;   // 최종 권장사항
  };
  performance: {
    totalTime: number;        // 총 소요 시간 (ms)
    successRate: number;      // 성공률 (0-1)
  };
}
```

---

## 🛠️ 개발

### 개발 모드

```bash
npm run dev  # TypeScript watch 모드
```

### 빌드

```bash
npm run build  # dist/ 폴더에 빌드
```

### 코드 품질

- **TypeScript strict 모드**: 타입 안전성 보장
- **ESM 모듈**: 최신 모듈 시스템
- **Vitest**: 빠른 테스트 실행
- **보안 검증**: Command Injection, 입력 검증

---

## 📝 라이센스

MIT License

---

## 🤝 기여

이슈 및 PR 환영합니다!

---

## 📚 관련 문서

- [Claude Code 공식 문서](https://docs.claude.com/en/docs/claude-code)
- [MCP 프로토콜 사양](https://modelcontextprotocol.io/)
- [프로젝트 CLAUDE.md](../../CLAUDE.md)

---

**Made with ❤️ by OpenManager VIBE Team**
