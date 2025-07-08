import { describe, expect, it } from 'vitest';

// 대시보드 통합 로직 테스트
describe('Dashboard Integration Logic', () => {
  describe('대시보드 데이터 통합', () => {
    it('should aggregate server data for dashboard', () => {
      const aggregateServerData = (servers: any[]): any => {
        const totalServers = servers.length;
        const activeServers = servers.filter(s => s.status === 'active').length;
        const totalCpu = servers.reduce((sum, s) => sum + (s.cpu || 0), 0);
        const totalMemory = servers.reduce(
          (sum, s) => sum + (s.memory || 0),
          0
        );
        const totalDisk = servers.reduce((sum, s) => sum + (s.disk || 0), 0);

        return {
          summary: {
            total: totalServers,
            active: activeServers,
            inactive: totalServers - activeServers,
            uptime: activeServers / totalServers,
          },
          averages: {
            cpu: totalServers > 0 ? totalCpu / totalServers : 0,
            memory: totalServers > 0 ? totalMemory / totalServers : 0,
            disk: totalServers > 0 ? totalDisk / totalServers : 0,
          },
          health: calculateOverallHealth(servers),
        };
      };

      const calculateOverallHealth = (servers: any[]): string => {
        const healthyCount = servers.filter(s => s.health === 'healthy').length;
        const warningCount = servers.filter(s => s.health === 'warning').length;
        const criticalCount = servers.filter(
          s => s.health === 'critical'
        ).length;

        if (criticalCount > 0) return 'critical';
        if (warningCount > servers.length * 0.3) return 'warning';
        return 'healthy';
      };

      const mockServers = [
        {
          id: 1,
          status: 'active',
          cpu: 30,
          memory: 40,
          disk: 50,
          health: 'healthy',
        },
        {
          id: 2,
          status: 'active',
          cpu: 60,
          memory: 70,
          disk: 80,
          health: 'warning',
        },
        {
          id: 3,
          status: 'inactive',
          cpu: 0,
          memory: 0,
          disk: 0,
          health: 'critical',
        },
      ];

      const aggregated = aggregateServerData(mockServers);

      expect(aggregated.summary.total).toBe(3);
      expect(aggregated.summary.active).toBe(2);
      expect(aggregated.summary.uptime).toBeCloseTo(0.67, 2);
      expect(aggregated.averages.cpu).toBe(30);
      expect(['healthy', 'warning', 'critical']).toContain(aggregated.health);
    });

    it('should process real-time dashboard updates', () => {
      const processDashboardUpdate = (
        currentData: any,
        newMetrics: any
      ): any => {
        const updated = { ...currentData };

        // 메트릭 업데이트
        updated.metrics = {
          ...updated.metrics,
          ...newMetrics,
          lastUpdate: Date.now(),
        };

        // 히스토리 추가 (최근 100개만 유지)
        if (!updated.history) updated.history = [];
        updated.history.push({
          timestamp: Date.now(),
          metrics: newMetrics,
        });

        if (updated.history.length > 100) {
          updated.history = updated.history.slice(-100);
        }

        // 트렌드 계산
        updated.trends = calculateTrends(updated.history);

        return updated;
      };

      const calculateTrends = (history: any[]): any => {
        if (history.length < 2)
          return { cpu: 'stable', memory: 'stable', disk: 'stable' };

        const recent = history.slice(-5);
        const older = history.slice(-10, -5);

        const calculateTrend = (
          recent: any[],
          older: any[],
          metric: string
        ): string => {
          const recentAvg =
            recent.reduce((sum, h) => sum + h.metrics[metric], 0) /
            recent.length;
          const olderAvg =
            older.reduce((sum, h) => sum + h.metrics[metric], 0) / older.length;

          if (recentAvg > olderAvg * 1.05) return 'increasing';
          if (recentAvg < olderAvg * 0.95) return 'decreasing';
          return 'stable';
        };

        return {
          cpu: calculateTrend(recent, older, 'cpu'),
          memory: calculateTrend(recent, older, 'memory'),
          disk: calculateTrend(recent, older, 'disk'),
        };
      };

      const currentData = {
        metrics: { cpu: 30, memory: 40, disk: 50 },
        history: [] as any[],
      };

      const newMetrics = { cpu: 35, memory: 45, disk: 55 };
      const updated = processDashboardUpdate(currentData, newMetrics);

      expect(updated.metrics.cpu).toBe(35);
      expect(updated.metrics.lastUpdate).toBeDefined();
      expect(updated.history.length).toBe(1);
      expect(updated.trends).toBeDefined();
    });

    it('should handle dashboard filtering and sorting', () => {
      const filterAndSortServers = (
        servers: any[],
        filters: any,
        sortBy: string,
        sortOrder: string
      ): any[] => {
        let filtered = [...servers];

        // 상태 필터링
        if (filters.status && filters.status !== 'all') {
          filtered = filtered.filter(s => s.status === filters.status);
        }

        // 헬스 필터링
        if (filters.health && filters.health !== 'all') {
          filtered = filtered.filter(s => s.health === filters.health);
        }

        // 이름 검색
        if (filters.search) {
          filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        // 메트릭 범위 필터링
        if (filters.cpuRange) {
          filtered = filtered.filter(
            s => s.cpu >= filters.cpuRange.min && s.cpu <= filters.cpuRange.max
          );
        }

        // 정렬
        filtered.sort((a, b) => {
          let aVal = a[sortBy];
          let bVal = b[sortBy];

          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }

          if (sortOrder === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
          }
        });

        return filtered;
      };

      const servers = [
        {
          id: 1,
          name: 'Web Server 1',
          status: 'active',
          health: 'healthy',
          cpu: 30,
        },
        {
          id: 2,
          name: 'Database Server',
          status: 'active',
          health: 'warning',
          cpu: 80,
        },
        {
          id: 3,
          name: 'Cache Server',
          status: 'inactive',
          health: 'critical',
          cpu: 5,
        },
        {
          id: 4,
          name: 'Web Server 2',
          status: 'active',
          health: 'healthy',
          cpu: 45,
        },
      ];

      const filters = {
        status: 'active',
        health: 'all',
        search: 'web',
        cpuRange: { min: 20, max: 60 },
      };

      const result = filterAndSortServers(servers, filters, 'cpu', 'desc');

      expect(result.length).toBe(2); // Web Server 1, Web Server 2 (active + web + cpu 20-60)
      expect(result[0].cpu).toBeGreaterThanOrEqual(result[1].cpu); // CPU 내림차순
      expect(result.every(s => s.status === 'active')).toBe(true);
      expect(result.every(s => s.name.toLowerCase().includes('web'))).toBe(
        true
      );
    });
  });

  describe('차트 및 시각화', () => {
    it('should prepare chart data', () => {
      const prepareChartData = (
        rawData: any[],
        chartType: string,
        timeRange: string
      ): any => {
        const processedData = rawData.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp).getTime(),
        }));

        // 시간 범위 필터링
        const now = Date.now();
        const timeRanges = {
          '1h': 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
        };

        const rangeMs = (timeRanges as any)[timeRange] || timeRanges['24h'];
        const filteredData = processedData.filter(
          item => now - item.timestamp <= rangeMs
        );

        // 차트 타입별 데이터 가공
        switch (chartType) {
          case 'line':
            return {
              data: filteredData.map(item => ({
                x: item.timestamp,
                y: item.value,
                label: item.label,
              })),
              type: 'line',
            };

          case 'bar':
            const grouped = groupByInterval(filteredData, timeRange);
            return {
              data: grouped.map(group => ({
                x: group.interval,
                y: group.average,
                count: group.count,
              })),
              type: 'bar',
            };

          case 'pie':
            const categories = {};
            filteredData.forEach(item => {
              (categories as any)[item.category] =
                ((categories as any)[item.category] || 0) + 1;
            });

            return {
              data: Object.entries(categories).map(([key, value]) => ({
                label: key,
                value: value,
              })),
              type: 'pie',
            };

          default:
            return { data: filteredData, type: 'default' };
        }
      };

      const groupByInterval = (data: any[], timeRange: string): any[] => {
        const intervalMs =
          {
            '1h': 5 * 60 * 1000, // 5분 간격
            '6h': 30 * 60 * 1000, // 30분 간격
            '24h': 60 * 60 * 1000, // 1시간 간격
            '7d': 6 * 60 * 60 * 1000, // 6시간 간격
          }[timeRange] || 60 * 60 * 1000;

        const groups = {};

        data.forEach(item => {
          const interval = Math.floor(item.timestamp / intervalMs) * intervalMs;
          if (!(groups as any)[interval]) {
            (groups as any)[interval] = { values: [], interval };
          }
          (groups as any)[interval].values.push(item.value);
        });

        return Object.values(groups).map((group: any) => ({
          interval: group.interval,
          average:
            group.values.reduce((sum: any, val: any) => sum + val, 0) /
            group.values.length,
          count: group.values.length,
        }));
      };

      const mockData = [
        {
          timestamp: Date.now() - 3600000,
          value: 30,
          label: 'CPU',
          category: 'system',
        },
        {
          timestamp: Date.now() - 1800000,
          value: 45,
          label: 'CPU',
          category: 'system',
        },
        {
          timestamp: Date.now() - 900000,
          value: 60,
          label: 'CPU',
          category: 'system',
        },
      ];

      const lineChart = prepareChartData(mockData, 'line', '6h');
      const barChart = prepareChartData(mockData, 'bar', '6h');
      const pieChart = prepareChartData(mockData, 'pie', '6h');

      expect(lineChart.type).toBe('line');
      expect(lineChart.data.length).toBeGreaterThan(0);
      expect(barChart.type).toBe('bar');
      expect(pieChart.type).toBe('pie');
      expect(
        pieChart.data.every(
          (item: any) => item.label && typeof item.value === 'number'
        )
      ).toBe(true);
    });

    it('should calculate dashboard statistics', () => {
      const calculateDashboardStats = (data: any[]): any => {
        if (data.length === 0) {
          return {
            total: 0,
            average: 0,
            min: 0,
            max: 0,
            trend: 'stable',
            variance: 0,
          };
        }

        const values = data
          .map(item => item.value)
          .filter(val => typeof val === 'number');
        const total = values.reduce((sum, val) => sum + val, 0);
        const average = total / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        // 분산 계산
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
          values.length;

        // 트렌드 계산 (최근 30% vs 이전 30%)
        const recentCount = Math.floor(values.length * 0.3);
        const recent = values.slice(-recentCount);
        const older = values.slice(0, recentCount);

        const recentAvg =
          recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg =
          older.reduce((sum, val) => sum + val, 0) / older.length;

        let trend = 'stable';
        if (recentAvg > olderAvg * 1.05) trend = 'increasing';
        else if (recentAvg < olderAvg * 0.95) trend = 'decreasing';

        return {
          total: values.length,
          sum: total,
          average: Math.round(average * 100) / 100,
          min,
          max,
          trend,
          variance: Math.round(variance * 100) / 100,
          standardDeviation: Math.round(Math.sqrt(variance) * 100) / 100,
        };
      };

      const testData = [
        { value: 30 },
        { value: 35 },
        { value: 40 },
        { value: 45 },
        { value: 50 },
        { value: 55 },
        { value: 60 },
        { value: 65 },
        { value: 70 },
        { value: 75 },
      ];

      const stats = calculateDashboardStats(testData);

      expect(stats.total).toBe(10);
      expect(stats.average).toBe(52.5);
      expect(stats.min).toBe(30);
      expect(stats.max).toBe(75);
      expect(stats.trend).toBe('increasing');
      expect(stats.variance).toBeGreaterThan(0);
      expect(stats.standardDeviation).toBeGreaterThan(0);
    });
  });

  describe('사용자 인터랙션', () => {
    it('should handle dashboard user preferences', () => {
      const manageUserPreferences = (userId: string, preferences: any): any => {
        const defaultPreferences = {
          theme: 'dark',
          refreshInterval: 30,
          defaultView: 'overview',
          chartTypes: ['line', 'bar'],
          notifications: true,
          autoRefresh: true,
          compactMode: false,
          language: 'ko',
        };

        const merged = { ...defaultPreferences, ...preferences };

        // 유효하지 않은 필드 제거
        const validKeys = Object.keys(defaultPreferences);
        const cleanedPreferences: any = {};
        validKeys.forEach(key => {
          cleanedPreferences[key] = merged[key];
        });

        // 검증
        const validThemes = ['light', 'dark', 'auto'];
        const validIntervals = [5, 10, 30, 60, 300];
        const validViews = ['overview', 'detailed', 'minimal'];

        if (!validThemes.includes(cleanedPreferences.theme)) {
          cleanedPreferences.theme = defaultPreferences.theme;
        }

        if (!validIntervals.includes(cleanedPreferences.refreshInterval)) {
          cleanedPreferences.refreshInterval =
            defaultPreferences.refreshInterval;
        }

        if (!validViews.includes(cleanedPreferences.defaultView)) {
          cleanedPreferences.defaultView = defaultPreferences.defaultView;
        }

        return {
          userId,
          preferences: cleanedPreferences,
          lastUpdated: Date.now(),
        };
      };

      const userPrefs = {
        theme: 'light',
        refreshInterval: 60,
        notifications: false,
        invalidField: 'should be ignored',
      };

      const result = manageUserPreferences('user123', userPrefs);

      expect(result.userId).toBe('user123');
      expect(result.preferences.theme).toBe('light');
      expect(result.preferences.refreshInterval).toBe(60);
      expect(result.preferences.notifications).toBe(false);
      expect(result.preferences.autoRefresh).toBe(true); // 기본값 유지
      expect(result.preferences.invalidField).toBeUndefined();
      expect(result.lastUpdated).toBeDefined();
    });

    it('should implement dashboard search functionality', () => {
      const searchDashboard = (query: string, data: any[]): any => {
        if (!query || query.trim() === '') {
          return {
            results: data,
            total: data.length,
            query: '',
            searchTime: 0,
          };
        }

        const startTime = Date.now();
        const normalizedQuery = query.toLowerCase().trim();

        const results = data.filter(item => {
          // 텍스트 필드 검색
          const textFields = ['name', 'description', 'type', 'category'];
          const textMatch = textFields.some(
            field =>
              item[field] && item[field].toLowerCase().includes(normalizedQuery)
          );

          // 숫자 필드 검색 (정확한 매치 또는 범위)
          const numericMatch = Object.keys(item).some(key => {
            const value = item[key];
            if (typeof value === 'number') {
              return value.toString().includes(normalizedQuery);
            }
            return false;
          });

          // 태그 검색
          const tagMatch =
            item.tags &&
            Array.isArray(item.tags) &&
            item.tags.some((tag: any) =>
              tag.toLowerCase().includes(normalizedQuery)
            );

          return textMatch || numericMatch || tagMatch;
        });

        // 관련성 점수 계산
        const scoredResults = results.map(item => {
          let score = 0;

          // 이름 매치는 높은 점수
          if (item.name && item.name.toLowerCase().includes(normalizedQuery)) {
            score += 10;
          }

          // 정확한 매치는 추가 점수
          if (item.name && item.name.toLowerCase() === normalizedQuery) {
            score += 20;
          }

          // 설명 매치는 중간 점수
          if (
            item.description &&
            item.description.toLowerCase().includes(normalizedQuery)
          ) {
            score += 5;
          }

          return { ...item, searchScore: score };
        });

        // 점수순 정렬
        scoredResults.sort((a, b) => b.searchScore - a.searchScore);

        return {
          results: scoredResults,
          total: scoredResults.length,
          query: normalizedQuery,
          searchTime: Date.now() - startTime,
        };
      };

      const mockData = [
        {
          id: 1,
          name: 'Web Server',
          description: 'Main web server',
          type: 'server',
          tags: ['web', 'production'],
        },
        {
          id: 2,
          name: 'Database',
          description: 'Primary database',
          type: 'database',
          tags: ['db', 'mysql'],
        },
        {
          id: 3,
          name: 'Cache Server',
          description: 'Redis cache server',
          type: 'cache',
          tags: ['redis', 'cache'],
        },
        {
          id: 4,
          name: 'Web Proxy',
          description: 'Nginx proxy server',
          type: 'proxy',
          tags: ['nginx', 'proxy'],
        },
      ];

      const searchResult1 = searchDashboard('web', mockData);
      const searchResult2 = searchDashboard('Database', mockData);
      const searchResult3 = searchDashboard('', mockData);

      expect(searchResult1.results.length).toBe(2); // Web Server, Web Proxy
      expect(searchResult1.results[0].searchScore).toBeGreaterThan(0);

      expect(searchResult2.results.length).toBe(1); // Database
      expect(searchResult2.results[0].name).toBe('Database');

      expect(searchResult3.results.length).toBe(4); // 모든 결과
      expect(searchResult3.query).toBe('');
    });
  });
});
