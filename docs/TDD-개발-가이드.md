# TDD 개발 가이드 - 푸시 예외 처리

> **현재 한국시간: 2025-07-01 18:24:43 (KST)**  
> **OpenManager Vibe v5.44.4 - TDD 지원 업데이트**

## 🎯 개요

Test-Driven Development(TDD) 방식으로 개발할 때, 의도적으로 실패하는 테스트(Red 단계)로 인해 git push가 차단되는 문제를 해결하는 방법을 제시합니다.

## 🚨 문제 상황

```bash
# TDD Red 단계에서 푸시 시도
git push origin main
# ❌ pre-push 훅이 실패 테스트로 인해 푸시 차단
```

## ✅ 해결 방법

### **방법 1: TDD 모드 환경변수 사용 (권장)**

```bash
# TDD 모드로 푸시
TDD_MODE=true git push origin main

# 또는 git alias 사용
git push-tdd
```

### **방법 2: npm 스크립트 사용**

```bash
# TDD 안전 모드 푸시
npm run push:tdd

# 강제 푸시 (긴급 시)
npm run push:force
```

### **방법 3: 검증 우회**

```bash
# pre-push 훅 완전 우회
git push origin main --no-verify
```

## 🧪 TDD 단계별 사용법

### **Red 단계 (테스트 실패)**

```bash
# 의도적 실패 테스트와 함께 푸시
TDD_MODE=true git push origin main
```

### **Green 단계 (테스트 통과)**

```bash
# 정상 푸시 (모든 검증 통과)
git push origin main
```

### **Refactor 단계 (리팩토링)**

```bash
# 정상 푸시 (모든 검증 통과)
git push origin main
```

## 🔧 설정된 스크립트

### **검증 스크립트**

- `validate:all` - 전체 검증 (기본)
- `validate:tdd` - TDD 모드 검증 (실패 허용)
- `validate:tdd:with-docs` - TDD 모드 + 문서 검증

### **테스트 스크립트**

- `test:unit` - 전체 단위 테스트
- `test:tdd-safe` - refactoring 테스트 제외

### **푸시 스크립트**

- `push:tdd` - TDD 모드 푸시
- `push:force` - 강제 푸시

## 🎛️ Git Alias

```bash
# 설정된 alias 확인
git config --get-regexp alias

# TDD 모드 푸시
git push-tdd

# 강제 푸시 (비상시)
git push-force
```

## 📋 커밋 메시지 가이드

TDD 단계별 커밋 메시지 형식:

```bash
# Red 단계
git commit -m "test: 새 기능 테스트 추가 (RED) - 2025-07-01 18:24 KST"

# Green 단계
git commit -m "feat: 새 기능 구현 (GREEN) - 2025-07-01 18:24 KST"

# Refactor 단계
git commit -m "refactor: 코드 개선 (REFACTOR) - 2025-07-01 18:24 KST"
```

## 🔍 문제 해결

### **pre-push 훅이 작동하지 않는 경우**

```bash
# 훅 권한 확인 및 설정
chmod +x .git/hooks/pre-push
```

### **TDD_MODE가 인식되지 않는 경우**

```bash
# Windows Git Bash에서
TDD_MODE=true git push origin main

# PowerShell에서
$env:TDD_MODE="true"; git push origin main
```

### **긴급 푸시가 필요한 경우**

```bash
# 모든 검증 우회
git push origin main --no-verify --force
```

## ⚠️ 주의사항

1. **TDD 모드는 개발 중에만 사용**
2. **프로덕션 배포 전 반드시 모든 테스트 통과 확인**
3. **커밋 메시지에 TDD 단계 명시 권장**
4. **팀원과 TDD 단계 공유**

## 📊 현재 테스트 상태 확인

```bash
# 테스트 상태 확인
npm test | grep -E "(failed|passed)"

# TDD 안전 테스트 실행
npm run test:tdd-safe
```

---

**마지막 업데이트**: 2025-07-01 18:24:43 (KST)  
**버전**: OpenManager Vibe v5.44.4
