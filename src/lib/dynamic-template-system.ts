/**
 * 🔄 동적 템플릿 시스템 v2.0
 * 
 * 유연한 메트릭 구조와 동적 필드 추가/삭제를 지원하는 개선된 템플릿 시스템
 * - 동적 메트릭 구조
 * - 커스텀 필드 지원
 * - AI 엔진 완벽 호환
 * - Supabase 백업 통합
 */

import smartRedis from '@/lib/redis';
import { createClient } from '@supabase/supabase-js';

// ==============================================
// 🎯 타입 정의
// ==============================================

export interface DynamicMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface DynamicServerTemplate {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'warning' | 'offline';
  metrics: Record<string, DynamicMetric>;
  customFields?: Record<string, any>;
  lastUpdate: Date;
  version: string;
}

export interface TemplateSchema {
  version: string;
  fields: Array<{
    name: string;
    type: 'number' | 'string' | 'boolean' | 'object' | 'array';
    required: boolean;
    defaultValue?: any;
    validator?: (value: any) => boolean;
  }>;
  customMetrics: string[];
}

// ==============================================
// 🎯 동적 템플릿 관리자
// ==============================================

export class DynamicTemplateManager {
  private static instance: DynamicTemplateManager;
  private supabase: any;
  private schema: TemplateSchema;
  
  private readonly SCHEMA_KEY = 'openmanager:template:schema';
  private readonly BACKUP_TABLE = 'server_templates_backup';

  constructor() {
    // Supabase 클라이언트 초기화
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // 기본 스키마
    this.schema = this.getDefaultSchema();
  }

  static getInstance(): DynamicTemplateManager {
    if (!DynamicTemplateManager.instance) {
      DynamicTemplateManager.instance = new DynamicTemplateManager();
    }
    return DynamicTemplateManager.instance;
  }

  /**
   * 🎯 기본 스키마 정의
   */
  private getDefaultSchema(): TemplateSchema {
    return {
      version: '2.0',
      fields: [
        { name: 'cpu', type: 'number', required: true, defaultValue: 50 },
        { name: 'memory', type: 'number', required: true, defaultValue: 60 },
        { name: 'disk', type: 'number', required: true, defaultValue: 70 },
        { name: 'network', type: 'number', required: true, defaultValue: 100 },
        // 새로운 필드들 (선택적)
        { name: 'gpu', type: 'number', required: false, defaultValue: 0 },
        { name: 'temperature', type: 'number', required: false, defaultValue: 65 },
        { name: 'connections', type: 'number', required: false, defaultValue: 150 },
        { name: 'iops', type: 'number', required: false, defaultValue: 1000 },
      ],
      customMetrics: [], // 사용자 정의 메트릭
    };
  }

  /**
   * 📊 동적 서버 템플릿 생성
   */
  async generateDynamicTemplate(
    serverId: string,
    options: {
      includeCustomMetrics?: boolean;
      scenario?: 'normal' | 'warning' | 'critical' | 'mixed';
      customFields?: Record<string, any>;
    } = {}
  ): Promise<DynamicServerTemplate> {
    const { includeCustomMetrics = true, scenario = 'mixed', customFields = {} } = options;
    
    // Redis에서 최신 스키마 로드
    await this.loadSchema();
    
    // 서버 타입별 특성
    const serverType = this.getServerType(serverId);
    const baseMultiplier = this.getScenarioMultiplier(scenario);
    
    // 동적 메트릭 생성
    const metrics: Record<string, DynamicMetric> = {};
    
    // 필수 메트릭
    for (const field of this.schema.fields) {
      if (field.required || includeCustomMetrics) {
        const baseValue = field.defaultValue || 0;
        const variation = this.getTimeBasedVariation();
        const typeMultiplier = this.getTypeMultiplier(serverType, field.name);
        
        metrics[field.name] = {
          name: field.name,
          value: Math.round(baseValue * baseMultiplier * typeMultiplier * variation),
          unit: this.getMetricUnit(field.name),
          timestamp: new Date(),
          metadata: {
            source: 'dynamic-template',
            scenario,
            variation: variation.toFixed(3),
          },
        };
      }
    }
    
    // 커스텀 메트릭 추가
    if (includeCustomMetrics && this.schema.customMetrics.length > 0) {
      for (const metricName of this.schema.customMetrics) {
        metrics[metricName] = {
          name: metricName,
          value: Math.round(Math.random() * 100),
          unit: 'custom',
          timestamp: new Date(),
          metadata: { custom: true },
        };
      }
    }
    
    // 서버 템플릿 생성
    const template: DynamicServerTemplate = {
      id: serverId,
      name: `${serverType} Server ${serverId.split('-').pop()}`,
      type: serverType,
      status: this.getServerStatus(metrics),
      metrics,
      customFields: {
        ...this.getServerTypeDefaults(serverType),
        ...customFields,
      },
      lastUpdate: new Date(),
      version: this.schema.version,
    };
    
    return template;
  }

  /**
   * 🔄 스키마 업데이트
   */
  async updateSchema(newSchema: Partial<TemplateSchema>): Promise<void> {
    this.schema = { ...this.schema, ...newSchema };
    
    // Redis에 저장
    await smartRedis.set(this.SCHEMA_KEY, JSON.stringify(this.schema), { ex: 3600 });
    
    // Supabase 백업
    if (this.supabase) {
      await this.backupSchemaToSupabase();
    }
    
    console.log('✅ 템플릿 스키마 업데이트 완료:', this.schema.version);
  }

  /**
   * ➕ 커스텀 메트릭 추가
   */
  async addCustomMetric(metricName: string, defaultValue: number = 0): Promise<void> {
    if (!this.schema.customMetrics.includes(metricName)) {
      this.schema.customMetrics.push(metricName);
      this.schema.fields.push({
        name: metricName,
        type: 'number',
        required: false,
        defaultValue,
      });
      
      await this.updateSchema(this.schema);
      console.log(`✅ 커스텀 메트릭 추가: ${metricName}`);
    }
  }

  /**
   * ➖ 커스텀 메트릭 제거
   */
  async removeCustomMetric(metricName: string): Promise<void> {
    this.schema.customMetrics = this.schema.customMetrics.filter(m => m !== metricName);
    this.schema.fields = this.schema.fields.filter(f => f.name !== metricName);
    
    await this.updateSchema(this.schema);
    console.log(`✅ 커스텀 메트릭 제거: ${metricName}`);
  }

  /**
   * 💾 Supabase 백업
   */
  async backupToSupabase(templates: DynamicServerTemplate[]): Promise<void> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase 클라이언트 없음, 백업 건너뛰기');
      return;
    }

    try {
      const backupData = templates.map(template => ({
        server_id: template.id,
        template_data: template,
        schema_version: this.schema.version,
        created_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from(this.BACKUP_TABLE)
        .insert(backupData);

      if (error) {
        console.error('❌ Supabase 백업 실패:', error);
      } else {
        console.log(`✅ ${templates.length}개 템플릿 Supabase 백업 완료`);
      }
    } catch (error) {
      console.error('❌ Supabase 백업 중 오류:', error);
    }
  }

  /**
   * 🔄 Supabase에서 복원
   */
  async restoreFromSupabase(serverId?: string): Promise<DynamicServerTemplate[]> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase 클라이언트 없음, 복원 불가');
      return [];
    }

    try {
      let query = this.supabase
        .from(this.BACKUP_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (serverId) {
        query = query.eq('server_id', serverId);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('❌ Supabase 복원 실패:', error);
        return [];
      }

      const templates = data?.map((item: any) => item.template_data) || [];
      console.log(`✅ ${templates.length}개 템플릿 Supabase에서 복원`);
      
      return templates;
    } catch (error) {
      console.error('❌ Supabase 복원 중 오류:', error);
      return [];
    }
  }

  /**
   * 🤖 AI 엔진 호환 데이터 변환
   */
  convertToAICompatible(template: DynamicServerTemplate): any {
    return {
      id: template.id,
      name: template.name,
      status: template.status,
      cpu: template.metrics.cpu?.value || 0,
      memory: template.metrics.memory?.value || 0,
      disk: template.metrics.disk?.value || 0,
      network: template.metrics.network?.value || 0,
      // 추가 메트릭들
      metrics: Object.entries(template.metrics).reduce((acc, [key, metric]) => {
        acc[key] = {
          usage: metric.value,
          unit: metric.unit,
          timestamp: metric.timestamp,
        };
        return acc;
      }, {} as Record<string, any>),
      // 커스텀 필드
      ...template.customFields,
      lastUpdate: template.lastUpdate,
    };
  }

  // ==============================================
  // 🔧 헬퍼 메서드들
  // ==============================================

  private async loadSchema(): Promise<void> {
    try {
      const savedSchema = await smartRedis.get(this.SCHEMA_KEY);
      if (savedSchema) {
        this.schema = JSON.parse(savedSchema);
      }
    } catch (error) {
      console.warn('⚠️ 스키마 로드 실패, 기본값 사용');
    }
  }

  private async backupSchemaToSupabase(): Promise<void> {
    if (!this.supabase) return;

    try {
      await this.supabase
        .from('template_schemas')
        .insert({
          version: this.schema.version,
          schema_data: this.schema,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('❌ 스키마 백업 실패:', error);
    }
  }

  private getServerType(serverId: string): string {
    if (serverId.includes('web')) return 'Web';
    if (serverId.includes('api')) return 'API';
    if (serverId.includes('db')) return 'Database';
    if (serverId.includes('cache')) return 'Cache';
    return 'General';
  }

  private getScenarioMultiplier(scenario: string): number {
    switch (scenario) {
      case 'normal': return 0.6;
      case 'warning': return 0.8;
      case 'critical': return 0.95;
      default: return 0.7 + Math.random() * 0.25;
    }
  }

  private getTimeBasedVariation(): number {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeOfDay = hours + minutes / 60;
    
    // 시간대별 변동 (업무 시간에 높음)
    if (timeOfDay >= 9 && timeOfDay <= 18) {
      return 0.9 + Math.random() * 0.2;
    } else {
      return 0.6 + Math.random() * 0.3;
    }
  }

  private getTypeMultiplier(serverType: string, metricName: string): number {
    const multipliers: Record<string, Record<string, number>> = {
      Web: { cpu: 0.7, memory: 0.8, disk: 0.6, network: 1.2 },
      API: { cpu: 0.9, memory: 0.7, disk: 0.5, network: 1.0 },
      Database: { cpu: 0.8, memory: 1.1, disk: 1.2, network: 0.8 },
      Cache: { cpu: 0.6, memory: 1.3, disk: 0.4, network: 0.9 },
      General: { cpu: 0.8, memory: 0.8, disk: 0.8, network: 0.8 },
    };
    
    return multipliers[serverType]?.[metricName] || 1.0;
  }

  private getMetricUnit(metricName: string): string {
    const units: Record<string, string> = {
      cpu: '%',
      memory: '%',
      disk: '%',
      network: 'Mbps',
      gpu: '%',
      temperature: '°C',
      connections: 'count',
      iops: 'IOPS',
    };
    
    return units[metricName] || 'unit';
  }

  private getServerStatus(metrics: Record<string, DynamicMetric>): 'online' | 'warning' | 'offline' {
    const cpu = metrics.cpu?.value || 0;
    const memory = metrics.memory?.value || 0;
    const disk = metrics.disk?.value || 0;
    
    if (cpu > 90 || memory > 95 || disk > 95) return 'offline';
    if (cpu > 75 || memory > 85 || disk > 85) return 'warning';
    return 'online';
  }

  private getServerTypeDefaults(serverType: string): Record<string, any> {
    const defaults: Record<string, Record<string, any>> = {
      Web: {
        port: 80,
        protocol: 'HTTP/2',
        ssl: true,
        loadBalancer: 'nginx',
      },
      API: {
        port: 3000,
        protocol: 'REST',
        rateLimit: 1000,
        authentication: 'JWT',
      },
      Database: {
        port: 3306,
        engine: 'MySQL',
        replication: true,
        backupEnabled: true,
      },
      Cache: {
        port: 6379,
        engine: 'Redis',
        maxMemory: '2GB',
        evictionPolicy: 'LRU',
      },
      General: {
        port: 22,
        protocol: 'SSH',
        monitoring: true,
      },
    };
    
    return defaults[serverType] || defaults.General;
  }
}

// ==============================================
// 🚀 싱글톤 인스턴스 export
// ==============================================

export const dynamicTemplateManager = DynamicTemplateManager.getInstance();

// 기본 export
export default DynamicTemplateManager;