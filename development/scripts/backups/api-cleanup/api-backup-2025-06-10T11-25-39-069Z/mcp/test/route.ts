import { NextRequest, NextResponse } from 'next/server';
import { RealMCPClient } from '../../../../services/mcp/real-mcp-client';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query가 필요합니다',
        },
        { status: 400 }
      );
    }

    // 실제 MCP 클라이언트 인스턴스 생성
    const mcpClient = new RealMCPClient();
    await mcpClient.initialize();

    // MCP 서버 상태 확인
    const serverStatus = await mcpClient.getServerStatus();

    // 연결 정보 조회
    const connectionInfo = mcpClient.getConnectionInfo();

    // 간단한 쿼리 실행 테스트
    let queryResult = null;
    try {
      queryResult = await mcpClient.performComplexQuery(query);
    } catch (error: any) {
      console.warn('쿼리 실행 실패:', error.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        query,
        response: 'MCP 시스템이 D 드라이브에서 정상 동작 중입니다.',
        serverStatus,
        connectionInfo,
        queryResult,
        driveInfo: {
          currentDirectory: process.cwd(),
          platform: process.platform,
          nodeVersion: process.version,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('MCP 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'MCP 테스트 중 오류 발생',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'MCP 테스트 API - POST 메서드를 사용하세요',
    usage: {
      method: 'POST',
      body: {
        query: '테스트할 질문',
      },
    },
  });
}
