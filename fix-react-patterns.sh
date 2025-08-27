#!/bin/bash

# React import patterns 일괄 수정 스크립트
echo "🔧 React import patterns 일괄 수정 시작..."

# src 디렉토리의 모든 .tsx, .ts 파일에 대해 수정
find src/ -name "*.tsx" -o -name "*.ts" | while read -r file; do
    if [[ -f "$file" ]]; then
        echo "Processing: $file"
        
        # React.Fragment → Fragment 변경
        sed -i 's/React\.Fragment/Fragment/g' "$file"
        
        # React.useState → useState 변경  
        sed -i 's/React\.useState/useState/g' "$file"
        
        # React.useEffect → useEffect 변경
        sed -i 's/React\.useEffect/useEffect/g' "$file"
        
        # React.useCallback → useCallback 변경
        sed -i 's/React\.useCallback/useCallback/g' "$file"
        
        # React.useMemo → useMemo 변경
        sed -i 's/React\.useMemo/useMemo/g' "$file"
        
        # React.useRef → useRef 변경
        sed -i 's/React\.useRef/useRef/g' "$file"
        
        # React.useContext → useContext 변경
        sed -i 's/React\.useContext/useContext/g' "$file"
        
        # React.createContext → createContext 변경
        sed -i 's/React\.createContext/createContext/g' "$file"
        
        # React.forwardRef → forwardRef 변경
        sed -i 's/React\.forwardRef/forwardRef/g' "$file"
        
        # React.createRef → createRef 변경
        sed -i 's/React\.createRef/createRef/g' "$file"
    fi
done

echo "✅ React patterns 일괄 수정 완료!"
echo "📊 수정 결과 확인:"
echo "React. 참조 남은 개수: $(grep -r "React\." src/ --include="*.tsx" --include="*.ts" | wc -l)"