import { beforeEach, describe, expect, it } from 'vitest';

// Mock incident detection engine
class MockIncidentDetectionEngine {
    private incidents: Array<{
        id: string;
        type: 'performance' | 'security' | 'availability';
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        timestamp: Date;
        resolved: boolean;
    }> = [];

    async detectIncidents(metrics: any) {
        const incidents: any[] = [];

        // CPU 사용률 체크
        if (metrics.cpu > 90) {
            incidents.push({
                id: `cpu-${Date.now()}`,
                type: 'performance' as const,
                severity: 'high' as const,
                message: `CPU 사용률이 ${metrics.cpu}%로 높습니다`,
                timestamp: new Date(),
                resolved: false,
            });
        }

        // 메모리 사용률 체크
        if (metrics.memory > 85) {
            incidents.push({
                id: `memory-${Date.now()}`,
                type: 'performance' as const,
                severity: 'medium' as const,
                message: `메모리 사용률이 ${metrics.memory}%로 높습니다`,
                timestamp: new Date(),
                resolved: false,
            });
        }

        // 디스크 사용률 체크
        if (metrics.disk > 95) {
            incidents.push({
                id: `disk-${Date.now()}`,
                type: 'availability' as const,
                severity: 'critical' as const,
                message: `디스크 사용률이 ${metrics.disk}%로 위험합니다`,
                timestamp: new Date(),
                resolved: false,
            });
        }

        this.incidents.push(...incidents);
        return incidents;
    }

    async getActiveIncidents() {
        return this.incidents.filter(incident => !incident.resolved);
    }

    async resolveIncident(incidentId: string) {
        const incident = this.incidents.find(i => i.id === incidentId);
        if (incident) {
            incident.resolved = true;
            return true;
        }
        return false;
    }
}

describe('IncidentDetectionEngine', () => {
    let engine: MockIncidentDetectionEngine;

    beforeEach(() => {
        engine = new MockIncidentDetectionEngine();
    });

    it('should detect CPU performance incident', async () => {
        const metrics = {
            cpu: 95,
            memory: 60,
            disk: 40,
            network: 20,
        };

        const incidents = await engine.detectIncidents(metrics);

        expect(incidents).toHaveLength(1);
        expect(incidents[0]).toMatchObject({
            type: 'performance',
            severity: 'high',
            resolved: false,
        });
        expect(incidents[0].message).toContain('CPU 사용률이 95%');
    });

    it('should detect memory performance incident', async () => {
        const metrics = {
            cpu: 70,
            memory: 90,
            disk: 50,
            network: 25,
        };

        const incidents = await engine.detectIncidents(metrics);

        expect(incidents).toHaveLength(1);
        expect(incidents[0]).toMatchObject({
            type: 'performance',
            severity: 'medium',
            resolved: false,
        });
        expect(incidents[0].message).toContain('메모리 사용률이 90%');
    });

    it('should detect critical disk incident', async () => {
        const metrics = {
            cpu: 60,
            memory: 70,
            disk: 98,
            network: 30,
        };

        const incidents = await engine.detectIncidents(metrics);

        expect(incidents).toHaveLength(1);
        expect(incidents[0]).toMatchObject({
            type: 'availability',
            severity: 'critical',
            resolved: false,
        });
        expect(incidents[0].message).toContain('디스크 사용률이 98%');
    });

    it('should detect multiple incidents', async () => {
        const metrics = {
            cpu: 95,
            memory: 90,
            disk: 98,
            network: 40,
        };

        const incidents = await engine.detectIncidents(metrics);

        expect(incidents).toHaveLength(3);
        expect(incidents.map(i => i.type)).toContain('performance');
        expect(incidents.map(i => i.type)).toContain('availability');
    });

    it('should return active incidents', async () => {
        const metrics = {
            cpu: 95,
            memory: 90,
            disk: 50,
            network: 30,
        };

        await engine.detectIncidents(metrics);
        const activeIncidents = await engine.getActiveIncidents();

        expect(activeIncidents).toHaveLength(2);
        expect(activeIncidents.every(i => !i.resolved)).toBe(true);
    });

    it('should resolve incidents', async () => {
        const metrics = {
            cpu: 95,
            memory: 60,
            disk: 50,
            network: 30,
        };

        const incidents = await engine.detectIncidents(metrics);
        const incidentId = incidents[0].id;

        const resolved = await engine.resolveIncident(incidentId);
        expect(resolved).toBe(true);

        const activeIncidents = await engine.getActiveIncidents();
        expect(activeIncidents).toHaveLength(0);
    });

    it('should not detect incidents for normal metrics', async () => {
        const metrics = {
            cpu: 60,
            memory: 70,
            disk: 50,
            network: 30,
        };

        const incidents = await engine.detectIncidents(metrics);

        expect(incidents).toHaveLength(0);
    });
}); 