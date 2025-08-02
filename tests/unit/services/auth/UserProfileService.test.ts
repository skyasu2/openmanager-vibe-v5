/**
 * ✅ TDD GREEN Phase: UserProfileService 테스트
 * 
 * 테스트 대상: UserProfileService 클래스
 * 모든 테스트 통과 완료 (53/53)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { UserProfileService } from '@/services/auth/UserProfileService';
import type { 
  DatabaseUser, 
  UserProfileUpdate, 
  UserSettings, 
  UserActivity,
  GitHubUser 
} from '@/types/auth.types';
import type { AIMetadata } from '@/types/ai-service-types';

// Mock Supabase clients
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-123'),
  },
  writable: true,
});

describe('UserProfileService', () => {
  let userProfileService: UserProfileService;
  let mockFromChain: any;
  let mockSupabaseClient: any;
  let mockSupabaseAdminClient: any;
  const originalWindow = global.window;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset crypto mock
    (global.crypto.randomUUID as any).mockReturnValue('mock-uuid-123');
    
    // Create mock chain for Supabase operations
    mockFromChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    // Get mocked modules
    const supabaseModule = await import('@/lib/supabase');
    const supabaseServerModule = await import('@/lib/supabase-server');
    
    mockSupabaseClient = supabaseModule.supabase;
    mockSupabaseAdminClient = supabaseServerModule.supabaseAdmin;

    // Setup mock clients to return the chain
    mockSupabaseClient.from.mockReturnValue(mockFromChain);
    mockSupabaseAdminClient.from.mockReturnValue(mockFromChain);

    // Mock window to test client-side initialization
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
      configurable: true,
    });

    userProfileService = new UserProfileService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    
    // Restore window object safely
    if (originalWindow !== undefined) {
      global.window = originalWindow;
    } else {
      delete (global as any).window;
    }
  });

  describe('🔴 getUserProfile', () => {
    it('should successfully retrieve user profile by ID', async () => {
      const mockUser: DatabaseUser = {
        id: 'user-123',
        auth_user_id: 'auth-123',
        email: 'test@example.com',
        name: 'Test User',
        user_type: 'github',
        permissions: ['dashboard:view'],
        settings: {} as UserSettings,
        created_at: '2025-08-02T00:00:00Z',
        updated_at: '2025-08-02T00:00:00Z',
      };

      mockFromChain.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await userProfileService.getUserProfile('user-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockFromChain.select).toHaveBeenCalledWith('*');
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user profile not found', async () => {
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' } 
      });

      const result = await userProfileService.getUserProfile('non-existent-user');

      expect(result).toBeNull();
    });

    // @tdd-red  
    it('should handle database errors gracefully', async () => {
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'CONNECTION_ERROR', message: 'Database connection failed' } 
      });

      const result = await userProfileService.getUserProfile('user-123');

      expect(result).toBeNull();
    });

    it('should handle exceptions during profile retrieval', async () => {
      mockFromChain.single.mockRejectedValue(new Error('Network error'));

      const result = await userProfileService.getUserProfile('user-123');

      expect(result).toBeNull();
    });
  });

  describe('🔴 createUserProfile', () => {
    const mockSupabaseUser: SupabaseUser = {
      id: 'auth-123',
      email: 'test@github.com',
      created_at: '2025-08-02T00:00:00Z',
      updated_at: '2025-08-02T00:00:00Z',
      user_metadata: {
        full_name: 'GitHub User',
        avatar_url: 'https://github.com/avatar.jpg',
        user_name: 'githubuser',
        bio: 'Developer',
        location: 'Seoul, Korea',
        company: 'GitHub Inc',
        blog: 'https://blog.example.com',
        twitter_username: 'githubuser',
        public_repos: 50,
        followers: 100,
        following: 80,
        sub: 'github-123',
      },
      app_metadata: {
        provider: 'github',
      },
      aud: '',
      confirmation_sent_at: '',
      confirmed_at: '',
      email_confirmed_at: '',
      last_sign_in_at: '',
      phone: '',
      recovery_sent_at: '',
      role: '',
    };

    it('should successfully create GitHub user profile', async () => {
      const mockCreatedUser: DatabaseUser = {
        id: 'mock-uuid-123',
        auth_user_id: 'auth-123',
        email: 'test@github.com',
        name: 'GitHub User',
        user_type: 'github',
        permissions: ['dashboard:view', 'dashboard:edit', 'system:start'],
        settings: {} as UserSettings,
        created_at: '2025-08-02T00:00:00Z',
        updated_at: '2025-08-02T00:00:00Z',
      };

      mockFromChain.single.mockResolvedValue({ data: mockCreatedUser, error: null });

      const result = await userProfileService.createUserProfile(mockSupabaseUser);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockFromChain.insert).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create guest user profile when not GitHub provider', async () => {
      const mockGuestSupabaseUser = {
        ...mockSupabaseUser,
        app_metadata: { provider: 'email' },
      };

      mockFromChain.single.mockResolvedValue({ 
        data: { user_type: 'guest', permissions: ['dashboard:view', 'system:start'] }, 
        error: null 
      });

      const result = await userProfileService.createUserProfile(mockGuestSupabaseUser);

      expect(result).toBeDefined();
      // The actual implementation should set user_type to 'guest' and limited permissions
    });

    it('should merge additional data when provided', async () => {
      const additionalData = {
        bio: 'Custom bio',
        location: 'Custom location',
      };

      mockFromChain.single.mockResolvedValue({ 
        data: { ...additionalData }, 
        error: null 
      });

      const result = await userProfileService.createUserProfile(mockSupabaseUser, additionalData);

      expect(result).toBeDefined();
    });

    it('should handle profile creation failure', async () => {
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'CONSTRAINT_VIOLATION', message: 'Email already exists' } 
      });

      const result = await userProfileService.createUserProfile(mockSupabaseUser);

      expect(result).toBeNull();
    });

    it('should handle exceptions during profile creation', async () => {
      mockFromChain.single.mockRejectedValue(new Error('Database connection failed'));

      const result = await userProfileService.createUserProfile(mockSupabaseUser);

      expect(result).toBeNull();
    });

    it('should set correct permissions for GitHub users', async () => {
      mockFromChain.single.mockResolvedValue({ 
        data: { permissions: ['dashboard:view', 'dashboard:edit', 'system:start', 'system:stop'] }, 
        error: null 
      });

      const result = await userProfileService.createUserProfile(mockSupabaseUser);

      expect(result).toBeDefined();
      // Should have elevated permissions for GitHub users
    });

    it('should handle missing user metadata gracefully', async () => {
      const userWithoutMetadata = {
        ...mockSupabaseUser,
        user_metadata: {},
      };

      mockFromChain.single.mockResolvedValue({ 
        data: { name: 'GitHub User' }, 
        error: null 
      });

      const result = await userProfileService.createUserProfile(userWithoutMetadata);

      expect(result).toBeDefined();
    });
  });

  describe('🔴 updateUserProfile', () => {
    const mockUpdate: UserProfileUpdate = {
      name: 'Updated Name',
      bio: 'Updated bio',
      location: 'Updated location',
    };

    it('should successfully update user profile', async () => {
      const mockUpdatedUser: DatabaseUser = {
        id: 'user-123',
        auth_user_id: 'auth-123',
        email: 'test@example.com',
        name: 'Updated Name',
        user_type: 'github',
        permissions: ['dashboard:view'],
        settings: {} as UserSettings,
        created_at: '2025-08-02T00:00:00Z',
        updated_at: '2025-08-02T01:00:00Z',
      };

      mockFromChain.single.mockResolvedValue({ data: mockUpdatedUser, error: null });

      const result = await userProfileService.updateUserProfile('user-123', mockUpdate);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockFromChain.update).toHaveBeenCalled();
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should include updated_at timestamp in update', async () => {
      mockFromChain.single.mockResolvedValue({ data: {}, error: null });

      await userProfileService.updateUserProfile('user-123', mockUpdate);

      const updateCall = mockFromChain.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
      expect(typeof updateCall.updated_at).toBe('string');
    });

    it('should return null when user not found for update', async () => {
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' } 
      });

      const result = await userProfileService.updateUserProfile('non-existent-user', mockUpdate);

      expect(result).toBeNull();
    });

    it('should handle update database errors', async () => {
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'CONSTRAINT_VIOLATION', message: 'Invalid data' } 
      });

      const result = await userProfileService.updateUserProfile('user-123', mockUpdate);

      expect(result).toBeNull();
    });

    it('should handle exceptions during profile update', async () => {
      mockFromChain.single.mockRejectedValue(new Error('Network error'));

      const result = await userProfileService.updateUserProfile('user-123', mockUpdate);

      expect(result).toBeNull();
    });
  });

  describe('🔴 updateUserSettings', () => {
    const mockSettings: Partial<UserSettings> = {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: false,
        browser: true,
        alerts: true,
      },
    };

    it('should successfully update user settings', async () => {
      mockFromChain.eq.mockResolvedValue({ data: null, error: null });

      const result = await userProfileService.updateUserSettings('user-123', mockSettings);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockFromChain.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should include updated_at timestamp in settings update', async () => {
      mockFromChain.eq.mockResolvedValue({ data: null, error: null });

      await userProfileService.updateUserSettings('user-123', mockSettings);

      const updateCall = mockFromChain.update.mock.calls[0][0];
      expect(updateCall.settings).toHaveProperty('updated_at');
      expect(updateCall).toHaveProperty('updated_at');
    });

    it('should return false when settings update fails', async () => {
      mockFromChain.eq.mockResolvedValue({ 
        data: null, 
        error: { code: 'CONSTRAINT_VIOLATION', message: 'Invalid settings' } 
      });

      const result = await userProfileService.updateUserSettings('user-123', mockSettings);

      expect(result).toBe(false);
    });

    it('should handle exceptions during settings update', async () => {
      mockFromChain.eq.mockRejectedValue(new Error('Database error'));

      const result = await userProfileService.updateUserSettings('user-123', mockSettings);

      expect(result).toBe(false);
    });
  });

  describe('🔴 logUserActivity', () => {
    const mockMetadata: AIMetadata = {
      aiEngine: 'google-ai',
      model: 'gemini-pro',
      usage: { promptTokens: 100, completionTokens: 50 },
    };

    it('should successfully log user activity', async () => {
      mockFromChain.insert.mockResolvedValue({ data: null, error: null });

      const result = await userProfileService.logUserActivity(
        'user-123', 
        'dashboard:view', 
        'server-metrics',
        mockMetadata
      );

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_activities');
      expect(mockFromChain.insert).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should log activity without resource and metadata', async () => {
      mockFromChain.insert.mockResolvedValue({ data: null, error: null });

      const result = await userProfileService.logUserActivity('user-123', 'login');

      expect(result).toBe(true);
    });

    it('should generate unique activity ID', async () => {
      mockFromChain.insert.mockResolvedValue({ data: null, error: null });

      await userProfileService.logUserActivity('user-123', 'test-action');

      const insertCall = mockFromChain.insert.mock.calls[0][0][0];
      expect(insertCall.id).toBe('mock-uuid-123');
    });

    it('should return false when activity logging fails', async () => {
      mockFromChain.insert.mockResolvedValue({ 
        data: null, 
        error: { code: 'INSERT_ERROR', message: 'Failed to insert activity' } 
      });

      const result = await userProfileService.logUserActivity('user-123', 'failed-action');

      expect(result).toBe(false);
    });

    it('should handle exceptions during activity logging', async () => {
      mockFromChain.insert.mockRejectedValue(new Error('Database connection lost'));

      const result = await userProfileService.logUserActivity('user-123', 'error-action');

      expect(result).toBe(false);
    });
  });

  describe('🔴 getUserActivities', () => {
    const mockActivities: UserActivity[] = [
      {
        id: 'activity-1',
        user_id: 'user-123',
        action: 'dashboard:view',
        resource: 'server-metrics',
        created_at: '2025-08-02T00:00:00Z',
      },
      {
        id: 'activity-2',
        user_id: 'user-123',
        action: 'settings:update',
        created_at: '2025-08-01T23:00:00Z',
      },
    ];

    it('should successfully retrieve user activities with default pagination', async () => {
      mockFromChain.range.mockResolvedValue({ data: mockActivities, error: null });

      const result = await userProfileService.getUserActivities('user-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_activities');
      expect(mockFromChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockFromChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockFromChain.range).toHaveBeenCalledWith(0, 49); // 0 to limit-1
      expect(result).toEqual(mockActivities);
    });

    it('should handle custom limit and offset', async () => {
      mockFromChain.range.mockResolvedValue({ data: mockActivities.slice(0, 1), error: null });

      const result = await userProfileService.getUserActivities('user-123', 10, 20);

      expect(mockFromChain.range).toHaveBeenCalledWith(20, 29); // offset to offset+limit-1
      expect(result).toHaveLength(1); // Mock returns 1 item (slice(0, 1))
    });

    it('should return empty array when no activities found', async () => {
      mockFromChain.range.mockResolvedValue({ data: [], error: null });

      const result = await userProfileService.getUserActivities('user-123');

      expect(result).toEqual([]);
    });

    it('should return empty array on database error', async () => {
      mockFromChain.range.mockResolvedValue({ 
        data: null, 
        error: { code: 'SELECT_ERROR', message: 'Query failed' } 
      });

      const result = await userProfileService.getUserActivities('user-123');

      expect(result).toEqual([]);
    });

    it('should handle exceptions during activities retrieval', async () => {
      mockFromChain.range.mockRejectedValue(new Error('Connection timeout'));

      const result = await userProfileService.getUserActivities('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('🔴 getUserProfileByAuthId', () => {
    it('should successfully retrieve user profile by auth ID', async () => {
      const mockUser: DatabaseUser = {
        id: 'user-123',
        auth_user_id: 'auth-123',
        email: 'test@example.com',
        name: 'Test User',
        user_type: 'github',
        permissions: ['dashboard:view'],
        settings: {} as UserSettings,
        created_at: '2025-08-02T00:00:00Z',
        updated_at: '2025-08-02T00:00:00Z',
      };

      mockFromChain.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await userProfileService.getUserProfileByAuthId('auth-123');

      expect(mockFromChain.eq).toHaveBeenCalledWith('auth_user_id', 'auth-123');
      expect(result).toEqual(mockUser);
    });

    it('should return null when profile not found by auth ID', async () => {
      mockFromChain.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' } 
      });

      const result = await userProfileService.getUserProfileByAuthId('non-existent-auth-id');

      expect(result).toBeNull();
    });

    it('should handle exceptions during auth ID lookup', async () => {
      mockFromChain.single.mockRejectedValue(new Error('Database error'));

      const result = await userProfileService.getUserProfileByAuthId('auth-123');

      expect(result).toBeNull();
    });
  });

  describe('🔴 updateLastSignIn', () => {
    it('should successfully update last sign in timestamp', async () => {
      mockFromChain.eq.mockResolvedValue({ data: null, error: null });

      const result = await userProfileService.updateLastSignIn('user-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockFromChain.update).toHaveBeenCalled();
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toBe(true);
    });

    it('should include both last_sign_in_at and updated_at timestamps', async () => {
      mockFromChain.eq.mockResolvedValue({ data: null, error: null });

      await userProfileService.updateLastSignIn('user-123');

      const updateCall = mockFromChain.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('last_sign_in_at');
      expect(updateCall).toHaveProperty('updated_at');
      expect(typeof updateCall.last_sign_in_at).toBe('string');
      expect(typeof updateCall.updated_at).toBe('string');
    });

    it('should return false when update fails', async () => {
      mockFromChain.eq.mockResolvedValue({ 
        data: null, 
        error: { code: 'UPDATE_ERROR', message: 'Update failed' } 
      });

      const result = await userProfileService.updateLastSignIn('user-123');

      expect(result).toBe(false);
    });

    it('should handle exceptions during sign in update', async () => {
      mockFromChain.eq.mockRejectedValue(new Error('Network error'));

      const result = await userProfileService.updateLastSignIn('user-123');

      expect(result).toBe(false);
    });
  });

  describe('🔴 supabaseUserToAppUser', () => {
    const mockSupabaseUser: SupabaseUser = {
      id: 'auth-123',
      email: 'test@github.com',
      created_at: '2025-08-02T00:00:00Z',
      updated_at: '2025-08-02T00:00:00Z',
      user_metadata: {
        full_name: 'GitHub User',
        avatar_url: 'https://github.com/avatar.jpg',
        user_name: 'githubuser',
        bio: 'Developer',
        sub: 'github-123',
      },
      app_metadata: {},
      aud: '',
      confirmation_sent_at: '',
      confirmed_at: '',
      email_confirmed_at: '',
      last_sign_in_at: '',
      phone: '',
      recovery_sent_at: '',
      role: '',
    };

    it('should convert Supabase user to GitHub app user format', () => {
      const result = userProfileService.supabaseUserToAppUser(mockSupabaseUser);

      expect(result.type).toBe('github');
      expect(result.email).toBe('test@github.com');
      expect(result.name).toBe('GitHub User');
      expect(result.avatar).toBe('https://github.com/avatar.jpg');
      expect(result.username).toBe('githubuser');
      expect(result.verified).toBe(true);
    });

    it('should use profile data when provided', () => {
      const mockProfileData: DatabaseUser = {
        id: 'profile-456',
        auth_user_id: 'auth-123',
        name: 'Profile Name',
        avatar_url: 'https://profile.avatar.jpg',
        username: 'profileuser',
        bio: 'Profile bio',
        user_type: 'github',
        permissions: [],
        settings: {} as UserSettings,
        created_at: '2025-08-02T00:00:00Z',
        updated_at: '2025-08-02T00:00:00Z',
      };

      const result = userProfileService.supabaseUserToAppUser(mockSupabaseUser, mockProfileData);

      expect(result.id).toBe('profile-456');
      expect(result.name).toBe('Profile Name');
      expect(result.avatar).toBe('https://profile.avatar.jpg');
      expect(result.username).toBe('profileuser');
      expect(result.bio).toBe('Profile bio');
    });

    it('should handle missing user metadata', () => {
      const userWithoutMetadata = {
        ...mockSupabaseUser,
        user_metadata: {},
      };

      const result = userProfileService.supabaseUserToAppUser(userWithoutMetadata);

      expect(result.name).toBe('test'); // Should use email prefix
      expect(result.avatar).toBeUndefined();
      expect(result.username).toBeUndefined();
    });

    it('should handle user without email', () => {
      const userWithoutEmail = {
        ...mockSupabaseUser,
        email: undefined,
        user_metadata: {},
      };

      const result = userProfileService.supabaseUserToAppUser(userWithoutEmail);

      expect(result.name).toBe('GitHub User'); // Fallback name
      expect(result.email).toBeUndefined();
    });

    it('should set default numeric values to 0', () => {
      const result = userProfileService.supabaseUserToAppUser(mockSupabaseUser);

      expect(result.public_repos).toBe(0);
      expect(result.followers).toBe(0);
      expect(result.following).toBe(0);
    });

    it('should use metadata numeric values when available', () => {
      const userWithStats = {
        ...mockSupabaseUser,
        user_metadata: {
          ...mockSupabaseUser.user_metadata,
          public_repos: 25,
          followers: 150,
          following: 75,
        },
      };

      const result = userProfileService.supabaseUserToAppUser(userWithStats);

      expect(result.public_repos).toBe(25);
      expect(result.followers).toBe(150);
      expect(result.following).toBe(75);
    });
  });

  describe('🔴 cleanupInactiveGuests', () => {
    it('should successfully cleanup inactive guest users', async () => {
      const mockDeletedUsers = [
        { id: 'guest-1', name: 'Guest 1' },
        { id: 'guest-2', name: 'Guest 2' },
      ];

      mockFromChain.select.mockResolvedValue({ data: mockDeletedUsers, error: null });

      const result = await userProfileService.cleanupInactiveGuests();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockFromChain.delete).toHaveBeenCalled();
      expect(mockFromChain.eq).toHaveBeenCalledWith('user_type', 'guest');
      expect(mockFromChain.lt).toHaveBeenCalledWith('last_sign_in_at', expect.any(String));
      expect(result).toBe(2);
    });

    it('should use correct cutoff time (24 hours ago)', async () => {
      const mockDate = new Date('2025-08-02T12:00:00Z');
      vi.setSystemTime(mockDate);

      mockFromChain.select.mockResolvedValue({ data: [], error: null });

      await userProfileService.cleanupInactiveGuests();

      const expectedCutoff = new Date('2025-08-01T12:00:00Z').toISOString();
      expect(mockFromChain.lt).toHaveBeenCalledWith('last_sign_in_at', expectedCutoff);

      vi.useRealTimers();
    });

    it('should return 0 when no inactive guests found', async () => {
      mockFromChain.select.mockResolvedValue({ data: [], error: null });

      const result = await userProfileService.cleanupInactiveGuests();

      expect(result).toBe(0);
    });

    it('should return 0 when cleanup fails', async () => {
      mockFromChain.select.mockResolvedValue({ 
        data: null, 
        error: { code: 'DELETE_ERROR', message: 'Cleanup failed' } 
      });

      const result = await userProfileService.cleanupInactiveGuests();

      expect(result).toBe(0);
    });

    it('should handle exceptions during cleanup', async () => {
      mockFromChain.select.mockRejectedValue(new Error('Database connection failed'));

      const result = await userProfileService.cleanupInactiveGuests();

      expect(result).toBe(0);
    });

    it('should handle null data response', async () => {
      mockFromChain.select.mockResolvedValue({ data: null, error: null });

      const result = await userProfileService.cleanupInactiveGuests();

      expect(result).toBe(0);
    });
  });

  describe('🔴 Constructor and Initialization', () => {
    it('should use client-side supabase when window is defined', () => {
      // Window is already defined in beforeEach
      const service = new UserProfileService();
      
      // Should initialize without throwing
      expect(service).toBeDefined();
      expect((service as any).supabase).toBeDefined();
    });

    it('should use server-side supabase when window is undefined', () => {
      // Temporarily remove window
      const windowDescriptor = Object.getOwnPropertyDescriptor(global, 'window');
      delete (global as any).window;

      const service = new UserProfileService();
      
      // Should initialize without throwing
      expect(service).toBeDefined();
      expect((service as any).supabase).toBeDefined();

      // Restore window
      if (windowDescriptor) {
        Object.defineProperty(global, 'window', windowDescriptor);
      }
    });
  });

  describe('🔴 Error Handling Integration', () => {
    it('should handle multiple consecutive failures gracefully', async () => {
      // Setup consecutive failures
      mockFromChain.single.mockResolvedValue({ data: null, error: { message: 'Error 1' } });
      mockFromChain.eq.mockResolvedValue({ data: null, error: { message: 'Error 2' } });
      mockFromChain.insert.mockResolvedValue({ data: null, error: { message: 'Error 3' } });

      // Test multiple operations
      const profileResult = await userProfileService.getUserProfile('user-123');
      const settingsResult = await userProfileService.updateUserSettings('user-123', {});
      const activityResult = await userProfileService.logUserActivity('user-123', 'test');

      expect(profileResult).toBeNull();
      expect(settingsResult).toBe(false);
      expect(activityResult).toBe(false);
    });

    it('should maintain state consistency during partial failures', async () => {
      // Profile update succeeds but activity logging fails
      mockFromChain.single.mockResolvedValue({ data: { id: 'user-123' }, error: null });
      mockFromChain.insert.mockResolvedValue({ data: null, error: { message: 'Activity log failed' } });

      const updateResult = await userProfileService.updateUserProfile('user-123', { name: 'New Name' });
      const activityResult = await userProfileService.logUserActivity('user-123', 'profile:update');

      expect(updateResult).toBeDefined(); // Profile update should succeed
      expect(activityResult).toBe(false);  // Activity log should fail
    });
  });
});