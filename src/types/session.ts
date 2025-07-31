// Session 관련 타입 정의
export interface SessionData {
  userId: string;
  email: string;
  username?: string;
  permissions: string[];
  expiresAt: number;
}

export interface SessionMetadata {
  createdAt: number;
  lastAccessed: number;
  userAgent?: string;
  ipAddress?: string;
  deviceId?: string;
}

export interface SessionContext {
  data: SessionData;
  metadata: SessionMetadata;
}
