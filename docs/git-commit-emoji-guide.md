# Git 커밋 이모지 가이드

## 🎯 커밋 이모지 컨벤션

### 주요 이모지

| 이모지 | 타입     | 설명                          | 예시                                    |
| ------ | -------- | ----------------------------- | --------------------------------------- |
| ✨     | feat     | 새로운 기능 추가              | `✨ feat: 사용자 인증 기능 추가`        |
| 🐛     | fix      | 버그 수정                     | `🐛 fix: 로그인 실패 오류 수정`         |
| 📝     | docs     | 문서 수정                     | `📝 docs: README 업데이트`              |
| 🎨     | style    | 코드 포맷팅, 세미콜론 누락 등 | `🎨 style: 코드 포맷팅 정리`            |
| ♻️     | refactor | 코드 리팩토링                 | `♻️ refactor: 서비스 로직 개선`         |
| ⚡     | perf     | 성능 개선                     | `⚡ perf: 쿼리 최적화로 응답 속도 개선` |
| ✅     | test     | 테스트 추가/수정              | `✅ test: 유닛 테스트 추가`             |
| 🔧     | chore    | 빌드, 패키지 매니저 설정 등   | `🔧 chore: ESLint 규칙 업데이트`        |
| 🚀     | deploy   | 배포 관련                     | `🚀 deploy: 프로덕션 배포 v1.2.0`       |

### 추가 이모지

| 이모지 | 사용 시기           | 예시                                     |
| ------ | ------------------- | ---------------------------------------- |
| 🔥     | 코드/파일 삭제      | `🔥 remove: 사용하지 않는 컴포넌트 제거` |
| 🚑     | 긴급 핫픽스         | `🚑 hotfix: 크리티컬 버그 긴급 수정`     |
| 💄     | UI/스타일 개선      | `💄 ui: 버튼 디자인 개선`                |
| 🎉     | 프로젝트 시작       | `🎉 init: 프로젝트 초기 설정`            |
| 🔒     | 보안 이슈 수정      | `🔒 security: API 키 노출 문제 해결`     |
| 🔖     | 릴리즈/버전 태그    | `🔖 release: v2.0.0`                     |
| 🌐     | 국제화/번역         | `🌐 i18n: 한국어 번역 추가`              |
| ⬆️     | 의존성 업그레이드   | `⬆️ deps: React 18로 업그레이드`         |
| ⬇️     | 의존성 다운그레이드 | `⬇️ deps: Node.js 버전 다운그레이드`     |
| 📦     | 패키지 관련         | `📦 package: 새 패키지 추가`             |
| 🔀     | 브랜치 머지         | `🔀 merge: feature/auth 브랜치 머지`     |
| 💡     | 주석 추가/수정      | `💡 comment: 복잡한 로직에 설명 추가`    |
| 🍱     | 에셋 추가/수정      | `🍱 assets: 새 아이콘 추가`              |
| ♿     | 접근성 개선         | `♿ a11y: 스크린 리더 지원 개선`         |
| 🚧     | 작업 진행 중        | `🚧 wip: 결제 기능 구현 중`              |

## 📋 사용 예시

### Claude Code에서 자동 적용

```bash
# 커밋 메시지 생성 시 이모지 자동 포함
git commit -m "$(cat <<'EOF'
🐛 fix: pre-push 훅 테스트 타임아웃 문제 해결

- 실행 시간 64초 → 0.048초로 99.9% 개선
- Vitest 오버헤드 제거하여 성능 최적화

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 프로젝트 최근 커밋 예시 (이모지 적용)

```bash
# 기존
fix: pre-push 훅 테스트 타임아웃 문제 해결

# 이모지 적용
🐛 fix: pre-push 훅 테스트 타임아웃 문제 해결

# 기존
docs: CHANGELOG.md 업데이트

# 이모지 적용
📝 docs: CHANGELOG.md 업데이트

# 기존
refactor: agent-coordinator로 재설계

# 이모지 적용
♻️ refactor: agent-coordinator로 재설계
```

## 🎯 OpenManager VIBE v5 프로젝트 특화 이모지

| 이모지 | 용도              | 예시                                          |
| ------ | ----------------- | --------------------------------------------- |
| 🤖     | AI/ML 관련        | `🤖 feat: AI 엔진 최적화`                     |
| 📊     | 모니터링/대시보드 | `📊 feat: 실시간 메트릭 차트 추가`            |
| 🔌     | MCP 서버 관련     | `🔌 fix: MCP 서버 연결 안정성 개선`           |
| 🎯     | 성능 목표 달성    | `🎯 perf: 응답시간 152ms 달성`                |
| 💰     | 무료 티어 최적화  | `💰 optimize: Vercel 무료 티어 사용량 최적화` |
| 🔴     | Redis 관련        | `🔴 feat: Upstash Redis 캐싱 구현`            |
| 🟢     | Supabase 관련     | `🟢 fix: Supabase RLS 정책 수정`              |

## 🛠️ Git Alias 설정 (선택사항)

```bash
# ~/.gitconfig에 추가
[alias]
    # 이모지 커밋 단축 명령어
    cfeat = "!git commit -m '✨ feat: '"
    cfix = "!git commit -m '🐛 fix: '"
    cdocs = "!git commit -m '📝 docs: '"
    cstyle = "!git commit -m '🎨 style: '"
    crefactor = "!git commit -m '♻️ refactor: '"
    cperf = "!git commit -m '⚡ perf: '"
    ctest = "!git commit -m '✅ test: '"
    cchore = "!git commit -m '🔧 chore: '"

# 사용 예시
git cfeat "새로운 AI 기능 추가"
# 결과: ✨ feat: 새로운 AI 기능 추가
```

## 📌 팁

1. **일관성 유지**: 프로젝트 전체에서 동일한 이모지 컨벤션 사용
2. **간결함**: 이모지는 1개만 사용 (복잡한 커밋은 본문에서 설명)
3. **의미 명확성**: 이모지가 커밋 타입을 명확히 나타내도록 선택
4. **팀 합의**: 팀원들과 이모지 컨벤션 공유 및 합의

## 🔄 자동화 스크립트

```typescript
// scripts/commit-with-emoji.js
const commitTypes = {
  feat: '✨',
  fix: '🐛',
  docs: '📝',
  style: '🎨',
  refactor: '♻️',
  perf: '⚡',
  test: '✅',
  chore: '🔧',
  deploy: '🚀',
};

// 사용법은 추후 구현 예정
```

---

**참고**: VSCode의 Gitmoji 확장 프로그램을 설치하면 GUI에서 쉽게 이모지를 선택할 수 있습니다.
