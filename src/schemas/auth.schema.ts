import { z } from 'zod';
import {
  IdSchema,
  EmailSchema,
  TimestampSchema,
  UrlSchema,
  MetadataSchema,
} from './common.schema';

/**
 * 🔐 인증 관련 Zod 스키마
 * 
 * 사용자 인증 및 권한 관리에 사용되는 스키마들
 */

// ===== 사용자 =====

export const UserRoleSchema = z.enum([
  'admin',
  'editor',
  'viewer',
  'guest',
]);

export const UserStatusSchema = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending',
]);

export const UserProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  avatar: UrlSchema.optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: UrlSchema.optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    language: z.string().default('ko'),
    timezone: z.string().default('Asia/Seoul'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
    }),
  }).optional(),
});

export const UserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  role: UserRoleSchema,
  status: UserStatusSchema,
  profile: UserProfileSchema,
  emailVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  lastLogin: TimestampSchema.optional(),
  metadata: MetadataSchema,
});

// ===== 인증 =====

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8),
  rememberMe: z.boolean().default(false),
  captcha: z.string().optional(),
});

export const GitHubLoginRequestSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

// ===== 토큰 =====

export const TokenTypeSchema = z.enum([
  'access',
  'refresh',
  'reset_password',
  'email_verification',
  'api_key',
]);

export const TokenSchema = z.object({
  token: z.string(),
  type: TokenTypeSchema,
  expiresAt: TimestampSchema,
  userId: IdSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().positive(),
  tokenType: z.literal('Bearer'),
});

// ===== 세션 =====

export const SessionSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  token: z.string(),
  device: z.object({
    userAgent: z.string(),
    ip: z.string().ip(),
    browser: z.string().optional(),
    os: z.string().optional(),
    device: z.string().optional(),
  }),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  createdAt: TimestampSchema,
  lastActivity: TimestampSchema,
  expiresAt: TimestampSchema,
});

// ===== 권한 =====

export const PermissionSchema = z.object({
  resource: z.string(),
  action: z.enum(['create', 'read', 'update', 'delete', 'execute']),
  scope: z.enum(['own', 'team', 'all']).optional(),
  conditions: z.record(z.unknown()).optional(),
});

export const RolePermissionsSchema = z.object({
  role: UserRoleSchema,
  permissions: z.array(PermissionSchema),
  inherits: z.array(UserRoleSchema).optional(),
});

// ===== OAuth =====

export const OAuthProviderSchema = z.enum([
  'github',
  'google',
  'microsoft',
  'apple',
]);

export const OAuthAccountSchema = z.object({
  provider: OAuthProviderSchema,
  providerId: z.string(),
  email: EmailSchema.optional(),
  name: z.string().optional(),
  image: UrlSchema.optional(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: TimestampSchema.optional(),
  scope: z.array(z.string()).optional(),
});

// ===== 비밀번호 재설정 =====

export const PasswordResetRequestSchema = z.object({
  email: EmailSchema,
  captcha: z.string().optional(),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

// ===== 2단계 인증 =====

export const TwoFactorSetupSchema = z.object({
  secret: z.string(),
  qrCode: z.string(),
  backupCodes: z.array(z.string()),
});

export const TwoFactorVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
  trustDevice: z.boolean().default(false),
});

// ===== API 키 =====

export const ApiKeySchema = z.object({
  id: IdSchema,
  name: z.string(),
  key: z.string(),
  userId: IdSchema,
  permissions: z.array(PermissionSchema),
  expiresAt: TimestampSchema.optional(),
  lastUsed: TimestampSchema.optional(),
  metadata: MetadataSchema,
});

// ===== 타입 내보내기 =====
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type User = z.infer<typeof UserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type RolePermissions = z.infer<typeof RolePermissionsSchema>;
export type OAuthAccount = z.infer<typeof OAuthAccountSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;