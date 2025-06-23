# 접근성 개선 계획

## 발견된 문제들

1. **missing-button-text** (src\components\dashboard\ServerCard.tsx:1)

   - 버튼에 접근 가능한 텍스트가 없음
   - 해결: aria-label 또는 title 속성 추가

2. **missing-button-text** (src\components\dashboard\ServerCard.tsx:2)
   - 버튼에 접근 가능한 텍스트가 없음
   - 해결: aria-label 또는 title 속성 추가

## 우선순위

1. **높음**: missing-button-text 문제들

## 수정 계획

### ServerCard.tsx 수정

- 모든 버튼에 적절한 aria-label 추가
- 아이콘 버튼에 title 속성 추가

### 검증 방법

- lighthouse 접근성 점수 확인
- 스크린 리더 테스트
