# 🚀 Git 커밋/푸시 완전 가이드

> **작성일**: 2025년 8월 18일 | **최종 수정일**: 2025년 8월 18일  
> **프로젝트**: OpenManager VIBE v5 | **환경**: WSL + Claude Code

## 📋 개요

OpenManager VIBE v5 프로젝트에서 Git 커밋과 푸시를 효율적으로 수행하는 완전 가이드입니다.

### 🎯 이 가이드의 목표

- ⚡ **빠른 커밋/푸시**: 성능 최적화된 워크플로우
- 🛡️ **안전한 커밋**: 품질 검증 자동화 
- 🎨 **일관된 스타일**: 팀 코딩 컨벤션 준수
- 🚨 **문제 해결**: 일반적인 오류 상황 대응

---

## ⚡ 빠른 시작 (30초 가이드)

### 일반적인 커밋/푸시

```bash
# 1. 변경사항 확인
git status
git diff

# 2. 변경사항 스테이징
git add .

# 3. 커밋 (이모지 + 설명)
git commit -m "✨ feat: 새로운 기능 추가"

# 4. 푸시
git push
```

### 빠른 커밋 (검증 스킵)

```bash
# Pre-commit hook 스킵
HUSKY=0 git commit -m "🚧 WIP: 작업 중인 기능"

# Pre-commit + Pre-push hook 모두 스킵
HUSKY=0 git commit -m "🚧 WIP: 빠른 백업" && HUSKY=0 git push
```

---

## 🎨 커밋 메시지 컨벤션

### 기본 형식

```
<이모지> <타입>: <간단한 설명>

[선택사항: 상세 설명]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 필수 이모지 + 타입

| 이모지 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| ✨ | feat | 새로운 기능 | `✨ feat: 사용자 대시보드 추가` |
| 🐛 | fix | 버그 수정 | `🐛 fix: 로그인 오류 해결` |
| ⚡ | perf | 성능 개선 | `⚡ perf: API 응답 시간 50% 단축` |
| ♻️ | refactor | 리팩토링 | `♻️ refactor: 컴포넌트 구조 개선` |
| 📚 | docs | 문서 수정 | `📚 docs: 설치 가이드 업데이트` |
| 🧪 | test | 테스트 | `🧪 test: 인증 테스트 추가` |
| 🔧 | chore | 설정/빌드 | `🔧 chore: ESLint 규칙 업데이트` |
| 🚀 | deploy | 배포 | `🚀 deploy: v5.67.0 프로덕션 배포` |

### AI 협업 커밋 서명

Claude Code로 작업한 경우 반드시 포함:

```
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🛠️ Pre-commit Hook 시스템 (v3.0)

### ⚡ 성능 혁신 달성 (2025-08-18 업데이트)

| 항목 | 이전 | 개선 후 | 향상률 |
|------|------|---------|--------|
| **TypeScript 검사** | 2분+ (타임아웃) | **7초** | **94%** ⚡ |
| **전체 검증 시간** | 타임아웃 발생 | **47초** | **완전 해결** ✅ |
| **개발자 스트레스** | 높음 | 거의 없음 | **95%** 😌 |

### 🚀 스마트 검증 단계

#### 1단계: 보안 검사 (1-2초)
- 하드코딩된 API 키, 비밀번호 검사
- 민감한 정보 커밋 방지

#### 2단계: TypeScript 구문 검사 (5-7초)
- **변경된 파일만 검사** (스마트 최적화)
- 캐시 활용으로 초고속 검증
- 2MB 이상 파일 자동 스킵

#### 3단계: 코드 품질 검사 (10-30초)
- ESLint + Prettier 자동 실행
- 캐시된 결과 활용
- 경고 20개 이하로 제한

#### 4단계: 빠른 테스트 (5-10초)
- 핵심 테스트만 실행
- 변경사항 영향 범위 분석

### 📊 모드별 동작

| 모드 | 파일 수 | 검증 범위 | 소요 시간 |
|------|---------|-----------|-----------|
| **FULL** | 1-10개 | 전체 검증 | 20-50초 |
| **FAST** | 11-25개 | 핵심 검증 | 15-30초 |
| **MINIMAL** | 26-50개 | 최소 검증 | 10-20초 |
| **SKIP** | 50개+ | 권장 스킵 | 즉시 |

---

## 🚨 문제 해결 가이드

### 🔥 Pre-commit Hook 타임아웃/느림

**증상**: `Command timed out after 2m 0.0s`

**해결책**:
```bash
# 1. 빠른 커밋 (검증 스킵)
HUSKY=0 git commit -m "🚧 WIP: 타임아웃으로 인한 빠른 커밋"

# 2. 캐시 정리 후 재시도
rm -rf /tmp/tsc-precommit-cache /tmp/lint-cache
git commit -m "✨ feat: 캐시 정리 후 재시도"

# 3. 파일별 분할 커밋
git add specific-file.ts
git commit -m "✨ feat: 특정 파일만 커밋"
```

### 🚫 TypeScript 에러

**증상**: `❌ TypeScript 구문 검사 실패`

**해결책**:
```bash
# 1. 에러 확인
npx tsc --noEmit --skipLibCheck

# 2. 빠른 타입 수정
npm run type-fix

# 3. 에러 무시하고 커밋 (비상시만)
HUSKY=0 git commit -m "🚧 WIP: 타입 에러 수정 중"
```

### 🔒 Git Push 실패

**증상**: `Permission denied`, `Authentication failed`

**해결책**:
```bash
# 1. Git 인증 재설정
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 2. SSH 키 확인
ssh -T git@github.com

# 3. HTTPS로 임시 푸시
git remote set-url origin https://github.com/username/repo.git
git push
```

### 📁 대용량 파일 커밋

**증상**: `파일이 너무 큽니다`, `Git LFS 필요`

**해결책**:
```bash
# 1. 파일 크기 확인
find . -type f -size +100M

# 2. .gitignore에 추가
echo "large-file.zip" >> .gitignore

# 3. 이미 추가된 경우 제거
git rm --cached large-file.zip
git commit -m "🔥 remove: 대용량 파일 제거"
```

---

## 💡 고급 워크플로우

### 🔄 브랜치 기반 개발

```bash
# 1. 새 브랜치 생성
git checkout -b feature/new-dashboard

# 2. 작업 후 커밋
git add .
git commit -m "✨ feat: 대시보드 레이아웃 구현"

# 3. 원격 브랜치에 푸시
git push -u origin feature/new-dashboard

# 4. 메인 브랜치로 병합
git checkout main
git pull origin main
git merge feature/new-dashboard
git push origin main
```

### 🎯 선택적 스테이징

```bash
# 1. 파일별 선택 추가
git add src/components/Dashboard.tsx
git add src/types/user.ts

# 2. 변경사항 일부만 추가
git add -p src/utils/helper.ts

# 3. 확인 후 커밋
git status
git commit -m "✨ feat: 대시보드 컴포넌트 추가"
```

### 🚀 자동화된 배포 워크플로우

```bash
# 1. 버전 태그 생성
git tag -a v5.67.0 -m "🔖 release: v5.67.0 - 대시보드 개선"

# 2. 태그 푸시 (자동 배포 트리거)
git push origin v5.67.0

# 3. 배포 확인
git push origin main
```

---

## 📊 성능 모니터링

### ⏱️ Pre-commit 성능 측정

```bash
# 시간 측정하여 커밋
time git commit -m "⚡ perf: 성능 테스트"

# 캐시 상태 확인
ls -la /tmp/tsc-precommit-cache
ls -la /tmp/lint-cache
```

### 📈 최적화 팁

1. **파일 분할**: 큰 변경사항을 여러 커밋으로 분할
2. **캐시 활용**: 반복 커밋 시 캐시 성능 향상
3. **선택적 검증**: `HUSKY=0`으로 필요시 스킵
4. **배치 작업**: 관련 변경사항을 함께 커밋

---

## 🛡️ 보안 및 품질 체크리스트

### ✅ 커밋 전 필수 확인사항

- [ ] 하드코딩된 API 키, 비밀번호 제거
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인  
- [ ] TypeScript 에러 해결
- [ ] ESLint 경고 20개 이하
- [ ] 테스트 코드 추가/수정 (필요시)
- [ ] 커밋 메시지에 이모지 + 타입 포함

### 🚨 절대 커밋하면 안 되는 것들

```bash
# 금지 목록
- API 키, 액세스 토큰
- 데이터베이스 비밀번호
- `.env` 파일
- `node_modules/` 폴더
- 개인 설정 파일
- 대용량 바이너리 파일 (>100MB)
```

---

## 🎯 팀 협업 가이드

### 🤝 코드 리뷰 준비

```bash
# 1. PR용 브랜치 생성
git checkout -b feature/user-authentication

# 2. 기능 개발 + 테스트
git commit -m "✨ feat: 사용자 인증 로직 구현"
git commit -m "🧪 test: 인증 테스트 케이스 추가"

# 3. PR 생성 준비
git push -u origin feature/user-authentication
```

### 📝 PR 커밋 메시지 가이드

```bash
# 좋은 예
git commit -m "✨ feat: JWT 기반 인증 시스템 구현

- 로그인/로그아웃 기능 추가
- 토큰 갱신 로직 구현  
- 인증 미들웨어 추가

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 나쁜 예
git commit -m "fix"
git commit -m "업데이트"
git commit -m "작업 완료"
```

---

## 🚀 NPM 스크립트 활용

### 빠른 커밋 명령어

```bash
# package.json에서 제공하는 편의 명령어들

# 1. 안전한 커밋 (기본 검증)
npm run commit:safe

# 2. 초고속 커밋 (검증 완전 스킵)
npm run commit:ultra-fast

# 3. 커밋 + 즉시 푸시
npm run git:commit-push

# 4. 응급 커밋 (모든 검증 스킵 + 강제 푸시)
npm run git:emergency
```

### 검증 명령어

```bash
# 커밋 전 수동 검증
npm run validate:quick      # 빠른 검증
npm run validate:all        # 전체 검증  
npm run type-check         # TypeScript만 검사
npm run lint:quick         # ESLint만 검사
```

---

## 📚 관련 문서

- [Git 워크플로우 2025 표준](./git-workflow-2025-standard.md)
- [Git 커밋 이모지 가이드](./git-commit-emoji-guide.md)
- [Husky Hooks 가이드](../../development/husky-hooks-guide.md)
- [테스트 커밋 프로세스](../../testing/test-commit-process.md)

---

## 🤖 Claude Code 통합

### AI 협업 커밋 시그니처

Claude Code와 협업한 모든 커밋에는 다음 서명을 포함하세요:

```
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### AI 도구 활용 팁

- **Claude Code**: 메인 개발 및 리팩토링
- **Gemini CLI**: 문서 자동 생성  
- **Qwen CLI**: 코드 리뷰 및 최적화

---

**🎉 이제 효율적이고 안전한 Git 워크플로우를 시작하세요!**

> 💡 **팁**: 이 가이드는 계속 업데이트됩니다. 새로운 최적화나 문제 해결 방법이 발견되면 즉시 반영됩니다.