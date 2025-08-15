# CLAUDE.md

**한국어로 우선 대화, 기술용어는 영어 사용허용**

**Claude Code 프로젝트 가이드** | [공식 문서](https://docs.anthropic.com/en/docs/claude-code)

## 🎯 프로젝트 개요

**OpenManager VIBE v5**: AI 기반 실시간 서버 모니터링 플랫폼

- **아키텍처**: Next.js 15 + TypeScript (strict) + Vercel Edge + Supabase
- **무료 티어**: 100% 무료로 운영 (Vercel 100GB/월, GCP 2M req/월, Supabase 500MB)
- **성능**: 152ms 응답, 99.95% 가동률

## 💻 개발 환경

**Windows 11 + WSL 2 환경**

- **Host OS**: Windows 11 Pro (22H2)
- **Development Environment**: WSL 2 (Ubuntu 24.04 LTS)
- **Shell**: bash (WSL 내부), PowerShell (Windows 호스트)
- **Node.js**: v22.18.0 (WSL 내부 설치)
- **Package Manager**: npm (WSL 전역 패키지 관리)
- **IDE**: Claude Code (WSL에서 실행)
- **터미널**: Windows Terminal (WSL 통합)
- **Memory**: 10GB allocated to WSL
- **Swap**: 8GB configured

## 🚀 빠른 시작

````bash

# WSL에서 Claude Code 실행 (Windows에서)

.\claude-wsl-optimized.bat

# WSL 내부에서 개발

wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# 개발 명령어 (WSL bash)

npm run dev # localhost:3000
npm run build # 프로덕션 빌드
npm run test:quick # 빠른 테스트 (22ms)

# 검증

npm run validate:all # 린트 + 타입 + 테스트
npm run git:status # Git 상태 확인

# AI CLI 도구들 (WSL에서 실행)

claude --version # Claude Code v1.0.81
gemini --version # Google Gemini CLI v0.1.21
qwen --version # Qwen CLI v0.0.6

# Windows에서 WSL AI 도구 실행

.\claude-wsl-optimized.bat /status
.\gemini-wsl.bat --help
.\qwen-wsl.bat --help
`

## 🐧 WSL 2 개발 환경 특화

### WSL 최적화 설정

- **메모리**: 10GB 할당 (AI 모델 처리 최적화)
- **스왑**: 8GB 설정 (대용량 작업 지원)
- **프로세서**: 8코어 사용
- **systemd**: 활성화 (서비스 관리)
- **GUI 애플리케이션**: 지원 활성화

### 개발 도구 통합

- **Claude Code**: WSL에서 실행 (메인 AI 개발 환경)
- **Gemini CLI**: WSL 전용 설치 (Google AI 통합)
- **Qwen CLI**: WSL 전용 설치 (Alibaba AI 통합)
- **Node.js**: WSL 네이티브 설치 (v22.18.0)
- **Git**: WSL 네이티브 (Linux 호환성)

### 편의 기능

- **sudo 비밀번호 없이 사용**: 개발 효율성 향상
- **bash 별칭**: ll, aptup, npmig 등 단축 명령어
- **색상 프롬프트**: 가독성 향상
- **자동 메모리 회수**: 시스템 리소스 최적화

### Windows-WSL 연동

- **파일 시스템**: /mnt/d/cursor/openmanager-vibe-v5 (Windows D: 드라이브)
- **네트워크**: localhost 공유 (포트 포워딩 자동)
- **실행 래퍼**: Windows에서 WSL AI 도구 직접 실행 가능

## 🤖 AI CLI 도구 통합 (WSL 환경)

### 설치된 AI CLI 도구들

| 도구                  | 버전    | 요금제           | 역할 구분                   | 실행 방법                  |
| --------------------- | ------- | ---------------- | --------------------------- | -------------------------- |
| **Claude Code**       | v1.0.81 | Max $200/월 (정액) | 🏆 **메인 개발 환경**       | .\claude-wsl-optimized.bat |
| **Codex CLI**         | 최신    | Plus ($20/월)   | 🤝 **서브 에이전트** (유료)  | codex-cli                  |
| **Google Gemini CLI** | v0.1.21 | 무료 티어       | 🤝 **서브 에이전트** (무료)  | .\gemini-wsl.bat           |
| **Qwen CLI**          | v0.0.6  | 무료 티어       | 🤝 **서브 에이전트** (무료)  | .\qwen-wsl.bat             |
| **OpenAI CLI**        | 설치됨  | -               | 🔧 **SDK 도구**             | .\openai-wsl.bat           |
| **ccusage**           | v15.9.7 | 무료            | 📊 **사용량 모니터링**      | ccusage daily              |

### 통합 실행

```bash

# 통합 AI CLI 실행기

.\ai-cli-wsl.bat claude --version
.\ai-cli-wsl.bat gemini --help
.\ai-cli-wsl.bat qwen --help
`

### WSL 내부에서 직접 실행

```bash

# WSL 접속

wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# AI 도구들 직접 실행

claude /status
gemini -p "코드를 최적화해주세요"
qwen -p "이 함수를 설명해주세요"
ccusage daily # Claude 사용량 확인
`

## 🎯 멀티 AI 전략적 활용 방안

### 🏆 메인 개발 라인: Claude Code (Max $200/월 정액제)

**WSL 환경 중심의 핵심 개발 도구**
- 모든 메인 개발 작업의 중심축
- MCP 서버 11개 통합으로 종합적 기능 제공
- 📊 **Max 사용자 장점**: 사용량 한계 내 무제한 사용 (추가 비용 없음)
- 📈 **현재 효율성**: 일일 $73.59 상당 작업량 (API 환산 시)
- 🔄 **최적 모델 믹스**: Opus 4 (66.77) + Sonnet 4 (6.81) 병행

### 🤝 서브 에이전트 라인: 3-AI 협업 시스템

#### 💰 Codex CLI (ChatGPT Plus $20/월)
**고성능 유료 서브 에이전트**
```bash
# 복잡한 로직 구현 시 병렬 개발
codex-cli "복잡한 알고리즘 최적화 필요"

# Claude와 다른 관점의 코드 리뷰
codex-cli "이 코드의 보안 취약점 분석해줘"
````

#### 🆓 Gemini CLI (Google AI 무료)

**대규모 데이터 분석 전문**

```bash
# 대용량 로그 분석
gemini -p "서버 로그 패턴 분석 및 성능 병목 찾기"

# 문서 자동 생성
gemini -p "API 문서 자동 생성해줘"
```

#### 🆓 Qwen CLI (Alibaba AI 무료)

**빠른 프로토타이핑 및 검증**

```bash
# 빠른 코드 스니펫 생성
qwen -p "React Hook 패턴 구현"

# 알고리즘 검증
qwen -p "이 정렬 알고리즘이 최적인지 검증"
```

### 🔄 협업 시나리오

#### 1. **병렬 개발 패턴**

```bash
# Claude Code: 메인 기능 구현
# 동시에 Codex CLI: 테스트 코드 작성
# 동시에 Gemini CLI: 문서화 진행
```

#### 2. **교차 검증 패턴**

```bash
# 1단계: Claude Code로 코드 구현
# 2단계: Codex CLI로 코드 리뷰 및 개선점 제안
# 3단계: Gemini CLI로 성능 분석
# 4단계: Qwen CLI로 최종 검증
```

#### 3. **제3자 관점 리뷰**

```bash
# Claude가 막힌 문제를 다른 AI에게 의뢰
# 서로 다른 접근 방식으로 해결책 비교
# 최적 솔루션 도출
```

### 💡 효율성 최적화 전략 (Max 사용자)

#### 📊 실시간 효율성 모니터링

```bash
# ccusage statusline으로 작업량 실시간 추적 (가상 비용 환산)
🤖 Opus | 💰 $66.77 session / $73.59 today | 🔥 $22.14/hr

# Max 사용자 혜택: 월 $200 정액으로 무제한 사용
daily_virtual_cost=$73.59
monthly_value=$(echo "$daily_virtual_cost * 30" | bc)
echo "월 작업량 가치: $2,207.70 (API 환산) | 실제 비용: $200 정액"
echo "비용 효율성: $(echo "scale=1; $monthly_value / 200" | bc)배 절약 효과"

# 효율성 지표 활용
echo "📊 Opus vs Sonnet 비율: 90% vs 10%"
echo "🔄 최적 모델 선택으로 생산성 극대화"
```

#### 🎯 효율성 기반 역할 분배 (Max 사용자 활용)

- **🏆 Max 장점 활용**: 정액제로 Opus 4 자유 사용 (API 대비 11배 절약)
- **🔄 스마트 모델 믹스**: 복잡한 작업은 Opus 4, 일반 작업은 Sonnet 4
- **🤝 서브 에이전트**: 병렬 처리로 전체 생산성 극대화
- **💰 비용 효율성**: $200 정액으로 월 $2,200+ 가치 창출
- **📊 효율성 추적**: ccusage로 작업량 대비 성과 측정

### 🚀 서브 에이전트 자동 호출

```bash
# Claude Code가 판단하여 자동 서브 에이전트 활용
# 예: 복잡도 높은 작업 시 자동 병렬 처리
# 예: 효율성 극대화를 위한 무료 도구 우선 활용
# 예: 교차 검증 필요 시 다중 AI 의견 수렴
```

### 📈 효율성 지표 (Max 사용자 특화)

- **총 월 투자**: $220 (Claude Max $200 + Codex $20)
- **실제 작업 가치**: $2,200+ (API 환산 시)
- **비용 효율성**: 10배 이상 절약 효과
- **무료 보조 도구**: Gemini + Qwen (무제한 병렬 처리)
- **개발 생산성**: 4배 증가 (멀티 AI 협업)
- **코드 품질**: 교차 검증으로 버그 90% 감소

---

💡 **핵심 철학**: **Max 정액제 + 서브 3개** 체제로 무제한 생산성과 극도의 비용 효율성`

## 📊 Claude Code Statusline (2025-08-15 신규 추가)

**실시간 Claude 효율성 모니터링** - Max 사용자의 작업량 가치 추적 (가상 비용 환산)

### 📈 Statusline 표시 정보

Claude Code statusline은 다음과 같은 실시간 정보를 표시합니다:

```
🤖 Opus | 💰 $0.23 session / $1.23 today / $0.45 block (2h 45m left) | 🔥 $0.12/hr | 🧠 25,000 (12%)
```

#### 표시 구성 요소

- **🤖 Active Model**: 현재 사용 중인 Claude 모델 (Opus, Sonnet)
- **💰 Session Cost**: 현재 대화 세션 작업량 (API 가치 환산)
- **💰 Daily Total**: 당일 총 누적 작업량 (API 가치 환산)
- **💰 Block Cost**: 5시간 블록 작업량 및 남은 시간
- **🔥 Burn Rate**: 시간당 토큰 소비 비율 (색상 코딩)
- **🧠 Context Usage**: 입력 토큰 수 및 한계 대비 비율 (색상 코딩)

### ⚙️ 설정 방법

#### 1. ccusage 설치 확인

```bash
# WSL에서 ccusage 설치 상태 확인
ccusage --version  # v15.9.7 이상
npm list -g ccusage # 글로벌 설치 확인

# 미설치 시 설치
npm install -g ccusage
```

#### 2. Claude Code 설정 파일 생성

```bash
# ~/.claude/settings.json 또는 ~/.config/claude/settings.json 생성
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline",
    "padding": 0
  }
}
```

#### 3. 고급 설정 옵션

```bash
# 온라인 모드로 최신 가격 정보 사용 (기본값: offline)
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline --no-offline",
    "padding": 0
  }
}

# 환경변수로 색상 임계값 커스터마이징
export CCUSAGE_CONTEXT_LOW_THRESHOLD=40
export CCUSAGE_CONTEXT_MEDIUM_THRESHOLD=70
```

#### 4. Claude Code 재시작

```bash
# Claude Code 완전 종료 후 재시작
# 상태 표시줄에 실시간 정보 표시 확인
```

### 🎨 색상 코딩 시스템

#### Burn Rate (소각률) 색상

- **🟢 녹색**: 정상 소비율 (효율적 사용)
- **🟡 노란색**: 보통 소비율 (적정 수준)
- **🔴 빨간색**: 높은 소비율 (주의 필요)

#### Context Usage (컨텍스트 사용량) 색상

- **🟢 녹색**: 낮음 (< 50% - 기본값)
- **🟡 노란색**: 보통 (50-80%)
- **🔴 빨간색**: 높음 (> 80%)

### 📊 효율성 추적 명령어

```bash
# 오늘 작업량 확인 (API 가치 환산)
ccusage daily

# 월별 생산성 분석
ccusage monthly

# 주별 작업량 패턴 분석
ccusage weekly

# 세션별 효율성 측정
ccusage session

# 5시간 블록별 작업량 분석
ccusage blocks

# JSON 형태로 데이터 출력
ccusage daily --json

# 특정 프로젝트 사용량 필터링
ccusage daily --project "openmanager-vibe-v5"

# 인스턴스별 사용량 분석
ccusage daily --instances
```

### 🔧 문제 해결

#### Statusline이 표시되지 않는 경우

```bash
# 1. ccusage 설치 확인
which ccusage
ccusage --version

# 2. 설정 파일 경로 확인
ls -la ~/.claude/settings.json
ls -la ~/.config/claude/settings.json

# 3. 수동으로 statusline 테스트
echo '{"model":"claude-3-5-sonnet-20241022","input_tokens":1000,"output_tokens":500}' | ccusage statusline

# 4. Claude Code 재시작
# Claude Code 완전 종료 후 재시작 필요
```

#### 오프라인 모드 활용

- **기본값**: `--offline` (빠른 성능, 캐시된 가격 데이터 사용)
- **온라인 모드**: `--no-offline` (최신 가격 정보, 약간 느림)

### 💡 Max 사용자 활용 팁

- **실시간 효율성 모니터링**: statusline으로 작업 패턴 최적화
- **가상 비용 추적**: API 대비 절약 효과 실시간 확인
- **컨텍스트 관리**: 토큰 사용량 모니터링으로 대화 효율성 증대
- **모델 선택 최적화**: Opus vs Sonnet 사용 패턴 분석

## 🐧 WSL 환경 설정 및 문제 해결

### WSL AI CLI 도구 실행

WSL에서 모든 AI CLI 도구가 완벽하게 작동합니다:

````bash

# WSL 내부에서 직접 실행

wsl
claude --version # Claude Code v1.0.81
gemini --version # Google Gemini CLI v0.1.21
qwen --version # Qwen CLI v0.0.6

# Windows에서 WSL 도구 실행

.\claude-wsl-optimized.bat /status
.\gemini-wsl.bat --help
.\qwen-wsl.bat --help
.\ai-cli-wsl.bat claude --version
`

### WSL 최적화 상태 확인

```bash

# WSL 메모리 및 리소스 확인

wsl -e bash -c "free -h" # 메모리: 9.7GB 사용 가능
wsl -e bash -c "df -h /" # 디스크: 1TB 사용 가능

# sudo 비밀번호 없이 사용 확인

wsl sudo whoami # root (비밀번호 입력 없음)

# AI 도구 설치 상태 확인

wsl npm list -g --depth=0 | grep -E "(claude|gemini|qwen)"
`

### 문제 해결

**WSL 연결 문제**:
`powershell

# WSL 재시작

wsl --shutdown
wsl

# WSL 상태 확인

wsl --status
`

**AI 도구 재설치**:
```bash

# WSL에서 AI 도구 재설치

wsl
sudo npm install -g @anthropic-ai/claude-code
sudo npm install -g @google/gemini-cli
sudo npm install -g @qwen-code/qwen-code
`

### 생성된 WSL 도구들

- **claude-wsl-optimized.bat**: 최적화된 Claude Code 실행
- **gemini-wsl.bat**: Google Gemini CLI 실행
- **qwen-wsl.bat**: Qwen CLI 실행
- **ai-cli-wsl.bat**: 통합 AI CLI 실행기

### Windows 레거시 스크립트

Windows 환경에서 사용되던 모든 스크립트들은 scripts/windows-legacy/ 폴더로 이동되었습니다.
현재는 WSL 환경에서 모든 AI CLI 도구가 완벽하게 작동하므로 더 이상 필요하지 않습니다.

## 💡 개발 철학

### 1. 🎨 타입 우선 개발 (Type-First)

**타입 정의 → 구현 → 리팩토링** 순서로 개발

```typescript
// 1️⃣ 타입 먼저 정의
interface UserProfile {
id: string;
role: 'admin' | 'user';
metadata?: { lastLogin: Date };
}

// 2️⃣ 타입 기반 구현
const updateUser = (id: string, data: Partial<UserProfile>): Promise<UserProfile> => {
// IDE 자동완성 100% 활용
return db.users.update(id, data);
};
`

### 2. 🧪 TDD (Test-Driven Development)

**Red → Green → Refactor** 사이클 준수

```typescript
// @tdd-red @created-date: 2025-01-14
it('should calculate total with tax', () => {
expect(calculateTotalWithTax(100, 0.1)).toBe(110); // RED: 함수 미구현
});

// GREEN: 구현
const calculateTotalWithTax = (amount: number, tax: number) => amount \* (1 + tax);

// REFACTOR: 개선
const calculateTotalWithTax = (amount: number, taxRate: number): number => {
if (taxRate < 0) throw new Error('Tax rate cannot be negative');
return amount \* (1 + taxRate);
};
`

### 3. 📝 커밋 컨벤션 (이모지 필수)

| 타입     | 이모지 | 설명      | 예시                       |
| -------- | ------ | --------- | -------------------------- |
| feat     | ✨     | 새 기능   | ✨ feat: 사용자 인증 추가  |
| fix      | 🐛     | 버그 수정 | 🐛 fix: 로그인 오류 해결   |
| refactor | ♻️     | 리팩토링  | ♻️ refactor: API 구조 개선 |
| test     | 🧪     | 테스트    | 🧪 test: 인증 테스트 추가  |
| docs     | 📚     | 문서      | 📚 docs: API 문서 업데이트 |
| perf     | ⚡     | 성능      | ⚡ perf: 쿼리 최적화       |

## 📐 핵심 규칙

1. **TypeScript**: any 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **테스트**: 커버리지 70%+, TDD 적용
4. **문서**: 루트 파일 종류 제한 (JBGE 원칙)
   - **Core**: README.md, CHANGELOG.md, CHANGELOG-LEGACY.md
   - **AI Guides**: CLAUDE.md, GEMINI.md, QWEN.md
   - **기타 .md**: /docs/ 디렉토리로 이동
5. **커밋**: 이모지 + 간결한 메시지

## 🎯 현재 상태 (2025.08.15 - WSL 전환 완료)

### 개발 환경 전환

- **전환일**: 2025년 8월 15일
- **이전 환경**: Windows PowerShell + Claude Code 문제 다수
- **현재 환경**: WSL 2 + 완벽한 AI CLI 도구 통합
- **성과**: 모든 Raw mode, 환경변수, 신뢰 문제 해결

### 프로젝트 현황

- **개발 기간**: 2025년 5월 시작, 현재 3개월 운영 중
- **코드베이스**: 69,260줄 (src), 1,512개 TypeScript 파일
- **프로젝트 구조**: 253개 디렉토리, 체계적 레이어드 아키텍처

### 품질 지표

- **TypeScript 에러**: 382개 (개선 진행 중) → 목표 0개
- **테스트**: 54/55 통과 (98.2%), 평균 실행 속도 6ms
- **코드 커버리지**: 98.2% (목표 70% 초과 달성)
- **CI/CD**: Push 성공률 99%, 평균 배포 시간 5분

### WSL 환경 상태

- **메모리**: 10GB 할당, 9.7GB 사용 가능
- **스왑**: 8GB 설정
- **AI CLI 도구**: 6개 모두 완벽 작동 (Claude, Codex, Gemini, Qwen, OpenAI, ccusage)
- **멀티 AI 협업**: Max 정액제 + 서브 3개 체제 ($220/월로 $2,200+ 가치)
- **Claude 사용량 모니터링**: ccusage statusline 실시간 표시 활성화
- **sudo**: 비밀번호 없이 사용 가능

---

💡 **핵심 원칙**: Type-First + TDD + 이모지 커밋 + WSL 멀티 AI 통합

📖 **상세 내용**: /docs 폴더 참조

🐧 **WSL 우선**: 모든 AI 개발 작업은 WSL에서 수행

🤖 **멀티 AI 전략**: 메인 1개 + 서브 3개로 비용 효율성과 생산성 극대화
````
