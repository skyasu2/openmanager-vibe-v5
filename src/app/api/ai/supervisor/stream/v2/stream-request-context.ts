/**
 * Supervisor Stream V2 — 요청 컨텍스트 해석
 *
 * `route.ts` POST 핸들러에서 "요청 해석" 책임만 분리한 모듈이다.
 * 세션 ID 스코프, 디바이스 타입, rate-limit identity, 내부 공개(disclosure) 모드,
 * 웜업 힌트를 한 번에 계산한다. 업스트림 전송/실행 로직은 포함하지 않는다.
 */

import type { NextRequest } from 'next/server';
import { buildJobQueryAsOf } from '@/lib/ai/query-as-of';
import {
  normalizeSupervisorDeviceType,
  type SupervisorDeviceType,
} from '@/lib/ai/supervisor/request-contracts';
import { getAPIAuthContext } from '@/lib/auth/api-auth';
import { logger } from '@/lib/logging';
import {
  createRateLimitIdentityHeaders,
  getRateLimitIdentity,
} from '@/lib/security/rate-limit-identity';
import {
  createInternalDisclosureFields,
  type InternalDisclosureFields,
  resolveSupervisorInternalDisclosureMode,
  type SupervisorInternalDisclosureMode,
} from '../../internal-disclosure-mode';
import { resolveScopedSessionIds } from '../../session-owner';
import {
  AI_FIRST_QUERY_HEADER,
  AI_WARMUP_STARTED_AT_HEADER,
  normalizeFrontendLocalRouteDecision,
} from './stream-response-builder';
import {
  isWarmupAwareFirstQuery,
  parseWarmupStartedAt,
} from './stream-timeouts';

export interface StreamRequestContext {
  queryAsOf: ReturnType<typeof buildJobQueryAsOf>;
  localRouteDecision: ReturnType<typeof normalizeFrontendLocalRouteDecision>;
  sessionId: string;
  backendSessionId: string;
  cacheSessionId: string;
  deviceType: SupervisorDeviceType;
  rateLimitIdentityHeaders: Record<string, string>;
  internalDisclosureMode: SupervisorInternalDisclosureMode | undefined;
  internalDisclosureFields: InternalDisclosureFields;
  warmupStartedAt: number | null;
  isFirstQuery: boolean;
  isFirstWarmupQuery: boolean;
}

export function resolveStreamRequestContext(params: {
  req: NextRequest;
  chatSessionId?: string;
  bodySessionId?: string;
  queryAsOfDataSlot?: unknown;
  rawLocalRouteDecision?: unknown;
}): StreamRequestContext {
  const { req, chatSessionId, bodySessionId, rawLocalRouteDecision } = params;

  const queryAsOf = buildJobQueryAsOf(
    new Date().toISOString(),
    params.queryAsOfDataSlot
  );
  const localRouteDecision = normalizeFrontendLocalRouteDecision(
    rawLocalRouteDecision
  );
  if (rawLocalRouteDecision !== undefined && !localRouteDecision) {
    logger.warn(
      '[SupervisorStreamV2] Ignoring invalid localRouteDecision payload'
    );
  }

  const { sessionId, backendSessionId, cacheSessionId } =
    resolveScopedSessionIds(req, bodySessionId ?? chatSessionId);
  const deviceType = normalizeSupervisorDeviceType(
    req.headers.get('X-Device-Type')
  );
  const rateLimitIdentity = getRateLimitIdentity(req, backendSessionId);
  const rateLimitIdentityHeaders =
    createRateLimitIdentityHeaders(rateLimitIdentity);
  const internalDisclosureMode = resolveSupervisorInternalDisclosureMode(
    getAPIAuthContext(req)
  );
  const internalDisclosureFields = createInternalDisclosureFields({
    mode: internalDisclosureMode,
    audience: 'supervisor',
    subject: backendSessionId,
  });
  const warmupStartedAt = parseWarmupStartedAt(
    req.headers.get(AI_WARMUP_STARTED_AT_HEADER)
  );
  const isFirstQuery = req.headers.get(AI_FIRST_QUERY_HEADER) === '1';
  const isFirstWarmupQuery = isWarmupAwareFirstQuery(
    warmupStartedAt,
    isFirstQuery
  );

  return {
    queryAsOf,
    localRouteDecision,
    sessionId,
    backendSessionId,
    cacheSessionId,
    deviceType,
    rateLimitIdentityHeaders,
    internalDisclosureMode,
    internalDisclosureFields,
    warmupStartedAt,
    isFirstQuery,
    isFirstWarmupQuery,
  };
}
