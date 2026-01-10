/**
 * 🎯 Rules API Endpoint
 *
 * Provides access to system rules configuration from Supabase.
 * Falls back to JSON when Supabase is unavailable.
 *
 * @route GET /api/rules - Get all rules
 * @route GET /api/rules?metric=cpu - Get specific threshold
 * @route POST /api/rules (Admin only) - Update rules
 */

import { type NextRequest, NextResponse } from 'next/server';
import systemRulesJson from '@/config/rules/system-rules.json';
import type { MetricThreshold, SystemRules } from '@/config/rules/types';
import { logger } from '@/lib/logging';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/rules
 * Returns system rules (thresholds, alert rules, etc.)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const metric = request.nextUrl.searchParams.get('metric');

  try {
    // Try Supabase first
    const { data, error } = await supabaseAdmin
      .from('system_rules')
      .select('category, key, value, description, enabled')
      .eq('enabled', true);

    if (error) {
      logger.warn('⚠️ Supabase rules fetch failed:', error.message);
      return returnJsonFallback(metric);
    }

    if (!data || data.length === 0) {
      logger.warn('⚠️ No rules in Supabase, using JSON fallback');
      return returnJsonFallback(metric);
    }

    // Transform Supabase data to SystemRules format
    const rules = transformToSystemRules(data);

    // If specific metric requested
    if (metric && metric in rules.thresholds) {
      return NextResponse.json({
        success: true,
        data: rules.thresholds[metric as keyof SystemRules['thresholds']],
        source: 'supabase',
      });
    }

    return NextResponse.json({
      success: true,
      data: rules,
      source: 'supabase',
    });
  } catch (err) {
    logger.error('❌ Rules API error:', err);
    return returnJsonFallback(metric);
  }
}

/**
 * JSON 폴백 응답 반환
 */
function returnJsonFallback(metric: string | null): NextResponse {
  const rules = systemRulesJson as unknown as SystemRules;

  if (metric && metric in rules.thresholds) {
    return NextResponse.json({
      success: true,
      data: rules.thresholds[metric as keyof SystemRules['thresholds']],
      source: 'json',
      message: 'Using JSON fallback',
    });
  }

  return NextResponse.json({
    success: true,
    data: rules,
    source: 'json',
    message: 'Using JSON fallback',
  });
}

/**
 * Supabase 데이터를 SystemRules 형식으로 변환
 */
function transformToSystemRules(
  records: Array<{
    category: string;
    key: string;
    value: unknown;
    description?: string;
    enabled?: boolean;
  }>
): SystemRules {
  // Start with JSON defaults
  const rules = systemRulesJson as unknown as SystemRules;

  for (const record of records) {
    if (record.category === 'thresholds') {
      const key = record.key as keyof SystemRules['thresholds'];
      if (key in rules.thresholds && typeof record.value === 'object') {
        rules.thresholds[key] = record.value as MetricThreshold;
      }
    } else if (record.category === 'ai_instructions') {
      if (typeof record.value === 'string') {
        rules.metadata.aiInstructions = record.value;
      }
    }
  }

  return rules;
}

/**
 * POST /api/rules (Future: Admin rule updates)
 * Currently disabled - implement with proper auth
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      source: 'json',
      error: 'Rule updates not yet implemented. Edit via Supabase dashboard.',
    },
    { status: 501 }
  );
}
