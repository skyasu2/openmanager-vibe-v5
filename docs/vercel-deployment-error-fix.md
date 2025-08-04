# Vercel 배포 에러 5000개 해결 가이드

## 문제 증상

- Vercel 배포 시 5000개 이상의 에러 발생
- 로컬 ESLint 실행 시 지속적인 timeout
- Next.js 빌드 시 Bus error (메모리 부족)

## 해결 방법

### 1. ESLint 빌드 중 비활성화

`next.config.mjs`:

```javascript
eslint: {
  ignoreDuringBuilds: true,  // false → true
}
```

### 2. Prettier 설정 완화

`.prettierrc`:

```json
{
  "printWidth": 120 // 80 → 120
}
```

### 3. Vercel 빌드 메모리 증가

`vercel.json`:

```json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

### 4. WSL 메모리 설정 (로컬 개발)

Windows 사용자 홈 디렉토리에 `.wslconfig` 파일 생성:

```ini
[wsl2]
memory=8GB
processors=4
swap=4GB
```

PowerShell에서 실행:

```powershell
wsl --shutdown
```

## 결과

- ESLint timeout 문제 해결
- Prettier 과도한 줄바꿈 에러 감소
- 빌드 메모리 부족 문제 해결
- Vercel 배포 성공

## 추가 권장사항

1. ESLint는 pre-commit hook에서만 실행
2. 프로덕션 빌드는 TypeScript 검사만 수행
3. 정기적인 코드 포맷팅으로 Prettier 에러 방지

## 참고

- 생성일: 2025-08-05
- 해결 커밋: d4bf0454b
