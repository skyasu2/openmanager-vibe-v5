/**
 * ��� 선택적 의존성 관리자 v2.0
 * OpenManager Vibe v5 - 선택적 의존성 처리 로직 개선
 */

export interface OptionalDependency {
  name: string;
  required: boolean;
  fallback?: any;
  loader?: () => Promise<any>;
}

export interface DependencyStatus {
  name: string;
  loaded: boolean;
  available: boolean;
  error?: string;
  fallbackUsed: boolean;
}

export class OptionalDependencyManager {
  private static instance: OptionalDependencyManager;
  private dependencies = new Map<string, OptionalDependency>();
  private statuses = new Map<string, DependencyStatus>();
  private loadedModules = new Map<string, any>();

  private constructor() {
    this.setupDefaultDependencies();
  }

  public static getInstance(): OptionalDependencyManager {
    if (!OptionalDependencyManager.instance) {
      OptionalDependencyManager.instance = new OptionalDependencyManager();
    }
    return OptionalDependencyManager.instance;
  }

  private setupDefaultDependencies(): void {
    this.registerDependency({
      name: 'onnxruntime-node',
      required: false,
      fallback: () => ({
        InferenceSession: {
          create: () => Promise.reject(new Error('ONNX Runtime not available')),
        },
      }),
    });
  }

  registerDependency(dependency: OptionalDependency): void {
    this.dependencies.set(dependency.name, dependency);
    this.statuses.set(dependency.name, {
      name: dependency.name,
      loaded: false,
      available: false,
      fallbackUsed: false,
    });
  }

  async loadDependency(name: string): Promise<any> {
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`의존성 '${name}'을 찾을 수 없습니다.`);
    }

    if (this.loadedModules.has(name)) {
      return this.loadedModules.get(name);
    }

    const status = this.statuses.get(name)!;

    try {
      let loadedModule: any = null;

      if (dependency.loader) {
        loadedModule = await dependency.loader();
      } else {
        loadedModule = await import(name);
      }

      status.loaded = true;
      status.available = true;
      this.loadedModules.set(name, loadedModule);
      return loadedModule;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      status.error = errorMessage;
      status.loaded = false;
      status.available = false;

      if (dependency.fallback) {
        const fallbackModule =
          typeof dependency.fallback === 'function'
            ? dependency.fallback()
            : dependency.fallback;
        status.fallbackUsed = true;
        this.loadedModules.set(name, fallbackModule);
        return fallbackModule;
      }

      if (dependency.required) {
        throw error;
      }

      return null;
    }
  }

  getDependencyStatus(name: string): DependencyStatus | null {
    return this.statuses.get(name) || null;
  }

  getAllDependencyStatuses(): DependencyStatus[] {
    return Array.from(this.statuses.values());
  }
}

export const optionalDependencyManager =
  OptionalDependencyManager.getInstance();

export async function loadOptionalDependency(name: string): Promise<any> {
  return optionalDependencyManager.loadDependency(name);
}

export async function safeImport(
  moduleName: string,
  fallback?: any
): Promise<any> {
  try {
    return await import(moduleName);
  } catch (error) {
    console.warn(`⚠️ 모듈 '${moduleName}' 로드 실패:`, error);
    return fallback || null;
  }
}
