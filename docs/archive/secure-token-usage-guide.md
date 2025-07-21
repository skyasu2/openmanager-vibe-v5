# 🔐 보안 토큰 관리 가이드

## 개요

민감한 API 키와 토큰을 암호화하여 안전하게 저장하고 관리하는 시스템입니다.
AES-256-GCM 암호화와 PBKDF2 100,000회 반복으로 강력한 보안을 제공합니다.

## 🚀 빠른 시작

### 1. GitHub 토큰 추가

```bash
# GitHub 토큰 추가
npm run secure:add GITHUB_TOKEN

# 마스터 비밀번호 입력 (화면에 표시되지 않음)
# GitHub 토큰 입력 (화면에 표시되지 않음)
```

### 2. MCP 설정에 적용

```bash
# MCP 설정 파일에 토큰 자동 적용
npm run secure:mcp-update

# 마스터 비밀번호 입력
```

### 3. Claude Code 시작

```bash
# 토큰을 환경변수로 로드
npm run mcp:secure-load

# 생성된 스크립트 실행
source .secure-tokens-export.sh

# Claude Code 시작
claude
```

## 📋 명령어 상세

### 토큰 추가

```bash
npm run secure:add TOKEN_NAME
# 예: npm run secure:add GITHUB_TOKEN
# 예: npm run secure:add BRAVE_API_KEY
```

### 토큰 조회

```bash
npm run secure:get TOKEN_NAME
# 예: npm run secure:get GITHUB_TOKEN
```

### 토큰 목록

```bash
npm run secure:list
```

### 토큰 삭제

```bash
npm run secure:token remove TOKEN_NAME
```

### MCP 설정 업데이트

```bash
npm run secure:mcp-update
```

## 🔒 보안 기능

1. **강력한 암호화**
   - AES-256-GCM (인증된 암호화)
   - PBKDF2 100,000회 반복
   - 개별 Salt와 IV 사용

2. **파일 권한**
   - 암호화된 파일: 600 (소유자만 읽기/쓰기)
   - 자동 백업 생성

3. **메모리 보안**
   - 복호화된 값은 메모리에만 존재
   - 프로세스 종료 시 자동 삭제

## ⚠️ 주의사항

1. **마스터 비밀번호**
   - 강력한 비밀번호 사용 권장
   - 비밀번호 분실 시 복구 불가능

2. **백업**
   - `.secure-tokens.json` 파일 백업 권장
   - 마스터 비밀번호와 별도 보관

3. **Git 제외**
   - `.secure-tokens.json` 자동 제외
   - `.secure-tokens-export.sh` 자동 제외

## 🔧 문제 해결

### 토큰 로드 실패

```bash
# 파일 존재 확인
ls -la .secure-tokens.json

# 권한 확인
chmod 600 .secure-tokens.json
```

### MCP 서버 연결 실패

```bash
# MCP 상태 확인
/mcp

# 토큰 재적용
npm run secure:mcp-update
```

### 환경변수 확인

```bash
# 로드된 환경변수 확인
echo $GITHUB_TOKEN
echo $BRAVE_API_KEY
```

## 📝 예시: 전체 워크플로우

```bash
# 1. GitHub 토큰 추가
npm run secure:add GITHUB_TOKEN
# 마스터 비밀번호: ********
# GITHUB_TOKEN 값: [YOUR_GITHUB_TOKEN_HERE]

# 2. Brave API 키 추가
npm run secure:add BRAVE_API_KEY
# 마스터 비밀번호: ********
# BRAVE_API_KEY 값: BSAxxxxxxxxxx

# 3. 저장된 토큰 확인
npm run secure:list
# 📋 저장된 토큰 목록:
#   - GITHUB_TOKEN
#   - BRAVE_API_KEY

# 4. MCP 설정에 적용
npm run secure:mcp-update
# ✅ GitHub 토큰 업데이트됨
# ✅ Brave API 키 업데이트됨

# 5. Claude Code 시작 전 토큰 로드
npm run mcp:secure-load
source .secure-tokens-export.sh

# 6. Claude Code 시작
claude

# 7. MCP 상태 확인
/mcp
# 모든 서버가 ✅ connected 상태여야 함
```

## 🌟 팁

1. **일괄 처리**

   ```bash
   # 여러 토큰을 한 번에 추가
   npm run secure:add GITHUB_TOKEN && \
   npm run secure:add BRAVE_API_KEY && \
   npm run secure:add SUPABASE_KEY
   ```

2. **별칭 설정**

   ```bash
   # ~/.bashrc 또는 ~/.zshrc에 추가
   alias mcp-load="npm run mcp:secure-load && source .secure-tokens-export.sh"
   ```

3. **자동화 스크립트**
   ```bash
   # start-claude.sh 생성
   #!/bin/bash
   npm run mcp:secure-load
   source .secure-tokens-export.sh
   claude
   ```

---

이 시스템을 사용하면 API 키와 토큰을 안전하게 관리하면서도 편리하게 사용할 수 있습니다.
