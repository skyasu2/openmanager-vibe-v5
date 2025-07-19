# 🗂️ 제거된 기능들 백업

> **백업 날짜**: 2025년 1월 19일  
> **제거 이유**: 사용자 요청에 따른 기능 삭제

## 📋 백업된 파일들

### SystemAlertsPage.tsx
- **원본 경로**: `src/components/ai/pages/SystemAlertsPage.tsx`
- **기능**: 대시보드의 실시간 시스템 알림 표시
- **제거 이유**: 사용자가 대시보드에서 해당 기능 삭제 요청
- **제거 날짜**: 2025년 1월 19일

#### 기능 설명
- AI 에이전트 사이드바의 실시간 시스템 알림 페이지
- Critical/Warning/Resolved 알림 분류
- 실시간 알림 업데이트 (10초 간격)
- 알림 상세 정보 및 액션

#### 관련 변경사항
- `src/components/dashboard/DashboardContent.tsx`에서 SystemAlertsPage import 제거
- 대시보드 그리드 레이아웃을 3칸에서 2칸으로 조정
- 인프라 전체 현황이 더 넓은 공간 차지하도록 변경

## 🔄 복원 방법

필요시 다음 단계로 기능을 복원할 수 있습니다:

1. **파일 복원**:
   ```bash
   move backup-removed-features/SystemAlertsPage.tsx src/components/ai/pages/
   ```

2. **DashboardContent.tsx 수정**:
   - SystemAlertsPage import 추가
   - 그리드 레이아웃을 다시 3칸으로 변경
   - 시스템 알림 섹션 추가

3. **관련 의존성 확인**:
   - useSystemAlerts 훅 사용 여부 확인
   - 관련 타입 정의 확인

## ⚠️ 주의사항

- 이 백업 폴더는 정기적으로 정리될 수 있습니다
- 복원 시 현재 코드베이스와의 호환성을 확인해야 합니다
- 관련 의존성이나 API가 변경되었을 수 있습니다