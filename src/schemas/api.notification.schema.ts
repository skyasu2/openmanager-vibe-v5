import { z } from 'zod';

/**
 * 🔔 브라우저 알림 관리 스키마
 * 
 * 알림 권한, 상태, 테스트, 설정, 웹 푸시 알림
 */

// ===== 알림 권한 =====

export const NotificationPermissionSchema = z.enum(['default', 'granted', 'denied']);

// ===== 알림 상태 =====

export const NotificationStatusSchema = z.object({
  supported: z.boolean(),
  permission: NotificationPermissionSchema,
  enabled: z.boolean(),
});

// ===== 알림 액션 =====

export const NotificationActionSchema = z.enum(['test', 'validate', 'clear-history', 'update-settings']);

// ===== 테스트 알림 데이터 =====

export const TestNotificationDataSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  silent: z.boolean().optional(),
});

// ===== 알림 검증 데이터 =====

export const ValidateNotificationDataSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }).optional(),
  }).optional(),
  permission: NotificationPermissionSchema.optional(),
});

// ===== 알림 설정 업데이트 =====

export const UpdateNotificationSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  silent: z.boolean().optional(),
  frequency: z.enum(['instant', 'hourly', 'daily']).optional(),
  categories: z.array(z.string()).optional(),
});

// ===== 알림 요청 (Discriminated Union) =====

export const NotificationRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('test'),
    title: z.string().optional(),
    body: z.string().optional(),
    icon: z.string().optional(),
    badge: z.string().optional(),
    tag: z.string().optional(),
    silent: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('validate'),
    subscription: z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }).optional(),
    }).optional(),
    permission: NotificationPermissionSchema.optional(),
  }),
  z.object({
    action: z.literal('clear-history'),
  }),
  z.object({
    action: z.literal('update-settings'),
    enabled: z.boolean().optional(),
    silent: z.boolean().optional(),
    frequency: z.enum(['instant', 'hourly', 'daily']).optional(),
    categories: z.array(z.string()).optional(),
  }),
]);

// ===== 알림 응답 =====

export const NotificationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  valid: z.boolean().optional(),
});

export const NotificationStatusResponseSchema = z.object({
  success: z.boolean(),
  data: NotificationStatusSchema,
});

// ===== 타입 내보내기 =====

export type NotificationPermission = z.infer<typeof NotificationPermissionSchema>;
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;
export type NotificationAction = z.infer<typeof NotificationActionSchema>;
export type TestNotificationData = z.infer<typeof TestNotificationDataSchema>;
export type ValidateNotificationData = z.infer<typeof ValidateNotificationDataSchema>;
export type UpdateNotificationSettings = z.infer<typeof UpdateNotificationSettingsSchema>;
export type NotificationRequest = z.infer<typeof NotificationRequestSchema>;
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type NotificationStatusResponse = z.infer<typeof NotificationStatusResponseSchema>;