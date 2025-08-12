/**
 * 💾 CloudContextLoader Storage Module
 * 
 * Storage operations for context documents:
 * - Firestore persistent storage
 * - Memory cache management
 * - Context CRUD operations
 * - Cache invalidation
 * - Statistics tracking
 */

import type { 
  ContextDocument, 
  CloudContextLoaderConfig,
  ContextStatsResponse
} from './CloudContextLoader.types';
import { MemoryContextCache } from './CloudContextLoader.cache';
import { generateContextId } from './CloudContextLoader.utils';

/**
 * 컨텍스트 스토리지 관리자
 */
export class ContextStorageManager {
  private config: CloudContextLoaderConfig;
  private memoryCache: MemoryContextCache;
  private contextCache: Map<string, ContextDocument> = new Map();

  constructor(config: CloudContextLoaderConfig) {
    this.config = config;
    this.memoryCache = new MemoryContextCache();
  }

  /**
   * 📚 컨텍스트 번들 저장 (Firestore + Memory)
   */
  async saveContextBundle(contextDoc: ContextDocument): Promise<boolean> {
    try {
      // 1. Firestore에 영구 저장
      if (this.config.enableFirestore) {
        await this.saveToFirestore(contextDoc);
      }

      // 2. 메모리 캐싱
      if (this.config.enableMemoryCache) {
        await this.saveToMemory(contextDoc);
      }

      // 3. 메모리 캐시 업데이트
      this.updateMemoryCache(contextDoc);

      console.log(`📚 컨텍스트 번들 저장 완료: ${contextDoc.id}`);
      return true;
    } catch (error) {
      console.error('❌ 컨텍스트 번들 저장 실패:', error);
      return false;
    }
  }

  /**
   * 🔍 컨텍스트 번들 로드 (Memory → Firestore → 캐시 순서)
   */
  async loadContextBundle(
    bundleType: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<ContextDocument | null> {
    try {
      const contextId = generateContextId(bundleType, clientId);

      // 1. 메모리 캐시 확인
      if (this.contextCache.has(contextId)) {
        console.log(`✅ 메모리 캐시에서 컨텍스트 로드: ${contextId}`);
        return this.contextCache.get(contextId);
      }

      // 2. 메모리 캐시에서 조회
      if (this.config.enableMemoryCache) {
        const cached = await this.getFromMemory(contextId);
        if (cached) {
          this.updateMemoryCache(cached);
          console.log(`✅ 메모리에서 컨텍스트 로드: ${contextId}`);
          return cached;
        }
      }

      // 3. Firestore에서 조회
      if (this.config.enableFirestore) {
        const firestore = await this.getFromFirestore(contextId);
        if (firestore) {
          // 메모리 캐시 업데이트
          if (this.config.enableMemoryCache) {
            await this.saveToMemory(firestore);
          }
          this.updateMemoryCache(firestore);
          console.log(`✅ Firestore에서 컨텍스트 로드: ${contextId}`);
          return firestore;
        }
      }

      console.log(`⚠️ 컨텍스트를 찾을 수 없음: ${contextId}`);
      return null;
    } catch (error) {
      console.error('❌ 컨텍스트 로드 실패:', error);
      return null;
    }
  }

  /**
   * 🗑️ 컨텍스트 삭제
   */
  async deleteContext(
    bundleType: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<boolean> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const contextId = generateContextId(bundleType, clientId);

      // 1. Firestore에서 삭제
      await fetch(`${appUrl}/api/firestore/context-documents/${contextId}`, {
        method: 'DELETE',
      });

      // 2. 메모리 캐시 삭제
      const key = `${this.config.memoryPrefix}${contextId}`;
      this.memoryCache.delete(key);

      // 3. 로컬 메모리 캐시 삭제
      this.contextCache.delete(contextId);

      console.log(`🗑️ 컨텍스트 삭제 완료: ${contextId}`);
      return true;
    } catch (error) {
      console.error('❌ 컨텍스트 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 🔄 컨텍스트 새로고침
   */
  async refreshContext(
    bundleType: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<boolean> {
    try {
      const contextId = generateContextId(bundleType, clientId);

      // 캐시 제거
      this.contextCache.delete(contextId);
      const key = `${this.config.memoryPrefix}${contextId}`;
      this.memoryCache.delete(key);

      // 새로 로드
      const refreshed = await this.loadContextBundle(bundleType, clientId);

      console.log(`🔄 컨텍스트 새로고침 완료: ${contextId}`);
      return refreshed !== null;
    } catch (error) {
      console.error('❌ 컨텍스트 새로고침 실패:', error);
      return false;
    }
  }

  /**
   * 📋 컨텍스트 목록 조회
   */
  async getContextList(
    bundleType?: 'base' | 'advanced' | 'custom'
  ): Promise<string[]> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const query = bundleType ? `?bundleType=${bundleType}` : '';
      const response = await fetch(
        `${appUrl}/api/firestore/context-documents/list${query}`
      );

      if (response.ok) {
        const data = await response.json();
        return data.contextIds || [];
      }

      return [];
    } catch (error) {
      console.error('❌ 컨텍스트 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 📊 컨텍스트 통계 조회
   */
  async getContextStats(): Promise<ContextStatsResponse> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(`${appUrl}/api/context-documents/stats`);
      if (response.ok) {
        const data = await response.json();
        const cacheStats = this.memoryCache.getStats();
        return {
          ...data,
          cacheHitRate: cacheStats.hitRate,
        };
      }
      // 실패 시 기본값 반환
      const cacheStats = this.memoryCache.getStats();
      return {
        totalContexts: this.contextCache.size,
        bundleTypes: {},
        cacheHitRate: cacheStats.hitRate,
        memoryUsage: `${Math.round(this.contextCache.size * 50)}KB`, // 추정치
      };
    } catch (error) {
      console.error('❌ 컨텍스트 통계 조회 실패:', error);
      const cacheStats = this.memoryCache.getStats();
      return {
        totalContexts: this.contextCache.size,
        bundleTypes: {},
        cacheHitRate: cacheStats.hitRate,
        memoryUsage: `${Math.round(this.contextCache.size * 50)}KB`,
      };
    }
  }

  /**
   * 🧹 캐시 무효화
   */
  invalidateCache(): void {
    this.contextCache.clear();
    this.memoryCache.clear();
    console.log('🧹 ContextStorageManager 캐시 무효화 완료');
  }

  /**
   * 💾 메모리 캐싱
   */
  private async saveToMemory(contextDoc: ContextDocument): Promise<void> {
    try {
      const key = `${this.config.memoryPrefix}${contextDoc.id}`;
      this.memoryCache.set(key, contextDoc, this.config.memoryTTL);

      console.log(`✅ 메모리 컨텍스트 캐싱 완료: ${contextDoc.id}`);
    } catch (error) {
      console.error('❌ 메모리 컨텍스트 캐싱 실패:', error);
      throw error;
    }
  }

  /**
   * 🗃️ Firestore 영구 저장
   */
  private async saveToFirestore(contextDoc: ContextDocument): Promise<void> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(
        `${appUrl}/api/firestore/context-documents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contextDoc),
        }
      );

      if (!response.ok) {
        throw new Error(`Firestore 컨텍스트 저장 실패: ${response.status}`);
      }

      console.log(`✅ Firestore 컨텍스트 저장 완료: ${contextDoc.id}`);
    } catch (error) {
      console.error('❌ Firestore 컨텍스트 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 🔍 메모리에서 컨텍스트 조회
   */
  private async getFromMemory(
    contextId: string
  ): Promise<ContextDocument | null> {
    try {
      const key = `${this.config.memoryPrefix}${contextId}`;
      return this.memoryCache.get<ContextDocument>(key);
    } catch (error) {
      console.error('❌ 메모리 컨텍스트 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔍 Firestore에서 컨텍스트 조회
   */
  private async getFromFirestore(
    contextId: string
  ): Promise<ContextDocument | null> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(
        `${appUrl}/api/firestore/context-documents/${contextId}`
      );

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('❌ Firestore 컨텍스트 조회 실패:', error);
      return null;
    }
  }

  /**
   * 💾 메모리 캐시 관리
   */
  private updateMemoryCache(contextDoc: ContextDocument): void {
    // 캐시 크기 제한
    if (this.contextCache.size >= this.config.maxCacheSize) {
      // LRU 방식으로 가장 오래된 항목 제거
      const firstKey = this.contextCache.keys().next().value;
      if (firstKey) {
        this.contextCache.delete(firstKey);
      }
    }

    this.contextCache.set(contextDoc.id, contextDoc);
  }

  /**
   * 🧹 정리 작업
   */
  cleanup(): void {
    this.memoryCache.cleanup();
  }

  /**
   * 📊 캐시 통계 반환
   */
  getCacheStats() {
    return this.memoryCache.getStats();
  }
}