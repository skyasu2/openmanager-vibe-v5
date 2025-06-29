/**
 * 🏗️ Server Type Registry
 *
 * ✅ 실제 기업 환경 기반 서버 타입 정의 및 관리
 * ✅ 단일 책임: 서버 타입 레지스트리만 관리
 * ✅ SOLID 원칙 적용
 */

// 🏗️ 실제 기업 환경 기반 서버 타입 정의
export interface RealWorldServerType {
  id: string;
  name: string;
  category: 'web' | 'app' | 'database' | 'infrastructure';
  os: string;
  service: string;
  port: number;
  version?: string;
  runtime?: string;
}

// 🎯 실제 기술 스택 기반 서버 타입들
const REALISTIC_SERVER_TYPES: RealWorldServerType[] = [
  // 웹서버 (25%)
  {
    id: 'nginx',
    name: 'Nginx',
    category: 'web',
    os: 'ubuntu-22.04',
    service: 'web-server',
    port: 80,
    version: '1.22.0',
  },
  {
    id: 'apache',
    name: 'Apache HTTP',
    category: 'web',
    os: 'centos-8',
    service: 'web-server',
    port: 80,
    version: '2.4.54',
  },
  {
    id: 'iis',
    name: 'IIS',
    category: 'web',
    os: 'windows-2022',
    service: 'web-server',
    port: 80,
    version: '10.0',
  },

  // 애플리케이션 서버 (30%)
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'app',
    os: 'alpine-3.16',
    service: 'app-server',
    port: 3000,
    runtime: 'node-18',
  },
  {
    id: 'springboot',
    name: 'Spring Boot',
    category: 'app',
    os: 'ubuntu-22.04',
    service: 'app-server',
    port: 8080,
    runtime: 'openjdk-17',
  },
  {
    id: 'django',
    name: 'Django',
    category: 'app',
    os: 'ubuntu-20.04',
    service: 'app-server',
    port: 8000,
    runtime: 'python-3.9',
  },
  {
    id: 'dotnet',
    name: '.NET Core',
    category: 'app',
    os: 'windows-2022',
    service: 'app-server',
    port: 5000,
    runtime: 'dotnet-6',
  },
  {
    id: 'php',
    name: 'PHP-FPM',
    category: 'app',
    os: 'debian-11',
    service: 'app-server',
    port: 9000,
    runtime: 'php-8.1',
  },

  // 데이터베이스 (20%)
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    os: 'ubuntu-20.04',
    service: 'database',
    port: 3306,
    version: '8.0.30',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    os: 'debian-11',
    service: 'database',
    port: 5432,
    version: '14.5',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    os: 'rhel-8',
    service: 'database',
    port: 27017,
    version: '5.0.12',
  },
  {
    id: 'oracle',
    name: 'Oracle DB',
    category: 'database',
    os: 'oracle-linux-8',
    service: 'database',
    port: 1521,
    version: '19c',
  },
  {
    id: 'mssql',
    name: 'SQL Server',
    category: 'database',
    os: 'windows-2019',
    service: 'database',
    port: 1433,
    version: '2019',
  },

  // 인프라 서비스 (25%)
  {
    id: 'redis',
    name: 'Redis',
    category: 'infrastructure',
    os: 'alpine-3.15',
    service: 'cache',
    port: 6379,
    version: '7.0.5',
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    category: 'infrastructure',
    os: 'ubuntu-20.04',
    service: 'message-queue',
    port: 5672,
    version: '3.10.7',
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    category: 'infrastructure',
    os: 'centos-7',
    service: 'search',
    port: 9200,
    version: '8.4.3',
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    category: 'infrastructure',
    os: 'ubuntu-22.04',
    service: 'ci-cd',
    port: 8080,
    version: '2.361.4',
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    category: 'infrastructure',
    os: 'alpine-3.16',
    service: 'monitoring',
    port: 9090,
    version: '2.38.0',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'infrastructure',
    os: 'ubuntu-20.04',
    service: 'monitoring',
    port: 3000,
    version: '9.2.4',
  },
];

// 서버 분포 계산 함수 (나머지 분배 로직 포함)
function calculateServerDistribution(
  totalServers: number
): Record<string, number> {
  // 🎯 기본 비율로 서버 수 계산
  const baseDistribution = {
    web: Math.floor(totalServers * 0.25), // 25%
    app: Math.floor(totalServers * 0.3), // 30%
    database: Math.floor(totalServers * 0.2), // 20%
    infrastructure: Math.floor(totalServers * 0.25), // 25%
  };

  // 📊 실제 할당된 서버 수 계산
  const actualTotal = Object.values(baseDistribution).reduce((sum, count) => sum + count, 0);

  // 🔄 부족한 서버 수 계산 및 분배
  const shortage = totalServers - actualTotal;

  if (shortage > 0) {
    // 우선순위: app > web > infrastructure > database 순으로 분배
    const distributionOrder = ['app', 'web', 'infrastructure', 'database'];

    for (let i = 0; i < shortage; i++) {
      const categoryToAdd = distributionOrder[i % distributionOrder.length];
      baseDistribution[categoryToAdd as keyof typeof baseDistribution]++;
    }
  }

  console.log(`🎯 서버 분포 계산: 총 ${totalServers}개 → 실제 ${Object.values(baseDistribution).reduce((sum, count) => sum + count, 0)}개`);
  console.log(`   - 웹서버: ${baseDistribution.web}개`);
  console.log(`   - 앱서버: ${baseDistribution.app}개`);
  console.log(`   - 데이터베이스: ${baseDistribution.database}개`);
  console.log(`   - 인프라: ${baseDistribution.infrastructure}개`);

  return baseDistribution;
}

/**
 * 🏗️ ServerTypeRegistry 클래스
 *
 * 단일 책임: 서버 타입 정의 및 관리만 담당
 */
export class ServerTypeRegistry {
  private static instance: ServerTypeRegistry | null = null;
  private serverTypes: Map<string, RealWorldServerType> = new Map();
  private categorizedTypes: Map<string, RealWorldServerType[]> = new Map();

  constructor() {
    this.initializeServerTypes();
  }

  public static getInstance(): ServerTypeRegistry {
    if (!ServerTypeRegistry.instance) {
      ServerTypeRegistry.instance = new ServerTypeRegistry();
    }
    return ServerTypeRegistry.instance;
  }

  /**
   * 서버 타입 초기화
   */
  private initializeServerTypes(): void {
    // 개별 서버 타입 등록
    REALISTIC_SERVER_TYPES.forEach(serverType => {
      this.serverTypes.set(serverType.id, serverType);
    });

    // 카테고리별 분류
    this.categorizeServerTypes();

    console.log(
      `🏗️ ServerTypeRegistry 초기화 완료: ${this.serverTypes.size}개 서버 타입 등록`
    );
  }

  /**
   * 카테고리별 서버 타입 분류
   */
  private categorizeServerTypes(): void {
    const categories = new Set(
      REALISTIC_SERVER_TYPES.map(type => type.category)
    );

    categories.forEach(category => {
      const typesInCategory = REALISTIC_SERVER_TYPES.filter(
        type => type.category === category
      );
      this.categorizedTypes.set(category, typesInCategory);
    });
  }

  /**
   * 서버 타입 ID로 조회
   */
  public getServerTypeById(id: string): RealWorldServerType | undefined {
    return this.serverTypes.get(id);
  }

  /**
   * 모든 서버 타입 조회
   */
  public getAllServerTypes(): RealWorldServerType[] {
    return Array.from(this.serverTypes.values());
  }

  /**
   * 카테고리별 서버 타입 조회
   */
  public getServerTypesByCategory(category: string): RealWorldServerType[] {
    return this.categorizedTypes.get(category) || [];
  }

  /**
   * 랜덤 서버 타입 선택
   */
  public getRandomServerType(): RealWorldServerType {
    const allTypes = this.getAllServerTypes();
    return allTypes[Math.floor(Math.random() * allTypes.length)];
  }

  /**
   * 카테고리별 랜덤 서버 타입 선택
   */
  public getRandomServerTypeByCategory(
    category: string
  ): RealWorldServerType | null {
    const typesInCategory = this.getServerTypesByCategory(category);
    if (typesInCategory.length === 0) {
      return null;
    }
    return typesInCategory[Math.floor(Math.random() * typesInCategory.length)];
  }

  /**
   * 서버 분포 계산
   */
  public calculateDistribution(totalServers: number): Record<string, number> {
    return calculateServerDistribution(totalServers);
  }

  /**
   * 카테고리 목록 조회
   */
  public getCategories(): string[] {
    return Array.from(this.categorizedTypes.keys());
  }

  /**
   * 서버 타입 통계 조회
   */
  public getStatistics(): {
    totalTypes: number;
    categoryCounts: Record<string, number>;
    categories: string[];
  } {
    const categoryCounts: Record<string, number> = {};

    this.categorizedTypes.forEach((types, category) => {
      categoryCounts[category] = types.length;
    });

    return {
      totalTypes: this.serverTypes.size,
      categoryCounts,
      categories: this.getCategories(),
    };
  }

  /**
   * 호스트명 생성
   */
  public generateHostname(
    serverType: RealWorldServerType,
    environment: string,
    index: number
  ): string {
    const env = environment.toLowerCase();
    const service = serverType.service.replace('-', '');
    const location = ['us-east', 'us-west', 'eu-west', 'ap-southeast'][
      Math.floor(Math.random() * 4)
    ];

    return `${service}-${env}-${location}-${String(index).padStart(2, '0')}`;
  }

  /**
   * 특화된 메트릭 생성
   */
  public generateSpecializedMetrics(serverType: RealWorldServerType): any {
    const baseMetrics = {
      cpu: Math.random() * 80 + 10, // 10-90%
      memory: Math.random() * 85 + 10, // 10-95%
      disk: Math.random() * 70 + 15, // 15-85%
      network: {
        in: Math.random() * 1000,
        out: Math.random() * 800,
      },
    };

    // 서버 타입별 특화 메트릭
    switch (serverType.category) {
      case 'web':
        return {
          ...baseMetrics,
          requests: Math.floor(Math.random() * 5000) + 100,
          connections: Math.floor(Math.random() * 1000) + 50,
          responseTime: Math.random() * 200 + 50,
        };

      case 'app':
        return {
          ...baseMetrics,
          threads: Math.floor(Math.random() * 200) + 20,
          heap_usage: Math.random() * 80 + 10,
          gc_time: Math.random() * 50,
        };

      case 'database':
        return {
          ...baseMetrics,
          queries_per_sec: Math.floor(Math.random() * 1000) + 10,
          connections: Math.floor(Math.random() * 100) + 5,
          buffer_hit_ratio: Math.random() * 15 + 85, // 85-100%
          lock_waits: Math.floor(Math.random() * 10),
        };

      case 'infrastructure':
        return {
          ...baseMetrics,
          uptime: Math.random() * 8760 + 24, // 1일-1년
          service_status: Math.random() > 0.1 ? 'active' : 'inactive',
          alerts: Math.floor(Math.random() * 3),
        };

      default:
        return baseMetrics;
    }
  }

  /**
   * 버전 정보 생성
   */
  public generateRealisticVersion(serverType: string): string {
    const versions: Record<string, string[]> = {
      nginx: ['1.22.0', '1.20.2', '1.18.0'],
      apache: ['2.4.54', '2.4.52', '2.4.48'],
      nodejs: ['18.12.1', '16.18.1', '14.21.1'],
      springboot: ['2.7.5', '2.6.13', '2.5.15'],
      mysql: ['8.0.30', '5.7.40', '8.0.28'],
      postgresql: ['14.5', '13.8', '12.12'],
      redis: ['7.0.5', '6.2.7', '6.0.16'],
      elasticsearch: ['8.4.3', '7.17.7', '6.8.23'],
    };

    const availableVersions = versions[serverType] || ['1.0.0'];
    return availableVersions[
      Math.floor(Math.random() * availableVersions.length)
    ];
  }

  /**
   * 리소스 정리
   */
  public dispose(): void {
    this.serverTypes.clear();
    this.categorizedTypes.clear();
    ServerTypeRegistry.instance = null;
    console.log('🗑️ ServerTypeRegistry 리소스 정리 완료');
  }
}
