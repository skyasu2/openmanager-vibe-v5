/**
 * 🔧 Dependency Injection Container
 *
 * 싱글톤 패턴을 대체하는 의존성 주입 시스템
 * - 타입 안전한 서비스 등록 및 해결
 * - 라이프사이클 관리 (Singleton, Transient, Scoped)
 * - 순환 의존성 감지
 * - 인터페이스 기반 의존성 관리
 */

export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

export interface ServiceDescriptor<T = unknown> {
  token: string | symbol;
  implementation: new (...args: unknown[]) => T;
  lifetime: ServiceLifetime;
  dependencies?: (string | symbol)[];
}

export interface ServiceFactory<T = unknown> {
  token: string | symbol;
  factory: (...args: unknown[]) => T;
  lifetime: ServiceLifetime;
  dependencies?: (string | symbol)[];
}

export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<
    string | symbol,
    ServiceDescriptor | ServiceFactory
  >();
  private singletonInstances = new Map<string | symbol, unknown>();
  private scopedInstances = new Map<string, Map<string | symbol, unknown>>();
  private resolutionStack: (string | symbol)[] = [];

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * 서비스 등록 (클래스 기반)
   */
  register<T>(descriptor: ServiceDescriptor<T>): void {
    this.services.set(descriptor.token, descriptor);
  }

  /**
   * 서비스 등록 (팩토리 기반)
   */
  registerFactory<T>(factory: ServiceFactory<T>): void {
    this.services.set(factory.token, factory);
  }

  /**
   * 인터페이스 기반 서비스 등록
   */
  registerInterface<T>(
    interfaceToken: string | symbol,
    implementation: new (...args: unknown[]) => T,
    lifetime: ServiceLifetime = 'singleton',
    dependencies?: (string | symbol)[]
  ): void {
    this.register({
      token: interfaceToken,
      implementation,
      lifetime,
      dependencies,
    });
  }

  /**
   * 서비스 해결
   */
  resolve<T>(token: string | symbol, scopeId?: string): T {
    // 순환 의존성 감지
    if (this.resolutionStack.includes(token)) {
      throw new Error(
        'Circular dependency detected: ' +
          (this.resolutionStack.join(' -> ') + ' -> ' + String(token))
      );
    }

    const service = this.services.get(token);
    if (!service) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    this.resolutionStack.push(token);

    try {
      switch (service.lifetime) {
        case 'singleton':
          return this.resolveSingleton(
            service as ServiceDescriptor<T> | ServiceFactory<T>
          );
        case 'transient':
          return this.resolveTransient(
            service as ServiceDescriptor<T> | ServiceFactory<T>
          );
        case 'scoped':
          return this.resolveScoped(
            service as ServiceDescriptor<T> | ServiceFactory<T>,
            scopeId || 'default'
          );
        default:
          throw new Error('Unknown service lifetime');
      }
    } finally {
      this.resolutionStack.pop();
    }
  }

  /**
   * 싱글톤 인스턴스 해결
   */
  private resolveSingleton<T>(
    service: ServiceDescriptor<T> | ServiceFactory<T>
  ): T {
    if (this.singletonInstances.has(service.token)) {
      return this.singletonInstances.get(service.token) as T;
    }

    const instance = this.createInstance(service);
    this.singletonInstances.set(service.token, instance);
    return instance;
  }

  /**
   * 일시적 인스턴스 해결
   */
  private resolveTransient<T>(
    service: ServiceDescriptor<T> | ServiceFactory<T>
  ): T {
    return this.createInstance(service);
  }

  /**
   * 스코프 인스턴스 해결
   */
  private resolveScoped<T>(
    service: ServiceDescriptor<T> | ServiceFactory<T>,
    scopeId: string
  ): T {
    if (!this.scopedInstances.has(scopeId)) {
      this.scopedInstances.set(scopeId, new Map());
    }

    const scopeMap = this.scopedInstances.get(scopeId);
    if (scopeMap?.has(service.token)) {
      return scopeMap.get(service.token) as T;
    }

    const instance = this.createInstance(service);
    scopeMap?.set(service.token, instance);
    return instance;
  }

  /**
   * 인스턴스 생성
   */
  private createInstance<T>(
    service: ServiceDescriptor<T> | ServiceFactory<T>
  ): T {
    const dependencies = service.dependencies || [];
    const resolvedDependencies = dependencies.map((dep) => this.resolve(dep));

    if ('factory' in service) {
      return service.factory(...resolvedDependencies);
    } else {
      return new service.implementation(...resolvedDependencies);
    }
  }

  /**
   * 스코프 정리
   */
  clearScope(scopeId: string): void {
    this.scopedInstances.delete(scopeId);
  }

  /**
   * 모든 스코프 정리
   */
  clearAllScopes(): void {
    this.scopedInstances.clear();
  }

  /**
   * 컨테이너 초기화
   */
  clear(): void {
    this.services.clear();
    this.singletonInstances.clear();
    this.scopedInstances.clear();
    this.resolutionStack = [];
  }

  /**
   * 등록된 서비스 목록 조회
   */
  getRegisteredServices(): (string | symbol)[] {
    return Array.from(this.services.keys());
  }

  /**
   * 서비스 등록 여부 확인
   */
  isRegistered(token: string | symbol): boolean {
    return this.services.has(token);
  }
}

// 서비스 토큰 정의
export const SERVICE_TOKENS = {
  // AI 서비스
  AI_ANALYSIS_SERVICE: Symbol('AIAnalysisService'),
  AI_AGENT_ENGINE: Symbol('AIAgentEngine'),

  // 로깅 서비스
  LOGGER: Symbol('Logger'),

  // 설정 서비스
  CONFIG_LOADER: Symbol('ConfigLoader'),

  // 메트릭 서비스
  METRICS_COLLECTOR: Symbol('MetricsCollector'),
  METRICS_BRIDGE: Symbol('MetricsBridge'),

  // 스토리지 서비스
  STORAGE_SERVICE: Symbol('StorageService'),

  // 캐시 서비스
  CACHE_SERVICE: Symbol('CacheService'),

  // 헬스체크 서비스
  HEALTH_CHECK_SERVICE: Symbol('HealthCheckService'),

  // 테스트 프레임워크
  TEST_FRAMEWORK: Symbol('TestFramework'),
} as const;

// 편의 함수들
export const container = DIContainer.getInstance();

export function registerService<T>(
  token: string | symbol,
  implementation: new (...args: unknown[]) => T,
  lifetime: ServiceLifetime = 'singleton',
  dependencies?: (string | symbol)[]
): void {
  container.register({ token, implementation, lifetime, dependencies });
}

export function registerFactory<T>(
  token: string | symbol,
  factory: (...args: unknown[]) => T,
  lifetime: ServiceLifetime = 'singleton',
  dependencies?: (string | symbol)[]
): void {
  container.registerFactory({ token, factory, lifetime, dependencies });
}

export function resolve<T>(token: string | symbol, scopeId?: string): T {
  return container.resolve<T>(token, scopeId);
}

export function clearScope(scopeId: string): void {
  container.clearScope(scopeId);
}

// 데코레이터 (선택적)
export function Injectable(
  token?: string | symbol,
  lifetime: ServiceLifetime = 'singleton'
) {
  return <T extends new (...args: unknown[]) => unknown>(ctor: T) => {
    const serviceToken = token || ctor.name;
    registerService(serviceToken, ctor, lifetime);
    return ctor;
  };
}

// 간단한 의존성 주입 데코레이터 (메타데이터 없이)
export function Inject(token: string | symbol) {
  return (
    target: unknown,
    _propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    // 간단한 의존성 추적 (실제 프로젝트에서는 reflect-metadata 사용 권장)
    const typedTarget = target as Record<string, unknown>;
    if (!typedTarget.__dependencies) {
      typedTarget.__dependencies = [];
    }
    (typedTarget.__dependencies as unknown[])[parameterIndex] = token;
  };
}
