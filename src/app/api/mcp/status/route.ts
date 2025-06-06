import { NextRequest, NextResponse } from 'next/server';
import { MCPConfigManager } from '@/services/mcp/config-manager';

export async function GET(request: NextRequest) {
  try {
    const configManager = MCPConfigManager.getInstance();
    const status = await configManager.checkServerStatus();

    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        ...status,
      },
    });
  } catch (error) {
    console.error('[MCP Status API] 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'MCP 상태 확인 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, serverName } = await request.json();

    if (action === 'reload') {
      // 설정 다시 로드
      const configManager = MCPConfigManager.getInstance();
      const config = await configManager.loadConfig();

      return NextResponse.json({
        success: true,
        message: '설정이 다시 로드되었습니다.',
        data: config,
      });
    }

    if (action === 'test' && serverName) {
      const configManager = MCPConfigManager.getInstance();
      const serverConfig = await configManager.getServerConfig(serverName);

      if (!serverConfig) {
        return NextResponse.json(
          {
            success: false,
            error: `서버 '${serverName}'을 찾을 수 없습니다.`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `서버 '${serverName}' 설정이 확인되었습니다.`,
        data: serverConfig,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: '유효하지 않은 액션입니다.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[MCP Status API] POST 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'MCP 제어 실패',
      },
      { status: 500 }
    );
  }
}
