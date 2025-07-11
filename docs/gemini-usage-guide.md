# Gemini CLI 효율적 사용 가이드

## 💡 비용 효율적인 AI 개발 전략

Claude (유료) + Gemini CLI (무료) 조합으로 최대 효율을 낼 수 있습니다.

## 📊 사용량 관리

### 1. 사용량 확인 명령어

```bash
# 현재 사용량 통계
gemini /stats

# 대화 기록 압축 (토큰 절약)
gemini /compress

# 컨텍스트 초기화
gemini /clear

# 저장된 메모리 확인
gemini /memory list
```

### 2. 일일 제한
- **무료 제한**: 1,000회/일
- **리셋 시간**: 태평양 표준시(PST) 자정
- **한국 시간**: 오후 4-5시경 리셋

## 🎯 효율적 사용 전략

### 1. 작업 분담

**Gemini CLI가 효율적인 작업:**
- 대용량 파일 분석 (`@` 참조)
- 코드베이스 전체 이해
- 반복적인 코드 리뷰
- 간단한 질문/답변

**Claude가 효율적인 작업:**
- 복잡한 코드 작성
- 디버깅 및 문제 해결
- 프로젝트 설계 및 아키텍처
- 실시간 페어 프로그래밍

### 2. 토큰 절약 팁

```bash
# ❌ 비효율적 (토큰 낭비)
gemini  # 대화형 모드로 장시간 대화

# ✅ 효율적 (토큰 절약)
echo "질문" | gemini -p "3줄로 답변"
cat file.js | gemini -p "@file.js 핵심만 요약"
```

### 3. 메모리 활용

```bash
# 프로젝트 정보 저장 (1회만)
gemini /memory add "OpenManager VIBE v5 - AI 서버 모니터링"
gemini /memory add "Next.js 15, TypeScript, Vercel 최적화"
gemini /memory add "주요 기능: 다중 AI 엔진, 실시간 모니터링"

# 저장된 정보로 효율적 대화
echo "로그인 문제" | gemini -p "메모리 기반으로 해결책 제시"
```

### 4. 일일 워크플로우 예시

```bash
# 아침 (사용량 0%)
gemini /stats  # 사용량 확인
gemini /memory list  # 컨텍스트 확인

# 개발 중 (사용량 ~50%)
git diff | gemini -p "변경사항 리뷰"  # 간단한 리뷰
echo "버그" | gemini -p "@error.log 원인 분석"  # 로그 분석

# 오후 (사용량 ~80%)
gemini /stats  # 남은 사용량 확인
gemini /compress  # 대화 압축으로 토큰 절약

# 저녁 (사용량 90%+)
# Claude로 전환하여 복잡한 작업 수행
```

## 📈 사용량 모니터링

### 1. 실시간 확인
```bash
# 사용량 확인 스크립트
alias gstats='echo "/stats" | gemini | grep -E "Usage|Remaining"'
```

### 2. 사용량 임계값
- 0-50%: Gemini 자유롭게 사용
- 50-80%: 중요한 작업 위주
- 80-100%: Claude로 전환 권장

## 🔄 Claude + Gemini 협업 패턴

### 1. 분석 → 구현
```bash
# Gemini: 코드베이스 분석
echo "분석" | gemini -p "@src/ AI 엔진 구조 파악"

# Claude: 분석 결과로 구현
# Gemini 분석 결과를 Claude에 전달하여 구현
```

### 2. 리뷰 → 수정
```bash
# Gemini: 빠른 코드 리뷰
git diff | gemini -p "문제점 찾기"

# Claude: 상세한 수정 작업
```

### 3. 문서화
```bash
# Gemini: 코드 요약
cat complex.ts | gemini -p "함수별 설명"

# Claude: 상세 문서 작성
```

## 💾 백업 전략

```bash
# 중요 대화 내용 저장
gemini /export > gemini_session_$(date +%Y%m%d).txt

# 메모리 백업
gemini /memory list > project_memory.txt
```

## 🚨 주의사항

1. **API 키 혼동 금지**
   - Gemini CLI: 로그인만 필요 (무료)
   - Google AI API: API 키 필요 (유료)

2. **사용량 초과 시**
   - 다음날 리셋까지 대기
   - Claude로 작업 전환
   - 긴급 시 다른 Google 계정 사용

3. **효율성 체크**
   ```bash
   # 일일 사용 효율 확인
   gemini /stats | tee daily_usage.log
   ```

이 가이드를 참고하여 Claude (유료)와 Gemini CLI (무료)를 효과적으로 조합해서 사용하세요!