/**
 * GCP VM Express Server API Handlers
 *
 * GCP VM에서 실행 중인 Express 서버 API를 모킹합니다.
 *
 * @endpoint http://35.209.146.37:10000
 * @see .env.local의 GCP_VM_EXTERNAL_IP, MCP_SERVER_URL
 */

import { http, HttpResponse } from 'msw';

// .env.local에서 GCP VM URL 가져오기
const GCP_VM_URL = process.env.MCP_SERVER_URL || 'http://35.209.146.37:10000';

/**
 * GCP VM API 핸들러
 */
export const gcpVMHandlers = [
  /**
   * Health Check - 서버 상태 확인
   *
   * @example GET /health
   */
  http.get(`${GCP_VM_URL}/health`, () => {
    console.log('[MSW] GCP VM Health Check Mocked');

    return HttpResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 12345, // Mock uptime (seconds)
        version: '1.0.0',
      },
      { status: 200 }
    );
  }),

  /**
   * Server Metrics - 서버 메트릭 조회
   *
   * @example GET /metrics
   */
  http.get(`${GCP_VM_URL}/metrics`, () => {
    console.log('[MSW] GCP VM Metrics Mocked');

    return HttpResponse.json(
      {
        cpu: {
          usage: 45.5,
          cores: 2,
        },
        memory: {
          total: 4096,
          used: 2048,
          free: 2048,
          usage: 50,
        },
        disk: {
          total: 30720,
          used: 15360,
          free: 15360,
          usage: 50,
        },
        network: {
          rx_bytes: 1024000,
          tx_bytes: 512000,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }),

  /**
   * Execute Command - 명령어 실행 (MCP Server)
   *
   * @example POST /execute
   */
  http.post(`${GCP_VM_URL}/execute`, async ({ request }) => {
    const body = (await request.json()) as {
      command: string;
      args?: string[];
    };

    console.log(
      `[MSW] GCP VM Execute Mocked: command=${body.command}, args=${JSON.stringify(body.args || [])}`
    );

    return HttpResponse.json(
      {
        success: true,
        stdout: `[Mock Output] Command executed: ${body.command}`,
        stderr: '',
        exitCode: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }),

  /**
   * List Services - 서비스 목록 조회
   *
   * @example GET /services
   */
  http.get(`${GCP_VM_URL}/services`, () => {
    console.log('[MSW] GCP VM Services Mocked');

    return HttpResponse.json(
      {
        services: [
          {
            name: 'nginx',
            status: 'running',
            pid: 1234,
            uptime: 86400,
          },
          {
            name: 'postgresql',
            status: 'running',
            pid: 5678,
            uptime: 86400,
          },
          {
            name: 'redis',
            status: 'stopped',
            pid: null,
            uptime: 0,
          },
        ],
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }),

  /**
   * Get Logs - 로그 조회
   *
   * @example GET /logs/:serviceName
   */
  http.get(`${GCP_VM_URL}/logs/:serviceName`, ({ params }) => {
    const { serviceName } = params;

    console.log(`[MSW] GCP VM Logs Mocked: service=${String(serviceName)}`);

    return HttpResponse.json(
      {
        service: serviceName,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `[Mock Log] ${String(serviceName)} is running`,
          },
          {
            timestamp: new Date(Date.now() - 60000).toISOString(),
            level: 'warn',
            message: `[Mock Log] ${String(serviceName)} warning message`,
          },
        ],
        total: 2,
      },
      { status: 200 }
    );
  }),
];
