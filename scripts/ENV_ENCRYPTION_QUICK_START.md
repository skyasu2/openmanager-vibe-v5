# 🔐 환경 변수 암호화 빠른 시작 가이드

## 🎯 이 기능을 사용하는 이유

- **문제**: GitHub에 환경 변수가 노출되면 보안 경고 발생
- **해결**: 암호화하여 GitHub 자동 감지 방지
- **목적**: 다른 환경에서 쉽게 복원 가능

## ⚡ 빠른 시작 (3단계)

### 1️⃣ 환경 변수 암호화
```bash
# Node.js 방식 (권장 - 자동 비밀번호 생성)
node scripts/setup-env.js

# 또는 Shell 방식 (수동 비밀번호)
./scripts/secure_env.sh encrypt "mypassword" .env.local .env.encrypted
```

### 2️⃣ Git에 커밋
```bash
git add .env.encrypted
git commit -m "🔒 Add encrypted environment variables"
git push
```

### 3️⃣ 다른 환경에서 복원
```bash
# 저장소 클론 후
git clone <repo-url>
cd openmanager-vibe-v5

# 환경 변수 복원
node scripts/restore-env.js
# 비밀번호 입력 프롬프트가 나타남
```

## 📁 핵심 파일

| 파일 | 설명 | Git 포함 |
|------|------|----------|
| `.env.local` | 실제 환경 변수 | ❌ 절대 안됨 |
| `.env.encrypted` | 암호화된 버전 | ✅ 안전함 |
| `.env.example` | 템플릿 (값 없음) | ✅ 안전함 |

## ⚠️ 주의사항

1. **비밀번호는 별도로 안전하게 공유**
   - Slack DM, 1Password, 구두 전달 등
   - 절대 코드나 커밋에 포함 금지

2. **`.env.local`은 절대 커밋하지 말 것**
   - 이미 `.gitignore`에 포함됨
   - 실수로 커밋했다면 즉시 삭제

3. **포트폴리오용 보안 수준**
   - GitHub 자동 감지 방지가 목적
   - 완벽한 보안이 아님 (그래도 충분)

## 🆘 문제 발생 시

### "openssl: command not found"
```bash
# Ubuntu/WSL
sudo apt-get install openssl

# Mac
brew install openssl

# Windows
# Git Bash 사용 또는 OpenSSL 별도 설치
```

### "복호화 실패"
- 비밀번호 확인 (대소문자, 특수문자)
- 파일이 손상되지 않았는지 확인

### 더 자세한 정보
📚 [전체 문서 보기](../docs/env-encryption-guide.md)

---

💡 **한 줄 요약**: `.env.local`을 암호화 → `.env.encrypted`로 저장 → Git에 안전하게 공유