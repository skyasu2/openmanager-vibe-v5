# 🤖 Gemini CLI 직접 실행 가이드

Claude가 Gemini CLI와 직접 대화하는 방법입니다.

## 📋 기본 사용법

```bash
# 기본 대화
echo "질문 내용" | gemini -p "답변해주세요"

# 파일 분석
cat src/app/page.tsx | gemini -p "이 코드를 분석해주세요"

# Git diff 리뷰
git diff | gemini -p "변경사항을 리뷰해주세요"

# 에러 메시지 분석
echo "에러 메시지" | gemini -p "해결 방법을 알려주세요"
```

## 🚀 자주 사용하는 패턴

### 1. 간단한 질문

```bash
echo "TypeScript에서 generic type을 사용하는 방법" | gemini -p "간단히 설명"
```

### 2. 코드 리뷰

```bash
cat filename.ts | gemini -p "코드 품질과 개선점 분석"
```

### 3. 문제 해결

```bash
echo "문제 설명" | gemini -p "단계별 해결 방법 제시"
```

### 4. 시스템 명령

```bash
# 대화 초기화
gemini /clear

# 사용량 확인
gemini /stats

# 대화 압축
gemini /compress
```

## ⚡ 효율적 사용 팁

1. **간결한 프롬프트**: 명확하고 짧게
2. **파이프 활용**: echo, cat, git diff 등
3. **-p 플래그**: 프롬프트 모드로 즉시 실행
4. **출력 제한**: 필요한 만큼만 요청

## 🔧 헬퍼 함수 (선택사항)

필요시 ~/.bashrc에 추가:

```bash
# Gemini 빠른 질문
gq() {
    echo "$@" | gemini -p "답변"
}

# 파일 분석
gf() {
    cat "$1" | gemini -p "코드 분석"
}

# Git diff 리뷰
gd() {
    git diff | gemini -p "변경사항 리뷰"
}
```

## 📊 사용량 관리

- 일일 1,000회 제한
- 80% 초과 시 Claude로 전환
- `/stats`로 실시간 확인
