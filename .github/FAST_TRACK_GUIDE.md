# 🚀 Fast Track 배포 가이드

## 개요

개발 속도 향상을 위한 유연한 CI/CD 옵션들입니다. 급할 때는 검증을 스킵하고 즉시 배포 가능합니다.

## Fast Track 옵션

### 1. 완전 CI 스킵
```bash
git commit -m "fix: 긴급 수정 [skip ci]"
```
- GitHub Actions 완전 스킵
- Vercel 배포만 실행
- 가장 빠른 배포 (2-3분)

### 2. 빌드 체크 스킵
```bash
git commit -m "feat: 새 기능 추가 [build-skip]"
```
- TypeScript 체크만 실행
- 빌드 과정 스킵 (메모리 절약)
- 중간 속도 배포 (5-7분)

### 3. 표준 검증 (기본)
```bash
git commit -m "refactor: 코드 정리"
```
- TypeScript + ESLint (경고만) + 테스트
- 빌드 체크 포함
- 안정성과 속도의 균형 (8-10분)

## 검증 레벨별 특징

| 옵션 | TypeScript | ESLint | 테스트 | 빌드 | 시간 | 안전도 |
|------|------------|--------|--------|------|------|--------|
| `[skip ci]` | ❌ | ❌ | ❌ | ❌ | 🚀 2-3분 | ⚠️ 낮음 |
| `[build-skip]` | ✅ | ⚠️ 경고만 | ⚠️ 경고만 | ❌ | ⚡ 5-7분 | 🔶 중간 |
| 표준 | ✅ | ⚠️ 경고만 | ⚠️ 경고만 | ✅ | 🔄 8-10분 | ✅ 높음 |

## 배포 전략

### 🎯 Primary: Vercel 배포
- 실제 배포 플랫폼
- 환경 변수 완전 지원
- 즉시 반영

### 🔄 Secondary: GitHub Actions
- 품질 체크 (백그라운드)
- 배포 차단하지 않음
- 결과는 알림만

### 📊 Monitoring
- Vercel Analytics로 성능 모니터링
- GitHub Actions 결과는 참고용
- 실제 문제는 Vercel 로그 확인

## 권장 사용법

### 🚨 긴급 상황
```bash
# 프로덕션 버그 수정
git commit -m "hotfix: 로그인 버그 수정 [skip ci]"
git push origin main
```

### 🛠️ 일반 개발
```bash
# 새 기능 개발
git commit -m "feat: 대시보드 차트 추가 [build-skip]"
git push origin main
```

### 🔍 안정성 중시
```bash
# 중요한 리팩토링
git commit -m "refactor: 인증 시스템 개선"
git push origin main
```

## 에러 처리

### GitHub Actions 실패 시
- Vercel 배포는 계속 진행
- 백그라운드에서 품질 체크만
- 배포 차단하지 않음

### Vercel 배포 실패 시
- 환경 변수 확인
- TypeScript 에러 수정
- Mock 모드로 fallback

## 모니터링

### 배포 성공률 추적
- 현재: ~70% (환경 변수 이슈)
- 목표: ~95% (개선 후)

### 성능 지표
- 평균 배포 시간: 2-10분
- TypeScript 에러율: <5%
- 핫픽스 속도: <3분

## 주의사항

⚠️ **Fast Track 사용 시 주의점:**
- TypeScript 에러는 여전히 Vercel에서 차단
- 환경 변수 누락 시 Mock 모드로 동작
- 중요한 변경사항은 표준 검증 권장

✅ **안전 장치:**
- Vercel 자체 빌드 검증
- 환경 변수 안전 래퍼 함수
- Mock 모드 자동 fallback
- 실시간 에러 모니터링

---

💡 **핵심 철학**: "빠른 배포 > 완벽한 검증"

개발 속도를 최우선으로 하되, 실제 사용자에게 영향을 주지 않도록 안전 장치를 유지합니다.