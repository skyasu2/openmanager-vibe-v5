/**
 * ⚙️ 커스텀 컨텍스트 관리자 (Level 3) - 실제 구현
 *
 * ✅ 조직별 가이드, 알림 임계값, 분석 규칙
 * ✅ Supabase에 JSON 형태로 저장
 * ✅ 사용자별 맞춤 설정
 * ✅ 동적 규칙 엔진
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase-singleton';

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
  value: unknown;
  logic?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'alert' | 'email' | 'webhook' | 'script' | 'log';
  config: Record<string, unknown>;
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
    monitoring: { type: string; config: Record<string, unknown> }[];
    alerting: { type: string; config: Record<string, unknown> }[];
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
  settings: Record<string, unknown>;
}

interface SystemIntegrations {
  database: { enabled: boolean; provider?: string; status?: string };
  cache: { enabled: boolean; provider?: string; status?: string };
  ai: { enabled: boolean; provider?: string; models?: string[] };
  // Slack 설정 제거됨 (포트폴리오용)
}

export class CustomContextManager {
  private static instance: CustomContextManager;
  private supabase: SupabaseClient | null = null;
  private isInitialized = false;
  private localCache: Map<string, unknown> = new Map();

  private constructor() {
    this._initializeSupabase();
  }

  static getInstance(): CustomContextManager {
    if (!CustomContextManager.instance) {
      CustomContextManager.instance = new CustomContextManager();
    }
    return CustomContextManager.instance;
  }

  /**
   * 🔍 타입 가드: OrganizationSettings 확인
   */
  private isOrganizationSettings(value: unknown): value is OrganizationSettings {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'organizationName' in value &&
      'thresholds' in value
    );
  }

  /**
   * 🔍 타입 가드: UserProfile 확인
   */
  private isUserProfile(value: unknown): value is UserProfile {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'username' in value &&
      'role' in value
    );
  }

  /**
   * 🔍 타입 가드: CustomRule 확인
   */
  private isCustomRule(value: unknown): value is CustomRule {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'name' in value &&
      'category' in value
    );
  }

  /**
   * 🔧 Supabase 초기화 (통합 싱글톤 사용)
   */
  private async _initializeSupabase(): Promise<void> {
    try {
      // 통합 Supabase 싱글톤 사용
      this.supabase = getSupabaseClient();
      await this.createTablesIfNotExists();
      this.isInitialized = true;
      console.log('✅ [CustomContext] Supabase 싱글톤 연결 성공');
    } catch (error) {
      console.error('❌ [CustomContext] Supabase 초기화 실패:', error);
      this.isInitialized = true; // 로컬 캐시로 폴백
    }
  }

  /**
   * 📋 필요한 테이블 생성
   */
  private async createTablesIfNotExists(): Promise<void> {
    if (!this.supabase) return;

    try {
      // organization_settings 테이블 확인/생성
      const { error: orgError } = await this.supabase
        .from('organization_settings')
        .select('id')
        .limit(1);

      if (orgError && orgError.code === '42P01') {
        // 테이블이 없으면 생성 (실제로는 migration으로 처리)
        console.log(
          '📋 [CustomContext] organization_settings 테이블 필요 - 관리자에게 문의'
        );
      }

      // custom_rules 테이블 확인/생성
      const { error: rulesError } = await this.supabase
        .from('custom_rules')
        .select('id')
        .limit(1);

      if (rulesError && rulesError.code === '42P01') {
        console.log(
          '📋 [CustomContext] custom_rules 테이블 필요 - 관리자에게 문의'
        );
      }

      // user_profiles 테이블 확인/생성
      const { error: profilesError } = await this.supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (profilesError && profilesError.code === '42P01') {
        console.log(
          '📋 [CustomContext] user_profiles 테이블 필요 - 관리자에게 문의'
        );
      }
    } catch (error) {
      console.error('❌ [CustomContext] 테이블 확인 실패:', error);
    }
  }

  /**
   * 🏢 조직 설정 저장 (실제 구현)
   */
  async saveOrganizationSettings(
    settings: OrganizationSettings
  ): Promise<void> {
    try {
      if (this.supabase) {
        const { error } = await this.supabase
          .from('organization_settings')
          .upsert({
            id: settings.id,
            organization_name: settings.organizationName,
            settings_data: settings,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        console.log(
          `💾 [CustomContext] 조직 설정 저장 완료: ${settings.organizationName}`
        );
      } else {
        // 로컬 캐시에 저장
        this.localCache.set(`org_${settings.id}`, settings);
        console.log(
          `💾 [CustomContext] 조직 설정 로컬 저장: ${settings.organizationName}`
        );
      }

      // 메모리 캐시 업데이트
      this.localCache.set(`org_${settings.id}`, settings);
    } catch (error) {
      console.error(`❌ [CustomContext] 조직 설정 저장 실패:`, error);
      // 폴백: 로컬 캐시에 저장
      this.localCache.set(`org_${settings.id}`, settings);
    }
  }

  /**
   * 🏢 조직 설정 조회 (실제 구현)
   */
  async getOrganizationSettings(
    orgId: string
  ): Promise<OrganizationSettings | null> {
    try {
      // 먼저 메모리 캐시 확인
      if (this.localCache.has(`org_${orgId}`)) {
        const cached = this.localCache.get(`org_${orgId}`);
        return this.isOrganizationSettings(cached) ? cached : null;
      }

      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('organization_settings')
          .select('settings_data')
          .eq('id', orgId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // 데이터 없음
            console.log(`📦 [CustomContext] 조직 설정 없음: ${orgId}`);
            return null;
          }
          throw error;
        }

        const settings = data.settings_data as OrganizationSettings;
        this.localCache.set(`org_${orgId}`, settings);
        console.log(
          `📦 [CustomContext] 조직 설정 조회 완료: ${settings.organizationName}`
        );
        return settings;
      } else {
        // 로컬 캐시에서 조회
        const cached = this.localCache.get(`org_${orgId}`);
        return this.isOrganizationSettings(cached) ? cached : null;
      }
    } catch (error) {
      console.error(`❌ [CustomContext] 조직 설정 조회 실패:`, error);
      const cached = this.localCache.get(`org_${orgId}`);
      return this.isOrganizationSettings(cached) ? cached : null;
    }
  }

  /**
   * 📏 커스텀 규칙 생성 (실제 구현)
   */
  async createCustomRule(
    rule: Omit<
      CustomRule,
      'id' | 'createdAt' | 'executionCount' | 'successRate'
    >
  ): Promise<string> {
    try {
      const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const completeRule: CustomRule = {
        ...rule,
        id: ruleId,
        createdAt: Date.now(),
        executionCount: 0,
        successRate: 0,
      };

      if (this.supabase) {
        const { error } = await this.supabase.from('custom_rules').insert({
          id: ruleId,
          name: rule.name,
          description: rule.description,
          category: rule.category,
          rule_data: completeRule,
          enabled: rule.enabled,
          created_by: rule.createdBy,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
        console.log(`📏 [CustomContext] 커스텀 규칙 생성 완료: ${rule.name}`);
      } else {
        // 로컬 캐시에 저장
        this.localCache.set(`rule_${ruleId}`, completeRule);
        console.log(`📏 [CustomContext] 커스텀 규칙 로컬 생성: ${rule.name}`);
      }

      // 메모리 캐시 업데이트
      this.localCache.set(`rule_${ruleId}`, completeRule);
      return ruleId;
    } catch (error) {
      console.error(`❌ [CustomContext] 커스텀 규칙 생성 실패:`, error);
      throw error;
    }
  }

  /**
   * 📏 커스텀 규칙 조회 (실제 구현)
   */
  async getCustomRules(category?: string): Promise<CustomRule[]> {
    try {
      if (this.supabase) {
        let query = this.supabase.from('custom_rules').select('rule_data');

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        const rules = data.map((item) => item.rule_data as CustomRule);
        console.log(
          `📏 [CustomContext] 커스텀 규칙 조회 완료: ${rules.length}개 (${category || 'all'})`
        );
        return rules;
      } else {
        // 로컬 캐시에서 조회
        const rules: CustomRule[] = [];
        for (const [key, value] of this.localCache.entries()) {
          if (
            key.startsWith('rule_') &&
            this.isCustomRule(value) &&
            (!category || value.category === category)
          ) {
            rules.push(value);
          }
        }
        console.log(`📏 [CustomContext] 로컬 규칙 조회: ${rules.length}개`);
        return rules;
      }
    } catch (error) {
      console.error(`❌ [CustomContext] 커스텀 규칙 조회 실패:`, error);
      return [];
    }
  }

  /**
   * ⚡ 규칙 실행 (실제 구현)
   */
  async executeRules(
    context: Record<string, unknown>,
    orgId: string
  ): Promise<{
    executed: number;
    triggered: number;
    actions: RuleAction[];
    errors: string[];
  }> {
    try {
      console.log(`⚡ [CustomContext] 규칙 실행 시작: ${orgId}`);

      const rules = await this.getCustomRules();
      const enabledRules = rules.filter((rule) => rule.enabled);

      let executed = 0;
      let triggered = 0;
      const actions: RuleAction[] = [];
      const errors: string[] = [];

      for (const rule of enabledRules) {
        try {
          executed++;
          const isTriggered = this.evaluateRuleConditions(
            rule.conditions,
            context
          );

          if (isTriggered) {
            triggered++;
            actions.push(...rule.actions);

            // 규칙 실행 통계 업데이트
            await this.updateRuleStats(rule.id, true);

            console.log(`🎯 [CustomContext] 규칙 트리거됨: ${rule.name}`);
          } else {
            await this.updateRuleStats(rule.id, false);
          }
        } catch (ruleError) {
          errors.push(`규칙 ${rule.name} 실행 실패: ${ruleError}`);
          console.error(`❌ 규칙 실행 실패 (${rule.name}):`, ruleError);
        }
      }

      const result = { executed, triggered, actions, errors };
      console.log(`⚡ [CustomContext] 규칙 실행 완료:`, result);
      return result;
    } catch (error) {
      console.error(`❌ [CustomContext] 규칙 실행 전체 실패:`, error);
      return {
        executed: 0,
        triggered: 0,
        actions: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * 🧮 규칙 조건 평가
   */
  private evaluateRuleConditions(
    conditions: RuleCondition[],
    context: Record<string, unknown>
  ): boolean {
    if (conditions.length === 0) return false;

    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.evaluateSingleCondition(condition, context);

      if (currentLogic === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      if (condition.logic) {
        currentLogic = condition.logic;
      }
    }

    return result;
  }

  /**
   * 🔍 단일 조건 평가
   */
  private evaluateSingleCondition(
    condition: RuleCondition,
    context: Record<string, unknown>
  ): boolean {
    const value = this.getNestedValue(context, condition.field);
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'gt':
        return Number(value) > Number(expectedValue);
      case 'gte':
        return Number(value) >= Number(expectedValue);
      case 'lt':
        return Number(value) < Number(expectedValue);
      case 'lte':
        return Number(value) <= Number(expectedValue);
      case 'eq':
        return value === expectedValue;
      case 'contains':
        return String(value).includes(String(expectedValue));
      case 'matches':
        return new RegExp(String(expectedValue)).test(String(value));
      default:
        return false;
    }
  }

  /**
   * 📊 중첩된 객체에서 값 추출
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }

  /**
   * 📈 규칙 통계 업데이트
   */
  private async updateRuleStats(
    ruleId: string,
    success: boolean
  ): Promise<void> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('custom_rules')
          .select('rule_data')
          .eq('id', ruleId)
          .single();

        if (error) throw error;

        const rule = data.rule_data as CustomRule;
        rule.executionCount++;

        if (success) {
          rule.successRate =
            (rule.successRate * (rule.executionCount - 1) + 100) /
            rule.executionCount;
        } else {
          rule.successRate =
            (rule.successRate * (rule.executionCount - 1)) /
            rule.executionCount;
        }

        await this.supabase
          .from('custom_rules')
          .update({
            rule_data: rule,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ruleId);
      }
    } catch (error) {
      console.error(`❌ 규칙 통계 업데이트 실패 (${ruleId}):`, error);
    }
  }

  /**
   * 👤 사용자 프로필 저장 (실제 구현)
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      if (this.supabase) {
        const { error } = await this.supabase.from('user_profiles').upsert({
          id: profile.id,
          username: profile.username,
          role: profile.role,
          organization_id: profile.organizationId,
          profile_data: profile,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        console.log(
          `👤 [CustomContext] 사용자 프로필 저장 완료: ${profile.username}`
        );
      } else {
        this.localCache.set(`user_${profile.id}`, profile);
        console.log(
          `👤 [CustomContext] 사용자 프로필 로컬 저장: ${profile.username}`
        );
      }

      this.localCache.set(`user_${profile.id}`, profile);
    } catch (error) {
      console.error(`❌ [CustomContext] 사용자 프로필 저장 실패:`, error);
      this.localCache.set(`user_${profile.id}`, profile);
    }
  }

  /**
   * 👤 사용자 프로필 조회 (실제 구현)
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // 메모리 캐시 확인
      if (this.localCache.has(`user_${userId}`)) {
        const cached = this.localCache.get(`user_${userId}`);
        return this.isUserProfile(cached) ? cached : null;
      }

      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('user_profiles')
          .select('profile_data')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`👤 [CustomContext] 사용자 프로필 없음: ${userId}`);
            return null;
          }
          throw error;
        }

        const profile = data.profile_data as UserProfile;
        this.localCache.set(`user_${userId}`, profile);
        console.log(
          `👤 [CustomContext] 사용자 프로필 조회 완료: ${profile.username}`
        );
        return profile;
      } else {
        const cached = this.localCache.get(`user_${userId}`);
        return this.isUserProfile(cached) ? cached : null;
      }
    } catch (error) {
      console.error(`❌ [CustomContext] 사용자 프로필 조회 실패:`, error);
      const cached = this.localCache.get(`user_${userId}`);
      return this.isUserProfile(cached) ? cached : null;
    }
  }

  /**
   * 🏢 기본 조직 설정 생성 (실제 구현)
   */
  async createDefaultOrganizationSettings(
    orgId: string,
    orgName: string
  ): Promise<OrganizationSettings> {
    console.log(`🏢 [CustomContext] 기본 조직 설정 생성: ${orgName}`);

    const defaultSettings: OrganizationSettings = {
      id: orgId,
      organizationName: orgName,
      thresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 },
        response_time: { warning: 1000, critical: 3000 },
      },
      notifications: {
        email: { enabled: false, addresses: [] },
        webhook: { enabled: false },
      },
      customGuides: [],
      preferences: {
        language: 'ko',
        timezone: 'Asia/Seoul',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        autoResolveAlerts: false,
        maintenanceWindows: [],
      },
      integrations: {
        monitoring: [],
        alerting: [],
      },
    };

    await this.saveOrganizationSettings(defaultSettings);
    return defaultSettings;
  }

  /**
   * 📚 가이드 문서 추가 (실제 구현)
   */
  async addGuideDocument(
    orgId: string,
    guide: Omit<GuideDocument, 'id' | 'lastUpdated'>
  ): Promise<string> {
    try {
      const guideId = `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const completeGuide: GuideDocument = {
        ...guide,
        id: guideId,
        lastUpdated: Date.now(),
      };

      const orgSettings = await this.getOrganizationSettings(orgId);
      if (orgSettings) {
        orgSettings.customGuides.push(completeGuide);
        await this.saveOrganizationSettings(orgSettings);
        console.log(`📚 [CustomContext] 가이드 문서 추가 완료: ${guide.title}`);
      }

      return guideId;
    } catch (error) {
      console.error(`❌ [CustomContext] 가이드 문서 추가 실패:`, error);
      throw error;
    }
  }

  /**
   * 🗑️ 캐시 정리 (실제 구현)
   */
  async clearCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        const keysToDelete: string[] = [];
        for (const key of this.localCache.keys()) {
          if (key.includes(pattern)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach((key) => this.localCache.delete(key));
        console.log(
          `🗑️ [CustomContext] 패턴 캐시 정리 완료: ${pattern} (${keysToDelete.length}개)`
        );
      } else {
        this.localCache.clear();
        console.log(`🗑️ [CustomContext] 전체 캐시 정리 완료`);
      }
    } catch (error) {
      console.error(`❌ [CustomContext] 캐시 정리 실패:`, error);
    }
  }

  /**
   * 📊 통계 조회 (실제 구현)
   */
  async getStatistics(): Promise<{
    totalOrganizations: number;
    totalUsers: number;
    totalRules: number;
    activeRules: number;
    avgSuccessRate: number;
  }> {
    try {
      if (this.supabase) {
        const [orgResult, userResult, ruleResult] = await Promise.all([
          this.supabase
            .from('organization_settings')
            .select('id', { count: 'exact' }),
          this.supabase.from('user_profiles').select('id', { count: 'exact' }),
          this.supabase.from('custom_rules').select('rule_data, enabled'),
        ]);

        const totalOrganizations = orgResult.count || 0;
        const totalUsers = userResult.count || 0;
        const rules = ruleResult.data || [];
        const totalRules = rules.length;
        const activeRules = rules.filter((r) => r.enabled).length;
        const avgSuccessRate =
          rules.length > 0
            ? rules.reduce(
                (sum, r) => sum + (r.rule_data?.successRate || 0),
                0
              ) / rules.length
            : 0;

        const stats = {
          totalOrganizations,
          totalUsers,
          totalRules,
          activeRules,
          avgSuccessRate,
        };

        console.log('📊 [CustomContext] 통계 조회 완료:', stats);
        return stats;
      } else {
        // 로컬 캐시 기반 통계
        let orgCount = 0;
        let userCount = 0;
        let ruleCount = 0;
        let activeRuleCount = 0;

        for (const [key, value] of this.localCache.entries()) {
          if (key.startsWith('org_')) orgCount++;
          if (key.startsWith('user_')) userCount++;
          if (key.startsWith('rule_')) {
            ruleCount++;
            if (this.isCustomRule(value) && value.enabled) activeRuleCount++;
          }
        }

        const stats = {
          totalOrganizations: orgCount,
          totalUsers: userCount,
          totalRules: ruleCount,
          activeRules: activeRuleCount,
          avgSuccessRate: 0,
        };

        console.log('📊 [CustomContext] 로컬 통계 조회:', stats);
        return stats;
      }
    } catch (error) {
      console.error(`❌ [CustomContext] 통계 조회 실패:`, error);
      return {
        totalOrganizations: 0,
        totalUsers: 0,
        totalRules: 0,
        activeRules: 0,
        avgSuccessRate: 0,
      };
    }
  }

  /**
   * 🔄 시스템 상태 확인
   */
  getSystemStatus() {
    return {
      isInitialized: this.isInitialized,
      hasSupabase: this.supabase !== null,
      cacheSize: this.localCache.size,
      implementationLevel: 'FULL', // 더미에서 완전 구현으로 변경
    };
  }
}
