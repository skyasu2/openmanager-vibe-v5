/**
 * Incident RAG Injector
 *
 * Automatically injects approved incident reports into knowledge_base
 * for RAG search by Reporter Agent.
 *
 * Flow:
 * 1. Fetch approved incident_report entries from approval_history
 * 2. Skip already-synced entries (check source_ref)
 * 3. Generate embeddings using Gemini text-embedding-004
 * 4. Insert into knowledge_base with category='incident'
 *
 * Rate Limit: Batch of 10, called on-demand only
 *
 * @version 1.0.0
 * @created 2025-12-30
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config-parser';
import { embedText, toVectorString } from './embedding';

// ============================================================================
// Types
// ============================================================================

interface ApprovedIncident {
  id: string;
  session_id: string;
  description: string;
  payload: Record<string, unknown>;
  requested_at: string;
  decided_at: string;
}

interface IncidentKnowledgeEntry {
  title: string;
  content: string;
  embedding?: string; // Vector string format
  category: 'incident';
  tags: string[];
  severity: 'info' | 'warning' | 'critical';
  source: 'auto_generated';
  serverTypes: string[]; // Maps to related_server_types column
  source_ref: string; // approval_history.session_id for dedup
}

interface SyncResult {
  success: boolean;
  synced: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// ============================================================================
// Supabase Client
// ============================================================================

let supabaseClient: SupabaseClient | null = null;
let initFailed = false;

function getSupabaseClient(): SupabaseClient | null {
  if (initFailed) return null;
  if (supabaseClient) return supabaseClient;

  const config = getSupabaseConfig();
  if (!config) {
    initFailed = true;
    console.warn('⚠️ [IncidentRAG] Supabase config missing');
    return null;
  }

  try {
    supabaseClient = createClient(config.url, config.serviceRoleKey);
    console.log('✅ [IncidentRAG] Supabase client initialized');
    return supabaseClient;
  } catch (e) {
    initFailed = true;
    console.error('❌ [IncidentRAG] Supabase init failed:', e);
    return null;
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Extract incident content for embedding from payload
 */
function extractIncidentContent(incident: ApprovedIncident): {
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical';
  tags: string[];
  serverTypes: string[];
} {
  const payload = incident.payload;

  // Extract title
  const title =
    (payload.title as string) ||
    (payload.summary as string) ||
    incident.description ||
    '인시던트 보고서';

  // Build rich content for embedding
  const contentParts: string[] = [];

  // Add description
  if (incident.description) {
    contentParts.push(`## 개요\n${incident.description}`);
  }

  // Add root cause if available
  if (payload.root_cause_analysis) {
    const rca = payload.root_cause_analysis as Record<string, unknown>;
    contentParts.push(`## 근본 원인\n${rca.primary_cause || ''}`);
    if (Array.isArray(rca.contributing_factors)) {
      contentParts.push(`기여 요인: ${rca.contributing_factors.join(', ')}`);
    }
  }

  // Add recommendations
  if (Array.isArray(payload.recommendations)) {
    const recs = payload.recommendations as Array<{ action?: string }>;
    const recTexts = recs.map((r) => r.action || String(r)).join('\n- ');
    contentParts.push(`## 권장 조치\n- ${recTexts}`);
  }

  // Add affected servers
  if (Array.isArray(payload.affected_servers)) {
    contentParts.push(`## 영향 서버\n${(payload.affected_servers as string[]).join(', ')}`);
  }

  // Add pattern if available
  if (payload.pattern) {
    contentParts.push(`## 패턴\n${payload.pattern}`);
  }

  // Add timeline if available
  if (Array.isArray(payload.timeline)) {
    const timeline = payload.timeline as Array<{
      timestamp?: string;
      event?: string;
    }>;
    const timelineText = timeline
      .map((t) => `- ${t.timestamp || ''}: ${t.event || ''}`)
      .join('\n');
    contentParts.push(`## 타임라인\n${timelineText}`);
  }

  // Extract severity
  let severity: 'info' | 'warning' | 'critical' = 'info';
  const payloadSeverity = String(payload.severity || '').toLowerCase();
  if (payloadSeverity === 'critical' || payloadSeverity === '위험') {
    severity = 'critical';
  } else if (
    payloadSeverity === 'high' ||
    payloadSeverity === 'warning' ||
    payloadSeverity === '높음'
  ) {
    severity = 'warning';
  }

  // Extract tags
  const tags: string[] = ['incident', 'auto-generated'];
  if (payload.category) tags.push(String(payload.category));
  if (payload.pattern) tags.push(String(payload.pattern));

  // Extract server types from affected servers
  const serverTypes: string[] = [];
  if (Array.isArray(payload.affected_servers)) {
    // Try to infer server types from names
    const servers = payload.affected_servers as string[];
    for (const server of servers) {
      const lower = server.toLowerCase();
      if (lower.includes('web')) serverTypes.push('web');
      else if (lower.includes('db') || lower.includes('database'))
        serverTypes.push('database');
      else if (lower.includes('api') || lower.includes('app'))
        serverTypes.push('application');
      else if (lower.includes('cache') || lower.includes('redis'))
        serverTypes.push('cache');
      else if (lower.includes('storage')) serverTypes.push('storage');
    }
  }

  return {
    title,
    content: contentParts.join('\n\n'),
    severity,
    tags: [...new Set(tags)],
    serverTypes: [...new Set(serverTypes)],
  };
}

/**
 * Check if incident is already synced to knowledge_base
 */
async function isAlreadySynced(
  supabase: SupabaseClient,
  sessionId: string
): Promise<boolean> {
  // Check if knowledge_base has this session_id in source_ref
  // We use tags to store source reference
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id')
    .eq('category', 'incident')
    .eq('source', 'auto_generated')
    .contains('tags', [sessionId])
    .limit(1);

  if (error) {
    console.warn('⚠️ [IncidentRAG] Dedup check failed:', error);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

/**
 * Insert incident into knowledge_base with embedding
 */
async function insertToKnowledgeBase(
  supabase: SupabaseClient,
  entry: IncidentKnowledgeEntry
): Promise<boolean> {
  try {
    const { error } = await supabase.from('knowledge_base').insert({
      title: entry.title,
      content: entry.content,
      embedding: entry.embedding,
      category: entry.category,
      tags: entry.tags,
      severity: entry.severity,
      source: entry.source,
      related_server_types: entry.serverTypes || [],
    });

    if (error) {
      console.error('❌ [IncidentRAG] Insert failed:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('❌ [IncidentRAG] Insert error:', e);
    return false;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Sync approved incident reports to knowledge_base for RAG
 *
 * @param options - Sync options
 * @param options.limit - Max number of incidents to sync (default: 10)
 * @param options.daysBack - How many days back to look (default: 30)
 * @returns Sync result with counts
 */
export async function syncIncidentsToRAG(
  options: { limit?: number; daysBack?: number } = {}
): Promise<SyncResult> {
  const { limit = 10, daysBack = 30 } = options;
  const result: SyncResult = {
    success: false,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  console.log(
    `🔄 [IncidentRAG] Starting sync (limit=${limit}, daysBack=${daysBack})`
  );

  const supabase = getSupabaseClient();
  if (!supabase) {
    result.errors.push('Supabase not available');
    return result;
  }

  try {
    // 1. Fetch approved incident reports from approval_history
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);

    const { data: incidents, error: fetchError } = await supabase
      .from('approval_history')
      .select('id, session_id, description, payload, requested_at, decided_at')
      .eq('action_type', 'incident_report')
      .eq('status', 'approved')
      .gte('decided_at', sinceDate.toISOString())
      .order('decided_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      result.errors.push(`Fetch error: ${fetchError.message}`);
      return result;
    }

    if (!incidents || incidents.length === 0) {
      console.log('✅ [IncidentRAG] No new incidents to sync');
      result.success = true;
      return result;
    }

    console.log(`📋 [IncidentRAG] Found ${incidents.length} approved incidents`);

    // 2. Process each incident
    for (const incident of incidents as ApprovedIncident[]) {
      try {
        // Check dedup
        if (await isAlreadySynced(supabase, incident.session_id)) {
          console.log(`⏭️ [IncidentRAG] Skipping already synced: ${incident.session_id}`);
          result.skipped++;
          continue;
        }

        // Extract content
        const extracted = extractIncidentContent(incident);

        if (!extracted.content || extracted.content.length < 20) {
          console.warn(`⚠️ [IncidentRAG] Insufficient content for: ${incident.session_id}`);
          result.skipped++;
          continue;
        }

        // Generate embedding
        const embeddingText = `${extracted.title}\n\n${extracted.content}`;
        const embedding = await embedText(embeddingText);
        const vectorString = toVectorString(embedding);

        // Insert to knowledge_base
        const entry: IncidentKnowledgeEntry = {
          title: extracted.title,
          content: extracted.content,
          embedding: vectorString,
          category: 'incident',
          tags: [...extracted.tags, incident.session_id], // Include session_id for dedup
          severity: extracted.severity,
          source: 'auto_generated',
          serverTypes: extracted.serverTypes,
          source_ref: incident.session_id,
        };

        const inserted = await insertToKnowledgeBase(supabase, entry);

        if (inserted) {
          console.log(`✅ [IncidentRAG] Synced: ${incident.session_id}`);
          result.synced++;
        } else {
          result.failed++;
        }
      } catch (e) {
        console.error(`❌ [IncidentRAG] Error processing ${incident.session_id}:`, e);
        result.errors.push(`${incident.session_id}: ${String(e)}`);
        result.failed++;
      }
    }

    result.success = true;
    console.log(
      `✅ [IncidentRAG] Sync complete: ${result.synced} synced, ${result.skipped} skipped, ${result.failed} failed`
    );

    return result;
  } catch (e) {
    console.error('❌ [IncidentRAG] Sync failed:', e);
    result.errors.push(String(e));
    return result;
  }
}

/**
 * Get RAG injection stats
 */
export async function getRAGInjectionStats(): Promise<{
  totalIncidents: number;
  syncedIncidents: number;
  pendingSync: number;
} | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // Count total approved incidents (last 30 days)
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);

    const { count: totalCount } = await supabase
      .from('approval_history')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'incident_report')
      .eq('status', 'approved')
      .gte('decided_at', sinceDate.toISOString());

    // Count synced incidents in knowledge_base
    const { count: syncedCount } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'incident')
      .eq('source', 'auto_generated');

    return {
      totalIncidents: totalCount || 0,
      syncedIncidents: syncedCount || 0,
      pendingSync: Math.max(0, (totalCount || 0) - (syncedCount || 0)),
    };
  } catch (e) {
    console.error('❌ [IncidentRAG] Stats error:', e);
    return null;
  }
}

export default { syncIncidentsToRAG, getRAGInjectionStats };
