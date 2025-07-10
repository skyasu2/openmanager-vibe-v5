# Gemini CLI 협업 가이드

## 프로젝트 컨텍스트

### 현재 작업 상황
- Vercel 무료 티어 최적화 중점 개발
- OpenManager VIBE v5 - AI 기반 서버 모니터링 플랫폼
- 로그인 후 홈 리다이렉션 문제 해결 중

### 기술 스택
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (인증/DB)
- Google AI (Gemini)
- Vercel (배포)

## Gemini CLI 사용 전략 (일일 1,000회 제한)

### 1. 토큰 절약 명령어
```bash
# 사용량 확인
gemini /stats

# 대화 압축
gemini /compress

# 컨텍스트 초기화
gemini /clear
```

### 2. 효율적인 파일 분석
```bash
# 특정 파일만 분석
cat src/app/page.tsx | gemini -p "인증 로직 분석"

# 간단한 질문
echo "로그인 리다이렉션 문제" | gemini -p "해결책 3줄 요약"
```

### 3. 프로젝트별 메모리 활용
```bash
# 중요 정보 저장
gemini /memory add "Vercel 무료 티어: 메모리 512MB, 실행시간 10초"
gemini /memory add "인증: Supabase + Google OAuth 사용"
gemini /memory add "배포: main 브랜치 자동 배포"
```

## 현재 해결 중인 문제

### 1. 로그인 후 홈 리다이렉션 이슈
- **문제**: 로그인 성공 후 홈으로 리다이렉션 안됨
- **원인**: 미들웨어 복잡도, 클라이언트 인증 상태 동기화
- **해결책**: 
  - 미들웨어 단순화 (완료)
  - 클라이언트 사이드 인증 체크 강화 (완료)
  - 콘솔 로그 추가로 디버깅 (완료)

### 2. Vercel 배포 최적화
- Edge Runtime 사용
- 메모리 사용량 최소화
- API 호출 최적화

## 협업 패턴

### 코드 분석 요청
```bash
# 파일 구조 파악
find src -name "*.tsx" | head -10 | gemini -p "주요 컴포넌트 역할"

# 특정 기능 분석
grep -n "auth" src/app/page.tsx | gemini -p "인증 흐름 설명"
```

### 문제 해결 요청
```bash
# 에러 분석
npm run dev 2>&1 | tail -20 | gemini -p "에러 원인과 해결책"

# 성능 최적화
npm run build | gemini -p "번들 크기 최적화 방법"
```

### 코드 생성 요청
```bash
# 컴포넌트 생성
echo "로딩 스피너 컴포넌트" | gemini -p "Tailwind CSS 사용, TypeScript"

# 유틸리티 함수
echo "한국 시간 포맷터" | gemini -p "KST 타임존, YYYY-MM-DD HH:mm:ss"
```

## 주의사항

1. **토큰 관리**
   - 긴 파일은 필요한 부분만 추출
   - 반복 질문 대신 한 번에 명확히
   - 대화 길어지면 /compress 사용

2. **컨텍스트 유지**
   - 중요 정보는 /memory에 저장
   - 프로젝트별 컨텍스트 분리
   - 작업 완료 후 /clear

3. **협업 효율**
   - 구체적인 질문
   - 파일 경로 명확히 제공
   - 예상 결과 함께 설명

## 자주 사용하는 명령어

```bash
# 프로젝트 시작
gemini /memory add "OpenManager VIBE v5 작업 시작"

# 일일 작업
gemini -p "오늘 작업: [작업 내용]"

# 문제 해결
cat [문제 파일] | gemini -p "[문제 설명] 해결 방법"

# 코드 리뷰
git diff | gemini -p "변경사항 리뷰"

# 작업 종료
gemini /compress
gemini /stats
```

## 업데이트 이력

- 2025-07-10: 초기 문서 작성
- 로그인 리다이렉션 문제 해결 중
- Vercel 무료 티어 최적화 진행