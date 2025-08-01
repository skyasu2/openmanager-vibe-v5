# npm cache-max 경고 수정 보고서

**작성일**: 2025-08-01
**작성자**: Claude Code

## 🔍 문제 분석

### 증상

```
npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
```

모든 npm 명령어 실행 시 위 경고 메시지가 반복적으로 출력됨

### 원인

- `.npmrc` 파일에 `cache-max=86400000` 설정이 포함되어 있음
- npm v7 이상에서 `cache-max` 옵션이 deprecated됨
- 현재 npm 버전: 10.9.2

### 영향

- 기능적 영향은 없으나 모든 npm 명령어에서 경고 출력
- CI/CD 로그 가독성 저하
- 개발자 경험(DX) 저하

## ✅ 해결 방법

### 1. 기존 설정 분석

```ini
# 기존 .npmrc (문제 부분)
prefer-offline=true    # 오프라인 우선 정책 (유지)
cache-max=86400000     # 24시간 캐시 (제거 필요)
```

### 2. 개선된 설정

```ini
# 캐시 최적화
prefer-offline=true

# 네트워크 안정성 개선 (추가)
fetch-retries=3
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000
```

### 변경 사항

1. **제거**: `cache-max=86400000` - deprecated 옵션 제거
2. **유지**: `prefer-offline=true` - 동일한 캐시 활용 효과
3. **추가**: 네트워크 재시도 설정으로 안정성 향상

## 📊 개선 효과

### 즉각적 효과

- ✅ npm 경고 메시지 완전 제거
- ✅ CI/CD 로그 클린
- ✅ 개발자 경험 개선

### 성능 영향

- 변화 없음 (`prefer-offline`이 동일한 역할 수행)
- 네트워크 불안정 시 재시도로 인한 안정성 향상

## 🔧 추가 최적화 옵션

### 고려할 수 있는 추가 설정

```ini
# 레지스트리 최적화
registry=https://registry.npmjs.org/

# 패키지 설치 속도 향상
install-strategy=hoisted

# 진행 표시 비활성화 (CI/CD용)
progress=false
```

## 📝 npm 캐시 정책 변화

### npm v6 이전

- `cache-max`: 캐시 유효 시간 설정
- `cache-min`: 최소 캐시 시간 설정

### npm v7 이후

- `prefer-offline`: 캐시 우선 사용
- `prefer-online`: 항상 최신 버전 확인
- 캐시 관리가 자동화되어 시간 기반 설정 불필요

## 🎯 권장사항

1. **개발 환경**: `prefer-offline=true` 유지 (빠른 설치)
2. **CI/CD**: `prefer-online=true` 고려 (항상 최신)
3. **모니터링**: 정기적으로 deprecated 옵션 확인

## 📚 참고 자료

- [npm config documentation](https://docs.npmjs.com/cli/v10/using-npm/config)
- [npm v7 breaking changes](https://github.com/npm/cli/blob/latest/changelogs/CHANGELOG-7.md)
