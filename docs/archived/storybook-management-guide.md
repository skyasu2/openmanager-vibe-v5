# 📖 스토리북 관리 가이드라인

## 🎯 기본 원칙

### 1. **파일 구조 유지**

- MDX 파일 사용 금지 (TSX만 사용)
- 컴포넌트와 스토리 파일 쌍으로 관리
- `src/stories/` 또는 컴포넌트 폴더 내 위치

### 2. **naming 규칙**

```
ComponentName.tsx          # 실제 컴포넌트
ComponentName.stories.tsx  # 스토리 파일
```

## 🛠️ 개발 워크플로우

### 새 컴포넌트 스토리 생성 시

```bash
# 1. 컴포넌트 생성 후
# 2. 스토리 파일 생성
# 3. 검증 실행
npm run storybook:validate
```

### 컴포넌트 삭제 시

```bash
# 1. 스토리 파일 의존성 확인
grep -r "ComponentName" src/
# 2. 스토리 파일도 함께 삭제
# 3. 검증 실행
npm run storybook:validate
```

## 🚨 문제 해결

### 포트 충돌 시

```bash
npm run storybook:clean  # 포트 정리 + 재시작
```

### 빌드 오류 시

```bash
npm run storybook:validate  # 의존성 검증
npm run storybook:build     # 빌드 테스트
```

## ⚡ 유용한 명령어

- `npm run storybook:clean` - 포트 정리 후 실행
- `npm run storybook:validate` - 파일 검증
- `npm run storybook:build` - 프로덕션 빌드 테스트

## 🔒 제한사항

❌ **사용 금지:**

- MDX 파일 (.stories.mdx)
- 복잡한 애드온 추가
- 외부 의존성이 많은 스토리

✅ **권장사항:**

- 단순한 TSX 스토리
- 기본 컨트롤 사용
- 독립적인 스토리 작성
