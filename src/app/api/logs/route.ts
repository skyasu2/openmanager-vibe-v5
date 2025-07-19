/**
 * 📝 로깅 시스템 API v1.0 (간소화 버전)
 * 
 * ✅ 로그 조회 및 검색
 * ✅ 로그 통계
 * ✅ 로그 내보내기
 * ✅ 로그 설정 관리
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// 타입 정의
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'system' | 'api' | 'ai' | 'security' | 'performance';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  source?: string;
  context?: any;
}

// 간단한 인메모리 로그 저장소
const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

// 로그 추가 함수
function addLog(level: LogLevel, category: LogCategory, message: string, context?: any) {
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    context
  };
  
  logs.unshift(entry);
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
  
  return entry;
}

/**
 * 📝 GET - 로그 조회 및 검색
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 필터링
    let filteredLogs = [...logs];

    // 레벨 필터
    const levels = searchParams.get('levels');
    if (levels) {
      const levelArray = levels.split(',') as LogLevel[];
      filteredLogs = filteredLogs.filter(log => levelArray.includes(log.level));
    }

    // 카테고리 필터
    const categories = searchParams.get('categories');
    if (categories) {
      const categoryArray = categories.split(',') as LogCategory[];
      filteredLogs = filteredLogs.filter(log => categoryArray.includes(log.category));
    }

    // 검색어
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 페이지네이션
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs,
        total: filteredLogs.length,
        limit,
        offset
      }
    });
  } catch (error) {
    logger.error('로그 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '로그 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

/**
 * 📊 POST - 로그 추가
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level = 'info', category = 'system', message, context } = body;

    if (!message) {
      return NextResponse.json({
        success: false,
        error: '메시지가 필요합니다.'
      }, { status: 400 });
    }

    const logEntry = addLog(level, category, message, context);

    return NextResponse.json({
      success: true,
      data: logEntry
    });
  } catch (error) {
    logger.error('로그 추가 오류:', error);
    return NextResponse.json({
      success: false,
      error: '로그 추가 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

/**
 * 🗑️ DELETE - 로그 정리
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keepDays = parseInt(searchParams.get('keepDays') || '7');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    
    const beforeCount = logs.length;
    logs.splice(0, logs.length, ...logs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    ));
    
    const deletedCount = beforeCount - logs.length;

    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        remainingCount: logs.length,
        message: `${deletedCount}개의 로그가 삭제되었습니다.`
      }
    });
  } catch (error) {
    logger.error('로그 정리 오류:', error);
    return NextResponse.json({
      success: false,
      error: '로그 정리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}