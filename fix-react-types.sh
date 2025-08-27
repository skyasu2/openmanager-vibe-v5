#!/bin/bash

# React 타입 참조 일괄 수정 스크립트
echo "🔧 React 타입 참조 일괄 수정 시작..."

# src 디렉토리의 모든 .tsx, .ts 파일에 대해 수정
find src/ -name "*.tsx" -o -name "*.ts" | while read -r file; do
    if [[ -f "$file" ]]; then
        echo "Processing types in: $file"
        
        # React.ComponentType → ComponentType
        sed -i 's/React\.ComponentType/ComponentType/g' "$file"
        
        # React.ElementRef → ElementRef  
        sed -i 's/React\.ElementRef/ElementRef/g' "$file"
        
        # React.HTMLAttributes → HTMLAttributes
        sed -i 's/React\.HTMLAttributes/HTMLAttributes/g' "$file"
        
        # React.KeyboardEvent → KeyboardEvent
        sed -i 's/React\.KeyboardEvent/KeyboardEvent/g' "$file"
        
        # React.MouseEvent → MouseEvent
        sed -i 's/React\.MouseEvent/MouseEvent/g' "$file"
        
        # React.FormEvent → FormEvent
        sed -i 's/React\.FormEvent/FormEvent/g' "$file"
        
        # React.ChangeEvent → ChangeEvent
        sed -i 's/React\.ChangeEvent/ChangeEvent/g' "$file"
        
        # React.FocusEvent → FocusEvent  
        sed -i 's/React\.FocusEvent/FocusEvent/g' "$file"
        
        # React.ErrorInfo → ErrorInfo
        sed -i 's/React\.ErrorInfo/ErrorInfo/g' "$file"
        
        # React.JSX.Element → JSX.Element
        sed -i 's/React\.JSX\.Element/JSX.Element/g' "$file"
        
        # React.ReactNode → ReactNode
        sed -i 's/React\.ReactNode/ReactNode/g' "$file"
        
        # React.RefObject → RefObject
        sed -i 's/React\.RefObject/RefObject/g' "$file"
        
        # React.MutableRefObject → MutableRefObject
        sed -i 's/React\.MutableRefObject/MutableRefObject/g' "$file"
    fi
done

echo "✅ React 타입 참조 일괄 수정 완료!"
echo "📊 수정 결과 확인:"
echo "React. 참조 남은 개수: $(grep -r "React\." src/ --include="*.tsx" --include="*.ts" | wc -l)"