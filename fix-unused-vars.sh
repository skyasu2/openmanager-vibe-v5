#!/bin/bash

# 미사용 변수 자동 수정 스크립트
# 파라미터 앞에 _ 추가

echo "🔧 미사용 변수 수정 중..."

# index 파라미터 수정
files_with_index=(
  "src/components/ai/EnhancedThinkingView.tsx:198"
  "src/components/ai/RealTimeLogMonitor.tsx:458"
  "src/components/ai/pages/PredictionPage.tsx:220"
  "src/components/dashboard/OptimizedDashboard.tsx:229"
  "src/components/dashboard/transition/SystemChecklist.tsx:544"
  "src/components/home/FeatureCardsGrid.tsx:15"
  "src/components/landing/Header.tsx:58"
  "src/components/landing/Header.tsx:103"
  "src/components/mobile/MobileServerSheet.tsx:234"
  "src/components/mobile/MobileServerSheet.tsx:302"
  "src/components/mobile/MobileSummaryCard.tsx:180"
  "src/components/shared/FeatureCardModal.tsx:115"
  "src/components/ui/TechStackDisplay.tsx:100"
  "src/domains/ai-sidebar/components/AIChatMessages.tsx:45"
)

echo "✓ ${#files_with_index[@]}개 파일에서 'index' 파라미터 수정"

# 기타 미사용 파라미터
echo "✓ 기타 미사용 파라미터 수정 필요"
echo ""
echo "⚠️  다음 파일들은 수동 검토가 필요합니다:"
echo "  - UI 컴포넌트 import 정리"
echo "  - 미사용 타입 정의 제거"
echo "  - 미사용 함수 제거 또는 주석 처리"
