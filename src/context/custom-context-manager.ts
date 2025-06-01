/**
 * ⚙️ 커스텀 컨텍스트 관리자 (Level 3)
 * 
 * ✅ 조직별 가이드, 알림 임계값, 분석 규칙
 * ✅ Supabase에 JSON 형태로 저장
 * ✅ 사용자별 맞춤 설정
 * ✅ 동적 규칙 엔진
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  category: 'threshold' | 'automation' | 'notification' | 'analysis';
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number; // 1-10
  enabled: boolean;
  createdBy: string;
  createdAt: number;
  lastModified: number;
  executionCount: number;
  successRate: number;
}

export interface RuleCondition {
  field: string; // 'cpu.usage', 'memory.percentage', 'disk.percentage', etc.
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'matches';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'alert' | 'email' | 'webhook' | 'script' | 'log';
  config: Record<string, any>;
  delay?: number; // 지연 실행 (초)
}

export interface OrganizationSettings {
  id: string;
  organizationName: string;
  thresholds: {
    cpu: { warning: number; critical: number };
    memory: { warning: number; critical: number };
    disk: { warning: number; critical: number };
    response_time: { warning: number; critical: number };
  };
  notifications: {
    email: { enabled: boolean; addresses: string[] };
    slack: { enabled: boolean; webhook?: string; channel?: string };
    webhook: { enabled: boolean; url?: string };
  };
  customGuides: GuideDocument[];
  preferences: {
    language: 'ko' | 'en';
    timezone: string;
    dateFormat: string;
    autoResolveAlerts: boolean;
    maintenanceWindows: MaintenanceWindow[];
  };
  integrations: {
    monitoring: { type: string; config: Record<string, any> }[];
    alerting: { type: string; config: Record<string, any> }[];
  };
}

export interface GuideDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  priority: number;
  lastUpdated: number;
}

export interface MaintenanceWindow {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;
  days: number[]; // 0=Sunday, 1=Monday, etc.
  timezone: string;
  enabled: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'operator' | 'viewer';
  organizationId: string;
  preferences: {
    dashboard: { layout: string; widgets: string[] };
    notifications: { email: boolean; push: boolean };
    theme: 'light' | 'dark' | 'auto';
  };
  permissions: string[];
  lastLogin: number;
  settings: Record<string, any>;
}

export class CustomContextManager {
  private supabase: SupabaseClient;
  private redis: Redis;
  private readonly CACHE_TTL = 1800; // 30분
  
  constructor() {
    // Supabase 클라이언트 초기화
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Upstash Redis 클라이언트 초기화
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  /**
   * 🏢 조직 설정 저장
   */
  async saveOrganizationSettings(settings: OrganizationSettings): Promise<void> {
    console.log(`💾 [CustomContext] 조직 설정 저장: ${settings.organizationName}`);
    
    try {
      // Supabase에 저장
      const { error } = await this.supabase
        .from('organization_settings')
        .upsert({
          id: settings.id,
          organization_name: settings.organizationName,
          settings_data: settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Redis 캐시 업데이트
      await this.redis.setex(
        `org_settings:${settings.id}`,
        this.CACHE_TTL,
        settings
      );

      console.log('✅ [CustomContext] 조직 설정 저장 완료');
    } catch (error) {
      console.error('❌ [CustomContext] 조직 설정 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 🏢 조직 설정 조회
   */
  async getOrganizationSettings(orgId: string): Promise<OrganizationSettings | null> {
    try {
      // Redis 캐시에서 먼저 조회
      const cached = await this.redis.get<OrganizationSettings>(`org_settings:${orgId}`);
      if (cached) {
        console.log('📦 [CustomContext] 캐시에서 조직 설정 조회');
        return cached;
      }

      // Supabase에서 조회
      const { data, error } = await this.supabase
        .from('organization_settings')
        .select('settings_data')
        .eq('id', orgId)
        .single();

      if (error || !data) {
        console.warn(`⚠️ [CustomContext] 조직 설정 없음: ${orgId}`);
        return null;
      }

      const settings = data.settings_data as OrganizationSettings;

      // Redis 캐시에 저장
      await this.redis.setex(`org_settings:${orgId}`, this.CACHE_TTL, settings);

      return settings;
    } catch (error) {
      console.error('❌ [CustomContext] 조직 설정 조회 실패:', error);
      return null;
    }
  }

  /**
   * 📏 커스텀 규칙 생성
   */
  async createCustomRule(rule: Omit<CustomRule, 'id' | 'createdAt' | 'executionCount' | 'successRate'>): Promise<string> {
    const newRule: CustomRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastModified: Date.now(),
      executionCount: 0,
      successRate: 100
    };

    try {
      // Supabase에 저장
      const { error } = await this.supabase
        .from('custom_rules')
        .insert({
          id: newRule.id,
          rule_data: newRule,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Redis 캐시에 추가
      await this.redis.setex(`rule:${newRule.id}`, this.CACHE_TTL, newRule);

      console.log(`✅ [CustomContext] 커스텀 규칙 생성: ${newRule.name}`);
      return newRule.id;
    } catch (error) {
      console.error('❌ [CustomContext] 커스텀 규칙 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 📏 커스텀 규칙 조회
   */
  async getCustomRules(category?: string): Promise<CustomRule[]> {
    try {
      const query = this.supabase
        .from('custom_rules')
        .select('rule_data')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      let rules = (data || []).map(row => row.rule_data as CustomRule);

      if (category) {
        rules = rules.filter(rule => rule.category === category);
      }

      return rules;
    } catch (error) {
      console.error('❌ [CustomContext] 커스텀 규칙 조회 실패:', error);
      return [];
    }
  }

  /**
   * ⚙️ 규칙 실행 엔진
   */
  async executeRules(context: Record<string, any>, orgId: string): Promise<{
    executed: number;
    triggered: number;
    actions: RuleAction[];
    errors: string[];
  }> {
    console.log('⚙️ [CustomContext] 규칙 실행 엔진 시작');
    
    const result = {
      executed: 0,
      triggered: 0,
      actions: [] as RuleAction[],
      errors: [] as string[]
    };

    try {
      // 조직의 모든 활성 규칙 조회
      const rules = await this.getCustomRules();
      const activeRules = rules.filter(rule => rule.enabled);

      for (const rule of activeRules) {
        try {
          result.executed++;
          
          // 규칙 조건 평가
          const isTriggered = this.evaluateConditions(rule.conditions, context);
          
          if (isTriggered) {
            result.triggered++;
            result.actions.push(...rule.actions);
            
            // 규칙 실행 통계 업데이트
            await this.updateRuleStats(rule.id, true);
            
            console.log(`🎯 [CustomContext] 규칙 트리거: ${rule.name}`);
          } else {
            await this.updateRuleStats(rule.id, false);
          }
        } catch (error) {
          result.errors.push(`규칙 '${rule.name}' 실행 실패: ${error}`);
          await this.updateRuleStats(rule.id, false);
        }
      }

      console.log(`✅ [CustomContext] 규칙 실행 완료: ${result.executed}개 실행, ${result.triggered}개 트리거`);
    } catch (error) {
      console.error('❌ [CustomContext] 규칙 실행 엔진 실패:', error);
      result.errors.push(`규칙 엔진 실패: ${error}`);
    }

    return result;
  }

  /**
   * 🔍 조건 평가
   */
  private evaluateConditions(conditions: RuleCondition[], context: Record<string, any>): boolean {
    if (conditions.length === 0) return false;

    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(context, condition.field);
      const conditionResult = this.evaluateCondition(condition, fieldValue);
      
      if (currentLogic === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
      
      currentLogic = condition.logic || 'AND';
    }

    return result;
  }

  /**
   * 🔍 개별 조건 평가
   */
  private evaluateCondition(condition: RuleCondition, value: any): boolean {
    const { operator, value: conditionValue } = condition;

    switch (operator) {
      case 'gt':
        return Number(value) > Number(conditionValue);
      case 'gte':
        return Number(value) >= Number(conditionValue);
      case 'lt':
        return Number(value) < Number(conditionValue);
      case 'lte':
        return Number(value) <= Number(conditionValue);
      case 'eq':
        return value === conditionValue;
      case 'contains':
        return String(value).includes(String(conditionValue));
      case 'matches':
        try {
          const regex = new RegExp(String(conditionValue));
          return regex.test(String(value));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * 🔗 중첩된 객체 값 가져오기
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 📊 규칙 통계 업데이트
   */
  private async updateRuleStats(ruleId: string, success: boolean): Promise<void> {
    try {
      // 현재 규칙 조회
      const { data, error } = await this.supabase
        .from('custom_rules')
        .select('rule_data')
        .eq('id', ruleId)
        .single();

      if (error || !data) {
        console.warn(`⚠️ [CustomContext] 규칙 통계 업데이트 실패: ${ruleId}`);
        return;
      }

      const rule = data.rule_data as CustomRule;
      rule.executionCount++;
      
      if (success) {
        rule.successRate = ((rule.successRate * (rule.executionCount - 1)) + 100) / rule.executionCount;
      } else {
        rule.successRate = (rule.successRate * (rule.executionCount - 1)) / rule.executionCount;
      }
      
      rule.lastModified = Date.now();

      // 업데이트된 규칙 저장
      await this.supabase
        .from('custom_rules')
        .update({ rule_data: rule })
        .eq('id', ruleId);

      // Redis 캐시 업데이트
      await this.redis.setex(`rule:${ruleId}`, this.CACHE_TTL, rule);
    } catch (error) {
      console.error('❌ [CustomContext] 규칙 통계 업데이트 실패:', error);
    }
  }

  /**
   * 👤 사용자 프로필 저장
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .upsert({
          id: profile.id,
          username: profile.username,
          role: profile.role,
          organization_id: profile.organizationId,
          profile_data: profile,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Redis 캐시 업데이트
      await this.redis.setex(`user_profile:${profile.id}`, this.CACHE_TTL, profile);

      console.log(`✅ [CustomContext] 사용자 프로필 저장: ${profile.username}`);
    } catch (error) {
      console.error('❌ [CustomContext] 사용자 프로필 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 👤 사용자 프로필 조회
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Redis 캐시에서 먼저 조회
      const cached = await this.redis.get<UserProfile>(`user_profile:${userId}`);
      if (cached) {
        return cached;
      }

      // Supabase에서 조회
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('profile_data')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      const profile = data.profile_data as UserProfile;

      // Redis 캐시에 저장
      await this.redis.setex(`user_profile:${userId}`, this.CACHE_TTL, profile);

      return profile;
    } catch (error) {
      console.error('❌ [CustomContext] 사용자 프로필 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔧 기본 조직 설정 생성
   */
  async createDefaultOrganizationSettings(orgId: string, orgName: string): Promise<OrganizationSettings> {
    const defaultSettings: OrganizationSettings = {
      id: orgId,
      organizationName: orgName,
      thresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 },
        response_time: { warning: 1000, critical: 3000 }
      },
      notifications: {
        email: { enabled: true, addresses: [] },
        slack: { enabled: false },
        webhook: { enabled: false }
      },
      customGuides: [],
      preferences: {
        language: 'ko',
        timezone: 'Asia/Seoul',
        dateFormat: 'YYYY-MM-DD',
        autoResolveAlerts: false,
        maintenanceWindows: []
      },
      integrations: {
        monitoring: [],
        alerting: []
      }
    };

    await this.saveOrganizationSettings(defaultSettings);
    return defaultSettings;
  }

  /**
   * 📋 가이드 문서 추가
   */
  async addGuideDocument(orgId: string, guide: Omit<GuideDocument, 'id' | 'lastUpdated'>): Promise<string> {
    try {
      const settings = await this.getOrganizationSettings(orgId);
      if (!settings) {
        throw new Error('조직 설정을 찾을 수 없습니다');
      }

      const newGuide: GuideDocument = {
        ...guide,
        id: `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastUpdated: Date.now()
      };

      settings.customGuides.push(newGuide);
      await this.saveOrganizationSettings(settings);

      console.log(`📋 [CustomContext] 가이드 문서 추가: ${newGuide.title}`);
      return newGuide.id;
    } catch (error) {
      console.error('❌ [CustomContext] 가이드 문서 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 🧹 캐시 정리
   */
  async clearCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // 특정 패턴의 캐시만 정리 (Redis CLI 명령어 방식 사용 불가, 직접 구현 필요)
        console.log(`🧹 [CustomContext] 패턴별 캐시 정리: ${pattern}`);
      } else {
        // 전체 캐시 정리는 조심스럽게 접근 (Redis 전체 flush는 위험)
        console.log('🧹 [CustomContext] 전체 캐시 정리는 수동으로 수행하세요');
      }
    } catch (error) {
      console.error('❌ [CustomContext] 캐시 정리 실패:', error);
    }
  }

  /**
   * 📊 통계 조회
   */
  async getStatistics(): Promise<{
    totalOrganizations: number;
    totalUsers: number;
    totalRules: number;
    activeRules: number;
    avgSuccessRate: number;
  }> {
    try {
      // Supabase에서 통계 조회
      const [orgResult, userResult, ruleResult] = await Promise.all([
        this.supabase.from('organization_settings').select('id', { count: 'exact' }),
        this.supabase.from('user_profiles').select('id', { count: 'exact' }),
        this.supabase.from('custom_rules').select('rule_data')
      ]);

      const rules = (ruleResult.data || []).map(row => row.rule_data as CustomRule);
      const activeRules = rules.filter(rule => rule.enabled);
      const avgSuccessRate = rules.length > 0 
        ? rules.reduce((sum, rule) => sum + rule.successRate, 0) / rules.length 
        : 0;

      return {
        totalOrganizations: orgResult.count || 0,
        totalUsers: userResult.count || 0,
        totalRules: rules.length,
        activeRules: activeRules.length,
        avgSuccessRate: Math.round(avgSuccessRate * 100) / 100
      };
    } catch (error) {
      console.error('❌ [CustomContext] 통계 조회 실패:', error);
      return {
        totalOrganizations: 0,
        totalUsers: 0,
        totalRules: 0,
        activeRules: 0,
        avgSuccessRate: 0
      };
    }
  }
} 