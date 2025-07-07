# TypeScript 메모리 관리 가이드

## 🎯 개요

대규모 프로젝트에서 TypeScript 엄격화로 인한 메모리 문제 해결 가이드

## 🔍 메모리 문제 진단

### 증상

- Cursor IDE에서 "장이 예기치 않게 종료되었습니다" 오류
- TypeScript 언어 서버 응답 없음
- 빌드 시 OOM 에러 (코드: -536870904)

### 원인

1. **엄격한 TypeScript 설정**: 모든 파일에 대한 세밀한 타입 체크
2. **대규모 프로젝트**: 100+ 패키지, 복잡한 AI 기능
3. **메모리 제한**: Node.js 기본 메모리 제한 (1.4GB)

## ⚖️ 균형잡힌 TypeScript 설정

### 권장 설정 (메모리 최적화)

```json
{
  "compilerOptions": {
    // 🟢 유지해야 할 중요한 설정
    "strict": true,
    "strictNullChecks": true,
    "skipLibCheck": true,
    
    // 🟡 상황에 따라 조절 가능한 설정
    "noImplicitAny": false,           // 개발 속도 vs 타입 안전성
    "strictFunctionTypes": false,     // 메모리 절약
    "noUncheckedIndexedAccess": false, // 성능 최적화
    
    // 🔴 대규모 프로젝트에서 비활성화 권장
    "exactOptionalPropertyTypes": false,
    "noImplicitOverride": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

### 단계별 엄격화 전략

#### 1단계: 메모리 안정화 (현재)

```json
{
  "strict": true,
  "strictNullChecks": true,
  "noImplicitAny": false
}
```

#### 2단계: 점진적 엄격화 (프로젝트 안정화 후)

```json
{
  "strict": true,
  "strictNullChecks": true,
  "noImplicitAny": true,
  "strictFunctionTypes": false
}
```

#### 3단계: 완전 엄격화 (메모리 충분 시)

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictFunctionTypes": true,
  "noUncheckedIndexedAccess": true
}
```

## 🛠️ 메모리 관리 도구

### 즉시 사용 가능한 명령어

```bash
# 메모리 정리
npm run memory:cleanup

# 메모리 사용량 확인
npm run memory:check

# 메모리 최적화된 개발 서버
npm run dev  # 이미 NODE_OPTIONS가 적용됨
```

### 메모리 모니터링

```bash
# TypeScript 서버 메모리 사용량 확인
npx tsc --showConfig
```

## 🎮 IDE 최적화

### Cursor/VSCode 설정

```json
{
  "typescript.tsserver.maxTsServerMemory": 8192,
  "typescript.disableAutomaticTypeAcquisition": true,
  "typescript.validate.enable": false,
  "typescript.preferences.includePackageJsonAutoImports": "off"
}
```

### 파일 감시 최적화

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/dist/**": true,
    "**/.cache/**": true
  }
}
```

## 📊 성능 벤치마크

### 메모리 사용량 비교

| 설정 수준 | 메모리 사용량 | 빌드 시간 | 타입 안전성 |
|-----------|---------------|-----------|-------------|
| 최소 엄격 | 2-3GB | 빠름 | 중간 |
| 균형 (현재) | 4-5GB | 보통 | 높음 |
| 최대 엄격 | 8-10GB | 느림 | 최고 |

## 🚨 문제 해결

### OOM 에러 재발 시

1. `npm run memory:cleanup`
2. Cursor IDE 재시작
3. 터미널 재시작
4. 필요 시 더 많은 메모리 할당:

   ```bash
   export NODE_OPTIONS="--max-old-space-size=12288"
   ```

### TypeScript 에러 대량 발생 시

1. `npx tsc --noEmit --skipLibCheck`로 핵심 에러만 확인
2. 단계별로 엄격화 설정 조정
3. 메모리 사용량 모니터링

## 💡 모범 사례

### 개발 단계별 전략

1. **초기 개발**: 메모리 최적화 우선
2. **안정화**: 점진적 타입 강화
3. **배포 준비**: 완전 타입 안전성

### 팀 개발 시 고려사항

- 팀원 PC 사양 고려
- CI/CD 파이프라인 메모리 설정
- 코드 리뷰 시 메모리 영향 검토

## 🔄 지속적 최적화

### 정기 점검 항목

- [ ] 메모리 사용량 모니터링
- [ ] TypeScript 설정 점진적 조정
- [ ] 불필요한 패키지 정리
- [ ] 캐시 정리

### 자동화 스크립트

```bash
# 주간 메모리 최적화
npm run memory:cleanup
npm run type-check
```

---

*이 가이드는 `openmanager-vibe-v5` 프로젝트의 메모리 부족 문제 해결 과정에서 정리된 내용입니다.*
