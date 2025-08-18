/**
 * 🔄 RealTimeHub v1.0
 *
 * OpenManager v5.21.0 - 실시간 통신 허브
 * - WebSocket 기반 실시간 데이터 전송
 * - 메모리 기반 연결 관리 (무설정 배포)
 * - 패턴 매칭 알림 시스템
 * - 클라이언트 그룹 관리
 */

export interface RealTimeConnection {
  id: string;
  socket: WebSocket | null;
  userId?: string;
  groups: Set<string>;
  lastActivity: number;
  metadata: Record<string, any>;
}

export interface RealTimeMessage {
  type: 'pattern_alert' | 'metric_update' | 'system_event' | 'custom';
  data: unknown;
  target?: string | string[]; // 특정 연결 또는 그룹 대상
  timestamp: number;
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  groupConnections: Map<string, number>;
  messagesSent: number;
  messagesReceived: number;
  lastActivity: number;
}

class RealTimeHub {
  private connections = new Map<string, RealTimeConnection>();
  private groups = new Map<string, Set<string>>();
  private messageHistory: RealTimeMessage[] = [];
  private stats: ConnectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    groupConnections: new Map(),
    messagesSent: 0,
    messagesReceived: 0,
    lastActivity: Date.now(),
  };

  private readonly MAX_HISTORY = 1000;
  private readonly CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5분
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
    console.log('🔄 RealTimeHub 초기화 완료');
  }

  /**
   * 🔗 새 연결 등록
   */
  registerConnection(
    connectionId: string,
    socket: WebSocket | null = null,
    metadata: Record<string, any> = {}
  ): RealTimeConnection {
    const connection: RealTimeConnection = {
      id: connectionId,
      socket,
      groups: new Set(['default']),
      lastActivity: Date.now(),
      metadata,
    };

    this.connections.set(connectionId, connection);
    this.addToGroup('default', connectionId);

    this.stats.totalConnections++;
    this.updateActiveConnections();

    console.log(
      `🔗 새 연결 등록: ${connectionId} (총 ${this.connections.size}개)`
    );

    return connection;
  }

  /**
   * 🚪 연결 해제
   */
  disconnectConnection(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    // 모든 그룹에서 제거
    connection.groups.forEach((group) => {
      this.removeFromGroup(group, connectionId);
    });

    // WebSocket 연결 종료
    if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.close();
    }

    this.connections.delete(connectionId);
    this.updateActiveConnections();

    console.log(
      `🚪 연결 해제: ${connectionId} (남은 ${this.connections.size}개)`
    );
    return true;
  }

  /**
   * 👥 그룹에 연결 추가
   */
  addToGroup(groupName: string, connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    if (!this.groups.has(groupName)) {
      this.groups.set(groupName, new Set());
    }

    this.groups.get(groupName).add(connectionId);
    connection.groups.add(groupName);

    this.updateGroupStats();
    return true;
  }

  /**
   * 👥 그룹에서 연결 제거
   */
  removeFromGroup(groupName: string, connectionId: string): boolean {
    const group = this.groups.get(groupName);
    if (!group) return false;

    group.delete(connectionId);

    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.groups.delete(groupName);
    }

    // 빈 그룹 정리
    if (group.size === 0 && groupName !== 'default') {
      this.groups.delete(groupName);
    }

    this.updateGroupStats();
    return true;
  }

  /**
   * 📢 메시지 브로드캐스트
   */
  broadcast(message: Omit<RealTimeMessage, 'timestamp'>): number {
    const fullMessage: RealTimeMessage = {
      ...message,
      timestamp: Date.now(),
    };

    let sentCount = 0;

    // 대상이 지정된 경우
    if (message.target) {
      const targets = Array.isArray(message.target)
        ? message.target
        : [message.target];

      targets.forEach((target) => {
        // 그룹 대상
        if (this.groups.has(target)) {
          const groupConnections = this.groups.get(target);
          groupConnections.forEach((connectionId) => {
            if (this.sendToConnection(connectionId, fullMessage)) {
              sentCount++;
            }
          });
        }
        // 개별 연결 대상
        else if (this.connections.has(target)) {
          if (this.sendToConnection(target, fullMessage)) {
            sentCount++;
          }
        }
      });
    }
    // 전체 브로드캐스트
    else {
      this.connections.forEach((_, connectionId) => {
        if (this.sendToConnection(connectionId, fullMessage)) {
          sentCount++;
        }
      });
    }

    // 메시지 히스토리 저장
    this.addToHistory(fullMessage);
    this.stats.messagesSent += sentCount;
    this.stats.lastActivity = Date.now();

    console.log(
      `📢 메시지 브로드캐스트: ${message.type} → ${sentCount}개 연결`
    );
    return sentCount;
  }

  /**
   * 📤 개별 연결에 메시지 전송
   */
  private sendToConnection(
    connectionId: string,
    message: RealTimeMessage
  ): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    try {
      // WebSocket이 있고 연결된 경우
      if (
        connection.socket &&
        connection.socket.readyState === WebSocket.OPEN
      ) {
        connection.socket.send(JSON.stringify(message));
        connection.lastActivity = Date.now();
        return true;
      }

      // WebSocket이 없는 경우 (polling 등 다른 방식)
      console.log(`📤 메시지 대기열에 추가: ${connectionId} → ${message.type}`);
      return true;
    } catch (error) {
      console.error(`❌ 메시지 전송 실패: ${connectionId}`, error);
      return false;
    }
  }

  /**
   * 📚 메시지 히스토리 관리
   */
  private addToHistory(message: RealTimeMessage): void {
    this.messageHistory.push(message);

    // 히스토리 크기 제한
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory = this.messageHistory.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * 📊 통계 업데이트
   */
  private updateActiveConnections(): void {
    const now = Date.now();
    let activeCount = 0;

    this.connections.forEach((connection) => {
      if (now - connection.lastActivity < this.CONNECTION_TIMEOUT) {
        activeCount++;
      }
    });

    this.stats.activeConnections = activeCount;
  }

  private updateGroupStats(): void {
    this.stats.groupConnections.clear();
    this.groups.forEach((connections, groupName) => {
      this.stats.groupConnections.set(groupName, connections.size);
    });
  }

  /**
   * 🧹 비활성 연결 정리
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const toRemove: string[] = [];

      this.connections.forEach((connection, connectionId) => {
        if (now - connection.lastActivity > this.CONNECTION_TIMEOUT) {
          toRemove.push(connectionId);
        }
      });

      toRemove.forEach((connectionId) => {
        this.disconnectConnection(connectionId);
      });

      if (toRemove.length > 0) {
        console.log(`🧹 비활성 연결 정리: ${toRemove.length}개 제거`);
      }

      this.updateActiveConnections();
    }, 60000); // 1분마다 정리
  }

  /**
   * 📈 실시간 통계 조회
   */
  getStats(): ConnectionStats {
    this.updateActiveConnections();
    return { ...this.stats };
  }

  /**
   * 🔍 연결 정보 조회
   */
  getConnection(connectionId: string): RealTimeConnection | null {
    return this.connections.get(connectionId) || null;
  }

  /**
   * 👥 그룹 정보 조회
   */
  getGroup(groupName: string): string[] {
    const group = this.groups.get(groupName);
    return group ? Array.from(group) : [];
  }

  /**
   * 📚 메시지 히스토리 조회
   */
  getHistory(limit: number = 50): RealTimeMessage[] {
    return this.messageHistory.slice(-limit);
  }

  /**
   * 🛑 Hub 종료
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // 모든 연결 종료
    this.connections.forEach((_, connectionId) => {
      this.disconnectConnection(connectionId);
    });

    console.log('🛑 RealTimeHub 종료 완료');
  }
}

// 싱글톤 인스턴스
let hubInstance: RealTimeHub | null = null;

export function getRealTimeHub(): RealTimeHub {
  if (!hubInstance) {
    hubInstance = new RealTimeHub();
  }
  return hubInstance;
}

export function resetRealTimeHub(): void {
  if (hubInstance) {
    hubInstance.shutdown();
    hubInstance = null;
  }
}

export default RealTimeHub;
