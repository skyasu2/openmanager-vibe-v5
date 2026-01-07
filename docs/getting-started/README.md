# Getting Started

> OpenManager VIBE v5 시작 가이드

---

## Quick Links

| 문서 | 설명 |
|------|------|
| [Quick Start](./quick-start.md) | 5분 만에 시작하기 |
| [Development Guide](../DEVELOPMENT.md) | 개발 환경 설정 |

---

## 필수 요구사항

- Node.js 22.x (LTS)
- npm 10.x
- Git 2.40+
- WSL 2 (Windows)

---

## 빠른 시작

```bash
# 1. 저장소 클론
git clone https://github.com/skyasu2/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local

# 4. 개발 서버 시작
npm run dev
```

---

## Next Steps

- [테스트 전략](../guides/testing/test-strategy.md)
- [AI 도구 가이드](../guides/ai/common/ai-standards.md)
- [아키텍처 문서](../reference/architecture/)
