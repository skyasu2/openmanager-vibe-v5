/**
 * GraphRAG Relationship Automation Service
 *
 * Automatically extracts and stores relationships between knowledge_base entries.
 * Uses LLM to identify relationship types (causes, solves, related_to, etc.)
 *
 * ## Important: No Knowledge Expansion
 * This service ONLY creates relationships between EXISTING entries.
 * It does NOT add new knowledge to the knowledge_base.
 *
 * ## Cost Optimization
 * - Uses cached embeddings (no new embedding calls)
 * - Batched relationship extraction
 * - Incremental processing (only new/updated entries)
 *
 * ## Secret Configuration (2025-12-26)
 * Uses config-parser for unified JSON secret support.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config-parser';
import { getAnalystModel } from './model-config';

// ============================================================================
// Types
// ============================================================================

export type RelationshipType =
  | 'causes'
  | 'solves'
  | 'related_to'
  | 'prerequisite'
  | 'part_of'
  | 'similar_to'
  | 'contradicts'
  | 'follows'
  | 'depends_on';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  severity: string;
}

interface ExtractedRelationship {
  targetId: string;
  type: RelationshipType;
  weight: number;
  description: string;
  bidirectional: boolean;
}

interface RelationshipExtractionResult {
  sourceId: string;
  relationships: ExtractedRelationship[];
  processedAt: string;
}

interface GraphRAGStats {
  totalEntries: number;
  totalRelationships: number;
  lastProcessed: string | null;
  pendingEntries: number;
}

// ============================================================================
// Supabase Client Singleton
// ============================================================================

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const config = getSupabaseConfig();
  if (!config) {
    console.warn('⚠️ [GraphRAG] Supabase config missing');
    return null;
  }

  supabaseClient = createClient(config.url, config.serviceRoleKey);
  return supabaseClient;
}

// ============================================================================
// Relationship Type Detection (LLM-based)
// ============================================================================

const RELATIONSHIP_PROMPT = `You are analyzing relationships between knowledge entries in a server monitoring system.

Given two knowledge entries, identify if there's a meaningful relationship and classify it.

## Available Relationship Types:
- causes: A causes B (e.g., "High CPU" causes "Memory Exhaustion")
- solves: A is a solution for B (e.g., "Cache Cleanup" solves "Memory Leak")
- related_to: A is generally related to B
- prerequisite: A must happen before B
- part_of: A is a component of B
- similar_to: A and B describe similar concepts
- contradicts: A and B are contradictory
- follows: A comes after B in sequence
- depends_on: A requires B to function

## Instructions:
1. Analyze the content of both entries
2. Determine if there's a meaningful relationship
3. Return JSON with relationships found

## Output Format:
{
  "hasRelationship": boolean,
  "type": "causes" | "solves" | "related_to" | etc.,
  "weight": 0.0-1.0 (confidence),
  "description": "brief explanation",
  "bidirectional": boolean
}

If no meaningful relationship exists, return:
{ "hasRelationship": false }`;

async function detectRelationship(
  source: KnowledgeEntry,
  target: KnowledgeEntry
): Promise<ExtractedRelationship | null> {
  try {
    const model = getAnalystModel();

    const prompt = `${RELATIONSHIP_PROMPT}

## Entry A (Source):
Title: ${source.title}
Category: ${source.category}
Content: ${source.content.substring(0, 500)}

## Entry B (Target):
Title: ${target.title}
Category: ${target.category}
Content: ${target.content.substring(0, 500)}

Analyze and return JSON:`;

    const response = await model.invoke([{ role: 'user', content: prompt }]);
    const content = typeof response.content === 'string' ? response.content : '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);
    if (!result.hasRelationship) return null;

    return {
      targetId: target.id,
      type: result.type as RelationshipType,
      weight: Math.min(1.0, Math.max(0.0, result.weight || 0.7)),
      description: result.description || '',
      bidirectional: result.bidirectional || false,
    };
  } catch (error) {
    console.error('❌ [GraphRAG] Relationship detection failed:', error);
    return null;
  }
}

// ============================================================================
// Heuristic-based Relationship Detection (Fast, No LLM)
// ============================================================================

function detectRelationshipHeuristic(
  source: KnowledgeEntry,
  target: KnowledgeEntry
): ExtractedRelationship | null {
  const sourceText = `${source.title} ${source.content}`.toLowerCase();
  const targetText = `${target.title} ${target.content}`.toLowerCase();

  // Category-based relationships
  if (source.category === 'incident' && target.category === 'troubleshooting') {
    return {
      targetId: target.id,
      type: 'solves',
      weight: 0.8,
      description: `Troubleshooting guide for ${source.title}`,
      bidirectional: false,
    };
  }

  // Keyword patterns
  const causePatterns = ['causes', '원인', '발생', 'leads to', 'results in'];
  const solvePatterns = ['solves', '해결', 'fix', 'solution', '조치'];
  const prereqPatterns = ['requires', '필수', 'prerequisite', 'before', '사전'];

  // Check for cause relationship
  for (const pattern of causePatterns) {
    if (sourceText.includes(pattern) && hasOverlappingTopics(source, target)) {
      return {
        targetId: target.id,
        type: 'causes',
        weight: 0.7,
        description: `Potential cause-effect relationship`,
        bidirectional: false,
      };
    }
  }

  // Check for solve relationship
  for (const pattern of solvePatterns) {
    if (targetText.includes(pattern) && hasOverlappingTopics(source, target)) {
      return {
        targetId: target.id,
        type: 'solves',
        weight: 0.7,
        description: `Potential solution relationship`,
        bidirectional: false,
      };
    }
  }

  // Check for prerequisite relationship
  for (const pattern of prereqPatterns) {
    if (sourceText.includes(pattern) && hasOverlappingTopics(source, target)) {
      return {
        targetId: target.id,
        type: 'prerequisite',
        weight: 0.6,
        description: `Potential prerequisite relationship`,
        bidirectional: false,
      };
    }
  }

  // Tag overlap → related_to
  const tagOverlap = source.tags.filter((t) => target.tags.includes(t));
  if (tagOverlap.length >= 2) {
    return {
      targetId: target.id,
      type: 'related_to',
      weight: 0.5 + tagOverlap.length * 0.1,
      description: `Related by tags: ${tagOverlap.join(', ')}`,
      bidirectional: true,
    };
  }

  // Same category → similar_to (weaker relationship)
  if (source.category === target.category && hasOverlappingTopics(source, target)) {
    return {
      targetId: target.id,
      type: 'similar_to',
      weight: 0.4,
      description: `Same category: ${source.category}`,
      bidirectional: true,
    };
  }

  return null;
}

function hasOverlappingTopics(a: KnowledgeEntry, b: KnowledgeEntry): boolean {
  const topics = ['cpu', 'memory', 'disk', 'network', 'server', 'error', 'log', 'cache', 'database'];
  const aText = `${a.title} ${a.content}`.toLowerCase();
  const bText = `${b.title} ${b.content}`.toLowerCase();

  for (const topic of topics) {
    if (aText.includes(topic) && bText.includes(topic)) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Process knowledge entries and extract relationships (batch)
 * Uses heuristics first, then LLM for uncertain cases
 */
export async function extractRelationships(
  options: {
    useLLM?: boolean;
    batchSize?: number;
    onlyUnprocessed?: boolean;
  } = {}
): Promise<RelationshipExtractionResult[]> {
  const { useLLM = false, batchSize = 50, onlyUnprocessed = true } = options;

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('⚠️ [GraphRAG] Supabase not available');
    return [];
  }

  console.log(`🔗 [GraphRAG] Starting relationship extraction (LLM: ${useLLM})`);

  // Fetch knowledge entries
  const { data: entries, error } = await supabase
    .from('knowledge_base')
    .select('id, title, content, category, tags, severity')
    .order('created_at', { ascending: false })
    .limit(batchSize);

  if (error || !entries) {
    console.error('❌ [GraphRAG] Failed to fetch entries:', error);
    return [];
  }

  console.log(`📊 [GraphRAG] Processing ${entries.length} entries`);

  const results: RelationshipExtractionResult[] = [];
  const newRelationships: Array<{
    source_id: string;
    target_id: string;
    source_table: string;
    target_table: string;
    relationship_type: RelationshipType;
    weight: number;
    description: string;
    bidirectional: boolean;
  }> = [];

  // Get existing relationships to avoid duplicates
  const { data: existingRels } = await supabase
    .from('knowledge_relationships')
    .select('source_id, target_id');

  const existingSet = new Set(
    (existingRels || []).map((r) => `${r.source_id}-${r.target_id}`)
  );

  // Process each pair
  for (let i = 0; i < entries.length; i++) {
    const source = entries[i];
    const extractedRels: ExtractedRelationship[] = [];

    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;

      const target = entries[j];
      const pairKey = `${source.id}-${target.id}`;

      // Skip if already exists
      if (existingSet.has(pairKey)) continue;

      // Try heuristic first
      let relationship = detectRelationshipHeuristic(source, target);

      // If no heuristic match and LLM is enabled, use LLM
      if (!relationship && useLLM) {
        relationship = await detectRelationship(source, target);
      }

      if (relationship) {
        extractedRels.push(relationship);
        newRelationships.push({
          source_id: source.id,
          target_id: relationship.targetId,
          source_table: 'knowledge_base',
          target_table: 'knowledge_base',
          relationship_type: relationship.type,
          weight: relationship.weight,
          description: relationship.description,
          bidirectional: relationship.bidirectional,
        });
        existingSet.add(pairKey);
      }
    }

    if (extractedRels.length > 0) {
      results.push({
        sourceId: source.id,
        relationships: extractedRels,
        processedAt: new Date().toISOString(),
      });
    }
  }

  // Batch insert new relationships
  if (newRelationships.length > 0) {
    const { error: insertError } = await supabase
      .from('knowledge_relationships')
      .insert(newRelationships);

    if (insertError) {
      console.error('❌ [GraphRAG] Failed to insert relationships:', insertError);
    } else {
      console.log(`✅ [GraphRAG] Inserted ${newRelationships.length} new relationships`);
    }
  }

  return results;
}

/**
 * Get GraphRAG statistics
 */
export async function getGraphRAGStats(): Promise<GraphRAGStats | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const [entriesResult, relsResult] = await Promise.all([
      supabase.from('knowledge_base').select('id', { count: 'exact', head: true }),
      supabase.from('knowledge_relationships').select('id, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(1),
    ]);

    return {
      totalEntries: entriesResult.count || 0,
      totalRelationships: relsResult.count || 0,
      lastProcessed: relsResult.data?.[0]?.created_at || null,
      pendingEntries: 0, // Would need more complex logic
    };
  } catch (error) {
    console.error('❌ [GraphRAG] Stats fetch failed:', error);
    return null;
  }
}

/**
 * Hybrid search: Vector similarity + Graph traversal
 */
export async function hybridGraphSearch(
  queryEmbedding: number[],
  options: {
    similarityThreshold?: number;
    maxVectorResults?: number;
    maxGraphHops?: number;
    maxTotalResults?: number;
  } = {}
): Promise<Array<{
  id: string;
  title: string;
  content: string;
  score: number;
  sourceType: 'vector' | 'graph';
  hopDistance: number;
}>> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const {
    similarityThreshold = 0.3,
    maxVectorResults = 5,
    maxGraphHops = 2,
    maxTotalResults = 15,
  } = options;

  try {
    const { data, error } = await supabase.rpc('hybrid_graph_vector_search', {
      p_query_embedding: `[${queryEmbedding.join(',')}]`,
      p_similarity_threshold: similarityThreshold,
      p_max_vector_results: maxVectorResults,
      p_max_graph_hops: maxGraphHops,
      p_max_total_results: maxTotalResults,
    });

    if (error) {
      console.error('❌ [GraphRAG] Hybrid search failed:', error);
      return [];
    }

    return (data || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      title: String(row.title || ''),
      content: String(row.content || ''),
      score: Number(row.score || 0),
      sourceType: row.source_type as 'vector' | 'graph',
      hopDistance: Number(row.hop_distance || 0),
    }));
  } catch (error) {
    console.error('❌ [GraphRAG] Hybrid search error:', error);
    return [];
  }
}

/**
 * Get related knowledge through graph traversal
 */
export async function getRelatedKnowledge(
  nodeId: string,
  options: {
    maxHops?: number;
    relationshipTypes?: RelationshipType[];
    maxResults?: number;
  } = {}
): Promise<Array<{
  id: string;
  title: string;
  content: string;
  hopDistance: number;
  pathWeight: number;
  relationshipPath: string[];
}>> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { maxHops = 2, relationshipTypes = null, maxResults = 10 } = options;

  try {
    const { data, error } = await supabase.rpc('traverse_knowledge_graph', {
      p_start_id: nodeId,
      p_start_table: 'knowledge_base',
      p_max_hops: maxHops,
      p_relationship_types: relationshipTypes,
      p_max_results: maxResults,
    });

    if (error) {
      console.error('❌ [GraphRAG] Graph traversal failed:', error);
      return [];
    }

    // Fetch actual content for results
    const nodeIds = (data || []).map((r: Record<string, unknown>) => r.node_id);
    if (nodeIds.length === 0) return [];

    const { data: entries } = await supabase
      .from('knowledge_base')
      .select('id, title, content')
      .in('id', nodeIds);

    const entryMap = new Map((entries || []).map((e) => [e.id, e]));

    return (data || []).map((row: Record<string, unknown>) => {
      const entry = entryMap.get(row.node_id as string);
      return {
        id: String(row.node_id),
        title: entry?.title || '',
        content: entry?.content || '',
        hopDistance: Number(row.hop_distance),
        pathWeight: Number(row.path_weight),
        relationshipPath: (row.relationship_path as string[]) || [],
      };
    });
  } catch (error) {
    console.error('❌ [GraphRAG] Related knowledge fetch error:', error);
    return [];
  }
}
