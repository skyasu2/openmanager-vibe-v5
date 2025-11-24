import type { EnhancedServerMetrics } from '@/types/server';
import type { EnrichedMetrics } from '../EnrichedMetricsGenerator';
import type { MetricsSource } from './MetricsSource';

interface BaselineData {
  pattern_multiplier?: number;
  response_time_baseline?: number;
  cpu_baseline?: number;
  memory_baseline?: number;
  disk_baseline?: number;
  network_baseline?: number;
  network_in_baseline?: number;
  network_out_baseline?: number;
  performance_multiplier?: number;
}

interface ScenarioData {
  type?: string;
  severity?: number | string;
  impact?: number;
  duration?: number;
  affected_metrics?: string[];
  recovery_time?: number;
  pattern?: {
    id?: string;
    severity?: string;
  };
}

export class MetricsSimulator implements MetricsSource {
  private baselineData: Map<string, BaselineData> = new Map();

  constructor(private getActiveScenarios: () => ScenarioData[] = () => []) {}

  async generateMetrics(
    server: EnhancedServerMetrics
  ): Promise<EnrichedMetrics> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    const baseline = this.getServerBaseline(server.id, hour);
    const scenarios = this.getActiveScenarios();

    const systemMetrics = this.generateSystemMetrics(
      server,
      baseline,
      scenarios
    );
    const applicationMetrics = this.generateApplicationMetrics(
      server,
      hour,
      baseline
    );
    const businessMetrics = this.generateBusinessMetrics(
      server,
      dayOfWeek,
      hour
    );
    const contextMetrics = this.generateContextMetrics(hour, dayOfWeek);

    return {
      system: systemMetrics,
      application: applicationMetrics,
      business: businessMetrics,
      context: contextMetrics,
    };
  }

  private getServerBaseline(
    serverId: string,
    hour: number
  ): BaselineData | null {
    return this.baselineData.get(`${serverId}-${hour}`) || {};
  }

  private generateSystemMetrics(
    server: EnhancedServerMetrics,
    baseline: BaselineData | null,
    scenarios: ScenarioData[]
  ): EnrichedMetrics['system'] {
    const baseMultiplier = baseline?.pattern_multiplier || 1.0;
    const scenarioImpact = this.calculateScenarioImpact(scenarios);

    const currentLoad =
      baseMultiplier * scenarioImpact * (0.8 + Math.random() * 0.4);

    return {
      cpu: {
        usage: Math.min(99.5, (baseline?.cpu_baseline || 30) * currentLoad),
        load1: currentLoad * 2,
        load5: currentLoad * 1.5,
        load15: currentLoad * 1.2,
        processes: 50 + Math.floor(currentLoad * 30),
        threads: 200 + Math.floor(currentLoad * 150),
        context_switches: Math.floor(currentLoad * 10000),
        interrupts: Math.floor(currentLoad * 5000),
      },
      memory: {
        used: (baseline?.memory_baseline || 40) * currentLoad,
        available: 100 - (baseline?.memory_baseline || 40) * currentLoad,
        buffers: 5 + Math.random() * 3,
        cached: 15 + Math.random() * 10,
        swap: {
          used: Math.max(0, (currentLoad - 0.8) * 10),
          total: 100,
        },
        page_faults: Math.floor(currentLoad * 1000),
        memory_leaks: scenarios.some(
          (s) => s.pattern?.id === 'gradual-memory-leak'
        )
          ? Math.floor(currentLoad * 50)
          : 0,
      },
      disk: {
        io: {
          read: Math.floor(currentLoad * 100),
          write: Math.floor(currentLoad * 50),
        },
        throughput: {
          read_mbps: currentLoad * 50,
          write_mbps: currentLoad * 25,
        },
        utilization: Math.min(
          95,
          (baseline?.disk_baseline || 20) + currentLoad * 30
        ),
        queue_depth: Math.floor(currentLoad * 5),
        latency: {
          read_ms: 5 + currentLoad * 15,
          write_ms: 8 + currentLoad * 20,
        },
        errors: Math.floor(Math.random() * currentLoad * 2),
      },
      network: {
        in_mbps: (baseline?.network_in_baseline || 10) * currentLoad,
        out_mbps: (baseline?.network_out_baseline || 8) * currentLoad,
        connections: Math.floor(50 + currentLoad * 200),
        errors: Math.floor(Math.random() * currentLoad * 3),
        dropped_packets: Math.floor(Math.random() * currentLoad * 5),
        retransmissions: Math.floor(Math.random() * currentLoad * 2),
      },
    };
  }

  private generateApplicationMetrics(
    server: EnhancedServerMetrics,
    hour: number,
    baseline: BaselineData | null
  ): EnrichedMetrics['application'] {
    const trafficMultiplier = this.getTrafficMultiplier(hour);
    const baseRps = baseline?.response_time_baseline || 100;

    return {
      http: {
        requests_per_second: Math.floor(baseRps * trafficMultiplier),
        response_time_ms: 50 + Math.random() * 200,
        error_rate: 0.5 + Math.random() * 2,
        active_connections: Math.floor(50 + trafficMultiplier * 300),
        queue_size: Math.floor(Math.random() * trafficMultiplier * 10),
      },
      database: {
        connections: Math.floor(10 + trafficMultiplier * 40),
        query_time_ms: 5 + Math.random() * 50,
        slow_queries: Math.floor(Math.random() * 5),
        deadlocks: Math.floor(Math.random() * 2),
        cache_hit_rate: 85 + Math.random() * 10,
      },
      cache: {
        hit_rate: 80 + Math.random() * 15,
        memory_usage: 30 + Math.random() * 40,
        evictions: Math.floor(Math.random() * 100),
        operations_per_second: Math.floor(500 + trafficMultiplier * 2000),
      },
      sessions: {
        active_users: Math.floor(100 + trafficMultiplier * 500),
        session_duration_avg: 10 + Math.random() * 20,
        login_rate: Math.floor(5 + trafficMultiplier * 20),
        authentication_failures: Math.floor(Math.random() * 3),
      },
    };
  }

  private generateBusinessMetrics(
    server: EnhancedServerMetrics,
    dayOfWeek: number,
    hour: number
  ): EnrichedMetrics['business'] {
    const businessMultiplier = this.getBusinessMultiplier(dayOfWeek, hour);

    return {
      traffic: {
        page_views: Math.floor(1000 + businessMultiplier * 5000),
        unique_visitors: Math.floor(200 + businessMultiplier * 1000),
        bounce_rate: 25 + Math.random() * 15,
        conversion_rate: 2 + Math.random() * 3,
      },
      performance: {
        sla_compliance: 95 + Math.random() * 4,
        availability: 99.5 + Math.random() * 0.5,
        mttr_minutes: 15 + Math.random() * 30,
        incident_count: Math.floor(Math.random() * 3),
      },
      cost: {
        cpu_cost_per_hour: 0.05 + Math.random() * 0.03,
        memory_cost_per_hour: 0.02 + Math.random() * 0.01,
        storage_cost_per_hour: 0.01 + Math.random() * 0.005,
        total_cost_per_hour: 0.08 + Math.random() * 0.045,
      },
    };
  }

  private generateContextMetrics(
    hour: number,
    dayOfWeek: number
  ): EnrichedMetrics['context'] {
    const isPeakHour =
      hour >= 9 && hour <= 18 && dayOfWeek >= 1 && dayOfWeek <= 5;
    const isMaintenanceWindow = hour >= 2 && hour <= 4;

    return {
      time: {
        hour,
        day_of_week: dayOfWeek,
        is_peak_hour: isPeakHour,
        is_maintenance_window: isMaintenanceWindow,
      },
      external: {
        temperature: 18 + Math.random() * 12,
        humidity: 40 + Math.random() * 20,
        power_efficiency: 85 + Math.random() * 10,
        cooling_cost: 0.02 + Math.random() * 0.01,
      },
      security: {
        threat_level: Math.floor(Math.random() * 5),
        failed_login_attempts: Math.floor(Math.random() * 10),
        suspicious_activities: Math.floor(Math.random() * 5),
        firewall_blocks: Math.floor(Math.random() * 20),
      },
    };
  }

  private calculateScenarioImpact(scenarios: ScenarioData[]): number {
    let impact = 1.0;
    scenarios.forEach((scenario) => {
      switch (scenario.pattern?.severity) {
        case 'critical':
          impact *= 1.5;
          break;
        case 'high':
          impact *= 1.3;
          break;
        case 'medium':
          impact *= 1.1;
          break;
        default:
          impact *= 1.05;
          break;
      }
    });
    return Math.min(impact, 2.0);
  }

  private getTrafficMultiplier(hour: number): number {
    if (hour >= 9 && hour <= 18) return 1.0;
    if (hour >= 19 && hour <= 22) return 0.8;
    return 0.3;
  }

  private getBusinessMultiplier(dayOfWeek: number, hour: number): number {
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isPeakHour = hour >= 9 && hour <= 18;

    if (isWeekday && isPeakHour) return 1.0;
    if (isWeekday && !isPeakHour) return 0.6;
    return 0.4;
  }
}
