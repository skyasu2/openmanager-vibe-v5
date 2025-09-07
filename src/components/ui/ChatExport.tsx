/**
 * 📤 ChatExport 컴포넌트 - 대화 내보내기 기능
 * 
 * 기능:
 * - 다양한 형식으로 내보내기 (JSON, Markdown, Text, CSV)
 * - 필터링 옵션 (날짜, 역할, 키워드)
 * - 프리뷰 기능
 * - 파일 다운로드
 */

'use client';

import { useState, useMemo, useCallback, type FC } from 'react';
import { 
  Download, 
  FileText, 
  FileCode, 
  Database,
  Eye,
  Calendar,
  Filter,
  X,
  CheckCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'thinking';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ExportFormat {
  id: string;
  name: string;
  icon: typeof FileText;
  extension: string;
  mimeType: string;
  description: string;
}

interface ExportFilter {
  startDate?: Date;
  endDate?: Date;
  roles: string[];
  keywords: string[];
}

interface ChatExportProps {
  messages: ChatMessage[];
  onClose: () => void;
  className?: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'markdown',
    name: 'Markdown',
    icon: FileText,
    extension: 'md',
    mimeType: 'text/markdown',
    description: '읽기 쉬운 마크다운 형식',
  },
  {
    id: 'json',
    name: 'JSON',
    icon: FileCode,
    extension: 'json',
    mimeType: 'application/json',
    description: '구조화된 데이터 형식',
  },
  {
    id: 'text',
    name: 'Plain Text',
    icon: FileText,
    extension: 'txt',
    mimeType: 'text/plain',
    description: '단순 텍스트 형식',
  },
  {
    id: 'csv',
    name: 'CSV',
    icon: Database,
    extension: 'csv',
    mimeType: 'text/csv',
    description: '스프레드시트 호환 형식',
  },
];

export const ChatExport: FC<ChatExportProps> = ({
  messages,
  onClose,
  className = '',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(EXPORT_FORMATS[0]!);
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState<ExportFilter>({
    roles: ['user', 'assistant'],
    keywords: [],
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // 필터링된 메시지
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      // 역할 필터
      if (!filters.roles.includes(message.role)) return false;

      // 날짜 필터
      if (filters.startDate && message.timestamp < filters.startDate) return false;
      if (filters.endDate && message.timestamp > filters.endDate) return false;

      // 키워드 필터
      if (filters.keywords.length > 0) {
        const content = message.content.toLowerCase();
        return filters.keywords.some(keyword => 
          content.includes(keyword.toLowerCase())
        );
      }

      return true;
    });
  }, [messages, filters]);

  // 내보낼 데이터 생성
  const generateExportData = useCallback((format: ExportFormat) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `openmanager-chat-${timestamp}.${format.extension}`;

    switch (format.id) {
      case 'markdown':
        const markdownContent = filteredMessages
          .map(message => {
            const time = message.timestamp.toLocaleString('ko-KR');
            const roleEmoji = message.role === 'user' ? '👤' : '🤖';
            return `## ${roleEmoji} ${message.role} (${time})\n\n${message.content}\n`;
          })
          .join('\n---\n\n');
        
        return {
          content: `# OpenManager AI Chat Export\n\n생성일: ${new Date().toLocaleString('ko-KR')}\n총 메시지: ${filteredMessages.length}개\n\n---\n\n${markdownContent}`,
          filename,
          mimeType: format.mimeType,
        };

      case 'json':
        const jsonData = {
          meta: {
            exportDate: new Date().toISOString(),
            totalMessages: filteredMessages.length,
            filters: filters,
          },
          messages: filteredMessages.map(message => ({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp.toISOString(),
            metadata: message.metadata,
          })),
        };
        
        return {
          content: JSON.stringify(jsonData, null, 2),
          filename,
          mimeType: format.mimeType,
        };

      case 'text':
        const textContent = filteredMessages
          .map(message => {
            const time = message.timestamp.toLocaleString('ko-KR');
            return `[${time}] ${message.role.toUpperCase()}: ${message.content}`;
          })
          .join('\n\n');
        
        return {
          content: `OpenManager AI Chat Export\n생성일: ${new Date().toLocaleString('ko-KR')}\n총 메시지: ${filteredMessages.length}개\n\n${textContent}`,
          filename,
          mimeType: format.mimeType,
        };

      case 'csv':
        const csvHeaders = 'ID,Role,Content,Timestamp';
        const csvRows = filteredMessages
          .map(message => 
            `"${message.id}","${message.role}","${message.content.replace(/"/g, '""')}","${message.timestamp.toISOString()}"`
          )
          .join('\n');
        
        return {
          content: `${csvHeaders}\n${csvRows}`,
          filename,
          mimeType: format.mimeType,
        };

      default:
        throw new Error(`Unsupported format: ${format.id}`);
    }
  }, [filteredMessages, filters]);

  // 파일 다운로드
  const downloadFile = useCallback(async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      const exportData = generateExportData(format);
      
      const blob = new Blob([exportData.content], { type: exportData.mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  }, [generateExportData]);

  // 키워드 추가
  const addKeyword = useCallback(() => {
    if (keywordInput.trim() && !filters.keywords.includes(keywordInput.trim())) {
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()],
      }));
      setKeywordInput('');
    }
  }, [keywordInput, filters.keywords]);

  // 키워드 제거
  const removeKeyword = useCallback((keyword: string) => {
    setFilters(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }));
  }, []);

  // 역할 토글
  const toggleRole = useCallback((role: string) => {
    setFilters(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  }, []);

  // 프리뷰 데이터
  const previewData = useMemo(() => {
    if (!showPreview) return null;
    return generateExportData(selectedFormat);
  }, [showPreview, selectedFormat, generateExportData]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">대화 내보내기</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 필터 설정 */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-700">
          <Filter className="h-4 w-4" />
          필터 설정
        </div>

        <div className="space-y-3">
          {/* 역할 필터 */}
          <div>
            <label className="text-xs font-medium text-gray-600">메시지 역할</label>
            <div className="mt-1 flex gap-2">
              {['user', 'assistant', 'thinking'].map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`
                    rounded px-3 py-1 text-xs font-medium transition-colors
                    ${filters.roles.includes(role)
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {role === 'user' ? '👤 사용자' : role === 'assistant' ? '🤖 AI' : '💭 사고'}
                </button>
              ))}
            </div>
          </div>

          {/* 키워드 필터 */}
          <div>
            <label className="text-xs font-medium text-gray-600">키워드 필터</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="키워드 입력..."
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={addKeyword}
                disabled={!keywordInput.trim()}
                className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
              >
                추가
              </button>
            </div>
            {filters.keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {filters.keywords.map(keyword => (
                  <span
                    key={keyword}
                    className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 형식 선택 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">내보내기 형식</label>
        <div className="grid grid-cols-2 gap-2">
          {EXPORT_FORMATS.map(format => (
            <button
              key={format.id}
              onClick={() => setSelectedFormat(format)}
              className={`
                flex items-center gap-3 rounded-lg border p-3 text-left transition-all
                ${selectedFormat.id === format.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <format.icon className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{format.name}</div>
                <div className="text-xs text-gray-500">{format.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="rounded bg-gray-50 p-3">
        <div className="text-sm text-gray-600">
          <strong>{filteredMessages.length}개</strong> 메시지가 내보내집니다
          <span className="ml-2 text-xs text-gray-500">
            (전체 {messages.length}개 중)
          </span>
        </div>
      </div>

      {/* 프리뷰 */}
      {showPreview && previewData && (
        <div className="rounded-lg border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 p-3">
            <span className="font-medium text-gray-700">미리보기</span>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-60 overflow-auto p-3">
            <pre className="whitespace-pre-wrap text-xs text-gray-600">
              {previewData.content.slice(0, 1000)}
              {previewData.content.length > 1000 && '\n\n... (더 보기)'}
            </pre>
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            미리보기
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => downloadFile(selectedFormat)}
            disabled={isExporting || filteredMessages.length === 0}
            className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                내보내는 중...
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle className="h-4 w-4" />
                완료!
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                다운로드
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};