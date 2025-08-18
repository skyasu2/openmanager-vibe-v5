import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { devKeyManager } from '@/utils/dev-key-manager';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  DevKeyManagerActionSchema,
  DevKeyManagerStatusResponseSchema,
  DevKeyManagerReportResponseSchema,
  DevKeyManagerEnvResponseSchema,
  DevKeyManagerSetupResponseSchema,
  DevKeyManagerDefaultResponseSchema,
  DevKeyManagerErrorResponseSchema,
  type DevKeyManagerAction,
  type DevKeyManagerStatusResponse,
  type DevKeyManagerReportResponse,
  type DevKeyManagerEnvResponse,
  type DevKeyManagerSetupResponse,
  type DevKeyManagerDefaultResponse,
  type DevKeyManagerValidation,
  type DevKeyManagerErrorResponse,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';
import debug from '@/utils/debug';

// GET handler
const getHandler = createApiRoute()
  .query(
    z.object({
      action: DevKeyManagerActionSchema.optional(),
    })
  )
  .response(
    z.union([
      DevKeyManagerStatusResponseSchema,
      DevKeyManagerReportResponseSchema,
      DevKeyManagerEnvResponseSchema,
      DevKeyManagerSetupResponseSchema,
      DevKeyManagerDefaultResponseSchema,
    ])
  )
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(
    async (
      _request,
      context
    ): Promise<
      | DevKeyManagerStatusResponse
      | DevKeyManagerReportResponse
      | DevKeyManagerEnvResponse
      | DevKeyManagerSetupResponse
      | DevKeyManagerDefaultResponse
    > => {
      // 🚫 개발 환경에서만 접근 허용
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Dev endpoints are only available in development');
      }

      const action = context.query?.action;

      switch (action) {
        case 'status': {
          const validation = devKeyManager.validateAllKeys();
          return {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            summary: {
              total: validation.details.length,
              valid: validation.valid,
              invalid: validation.invalid,
              missing: validation.missing,
              successRate: Math.round(
                (validation.valid / validation.details.length) * 100
              ),
            },
            services: validation.details.map((detail) => ({
              name: detail.key, // Use key as name since that's what we have
              key: detail.key,
              configured: detail.status !== 'missing',
              valid: detail.status === 'valid',
              message: detail.message,
            })),
          };
        }

        case 'report': {
          const report = devKeyManager.getStatusReport();
          return {
            timestamp: new Date().toISOString(),
            report: report,
          };
        }

        case 'generate-env': {
          const envResult = await devKeyManager.generateEnvFile();
          return {
            timestamp: new Date().toISOString(),
            ...envResult,
          };
        }

        case 'quick-setup': {
          const setupResult = await devKeyManager.quickSetup();
          return {
            timestamp: new Date().toISOString(),
            ...setupResult,
          };
        }

        default: {
          // 기본: 상태 정보 반환
          const defaultValidation = devKeyManager.validateAllKeys();
          return {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            keyManager: 'DevKeyManager v1.0',
            summary: {
              total: defaultValidation.details.length,
              valid: defaultValidation.valid,
              invalid: defaultValidation.invalid,
              missing: defaultValidation.missing,
              successRate: Math.round(
                (defaultValidation.valid / defaultValidation.details.length) *
                  100
              ),
            },
            availableActions: [
              'status',
              'report',
              'generate-env',
              'quick-setup',
            ],
          };
        }
      }
    }
  );

export async function GET(request: NextRequest) {
  try {
    // 🚫 개발 환경에서만 접근 허용
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Dev endpoints are only available in development' },
        { status: 404 }
      );
    }

    return await getHandler(request);
  } catch (error) {
    debug.error('❌ DevKeyManager API 오류:', error);

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: getErrorMessage(error),
        keyManager: 'DevKeyManager v1.0',
      } satisfies DevKeyManagerErrorResponse,
      { status: 500 }
    );
  }
}
