# ESLint 결과 파일 최적화 가이드

## 문제 상황
ESLint 결과 파일(`eslint-results.json`)이 1.4MB로 너무 커서 읽을 수 없는 문제가 발생했습니다. 이는 ESLint가 각 파일의 전체 소스 코드를 결과에 포함시키기 때문입니다.

## 해결 방법

### 1. 자동 정리 스크립트 생성
`scripts/clean-eslint-results.js` 파일을 생성하여 ESLint 결과에서 불필요한 소스 코드를 제거합니다.

**주요 기능:**
- 소스 코드 제거로 파일 크기 90% 이상 감소
- 원본 파일 자동 백업
- JSON 유효성 검증
- 상세한 통계 정보 제공

### 2. package.json 스크립트 추가
```json
{
  "scripts": {
    "clean:eslint": "node scripts/clean-eslint-results.js",
    "lint:json": "next lint --format=json --output-file=eslint-results.json && npm run clean:eslint"
  }
}
```

### 3. 사용 방법

#### 기존 결과 파일 정리
```bash
npm run clean:eslint
```

#### ESLint 실행 후 자동 정리
```bash
npm run lint:json
```

## 최적화 결과

### Before (원본)
- 파일 크기: 1.61MB
- 읽기 불가능 (256KB 제한 초과)
- 소스 코드 포함

### After (최적화)
- 파일 크기: 178KB (89% 감소)
- 읽기 가능
- 린트 결과만 포함

## 파일 구조 비교

### 원본 구조
```json
{
  "filePath": "...",
  "messages": [...],
  "source": "전체 소스 코드 (용량 증가 원인)",
  "errorCount": 0,
  ...
}
```

### 최적화된 구조
```json
{
  "filePath": "...",
  "messages": [...],
  "errorCount": 0,
  "warningCount": 1,
  "fixableErrorCount": 0,
  "fixableWarningCount": 0,
  "suppressedMessages": [],
  "usedDeprecatedRules": []
}
```

## 자동화 권장사항

### CI/CD 파이프라인에서 사용
```yaml
- name: Run ESLint with optimization
  run: npm run lint:json
```

### Git Hook 설정
```bash
# .husky/pre-commit
npm run lint:json
```

## 추가 최적화 팁

1. **캐시 활용**: ESLint 캐시를 사용하여 성능 향상
2. **점진적 린팅**: 변경된 파일만 린팅
3. **병렬 처리**: 대용량 프로젝트에서 병렬 린팅 고려

## 문제 해결

### 스크립트 실행 오류
```bash
# Node.js 권한 확인
node --version

# 스크립트 실행 권한 확인
chmod +x scripts/clean-eslint-results.js
```

### JSON 파싱 오류
스크립트가 자동으로 npm warnings와 기타 텍스트를 제거하고 유효한 JSON만 추출합니다.

## 결론
이 최적화를 통해 ESLint 결과 파일의 크기를 90% 이상 줄이고, 개발 도구에서 읽을 수 있게 만들었습니다. 앞으로 `npm run lint:json` 명령어를 사용하여 자동으로 최적화된 결과를 얻을 수 있습니다.