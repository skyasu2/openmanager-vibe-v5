# 🚀 Gemini 개발 도구 v5.0 완전 가이드

## 📋 목차

1. [개요](#개요)
2. [설치 및 설정](#설치-및-설정)
3. [기본 사용법](#기본-사용법)
4. [고급 기능](#고급-기능)
5. [성능 최적화](#성능-최적화)
6. [문제 해결](#문제-해결)
7. [마이그레이션 가이드](#마이그레이션-가이드)

## 개요

Gemini 개발 도구 v5.0은 기존 MCP 브릿지를 완전히 대체하는 고성능 직접 실행 도구입니다.

⚠️ **중요**: MCP 브릿지(gemini-cli-bridge)는 이제 개발/디버깅 전용입니다. 일반 사용 시 반드시 v5.0 직접 실행 도구를 사용하세요.

### 🎯 주요 특징

- **70% 성능 향상**: MCP stdio 오버헤드 제거
- **5분 캐싱 시스템**: 반복 질문 즉시 응답
- **Rate Limiting**: API 호출 제한으로 안정성 향상
- **배치 처리**: 여러 프롬프트 동시 실행
- **Git 통합**: diff 자동 분석 및 리뷰
- **에러 재시도**: 네트워크 오류 시 자동 재시도

### 🆚 기존 MCP 브릿지와 비교

| 특징      | MCP 브릿지 v4.0 (개발 전용) | 개발 도구 v5.0 (권장) |
| --------- | --------------------------- | --------------------- |
| 용도      | 개발/디버깅 전용            | 프로덕션 사용 권장    |
| 성능      | stdio 통신 지연             | 직접 실행 (70% 향상)  |
| 캐싱      | 없음                        | 5분 TTL 캐싱          |
| 배치 처리 | 미지원                      | 지원                  |
| 에러 처리 | 단순                        | 자동 재시도           |
| 사용법    | MCP 함수 호출               | CLI/npm 스크립트      |

## 설치 및 설정

### 1. 기본 요구사항

```bash
# Node.js 22+ 필요
node --version  # v22.15.1+

# Gemini CLI 설치 확인
gemini --version
```

### 2. 도구 설치

```bash
# 이미 프로젝트에 포함됨
ls tools/gemini-dev-tools.js  # 메인 도구
ls tools/g                    # Unix/Linux 래퍼
ls tools/g.ps1                # PowerShell 래퍼
```

### 3. 권한 설정

```bash
# Unix/Linux 환경
chmod +x tools/g

# PowerShell 환경 (필요시)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 기본 사용법

### 🎯 빠른 시작

```bash
# 🔥 가장 빠른 방법
./tools/g "TypeScript 에러 해결법"

# 📦 npm 스크립트로
npm run gemini:chat "TypeScript 에러 해결법"

# 💻 PowerShell에서
.\tools\g.ps1 "TypeScript 에러 해결법"
```

### 📋 주요 명령어

#### 1. 빠른 채팅

```bash
# 기본 채팅
./tools/g "React hooks 사용법"

# 긴 프롬프트 (따옴표 필수)
./tools/g "이 에러를 해결하는 방법을 3가지로 설명해주세요: TypeError: Cannot read property 'map' of undefined"
```

#### 2. 파일 분석

```bash
# 파일 분석 (기본 질문)
./tools/g file src/app/page.tsx

# 파일 분석 (커스텀 질문)
./tools/g file src/app/page.tsx "성능 최적화 방법"
npm run gemini:analyze src/app/page.tsx "보안 취약점 검사"
```

#### 3. Git 변경사항 리뷰

```bash
# 기본 리뷰
./tools/g diff
npm run gemini:diff

# 특정 관점에서 리뷰
./tools/g diff "SOLID 원칙 관점에서"
npm run gemini:diff "성능 최적화 관점에서"
```

#### 4. 상태 관리

```bash
# 사용량 확인
./tools/g stats
npm run gemini:stats

# 헬스 체크
./tools/g health
npm run gemini:health

# 컨텍스트 초기화
./tools/g clear

# 메모리 관리 (대화 압축 대체)
# Gemini CLI에서 /compress 명령이 제거됨
# 대신 /clear 또는 /memory 사용 권장
```

## 🎯 시스템 명령 (v5.1 신기능)

### 자체 구현 시스템 명령

Gemini CLI의 인터랙티브 명령이 TTY 환경에서만 작동하는 한계를 극복하기 위해 자체 시스템 명령을 구현했습니다.

#### 1. 사용량 통계 (`stats`)

```bash
./tools/g stats

# 출력 예시:
# 📊 **Gemini 사용량 통계**
#
# 🗓️ 오늘 (2025-07-18)
# - 요청 횟수: 15회
# - 토큰 사용량: 3,250 토큰
# - 남은 요청: 985회
#
# 📈 이번 달 총계
# - 총 요청: 250회
# - 총 토큰: 52,100 토큰
```

#### 2. 메모리 관리 (`memory`)

```bash
# 메모리 목록 보기
./tools/g memory list

# 새 정보 저장
./tools/g memory add "프로젝트는 Next.js 15를 사용합니다"
./tools/g memory add "주요 AI 엔진은 Google Generative AI입니다"

# 특정 메모리 제거
./tools/g memory remove 2

# 전체 메모리 초기화
./tools/g memory clear
```

#### 3. 컨텍스트 초기화 (`clear`)

```bash
./tools/g clear

# 출력:
# ✅ 컨텍스트가 초기화되었습니다.
#
# 🧹 초기화된 항목:
# - 대화 기록
# - 임시 컨텍스트
# - 캐시된 응답
```

### 데이터 저장 위치

시스템 명령의 데이터는 다음 위치에 저장됩니다:

- **Linux/Mac**: `~/.gemini-dev-tools/`
- **Windows**: `%USERPROFILE%\.gemini-dev-tools\`

저장되는 파일:

- `usage.json` - 사용량 통계
- `memory.json` - 저장된 메모리
- `context.json` - 컨텍스트 정보

## 고급 기능

### 🔄 배치 처리

```javascript
// tools/gemini-dev-tools.js 직접 사용
import GeminiDevTools from './tools/gemini-dev-tools.js';

const tool = new GeminiDevTools();

// 여러 프롬프트 배치 실행
const results = await tool.batchProcess([
  'TypeScript 에러 해결법',
  'React hooks 최적화',
  'Next.js 성능 튜닝',
]);

results.forEach(result => {
  console.log(`질문: ${result.prompt}`);
  console.log(`답변: ${result.result}`);
  console.log(`성공: ${result.success}`);
});
```

### 🎯 프로그래밍 방식 사용

```javascript
import GeminiDevTools from './tools/gemini-dev-tools.js';

const tool = new GeminiDevTools({
  timeout: 45000, // 45초 타임아웃
  debug: true, // 디버그 모드
});

// 빠른 채팅
const response = await tool.quickChat('React 최적화 방법', {
  model: 'gemini-2.5-pro',
  yolo: true,
});

// 파일 분석
const analysis = await tool.analyzeFile('src/app/page.tsx', '성능 검사');

// Git diff 분석
const review = await tool.analyzeGitDiff('보안 관점에서 리뷰');
```

### 🎨 커스텀 설정

```javascript
// 환경 변수로 설정
export GEMINI_DEBUG=true        # 디버그 모드
export GEMINI_TIMEOUT=60000     # 60초 타임아웃

// 또는 코드에서 설정
const tool = new GeminiDevTools({
  timeout: 60000,
  debug: process.env.NODE_ENV === 'development'
});
```

## 성능 최적화

### 💾 캐싱 시스템

```bash
# 캐시 위치
.cache/gemini/

# 캐시 확인
ls .cache/gemini/

# 캐시 정리 (자동으로 5분 후 만료)
rm -rf .cache/gemini/
```

### ⚡ 성능 팁

1. **읽기 전용 작업**: 자동 캐싱 (5분)
2. **Rate Limiting**: 1초 간격으로 API 호출
3. **배치 처리**: 여러 질문을 한 번에 처리
4. **에러 재시도**: 네트워크 오류 시 자동 재시도

### 📊 성능 비교

```bash
# 성능 테스트
time ./tools/g "간단한 질문"           # ~2초
time npm run gemini:chat "간단한 질문"  # ~3초

# 캐시 히트시
time ./tools/g "간단한 질문"           # ~0.1초 (캐시)
```

## 문제 해결

### 🔧 일반적인 문제

#### 1. Gemini CLI 인식 안됨

```bash
# 해결법
npm install -g @google-ai/generativelanguage
# 또는
gemini auth login
```

#### 2. 권한 오류 (PowerShell)

```powershell
# 해결법
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 3. 캐시 문제

```bash
# 캐시 정리
rm -rf .cache/gemini/

# 캐시 비활성화
./tools/g --no-cache "질문"
```

#### 4. 타임아웃 오류

```bash
# 타임아웃 증가
export GEMINI_TIMEOUT=60000
```

### 🩺 진단 도구

```bash
# 헬스 체크
npm run gemini:health

# 버전 확인
npm run gemini:version

# 디버그 모드
export GEMINI_DEBUG=true
./tools/g "테스트 질문"
```

## 마이그레이션 가이드

### 🔄 MCP 브릿지에서 v5.0으로

⚠️ **중요**: MCP 브릿지는 이제 개발/디버깅 전용입니다. 프로덕션 사용을 위해 v5.0으로 마이그레이션하세요.

#### 기존 MCP 사용법 (개발 전용)

```typescript
// ⚠️ 개발/디버깅 전용 - 프로덕션 사용 금지
mcp__gemini -
  cli -
  bridge__gemini_chat({
    prompt: '디버깅 메시지',
    model: 'gemini-2.5-pro',
  });
```

#### v5.0 사용법 (권장)

```bash
# ✅ 프로덕션 권장 방식
./tools/g "질문"
npm run gemini:chat "질문"
```

### 📝 마이그레이션 체크리스트

- [ ] 기존 MCP 브릿지 프로덕션 사용 중단
- [ ] MCP 브릿지는 개발/테스트 환경에서만 사용
- [ ] v5.0 도구 테스트: `npm run gemini:health`
- [ ] 기존 스크립트를 v5.0 방식으로 업데이트
- [ ] 팀원들에게 새 사용법 공유
- [ ] 캐시 디렉토리 `.cache/gemini/` 추가 (.gitignore에 포함)

### 🎯 권장 워크플로우

1. **개발 중**: `./tools/g "빠른 질문"`
2. **코드 리뷰**: `./tools/g diff`
3. **파일 분석**: `./tools/g file 파일경로`
4. **사용량 확인**: `./tools/g stats`

## 📚 추가 자료

- [Gemini CLI 공식 문서](https://ai.google.dev/gemini-api/docs/cli)
- [프로젝트 CLAUDE.md](../CLAUDE.md)
- [MCP 완전 가이드](./mcp-complete-guide.md)

---

**v5.0 업데이트 완료** - 2025년 7월 15일 (KST)
더 빠르고 효율적인 Gemini 개발 도구를 만나보세요! 🚀
