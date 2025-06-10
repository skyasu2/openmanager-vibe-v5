/**
 * 📚 문서 인덱스 API
 * GET /api/documents/index
 *
 * LocalRAGEngine에서 사용하는 문서 인덱스를 제공합니다.
 * MCP 서버의 문서들을 기반으로 검색 가능한 인덱스를 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { realMCPClient } from '@/services/mcp/real-mcp-client';

interface DocumentIndex {
  [id: string]: {
    content: string;
    keywords: string[];
    category: string;
    priority: number;
    lastUpdated: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('📚 문서 인덱스 요청 처리 중...');

    // MCP 서버에서 문서 검색
    const documents: DocumentIndex = {};

    try {
      // docs 폴더의 주요 문서들 검색
      const docFiles = [
        'README.md',
        'DEVELOPMENT_GUIDE.md',
        'PROJECT_STATUS.md',
        'ENVIRONMENT_SETUP.md',
        'MCP_CONFIG_GUIDE.md',
        'DEPLOYMENT_CHECKLIST.md',
      ];

      for (const file of docFiles) {
        try {
          const content = await realMCPClient.readFile(`docs/${file}`);
          if (content) {
            const keywords = extractKeywords(content);
            const category = categorizeDocument(file, content);

            documents[file] = {
              content: content.substring(0, 2000), // 처음 2000자만
              keywords,
              category,
              priority: getPriority(file),
              lastUpdated: new Date().toISOString(),
            };
          }
        } catch (error) {
          console.warn(`⚠️ 문서 읽기 실패: ${file}`, error);
        }
      }

      // 기본 지식베이스 추가
      if (Object.keys(documents).length === 0) {
        documents['basic-knowledge'] = {
          content: '서버 모니터링 및 관리에 대한 기본 지식베이스입니다.',
          keywords: ['서버', '모니터링', '관리', 'server', 'monitoring'],
          category: 'general',
          priority: 1,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (mcpError) {
      console.warn('⚠️ MCP 서버 연결 실패, 기본 지식베이스 사용:', mcpError);

      // MCP 실패 시 기본 지식베이스
      documents['cpu-optimization'] = {
        content:
          'CPU 사용률이 높을 때는 프로세스를 확인하고 불필요한 서비스를 중지하세요. top 명령어로 CPU 사용량이 높은 프로세스를 찾을 수 있습니다.',
        keywords: ['cpu', '최적화', '프로세스', '성능'],
        category: 'performance',
        priority: 2,
        lastUpdated: new Date().toISOString(),
      };

      documents['memory-management'] = {
        content:
          '메모리 사용률이 높을 때는 메모리 누수를 확인하고 캐시를 정리하세요. free -h 명령어로 메모리 상태를 확인할 수 있습니다.',
        keywords: ['메모리', '관리', '누수', '캐시'],
        category: 'performance',
        priority: 2,
        lastUpdated: new Date().toISOString(),
      };

      documents['disk-cleanup'] = {
        content:
          '디스크 공간이 부족할 때는 로그 파일을 정리하고 임시 파일을 삭제하세요. df -h로 디스크 사용량을 확인할 수 있습니다.',
        keywords: ['디스크', '정리', '로그', '공간'],
        category: 'storage',
        priority: 2,
        lastUpdated: new Date().toISOString(),
      };

      documents['network-troubleshooting'] = {
        content:
          '네트워크 문제가 발생했을 때는 ping과 traceroute로 연결 상태를 확인하세요. netstat으로 포트 상태를 점검할 수 있습니다.',
        keywords: ['네트워크', '문제해결', '연결', '포트'],
        category: 'network',
        priority: 2,
        lastUpdated: new Date().toISOString(),
      };
    }

    console.log(
      `✅ 문서 인덱스 생성 완료: ${Object.keys(documents).length}개 문서`
    );

    return NextResponse.json(documents, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5분 캐시
      },
    });
  } catch (error: any) {
    console.error('❌ 문서 인덱스 생성 실패:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate document index',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 텍스트에서 키워드 추출
 */
function extractKeywords(text: string): string[] {
  const korean = text.match(/[가-힣]{2,}/g) || [];
  const english = text.match(/[a-zA-Z]{3,}/g) || [];
  const technical =
    text.match(
      /\b(?:CPU|API|DB|RAM|SSD|HTTP|JSON|서버|모니터링|성능|메모리|디스크|네트워크)\b/gi
    ) || [];

  return [...new Set([...korean, ...english, ...technical])]
    .map(k => k.toLowerCase())
    .filter(k => k.length >= 2)
    .slice(0, 20); // 최대 20개
}

/**
 * 문서 카테고리 분류
 */
function categorizeDocument(filename: string, content: string): string {
  const lower = filename.toLowerCase() + ' ' + content.toLowerCase();

  if (
    lower.includes('performance') ||
    lower.includes('성능') ||
    lower.includes('cpu') ||
    lower.includes('memory')
  ) {
    return 'performance';
  }
  if (
    lower.includes('security') ||
    lower.includes('보안') ||
    lower.includes('auth')
  ) {
    return 'security';
  }
  if (
    lower.includes('network') ||
    lower.includes('네트워크') ||
    lower.includes('connection')
  ) {
    return 'network';
  }
  if (
    lower.includes('storage') ||
    lower.includes('disk') ||
    lower.includes('디스크')
  ) {
    return 'storage';
  }
  if (
    lower.includes('deployment') ||
    lower.includes('배포') ||
    lower.includes('setup')
  ) {
    return 'deployment';
  }
  if (
    lower.includes('development') ||
    lower.includes('개발') ||
    lower.includes('guide')
  ) {
    return 'development';
  }

  return 'general';
}

/**
 * 문서 우선순위 결정
 */
function getPriority(filename: string): number {
  if (filename.includes('README')) return 3;
  if (filename.includes('GUIDE') || filename.includes('STATUS')) return 2;
  return 1;
}
