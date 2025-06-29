/**
 * AI Agent Plugin System
 *
 * 🔌 확장 가능한 플러그인 아키텍처
 * - 런타임 플러그인 로딩
 * - 이벤트 기반 훅 시스템
 * - 플러그인 간 통신
 * - 의존성 관리
 */

export interface PluginContext {
  config: any;
  logger: any;
  storage: any;
  metrics: any;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
  hooks: string[];
  config?: Record<string, any>;
}

export interface Plugin {
  manifest: PluginManifest;
  initialize(context: PluginContext): Promise<void>;
  destroy?(): Promise<void>;
  onQuery?(query: string, context: any): Promise<any>;
  onResponse?(response: any, context: any): Promise<any>;
  onIntent?(intent: any, context: any): Promise<any>;
  onAction?(action: string, context: any): Promise<any>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, ((...args: any[]) => any)[]> = new Map();
  private context: PluginContext;
  private isInitialized = false;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 기본 플러그인 로드
    await this.loadBuiltinPlugins();

    this.isInitialized = true;
    this.context.logger.info('Plugin Manager initialized');
  }

  /**
   * 플러그인 등록
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    const { name, dependencies = [] } = plugin.manifest;

    // 의존성 검사
    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin dependency not found: ${dep}`);
      }
    }

    // 플러그인 초기화
    await plugin.initialize(this.context);

    // 훅 등록
    for (const hook of plugin.manifest.hooks) {
      this.registerHook(hook, plugin);
    }

    this.plugins.set(name, plugin);
    this.context.logger.info(`Plugin registered: ${name}`);
  }

  /**
   * 플러그인 제거
   */
  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    // 플러그인 정리
    if (plugin.destroy) {
      await plugin.destroy();
    }

    // 훅 제거
    for (const hook of plugin.manifest.hooks) {
      this.unregisterHook(hook, plugin);
    }

    this.plugins.delete(name);
    this.context.logger.info(`Plugin unregistered: ${name}`);
  }

  /**
   * 훅 실행
   */
  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const handlers = this.hooks.get(hookName) || [];
    const results: any[] = [];

    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        if (result !== undefined) {
          results.push(result);
        }
      } catch (error) {
        this.context.logger.error(`Hook execution failed: ${hookName}`, error);
      }
    }

    return results;
  }

  /**
   * 쿼리 처리 훅
   */
  async onQuery(query: string, context: any): Promise<any> {
    const results = await this.executeHook('onQuery', query, context);
    return this.mergeResults(results);
  }

  /**
   * 응답 처리 훅
   */
  async onResponse(response: any, context: any): Promise<any> {
    const results = await this.executeHook('onResponse', response, context);
    return this.mergeResults(results, response);
  }

  /**
   * 의도 분류 훅
   */
  async onIntent(intent: any, context: any): Promise<any> {
    const results = await this.executeHook('onIntent', intent, context);
    return this.mergeResults(results, intent);
  }

  /**
   * 액션 실행 훅
   */
  async onAction(action: string, context: any): Promise<any> {
    const results = await this.executeHook('onAction', action, context);
    return this.mergeResults(results);
  }

  /**
   * 플러그인 목록 조회
   */
  getPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(p => p.manifest);
  }

  /**
   * 플러그인 상태 조회
   */
  getPluginStatus(name: string): any {
    const plugin = this.plugins.get(name);
    if (!plugin) return null;

    return {
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      active: true,
      hooks: plugin.manifest.hooks,
    };
  }

  private registerHook(hookName: string, plugin: Plugin): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const method = (plugin as any)[hookName];
    if (typeof method === 'function') {
      this.hooks.get(hookName)!.push(method.bind(plugin));
    }
  }

  private unregisterHook(hookName: string, plugin: Plugin): void {
    const handlers = this.hooks.get(hookName);
    if (!handlers) return;

    const method = (plugin as any)[hookName];
    if (typeof method === 'function') {
      const index = handlers.indexOf(method.bind(plugin));
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private mergeResults(results: any[], defaultValue?: any): any {
    if (results.length === 0) return defaultValue;
    if (results.length === 1) return results[0];

    // 객체 병합
    if (results.every(r => typeof r === 'object' && r !== null)) {
      return Object.assign({}, defaultValue, ...results);
    }

    // 배열 병합
    if (results.every(r => Array.isArray(r))) {
      return results.flat();
    }

    // 마지막 결과 반환
    return results[results.length - 1];
  }

  private async loadBuiltinPlugins(): Promise<void> {
    // 디버그 플러그인
    if (this.context.config.plugins?.enabled?.includes('debug')) {
      await this.registerPlugin(new DebugPlugin());
    }

    // 메트릭 플러그인
    if (this.context.config.plugins?.enabled?.includes('metrics')) {
      await this.registerPlugin(new MetricsPlugin());
    }

    // 캐시 플러그인
    if (this.context.config.plugins?.enabled?.includes('cache')) {
      await this.registerPlugin(new CachePlugin());
    }
  }
}

/**
 * 내장 플러그인들
 */

// 디버그 플러그인
export class DebugPlugin implements Plugin {
  manifest: PluginManifest = {
    name: 'debug',
    version: '1.0.0',
    description: 'Debug and development tools',
    author: 'OpenManager',
    hooks: ['onQuery', 'onResponse', 'onIntent', 'onAction'],
  };

  private context!: PluginContext;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.context.logger.debug('Debug plugin initialized');
  }

  async onQuery(query: string, context: any): Promise<any> {
    this.context.logger.debug('Query received:', { query, context });
    return { debugInfo: { queryLength: query.length, timestamp: Date.now() } };
  }

  async onResponse(response: any, context: any): Promise<any> {
    this.context.logger.debug('Response generated:', { response, context });
    return {
      ...response,
      debugInfo: { responseLength: response.response?.length || 0 },
    };
  }

  async onIntent(intent: any, context: any): Promise<any> {
    this.context.logger.debug('Intent classified:', { intent, context });
    return { ...intent, debugInfo: { confidence: intent.confidence } };
  }

  async onAction(action: string, context: any): Promise<any> {
    this.context.logger.debug('Action executed:', { action, context });
    return { debugInfo: { actionType: action } };
  }
}

// 메트릭 플러그인
export class MetricsPlugin implements Plugin {
  manifest: PluginManifest = {
    name: 'metrics',
    version: '1.0.0',
    description: 'Performance and usage metrics',
    author: 'OpenManager',
    hooks: ['onQuery', 'onResponse', 'onIntent'],
  };

  private context!: PluginContext;
  private queryCount = 0;
  private responseTime: number[] = [];

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.context.logger.info('Metrics plugin initialized');
  }

  async onQuery(query: string, context: any): Promise<any> {
    this.queryCount++;
    this.context.metrics.increment('ai_agent.queries.total');
    this.context.metrics.gauge('ai_agent.queries.count', this.queryCount);

    context.startTime = Date.now();
    return {};
  }

  async onResponse(response: any, context: any): Promise<any> {
    if (context.startTime) {
      const duration = Date.now() - context.startTime;
      this.responseTime.push(duration);
      this.context.metrics.timing('ai_agent.response.duration', duration);

      // 평균 응답 시간 계산
      const avgTime =
        this.responseTime.reduce((a, b) => a + b, 0) / this.responseTime.length;
      this.context.metrics.gauge('ai_agent.response.avg_duration', avgTime);
    }

    this.context.metrics.increment('ai_agent.responses.total');
    return response;
  }

  async onIntent(intent: any, context: any): Promise<any> {
    this.context.metrics.increment('ai_agent.intents.total', 1, {
      intent: intent.name,
    });
    this.context.metrics.histogram(
      'ai_agent.intent.confidence',
      intent.confidence
    );
    return intent;
  }
}

// 캐시 플러그인
export class CachePlugin implements Plugin {
  manifest: PluginManifest = {
    name: 'cache',
    version: '1.0.0',
    description: 'Response caching for performance',
    author: 'OpenManager',
    hooks: ['onQuery', 'onResponse'],
  };

  private context!: PluginContext;
  private cache = new Map<
    string,
    { response: any; timestamp: number; ttl: number }
  >();
  private defaultTTL = 5 * 60 * 1000; // 5분

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.context.logger.info('Cache plugin initialized');

    // 캐시 정리 스케줄러
    setInterval(() => this.cleanupCache(), 60000); // 1분마다
  }

  async onQuery(query: string, context: any): Promise<any> {
    const cacheKey = this.generateCacheKey(query, context);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      this.context.logger.debug('Cache hit:', cacheKey);
      this.context.metrics.increment('ai_agent.cache.hits');
      context.fromCache = true;
      return cached.response;
    }

    this.context.metrics.increment('ai_agent.cache.misses');
    context.cacheKey = cacheKey;
    return {};
  }

  async onResponse(response: any, context: any): Promise<any> {
    if (context.fromCache) {
      return response; // 이미 캐시에서 온 응답
    }

    if (context.cacheKey && response.success) {
      this.cache.set(context.cacheKey, {
        response,
        timestamp: Date.now(),
        ttl: this.defaultTTL,
      });
      this.context.logger.debug('Response cached:', context.cacheKey);
    }

    return response;
  }

  private generateCacheKey(query: string, context: any): string {
    const key = `${query}:${JSON.stringify(context.serverData || {})}`;
    return Buffer.from(key).toString('base64').slice(0, 32);
  }

  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.timestamp + value.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.context.logger.debug(`Cache cleanup: ${cleaned} entries removed`);
    }
  }
}
