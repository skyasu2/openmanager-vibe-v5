# WSL 환경에 최적화된 CLAUDE.md 생성 스크립트

Write-Host "📝 WSL 환경 최적화 CLAUDE.md 생성..." -ForegroundColor Green

$claudeMdContent = @"
# CLAUDE.md

**한국어로 대화하세요** | 모든 응답과 설명은 한국어로 작성해주세요 (기술적인 용어는 영어 허용)

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

```bash
# WSL에서 Claude Code 실행 (Windows에서)
.\claude-wsl-optimized.bat

# WSL 내부에서 개발
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# 개발 명령어 (WSL bash)
npm run dev              # localhost:3000
npm run build            # 프로덕션 빌드
npm run test:quick       # 빠른 테스트 (22ms)

# 검증
npm run validate:all     # 린트 + 타입 + 테스트
npm run git:status       # Git 상태 확인

# AI CLI 도구들 (WSL에서 실행)
claude --version         # Claude Code v1.0.81
gemini --version         # Google Gemini CLI v0.1.21
qwen --version           # Qwen CLI v0.0.6

# Windows에서 WSL AI 도구 실행
.\claude-wsl-optimized.bat /status
.\gemini-wsl.bat --help
.\qwen-wsl.bat --help
```

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
- **파일 시스템**: `/mnt/d/cursor/openmanager-vibe-v5` (Windows D: 드라이브)
- **네트워크**: localhost 공유 (포트 포워딩 자동)
- **실행 래퍼**: Windows에서 WSL AI 도구 직접 실행 가능

## 🤖 AI CLI 도구 통합 (WSL 환경)

### 설치된 AI CLI 도구들
| 도구 | 버전 | 용도 | 실행 방법 |
|------|------|------|----------|
| **Claude Code** | v1.0.81 | 메인 AI 개발 환경 | `.\claude-wsl-optimized.bat` |
| **Google Gemini CLI** | v0.1.21 | Google AI 통합, 대규모 분석 | `.\gemini-wsl.bat` |
| **Qwen CLI** | v0.0.6 | Alibaba AI, 병렬 개발 | `.\qwen-wsl.bat` |
| **OpenAI CLI** | 설치됨 | OpenAI SDK 도구 | `.\openai-wsl.bat` |

### 통합 실행
```bash
# 통합 AI CLI 실행기
.\ai-cli-wsl.bat claude --version
.\ai-cli-wsl.bat gemini --help
.\ai-cli-wsl.bat qwen --help
```

### WSL 내부에서 직접 실행
```bash
# WSL 접속
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# AI 도구들 직접 실행
claude /status
gemini -p "코드를 최적화해주세요"
qwen -p "이 함수를 설명해주세요"
```

## 🐧 WSL 환경 설정 및 문제 해결

### WSL AI CLI 도구 실행
WSL에서 모든 AI CLI 도구가 완벽하게 작동합니다:

```bash
# WSL 내부에서 직접 실행
wsl
claude --version        # Claude Code v1.0.81
gemini --version        # Google Gemini CLI v0.1.21
qwen --version          # Qwen CLI v0.0.6

# Windows에서 WSL 도구 실행
.\claude-wsl-optimized.bat /status
.\gemini-wsl.bat --help
.\qwen-wsl.bat --help
.\ai-cli-wsl.bat claude --version
```

### WSL 최적화 상태 확인
```bash
# WSL 메모리 및 리소스 확인
wsl -e bash -c "free -h"          # 메모리: 9.7GB 사용 가능
wsl -e bash -c "df -h /"          # 디스크: 1TB 사용 가능

# sudo 비밀번호 없이 사용 확인
wsl sudo whoami                   # root (비밀번호 입력 없음)

# AI 도구 설치 상태 확인
wsl npm list -g --depth=0 | grep -E "(claude|gemini|qwen)"
```

### 문제 해결
**WSL 연결 문제**:
```powershell
# WSL 재시작
wsl --shutdown
wsl

# WSL 상태 확인
wsl --status
```

**AI 도구 재설치**:
```bash
# WSL에서 AI 도구 재설치
wsl
sudo npm install -g @anthropic-ai/claude-code
sudo npm install -g @google/gemini-cli
sudo npm install -g @qwen-code/qwen-code
```

### 생성된 WSL 도구들
- **`claude-wsl-optimized.bat`**: 최적화된 Claude Code 실행
- **`gemini-wsl.bat`**: Google Gemini CLI 실행
- **`qwen-wsl.bat`**: Qwen CLI 실행
- **`ai-cli-wsl.bat`**: 통합 AI CLI 실행기

### Windows 레거시 스크립트
Windows 환경에서 사용되던 모든 스크립트들은 `scripts/windows-legacy/` 폴더로 이동되었습니다. 
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
```

### 2. 🧪 TDD (Test-Driven Development)
**Red → Green → Refactor** 사이클 준수

```typescript
// @tdd-red @created-date: 2025-01-14
it('should calculate total with tax', () => {
  expect(calculateTotalWithTax(100, 0.1)).toBe(110); // RED: 함수 미구현
});

// GREEN: 구현
const calculateTotalWithTax = (amount: number, tax: number) => amount * (1 + tax);

// REFACTOR: 개선
const calculateTotalWithTax = (amount: number, taxRate: number): number => {
  if (taxRate < 0) throw new Error('Tax rate cannot be negative');
  return amount * (1 + taxRate);
};
```

### 3. 📝 커밋 컨벤션 (이모지 필수)

| 타입 | 이모지 | 설명 | 예시 |
|------|--------|------|------|
| feat | ✨ | 새 기능 | `✨ feat: 사용자 인증 추가` |
| fix | 🐛 | 버그 수정 | `🐛 fix: 로그인 오류 해결` |
| refactor | ♻️ | 리팩토링 | `♻️ refactor: API 구조 개선` |
| test | 🧪 | 테스트 | `🧪 test: 인증 테스트 추가` |
| docs | 📚 | 문서 | `📚 docs: API 문서 업데이트` |
| perf | ⚡ | 성능 | `⚡ perf: 쿼리 최적화` |

## 📐 핵심 규칙

1. **TypeScript**: `any` 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **테스트**: 커버리지 70%+, TDD 적용
4. **문서**: 루트 파일 종류 제한 (JBGE 원칙)
   - **Core**: README.md, CHANGELOG.md, CHANGELOG-LEGACY.md
   - **AI Guides**: CLAUDE.md, GEMINI.md, QWEN.md
   - **기타 .md**: `/docs/` 디렉토리로 이동
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
- **AI CLI 도구**: 4개 모두 완벽 작동
- **sudo**: 비밀번호 없이 사용 가능

---

💡 **핵심 원칙**: Type-First + TDD + 이모지 커밋 + WSL AI 통합

📖 **상세 내용**: `/docs` 폴더 참조

🐧 **WSL 우선**: 모든 AI 개발 작업은 WSL에서 수행
"@

# CLAUDE.md 파일 생성
$claudeMdContent | Out-File -FilePath "CLAUDE.md" -Encoding UTF8 -Force

Write-Host "✅ WSL 환경 최적화 CLAUDE.md 생성 완료" -ForegroundColor Green
Write-Host "📊 주요 변경사항:" -ForegroundColor Yellow
Write-Host "  • Windows PowerShell → WSL 2 환경" -ForegroundColor White
Write-Host "  • AI CLI 도구 WSL 통합" -ForegroundColor White
Write-Host "  • Windows 레거시 스크립트 정리" -ForegroundColor White
Write-Host "  • WSL 최적화 설정 문서화" -ForegroundColor White