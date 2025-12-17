/**
 * 🕸️ GraphRAG Type Definitions
 *
 * Types for graph-based retrieval augmented generation.
 *
 * @version 1.0.0
 * @created 2025-12-18
 */

/**
 * Relationship types between knowledge nodes
 */
export type KnowledgeRelationshipType =
  | 'causes' // A causes B (원인-결과)
  | 'solves' // A solves B (해결책)
  | 'related_to' // A is related to B (관련)
  | 'prerequisite' // A is prerequisite for B (선행조건)
  | 'part_of' // A is part of B (구성요소)
  | 'similar_to' // A is similar to B (유사)
  | 'contradicts' // A contradicts B (상충)
  | 'follows' // A follows B (순서)
  | 'depends_on'; // A depends on B (의존)

/**
 * Direction of relationship traversal
 */
export type RelationshipDirection = 'outgoing' | 'incoming' | 'bidirectional';

/**
 * Source table for knowledge nodes
 */
export type KnowledgeSourceTable = 'knowledge_base' | 'command_vectors';

/**
 * Knowledge relationship edge
 */
export interface KnowledgeRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  sourceTable: KnowledgeSourceTable;
  targetTable: KnowledgeSourceTable;
  relationshipType: KnowledgeRelationshipType;
  weight: number;
  description?: string;
  bidirectional: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Neighbor node from graph traversal
 */
export interface KnowledgeNeighbor {
  neighborId: string;
  neighborTable: KnowledgeSourceTable;
  relationshipType: KnowledgeRelationshipType;
  weight: number;
  direction: RelationshipDirection;
}

/**
 * Graph traversal result node
 */
export interface GraphTraversalNode {
  nodeId: string;
  nodeTable: KnowledgeSourceTable;
  hopDistance: number;
  pathWeight: number;
  relationshipPath: string[];
}

/**
 * Combined vector + graph search result
 */
export interface HybridGraphResult {
  id: string;
  content: string;
  title?: string;
  score: number;
  sourceType: 'vector' | 'graph';
  hopDistance: number;
  metadata?: Record<string, unknown>;
}

/**
 * Options for graph traversal
 */
export interface GraphTraversalOptions {
  maxHops?: number;
  relationshipTypes?: KnowledgeRelationshipType[];
  maxResults?: number;
  minWeight?: number;
}

/**
 * Options for hybrid search
 */
export interface HybridGraphSearchOptions {
  similarityThreshold?: number;
  maxVectorResults?: number;
  maxGraphHops?: number;
  maxTotalResults?: number;
  relationshipTypes?: KnowledgeRelationshipType[];
}

/**
 * Input for creating a relationship
 */
export interface CreateRelationshipInput {
  sourceId: string;
  targetId: string;
  sourceTable?: KnowledgeSourceTable;
  targetTable?: KnowledgeSourceTable;
  relationshipType: KnowledgeRelationshipType;
  weight?: number;
  description?: string;
  bidirectional?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * GraphRAG search result
 */
export interface GraphRAGSearchResult {
  success: boolean;
  results: HybridGraphResult[];
  vectorResultCount: number;
  graphResultCount: number;
  processingTime: number;
  context?: string;
}

/**
 * Relationship statistics
 */
export interface RelationshipStats {
  totalRelationships: number;
  byType: Record<KnowledgeRelationshipType, number>;
  avgWeight: number;
  bidirectionalCount: number;
}
