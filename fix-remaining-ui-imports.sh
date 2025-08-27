#!/bin/bash

# UI 컴포넌트들의 React import 수정
files=(
  "src/components/ui/accordion.tsx"
  "src/components/ui/label.tsx" 
  "src/components/ui/pagination.tsx"
  "src/components/ui/popover.tsx"
  "src/components/ui/scroll-area.tsx"
  "src/components/ui/select.tsx"
  "src/components/ui/separator.tsx"
  "src/components/ui/switch.tsx"
  "src/components/ui/tabs.tsx"
  "src/components/ui/tooltip.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "수정 중: $file"
    
    # React import를 명시적 import로 변경
    sed -i 's/import \* as React from '\''react'\'';/import { forwardRef, type ComponentProps, type ReactElement, type ReactNode, type HTMLAttributes, type ButtonHTMLAttributes, type ElementRef } from '\''react'\'';/g' "$file"
    
    # 중복 제거 및 실제 사용되는 것만 남기기
    # 각 파일별로 실제 사용하는 타입만 import하도록 나중에 정리
    echo "완료: $file"
  fi
done

echo "모든 UI 컴포넌트 import 수정 완료"
