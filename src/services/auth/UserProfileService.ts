/**
 * 👤 User Profile Service
 *
 * Supabase 기반 사용자 프로필 관리 서비스
 * GitHub OAuth + 게스트 사용자 통합 관리
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-server';
import type {
  GitHubUser,
  DatabaseUser,
  UserProfileUpdate,
  UserSettings,
  UserActivity,
} from '@/types/auth.types';
import type { AIMetadata } from '@/types/ai-service-types';

export class UserProfileService {
  private supabase;

  constructor() {
    // 클라이언트 사이드에서 사용할 때
    if (typeof window !== 'undefined') {
      this.supabase = supabase;
    } else {
      // 서버 사이드에서 사용할 때
      this.supabase = supabaseAdmin;
    }
  }

  /**
   * 🔍 사용자 프로필 조회
   */
  async getUserProfile(userId: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // 에러 타입에 따른 세밀한 처리
        if (error.code === 'CONNECTION_ERROR') {
          console.error('⚠️ 데이터베이스 연결 오류:', {
            userId,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.error('사용자 프로필 조회 실패:', error);
        }
        return null;
      }

      return data as DatabaseUser;
    } catch (error) {
      console.error('사용자 프로필 조회 중 예외 발생:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }

  /**
   * 📝 사용자 프로필 생성 (GitHub OAuth 후 자동 생성)
   */
  async createUserProfile(
    authUser: SupabaseUser,
    additionalData?: Partial<DatabaseUser>
  ): Promise<DatabaseUser | null> {
    try {
      // GitHub 사용자 메타데이터 추출
      const metadata = authUser.user_metadata || {};
      const isGitHubUser = authUser.app_metadata?.provider === 'github';

      const newUser: Partial<DatabaseUser> = {
        id: crypto.randomUUID(),
        auth_user_id: authUser.id,
        email: authUser.email,
        name:
          metadata.full_name ||
          metadata.name ||
          metadata.user_name ||
          authUser.email?.split('@')[0] ||
          'GitHub User',
        avatar_url: metadata.avatar_url,
        username: metadata.user_name,
        bio: metadata.bio,
        location: metadata.location,
        company: metadata.company,
        blog: metadata.blog,
        twitter_username: metadata.twitter_username,
        github_id: metadata.sub || metadata.provider_id,
        public_repos: metadata.public_repos,
        followers: metadata.followers,
        following: metadata.following,
        verified: true, // GitHub OAuth 사용자는 기본적으로 인증됨
        user_type: isGitHubUser ? 'github' : 'guest',
        permissions: isGitHubUser
          ? [
              'dashboard:view',
              'dashboard:edit',
              'system:start',
              'system:stop',
              'api:read',
              'api:write',
              'logs:view',
              'metrics:view',
              'settings:edit',
            ]
          : [
              'dashboard:view',
              'system:start',
              'basic_interaction',
              'metrics:view',
              'logs:view',
            ],
        settings: {
          user_id: authUser.id,
          theme: 'system',
          language: 'ko',
          timezone: 'Asia/Seoul',
          notifications: {
            email: true,
            browser: true,
            alerts: true,
          },
          privacy: {
            profile_public: false,
            activity_public: false,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        last_sign_in_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      const { data, error } = await this.supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.error('사용자 프로필 생성 실패:', error);
        return null;
      }

      console.log('✅ 사용자 프로필 생성 성공:', data.name);
      return data as DatabaseUser;
    } catch (error) {
      console.error('사용자 프로필 생성 중 오류:', error);
      return null;
    }
  }

  /**
   * 🔄 사용자 프로필 업데이트
   */
  async updateUserProfile(
    userId: string,
    updates: UserProfileUpdate
  ): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('사용자 프로필 업데이트 실패:', error);
        return null;
      }

      console.log('✅ 사용자 프로필 업데이트 성공:', data.name);
      return data as DatabaseUser;
    } catch (error) {
      console.error('사용자 프로필 업데이트 중 오류:', error);
      return null;
    }
  }

  /**
   * 🎯 사용자 설정 업데이트
   */
  async updateUserSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          settings: {
            ...settings,
            updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('사용자 설정 업데이트 실패:', error);
        return false;
      }

      console.log('✅ 사용자 설정 업데이트 성공');
      return true;
    } catch (error) {
      console.error('사용자 설정 업데이트 중 오류:', error);
      return false;
    }
  }

  /**
   * 📊 사용자 활동 기록
   */
  async logUserActivity(
    userId: string,
    action: string,
    resource?: string,
    metadata?: AIMetadata
  ): Promise<boolean> {
    try {
      const activity: Partial<UserActivity> = {
        id: crypto.randomUUID(),
        user_id: userId,
        action,
        resource,
        metadata,
        created_at: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from('user_activities')
        .insert([activity]);

      if (error) {
        console.error('사용자 활동 기록 실패:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('사용자 활동 기록 중 오류:', error);
      return false;
    }
  }

  /**
   * 🔍 사용자 활동 조회
   */
  async getUserActivities(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserActivity[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('사용자 활동 조회 실패:', error);
        return [];
      }

      return data as UserActivity[];
    } catch (error) {
      console.error('사용자 활동 조회 중 오류:', error);
      return [];
    }
  }

  /**
   * 🗂️ Auth User ID로 프로필 조회
   */
  async getUserProfileByAuthId(
    authUserId: string
  ): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error) {
        console.error('Auth ID로 사용자 프로필 조회 실패:', error);
        return null;
      }

      return data as DatabaseUser;
    } catch (error) {
      console.error('Auth ID로 사용자 프로필 조회 중 오류:', error);
      return null;
    }
  }

  /**
   * 🔄 로그인 시간 업데이트
   */
  async updateLastSignIn(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('마지막 로그인 시간 업데이트 실패:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('마지막 로그인 시간 업데이트 중 오류:', error);
      return false;
    }
  }

  /**
   * 🔧 Supabase User를 AppUser로 변환
   */
  supabaseUserToAppUser(
    supabaseUser: SupabaseUser,
    profileData?: DatabaseUser
  ): GitHubUser {
    const metadata = supabaseUser.user_metadata || {};

    return {
      id: profileData?.id || crypto.randomUUID(),
      type: 'github',
      email: supabaseUser.email,
      name:
        profileData?.name ||
        metadata.full_name ||
        metadata.name ||
        supabaseUser.email?.split('@')[0] ||
        'GitHub User',
      avatar: profileData?.avatar_url || metadata.avatar_url,
      github_id: metadata.sub || metadata.provider_id || supabaseUser.id,
      username: profileData?.username || metadata.user_name,
      bio: profileData?.bio || metadata.bio,
      location: profileData?.location || metadata.location,
      company: profileData?.company || metadata.company,
      blog: profileData?.blog || metadata.blog,
      twitter_username:
        profileData?.twitter_username || metadata.twitter_username,
      public_repos: profileData?.public_repos || metadata.public_repos || 0,
      followers: profileData?.followers || metadata.followers || 0,
      following: profileData?.following || metadata.following || 0,
      verified: true,
      created_at: profileData?.created_at || supabaseUser.created_at,
      updated_at: profileData?.updated_at || supabaseUser.updated_at,
    };
  }

  /**
   * 🧹 비활성 게스트 사용자 정리
   */
  async cleanupInactiveGuests(): Promise<number> {
    try {
      // 24시간 이상 비활성 게스트 사용자 삭제
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 24);

      const { data, error } = await this.supabase
        .from('users')
        .delete()
        .eq('user_type', 'guest')
        .lt('last_sign_in_at', cutoffTime.toISOString())
        .select();

      if (error) {
        console.error('비활성 게스트 사용자 정리 실패:', error);
        return 0;
      }

      const cleanedCount = data?.length || 0;
      console.log(`🧹 ${cleanedCount}명의 비활성 게스트 사용자 정리 완료`);
      return cleanedCount;
    } catch (error) {
      console.error('비활성 게스트 사용자 정리 중 오류:', error);
      return 0;
    }
  }
}

// 싱글톤 인스턴스 생성
export const userProfileService = new UserProfileService();
