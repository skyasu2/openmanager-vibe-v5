/**
 * 🌐 네트워크 토폴로지 생성기
 * enhanced-data-generator.ts에서 추출한 고급 기능
 */

import { faker } from '@faker-js/faker';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'server' | 'database' | 'cache' | 'proxy' | 'loadbalancer' | 'firewall';
  location: string;
  coordinates: { x: number; y: number };
  status: 'online' | 'warning' | 'offline';
  connections: string[];
  metrics: {
    throughput: number;
    latency: number;
    packetLoss: number;
  };
}

export interface NetworkConnection {
  from: string;
  to: string;
  type: 'ethernet' | 'fiber' | 'wireless' | 'vpn';
  bandwidth: number;
  latency: number;
  status: 'active' | 'degraded' | 'down';
}

export class NetworkTopologyGenerator {
  private nodeTypes = ['server', 'database', 'cache', 'proxy', 'loadbalancer', 'firewall'] as const;
  private connectionTypes = ['ethernet', 'fiber', 'wireless', 'vpn'] as const;

  /**
   * 🏗️ 네트워크 토폴로지 생성
   */
  generateTopology(nodeCount: number = 10): { nodes: NetworkNode[], connections: NetworkConnection[] } {
    const nodes = this.generateNodes(nodeCount);
    const connections = this.generateConnections(nodes);

    return { nodes, connections };
  }

  /**
   * 📍 네트워크 노드 생성
   */
  private generateNodes(count: number): NetworkNode[] {
    return Array.from({ length: count }, (_, index) => {
      const nodeType = faker.helpers.arrayElement(this.nodeTypes);

      return {
        id: faker.string.uuid(),
        name: this.generateNodeName(nodeType, index),
        type: nodeType,
        location: faker.location.city(),
        coordinates: {
          x: faker.number.int({ min: 50, max: 950 }),
          y: faker.number.int({ min: 50, max: 550 })
        },
        status: faker.helpers.weightedArrayElement([
          { weight: 80, value: 'online' },
          { weight: 15, value: 'warning' },
          { weight: 5, value: 'offline' }
        ] as const),
        connections: [] as any[],
        metrics: {
          throughput: faker.number.float({ min: 10, max: 1000 }),
          latency: faker.number.float({ min: 1, max: 100 }),
          packetLoss: faker.number.float({ min: 0, max: 5 })
        }
      };
    });
  }

  /**
   * 🔗 네트워크 연결 생성
   */
  private generateConnections(nodes: NetworkNode[]): NetworkConnection[] {
    const connections: NetworkConnection[] = [];

    // 각 노드마다 1-3개의 연결 생성
    nodes.forEach(node => {
      const connectionCount = faker.number.int({ min: 1, max: 3 });
      const possibleTargets = nodes.filter(n => n.id !== node.id);

      for (let i = 0; i < connectionCount && possibleTargets.length > 0; i++) {
        const target = faker.helpers.arrayElement(possibleTargets);

        // 중복 연결 방지
        const existingConnection = connections.find(c =>
          (c.from === node.id && c.to === target.id) ||
          (c.from === target.id && c.to === node.id)
        );

        if (!existingConnection) {
          const connection: NetworkConnection = {
            from: node.id,
            to: target.id,
            type: this.selectConnectionType(node.type, target.type),
            bandwidth: faker.number.int({ min: 100, max: 10000 }), // Mbps
            latency: faker.number.float({ min: 0.1, max: 50 }), // ms
            status: faker.helpers.weightedArrayElement([
              { weight: 85, value: 'active' },
              { weight: 10, value: 'degraded' },
              { weight: 5, value: 'down' }
            ] as const)
          };

          connections.push(connection);
          node.connections.push(target.id);
          target.connections.push(node.id);
        }

        // 선택된 타겟 제거
        possibleTargets.splice(possibleTargets.indexOf(target), 1);
      }
    });

    return connections;
  }

  /**
   * 🏷️ 노드 이름 생성
   */
  private generateNodeName(type: string, index: number): string {
    const prefixes = {
      server: 'WEB',
      database: 'DB',
      cache: 'CACHE',
      proxy: 'PROXY',
      loadbalancer: 'LB',
      firewall: 'FW'
    };

    const prefix = prefixes[type as keyof typeof prefixes] || 'NODE';
    return `${prefix}-${String(index + 1).padStart(2, '0')}`;
  }

  /**
   * 🔌 연결 타입 선택
   */
  private selectConnectionType(fromType: string, toType: string): NetworkConnection['type'] {
    // 데이터베이스와 캐시는 고속 연결 선호
    if ((fromType === 'database' || toType === 'database') ||
      (fromType === 'cache' || toType === 'cache')) {
      return faker.helpers.weightedArrayElement([
        { weight: 70, value: 'fiber' },
        { weight: 30, value: 'ethernet' }
      ] as const);
    }

    // 일반적인 연결
    return faker.helpers.arrayElement(this.connectionTypes);
  }

  /**
   * 📊 토폴로지 통계
   */
  getTopologyStats(nodes: NetworkNode[], connections: NetworkConnection[]) {
    return {
      totalNodes: nodes.length,
      totalConnections: connections.length,
      nodesByType: this.groupBy(nodes, 'type'),
      nodesByStatus: this.groupBy(nodes, 'status'),
      connectionsByType: this.groupBy(connections, 'type'),
      connectionsByStatus: this.groupBy(connections, 'status'),
      avgConnections: (connections.length * 2) / nodes.length, // 양방향이므로 *2
      totalBandwidth: connections.reduce((sum, c) => sum + c.bandwidth, 0),
      avgLatency: connections.reduce((sum, c) => sum + c.latency, 0) / connections.length
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const group = String(item[key]);
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// 싱글톤 인스턴스
export const networkTopologyGenerator = new NetworkTopologyGenerator();

// 편의 함수들
export function generateNetworkTopology(nodeCount: number = 10) {
  return networkTopologyGenerator.generateTopology(nodeCount);
}

export function generateNetworkNodes(count: number = 10) {
  return networkTopologyGenerator.generateTopology(count).nodes;
} 