import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MonitoringResults from '@/components/ai/MonitoringResults';

// Mock the monitoring result props
const mockResults = {
  summary: {
    severity: 'high' as const,
    confidence: 0.85,
    processingTime: 1200,
  },
  actions: [
    {
      priority: 'high' as const,
      title: 'Critical Memory Usage',
      description: 'Server memory usage exceeds 90%',
    },
  ],
  details: {
    anomalyDetection: {
      detected: true,
      confidence: 0.92,
      metrics: ['cpu', 'memory'],
    },
    rootCauseAnalysis: {
      identified: true,
      causes: ['Memory leak in application'],
    },
    predictiveMonitoring: {
      forecast: 'degradation',
      timeframe: '2 hours',
    },
  },
};

describe('MonitoringResults', () => {
  it('renders monitoring results summary', () => {
    render(<MonitoringResults results={mockResults} />);

    expect(screen.getByText(/monitoring results/i)).toBeInTheDocument();
  });

  it('displays severity level correctly', () => {
    render(<MonitoringResults results={mockResults} />);

    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('shows confidence score', () => {
    render(<MonitoringResults results={mockResults} />);

    expect(screen.getByText(/85%|0.85/)).toBeInTheDocument();
  });

  it('displays priority actions', () => {
    render(<MonitoringResults results={mockResults} />);

    expect(screen.getByText('Critical Memory Usage')).toBeInTheDocument();
    expect(screen.getByText(/memory usage exceeds 90%/i)).toBeInTheDocument();
  });

  it('shows anomaly detection results', () => {
    render(<MonitoringResults results={mockResults} />);

    expect(screen.getByText(/anomaly/i)).toBeInTheDocument();
    expect(screen.getByText(/92%|0.92/)).toBeInTheDocument();
  });

  it('handles empty results gracefully', () => {
    const emptyResults = {
      summary: { severity: 'low' as const, confidence: 0, processingTime: 0 },
      actions: [],
      details: {},
    };

    render(<MonitoringResults results={emptyResults} />);

    expect(screen.getByText(/monitoring results/i)).toBeInTheDocument();
  });
});
