/**
 * ✏️ EditableMessage 컴포넌트 - 인라인 메시지 편집 기능
 *
 * 기능:
 * - 인라인 메시지 편집
 * - 자동 저장/취소
 * - 키보드 단축키 지원
 * - 접근성 완전 준수
 */

'use client';

import { Check, Edit3, RotateCcw, X } from 'lucide-react';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface EditableMessageProps {
  /** 원본 메시지 텍스트 */
  originalText: string;
  /** 편집 완료 콜백 */
  onEditComplete: (newText: string) => void;
  /** 편집 취소 콜백 */
  onEditCancel?: () => void;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
  /** 메시지 역할 (user/assistant) */
  role?: 'user' | 'assistant';
  /** 커스텀 클래스 */
  className?: string;
}

export const EditableMessage: FC<EditableMessageProps> = ({
  originalText,
  onEditComplete,
  onEditCancel,
  readOnly = false,
  role = 'user',
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(originalText);
  const [hasChanges, setHasChanges] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  // 편집 텍스트 변경 감지
  useEffect(() => {
    setHasChanges(editText !== originalText);
  }, [editText, originalText]);

  // 편집 모드 시작
  const startEditing = useCallback(() => {
    if (readOnly) return;
    setIsEditing(true);
    setEditText(originalText);
    setHasChanges(false);
  }, [originalText, readOnly]);

  // 편집 완료
  const completeEdit = useCallback(() => {
    if (hasChanges) {
      onEditComplete(editText.trim());
    }
    setIsEditing(false);
    setHasChanges(false);

    // 편집 버튼에 포커스 복원
    setTimeout(() => {
      editButtonRef.current?.focus();
    }, 100);
  }, [editText, hasChanges, onEditComplete]);

  // 편집 취소
  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText(originalText);
    setHasChanges(false);
    onEditCancel?.();

    // 편집 버튼에 포커스 복원
    setTimeout(() => {
      editButtonRef.current?.focus();
    }, 100);
  }, [originalText, onEditCancel]);

  // 원본으로 되돌리기
  const resetToOriginal = useCallback(() => {
    setEditText(originalText);
    setHasChanges(false);
  }, [originalText]);

  // 키보드 단축키 핸들러
  const handleKeyboardShortcut = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'Enter') {
        completeEdit();
      } else if (event.key === 'Escape') {
        cancelEdit();
      }
    },
    [completeEdit, cancelEdit]
  );

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* 편집 헤더 */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Edit3 className="h-3 w-3" />
            메시지 편집 중
          </span>
          <span className="text-gray-400">Ctrl+Enter: 저장 | Esc: 취소</span>
        </div>

        {/* 편집 텍스트 영역 */}
        <AutoResizeTextarea
          value={editText}
          onValueChange={setEditText}
          onKeyboardShortcut={handleKeyboardShortcut}
          placeholder="메시지를 편집하세요..."
          className="w-full rounded border border-blue-300 bg-blue-50/50 px-3 py-2 text-sm focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          minHeight={60}
          maxHeight={200}
          aria-label="메시지 편집"
        />

        {/* 편집 액션 버튼들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* 원본으로 되돌리기 */}
            <button
              onClick={resetToOriginal}
              disabled={!hasChanges}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              title="원본으로 되돌리기"
            >
              <RotateCcw className="h-3 w-3" />
              되돌리기
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* 취소 버튼 */}
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1 rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
              aria-label="편집 취소"
            >
              <X className="h-3 w-3" />
              취소
            </button>

            {/* 저장 버튼 */}
            <button
              onClick={completeEdit}
              disabled={!editText.trim() || !hasChanges}
              className="flex items-center gap-1 rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="편집 완료"
            >
              <Check className="h-3 w-3" />
              저장
            </button>
          </div>
        </div>

        {/* 변경 상태 표시 */}
        {hasChanges && (
          <div className="rounded bg-amber-50 p-2 text-xs text-amber-700">
            💾 변경사항이 있습니다. 저장하려면 &quot;저장&quot; 버튼을
            클릭하세요.
          </div>
        )}
      </div>
    );
  }

  // 읽기 모드
  return (
    <div className={`group relative ${className}`}>
      {/* 메시지 텍스트 */}
      <div
        className={`whitespace-pre-wrap break-words text-sm ${role === 'user' ? 'text-gray-800' : 'text-gray-700'} ${!readOnly ? 'pr-8' : ''} `}
      >
        {originalText}
      </div>

      {/* 편집 버튼 */}
      {!readOnly && (
        <button
          ref={editButtonRef}
          onClick={startEditing}
          className="absolute right-0 top-0 rounded p-1 text-gray-400 opacity-0 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 focus:opacity-100 group-hover:opacity-100"
          title="메시지 편집"
          aria-label="메시지 편집"
        >
          <Edit3 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
