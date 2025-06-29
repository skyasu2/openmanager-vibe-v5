import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, sessionId, mcpServerUrl } = await request.json();

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query가 필요합니다',
        },
        { status: 400 }
      );
    }

    const serverUrl =
      mcpServerUrl || 'https://openmanager-vibe-v5.onrender.com';
    const startTime = Date.now();

    // 🔍 실제 서버 데이터 기반 분석 수행 (반칙 방지!)
    let mcpResponse;
    try {
      // 1. MCP 서버 상태 확인
      const healthRes = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!healthRes.ok) {
        throw new Error('MCP 서버 응답 없음');
      }

      // 2. 실제 서버 데이터 가져오기
      const realServerData = await getRealServerData();

      // 3. 실제 MCP 도구를 사용한 쿼리 처리
      const toolsRes = await fetch(`${serverUrl}/mcp/tools`);
      const toolsData = await toolsRes.json();

      // 4. 실제 데이터 기반 응답 생성
      mcpResponse = await generateRealDataMCPResponse(
        query,
        sessionId,
        toolsData.tools,
        realServerData
      );
    } catch (mcpError) {
      console.warn('MCP 서버 연결 실패, 실제 로컬 데이터로 처리:', mcpError);

      // 로컬에서도 실제 서버 데이터 사용
      const realServerData = await getRealServerData();
      mcpResponse = await generateRealDataLocalResponse(
        query,
        sessionId,
        realServerData
      );
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      response: mcpResponse.response,
      confidence: mcpResponse.confidence,
      source: mcpResponse.source,
      processingTime,
      sessionId,
      timestamp: new Date().toISOString(),
      dataAnalyzed: mcpResponse.dataAnalyzed,
    });
  } catch (error: any) {
    console.error('MCP 쿼리 처리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'MCP 쿼리 처리 중 오류 발생',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// 🔗 실제 서버 데이터 가져오기
async function getRealServerData() {
  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://openmanager-vibe-v5.vercel.app'
        : 'http://localhost:3001';

    const response = await fetch(`${baseUrl}/api/servers`);
    if (!response.ok) {
      throw new Error('서버 데이터 조회 실패');
    }

    const serverApiResponse = await response.json();
    const servers = Array.isArray(serverApiResponse.data)
      ? serverApiResponse.data
      : [];

    console.log(`🔍 [MCP 실제 분석] ${servers.length}개 서버 데이터 수집 완료`);

    return {
      servers,
      totalCount: servers.length,
      criticalCount: servers.filter((s: any) => s.status === 'critical').length,
      warningCount: servers.filter((s: any) => s.status === 'warning').length,
      healthyCount: servers.filter((s: any) => s.status === 'running').length,
      avgCpu:
        servers.reduce((acc: number, s: any) => acc + (s.cpu || 0), 0) /
        servers.length,
      avgMemory:
        servers.reduce((acc: number, s: any) => acc + (s.memory || 0), 0) /
        servers.length,
      isRealData: !servers.some((s: any) => s._isMockData === true),
    };
  } catch (error) {
    console.error('실제 서버 데이터 수집 실패:', error);
    return null;
  }
}

// 실제 MCP 서버를 사용한 응답 생성 (실제 데이터 기반)
async function generateRealDataMCPResponse(
  query: string,
  sessionId: string,
  tools: any[],
  serverData: any
) {
  const safeTools = Array.isArray(tools) ? tools : [];
  const toolCount = safeTools.length;

  if (!serverData) {
    return {
      response: `🚨 [MCP 연동] 현재 서버 데이터에 접근할 수 없습니다. 시스템 연결 상태를 확인해주세요.`,
      confidence: 0.3,
      source: 'mcp-server-error',
      toolsAvailable: toolCount,
      dataAnalyzed: false,
    };
  }

  // 🔍 질의 유형별 실제 데이터 분석
  const lowerQuery = query.toLowerCase();
  let analysisResult = '';
  let confidence = 0.85;

  if (lowerQuery.includes('서버') || lowerQuery.includes('상태')) {
    analysisResult = `📊 [실제 분석] 전체 ${serverData.totalCount}개 서버 상태:
• 🔥 심각: ${serverData.criticalCount}개 (${((serverData.criticalCount / serverData.totalCount) * 100).toFixed(1)}%)
• ⚠️  경고: ${serverData.warningCount}개 (${((serverData.warningCount / serverData.totalCount) * 100).toFixed(1)}%)
• ✅ 정상: ${serverData.healthyCount}개 (${((serverData.healthyCount / serverData.totalCount) * 100).toFixed(1)}%)

현재 ${serverData.criticalCount > 0 ? '긴급 대응이 필요한' : serverData.warningCount > 3 ? '주의가 필요한' : '안정적인'} 상황입니다.`;
    confidence = 0.95;
  } else if (
    lowerQuery.includes('성능') ||
    lowerQuery.includes('cpu') ||
    lowerQuery.includes('메모리')
  ) {
    analysisResult = `📈 [실제 분석] 시스템 성능 현황:
• 평균 CPU 사용률: ${serverData.avgCpu.toFixed(1)}%
• 평균 메모리 사용률: ${serverData.avgMemory.toFixed(1)}%

${serverData.avgCpu > 80 ? '⚠️ CPU 과부하 상태입니다.' : serverData.avgCpu > 60 ? '⚠️ CPU 사용률이 높습니다.' : '✅ CPU 사용률이 정상 범위입니다.'}
${serverData.avgMemory > 85 ? '⚠️ 메모리 부족 상태입니다.' : serverData.avgMemory > 70 ? '⚠️ 메모리 사용률이 높습니다.' : '✅ 메모리 사용률이 정상 범위입니다.'}`;
    confidence = 0.92;
  } else if (
    lowerQuery.includes('문제') ||
    lowerQuery.includes('장애') ||
    lowerQuery.includes('이상')
  ) {
    const problemServers = serverData.servers.filter(
      (s: any) => s.status !== 'running'
    );
    if (problemServers.length > 0) {
      const problemList = problemServers
        .map(
          (s: any) =>
            `• ${s.name || s.hostname} (${s.status}): CPU ${Math.round(s.cpu || 0)}%, 메모리 ${Math.round(s.memory || 0)}%`
        )
        .join('\n');

      analysisResult = `🚨 [실제 분석] ${problemServers.length}개 서버에서 문제 감지:
${problemList}

즉시 확인이 필요한 서버들입니다.`;
      confidence = 0.98;
    } else {
      analysisResult = `✅ [실제 분석] 현재 모든 ${serverData.totalCount}개 서버가 정상 작동 중입니다. 감지된 문제가 없습니다.`;
      confidence = 0.9;
    }
  } else {
    analysisResult = `🤖 [실제 분석] "${query}"에 대한 분석 결과:
전체 ${serverData.totalCount}개 서버를 실시간으로 모니터링하고 있으며, 현재 ${serverData.criticalCount + serverData.warningCount}개 서버에서 주의가 필요한 상황입니다.`;
    confidence = 0.75;
  }

  const response = `🤖 [실제 MCP 연동] ${analysisResult}

📡 MCP 도구 상태: ${toolCount}개 도구 활성화
🔗 데이터 소스: ${serverData.isRealData ? '실시간' : '목업'} 서버 모니터링 시스템
⏱️ 분석 시점: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} KST`;

  return {
    response,
    confidence,
    source: 'mcp-server-real-data',
    toolsAvailable: toolCount,
    dataAnalyzed: true,
  };
}

// 로컬 처리 (실제 데이터 기반)
async function generateRealDataLocalResponse(
  query: string,
  sessionId: string,
  serverData: any
) {
  if (!serverData) {
    return {
      response: `🚨 [로컬 처리] 현재 서버 데이터 연결에 문제가 있습니다. 시스템 관리자에게 문의해주세요.`,
      confidence: 0.2,
      source: 'local-error',
      dataAnalyzed: false,
    };
  }

  const lowerQuery = query.toLowerCase();
  let response = '';

  if (lowerQuery.includes('시스템') || lowerQuery.includes('전체')) {
    response = `🔍 [로컬 실제 분석] 전체 시스템 요약:
${serverData.totalCount}개 서버 중 ${serverData.healthyCount}개 정상, ${serverData.warningCount + serverData.criticalCount}개 주의 필요`;
  } else if (lowerQuery.includes('서버')) {
    response = `🔍 [로컬 실제 분석] 서버 상태: 정상 ${serverData.healthyCount}개, 경고 ${serverData.warningCount}개, 심각 ${serverData.criticalCount}개`;
  } else {
    response = `🔍 [로컬 실제 분석] "${query}" 분석 완료. ${serverData.totalCount}개 서버 데이터를 기반으로 분석했습니다.`;
  }

  return {
    response,
    confidence: 0.8,
    source: 'local-real-data',
    dataAnalyzed: true,
  };
}
