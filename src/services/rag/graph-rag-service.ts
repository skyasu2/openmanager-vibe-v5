/**
 * 🕸️ GraphRAG Service
 *
 * Graph-based Retrieval Augmented Generation service.
 * Extends vector similarity search with relationship traversal.
 *
 * Cost Impact: $0 (uses existing Supabase PostgreSQL)
 *
 * @version 1.0.0
 * @created 2025-12-18
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CreateRelationshipInput,
  GraphRAGSearchResult,
  GraphTraversalNode,
  GraphTraversalOptions,
  HybridGraphResult,
  HybridGraphSearchOptions,
  HybridTextGraphResult,
  HybridTextSearchOptions,
  HybridTextSearchResult,
  KnowledgeNeighbor,
  KnowledgeRelationship,
  KnowledgeRelationshipType,
  RelationshipStats,
} from '@/types/rag/graph-rag-types';

// Supabase client (reuse existing)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

/**
 * GraphRAG Service Class
 *
 * Provides graph-based retrieval capabilities on top of vector search.
 */
class GraphRAGService {
  private supabase;
  private isInitialized = false;

  constructor() {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.isInitialized = true;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Create a relationship between two knowledge nodes
   */
  async createRelationship(
    input: CreateRelationshipInput
  ): Promise<KnowledgeRelationship | null> {
    if (!this.supabase) {
      console.warn('🕸️ [GraphRAG] Supabase not initialized');
      return null;
    }

    const { data, error } = await this.supabase
      .from('knowledge_relationships')
      .insert({
        source_id: input.sourceId,
        target_id: input.targetId,
        source_table: input.sourceTable || 'knowledge_base',
        target_table: input.targetTable || 'knowledge_base',
        relationship_type: input.relationshipType,
        weight: input.weight ?? 1.0,
        description: input.description,
        bidirectional: input.bidirectional ?? false,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('🕸️ [GraphRAG] Failed to create relationship:', error);
      return null;
    }

    return this.mapToRelationship(data);
  }

  /**
   * Create multiple relationships in batch
   */
  async createRelationshipsBatch(
    inputs: CreateRelationshipInput[]
  ): Promise<number> {
    if (!this.supabase || inputs.length === 0) return 0;

    const records = inputs.map((input) => ({
      source_id: input.sourceId,
      target_id: input.targetId,
      source_table: input.sourceTable || 'knowledge_base',
      target_table: input.targetTable || 'knowledge_base',
      relationship_type: input.relationshipType,
      weight: input.weight ?? 1.0,
      description: input.description,
      bidirectional: input.bidirectional ?? false,
      metadata: input.metadata || {},
    }));

    const { data, error } = await this.supabase
      .from('knowledge_relationships')
      .insert(records)
      .select();

    if (error) {
      console.error('🕸️ [GraphRAG] Batch insert failed:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Get direct neighbors of a knowledge node
   */
  async getNeighbors(
    nodeId: string,
    nodeTable: string = 'knowledge_base',
    options: GraphTraversalOptions = {}
  ): Promise<KnowledgeNeighbor[]> {
    if (!this.supabase) return [];

    const { maxResults = 10, relationshipTypes, minWeight } = options;

    const { data, error } = await this.supabase.rpc('get_knowledge_neighbors', {
      p_node_id: nodeId,
      p_node_table: nodeTable,
      p_relationship_types: relationshipTypes || null,
      p_max_results: maxResults,
    });

    if (error) {
      console.error('🕸️ [GraphRAG] Failed to get neighbors:', error);
      return [];
    }

    let neighbors = (data || []).map(this.mapToNeighbor);

    // Filter by min weight if specified
    if (minWeight !== undefined) {
      neighbors = neighbors.filter(
        (n: KnowledgeNeighbor) => n.weight >= minWeight
      );
    }

    return neighbors;
  }

  /**
   * Traverse knowledge graph from a starting node
   */
  async traverseGraph(
    startId: string,
    startTable: string = 'knowledge_base',
    options: GraphTraversalOptions = {}
  ): Promise<GraphTraversalNode[]> {
    if (!this.supabase) return [];

    const { maxHops = 2, relationshipTypes, maxResults = 20 } = options;

    const { data, error } = await this.supabase.rpc(
      'traverse_knowledge_graph',
      {
        p_start_id: startId,
        p_start_table: startTable,
        p_max_hops: maxHops,
        p_relationship_types: relationshipTypes || null,
        p_max_results: maxResults,
      }
    );

    if (error) {
      console.error('🕸️ [GraphRAG] Graph traversal failed:', error);
      return [];
    }

    return (data || []).map(this.mapToTraversalNode);
  }

  /**
   * Hybrid search: Vector similarity + Graph expansion
   */
  async hybridSearch(
    queryEmbedding: number[],
    options: HybridGraphSearchOptions = {}
  ): Promise<GraphRAGSearchResult> {
    const startTime = Date.now();

    if (!this.supabase) {
      return {
        success: false,
        results: [],
        vectorResultCount: 0,
        graphResultCount: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const {
      similarityThreshold = 0.7,
      maxVectorResults = 5,
      maxGraphHops = 2,
      maxTotalResults = 15,
    } = options;

    // Convert embedding array to string format for pgvector
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const { data, error } = await this.supabase.rpc(
      'hybrid_graph_vector_search',
      {
        p_query_embedding: embeddingStr,
        p_similarity_threshold: similarityThreshold,
        p_max_vector_results: maxVectorResults,
        p_max_graph_hops: maxGraphHops,
        p_max_total_results: maxTotalResults,
      }
    );

    if (error) {
      console.error('🕸️ [GraphRAG] Hybrid search failed:', error);
      return {
        success: false,
        results: [],
        vectorResultCount: 0,
        graphResultCount: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const results: HybridGraphResult[] = (data || []).map(
      this.mapToHybridResult
    );
    const vectorResults = results.filter((r) => r.sourceType === 'vector');
    const graphResults = results.filter((r) => r.sourceType === 'graph');

    // Build context string
    const context = results
      .map((r, i) => {
        const source =
          r.sourceType === 'vector' ? '벡터' : `그래프(${r.hopDistance}홉)`;
        return `[${i + 1}] (${source}, 점수: ${r.score.toFixed(2)}) ${r.content}`;
      })
      .join('\n\n');

    return {
      success: true,
      results,
      vectorResultCount: vectorResults.length,
      graphResultCount: graphResults.length,
      processingTime: Date.now() - startTime,
      context,
    };
  }

  /**
   * Hybrid search with text: Vector + BM25 Text + Graph
   * This is the recommended method for 2025 RAG best practices.
   */
  async hybridTextSearch(
    queryEmbedding: number[],
    options: HybridTextSearchOptions = {}
  ): Promise<HybridTextSearchResult> {
    const startTime = Date.now();

    if (!this.supabase) {
      return {
        success: false,
        results: [],
        vectorResultCount: 0,
        textResultCount: 0,
        graphResultCount: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const {
      queryText,
      similarityThreshold = 0.5,
      textWeight = 0.3,
      vectorWeight = 0.5,
      graphWeight = 0.2,
      maxVectorResults = 5,
      maxTextResults = 5,
      maxGraphHops = 2,
      maxTotalResults = 15,
      filterCategory,
    } = options;

    // Convert embedding array to string format for pgvector
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const { data, error } = await this.supabase.rpc('hybrid_search_with_text', {
      p_query_embedding: embeddingStr,
      p_query_text: queryText || null,
      p_similarity_threshold: similarityThreshold,
      p_text_weight: textWeight,
      p_vector_weight: vectorWeight,
      p_graph_weight: graphWeight,
      p_max_vector_results: maxVectorResults,
      p_max_text_results: maxTextResults,
      p_max_graph_hops: maxGraphHops,
      p_max_total_results: maxTotalResults,
      p_filter_category: filterCategory || null,
    });

    if (error) {
      console.error('🕸️ [GraphRAG] Hybrid text search failed:', error);
      return {
        success: false,
        results: [],
        vectorResultCount: 0,
        textResultCount: 0,
        graphResultCount: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const results: HybridTextGraphResult[] = (data || []).map(
      this.mapToHybridTextResult
    );

    // Calculate counts by source type and scores
    const hybridResults = results.filter((r) => r.sourceType === 'hybrid');
    const graphResults = results.filter((r) => r.sourceType === 'graph');

    // Count based on dominant score
    let vectorDominant = 0;
    let textDominant = 0;

    for (const r of hybridResults) {
      if (r.vectorScore > r.textScore) {
        vectorDominant++;
      } else if (r.textScore > 0) {
        textDominant++;
      } else {
        vectorDominant++;
      }
    }

    // Calculate average scores
    const avgVectorScore =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.vectorScore, 0) / results.length
        : 0;
    const avgTextScore =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.textScore, 0) / results.length
        : 0;
    const avgGraphScore =
      graphResults.length > 0
        ? graphResults.reduce((sum, r) => sum + r.graphScore, 0) /
          graphResults.length
        : 0;

    // Build context string
    const context = results
      .map((r, i) => {
        const sourceLabel =
          r.sourceType === 'graph'
            ? `그래프(${r.hopDistance}홉)`
            : `하이브리드(V:${r.vectorScore.toFixed(2)}, T:${r.textScore.toFixed(2)})`;
        return `[${i + 1}] (${sourceLabel}, 점수: ${r.score.toFixed(2)}) ${r.content}`;
      })
      .join('\n\n');

    return {
      success: true,
      results,
      vectorResultCount: vectorDominant,
      textResultCount: textDominant,
      graphResultCount: graphResults.length,
      processingTime: Date.now() - startTime,
      context,
      scoreBreakdown: {
        avgVectorScore,
        avgTextScore,
        avgGraphScore,
      },
    };
  }

  /**
   * Text-only search (for testing/fallback)
   */
  async textSearch(
    queryText: string,
    options: { maxResults?: number; filterCategory?: string } = {}
  ): Promise<
    { id: string; title: string; content: string; textRank: number }[]
  > {
    if (!this.supabase || !queryText) return [];

    const { maxResults = 10, filterCategory } = options;

    const { data, error } = await this.supabase.rpc('search_knowledge_text', {
      p_query_text: queryText,
      p_max_results: maxResults,
      p_filter_category: filterCategory || null,
    });

    if (error) {
      console.error('🕸️ [GraphRAG] Text search failed:', error);
      return [];
    }

    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      content: row.content as string,
      textRank: row.text_rank as number,
    }));
  }

  /**
   * Get related concepts for a topic (simplified graph search)
   */
  async getRelatedConcepts(
    nodeId: string,
    relationshipTypes: KnowledgeRelationshipType[] = [
      'causes',
      'solves',
      'related_to',
    ]
  ): Promise<{ concept: string; relationship: string; weight: number }[]> {
    if (!this.supabase) return [];

    // Get neighbors with specified relationship types
    const neighbors = await this.getNeighbors(nodeId, 'knowledge_base', {
      relationshipTypes,
      maxResults: 10,
    });

    // Fetch content for each neighbor
    const results: { concept: string; relationship: string; weight: number }[] =
      [];

    for (const neighbor of neighbors) {
      const { data } = await this.supabase
        .from(neighbor.neighborTable)
        .select('title, content')
        .eq('id', neighbor.neighborId)
        .single();

      if (data) {
        results.push({
          concept: data.title || data.content?.substring(0, 100) || 'Unknown',
          relationship: neighbor.relationshipType,
          weight: neighbor.weight,
        });
      }
    }

    return results;
  }

  /**
   * Auto-suggest relationships based on content similarity
   */
  async suggestRelationships(
    nodeId: string,
    nodeTable: string = 'knowledge_base',
    similarityThreshold: number = 0.8
  ): Promise<CreateRelationshipInput[]> {
    if (!this.supabase) return [];

    // Get the source node's embedding
    const { data: sourceNode } = await this.supabase
      .from(nodeTable)
      .select('embedding, content, metadata')
      .eq('id', nodeId)
      .single();

    if (!sourceNode?.embedding) return [];

    // Find similar nodes
    const { data: similarNodes } = await this.supabase.rpc(
      'search_similar_vectors',
      {
        query_embedding: sourceNode.embedding,
        match_threshold: similarityThreshold,
        match_count: 10,
      }
    );

    if (!similarNodes) return [];

    // Generate relationship suggestions
    const suggestions: CreateRelationshipInput[] = [];

    for (const similar of similarNodes) {
      if (similar.id === nodeId) continue;

      // Infer relationship type from metadata/content
      const relationshipType = this.inferRelationshipType(
        sourceNode.content,
        similar.content,
        sourceNode.metadata,
        similar.metadata
      );

      suggestions.push({
        sourceId: nodeId,
        targetId: similar.id,
        sourceTable: nodeTable as 'knowledge_base' | 'command_vectors',
        targetTable: nodeTable as 'knowledge_base' | 'command_vectors',
        relationshipType,
        weight: similar.similarity || 0.8,
        description: `Auto-suggested based on ${(similar.similarity * 100).toFixed(0)}% similarity`,
      });
    }

    return suggestions;
  }

  /**
   * Get relationship statistics
   */
  async getStats(): Promise<RelationshipStats | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from('knowledge_relationships')
      .select('relationship_type, weight, bidirectional');

    if (error || !data) return null;

    const byType: Record<string, number> = {};
    let totalWeight = 0;
    let bidirectionalCount = 0;

    for (const row of data) {
      byType[row.relationship_type] = (byType[row.relationship_type] || 0) + 1;
      totalWeight += row.weight;
      if (row.bidirectional) bidirectionalCount++;
    }

    return {
      totalRelationships: data.length,
      byType: byType as Record<KnowledgeRelationshipType, number>,
      avgWeight: data.length > 0 ? totalWeight / data.length : 0,
      bidirectionalCount,
    };
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(relationshipId: string): Promise<boolean> {
    if (!this.supabase) return false;

    const { error } = await this.supabase
      .from('knowledge_relationships')
      .delete()
      .eq('id', relationshipId);

    return !error;
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private inferRelationshipType(
    sourceContent: string,
    targetContent: string,
    sourceMetadata?: Record<string, unknown>,
    targetMetadata?: Record<string, unknown>
  ): KnowledgeRelationshipType {
    const sourceLower = sourceContent?.toLowerCase() || '';
    const targetLower = targetContent?.toLowerCase() || '';

    // Check for cause-effect patterns
    if (
      sourceLower.includes('원인') ||
      sourceLower.includes('cause') ||
      targetLower.includes('결과') ||
      targetLower.includes('effect')
    ) {
      return 'causes';
    }

    // Check for solution patterns
    if (
      sourceMetadata?.category === 'troubleshooting' ||
      targetMetadata?.category === 'troubleshooting' ||
      targetLower.includes('해결') ||
      targetLower.includes('solution')
    ) {
      return 'solves';
    }

    // Check for prerequisite patterns
    if (
      sourceLower.includes('먼저') ||
      sourceLower.includes('prerequisite') ||
      sourceLower.includes('before')
    ) {
      return 'prerequisite';
    }

    // Default to related_to
    return 'related_to';
  }

  private mapToRelationship(
    row: Record<string, unknown>
  ): KnowledgeRelationship {
    return {
      id: row.id as string,
      sourceId: row.source_id as string,
      targetId: row.target_id as string,
      sourceTable: row.source_table as 'knowledge_base' | 'command_vectors',
      targetTable: row.target_table as 'knowledge_base' | 'command_vectors',
      relationshipType: row.relationship_type as KnowledgeRelationshipType,
      weight: row.weight as number,
      description: row.description as string | undefined,
      bidirectional: row.bidirectional as boolean,
      metadata: row.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapToNeighbor(row: Record<string, unknown>): KnowledgeNeighbor {
    return {
      neighborId: row.neighbor_id as string,
      neighborTable: row.neighbor_table as 'knowledge_base' | 'command_vectors',
      relationshipType: row.relationship_type as KnowledgeRelationshipType,
      weight: row.weight as number,
      direction: row.direction as 'outgoing' | 'incoming' | 'bidirectional',
    };
  }

  private mapToTraversalNode(row: Record<string, unknown>): GraphTraversalNode {
    return {
      nodeId: row.node_id as string,
      nodeTable: row.node_table as 'knowledge_base' | 'command_vectors',
      hopDistance: row.hop_distance as number,
      pathWeight: row.path_weight as number,
      relationshipPath: row.relationship_path as string[],
    };
  }

  private mapToHybridResult(row: Record<string, unknown>): HybridGraphResult {
    return {
      id: row.id as string,
      content: row.content as string,
      title: row.title as string | undefined,
      score: row.score as number,
      sourceType: row.source_type as 'vector' | 'graph',
      hopDistance: row.hop_distance as number,
      metadata: row.metadata as Record<string, unknown> | undefined,
    };
  }

  /**
   * Map database row to HybridTextGraphResult
   */
  private mapToHybridTextResult(
    row: Record<string, unknown>
  ): HybridTextGraphResult {
    return {
      id: row.id as string,
      content: row.content as string,
      title: row.title as string | undefined,
      category: row.category as string | undefined,
      score: row.score as number,
      vectorScore: row.vector_score as number,
      textScore: row.text_score as number,
      graphScore: row.graph_score as number,
      sourceType: row.source_type as 'vector' | 'graph' | 'hybrid',
      hopDistance: row.hop_distance as number,
      metadata: row.metadata as Record<string, unknown> | undefined,
    };
  }
}

// Export singleton instance
export const graphRAGService = new GraphRAGService();

export default graphRAGService;
