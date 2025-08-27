'use client';

/**
 * 🎨 D3.js 기반 실시간 차트 프로토타입
 * 
 * 특징:
 * - 완전한 커스터마이징 가능
 * - SVG 기반 벡터 그래픽
 * - 복잡한 시각화 및 인터랙션
 * - 고성능 데이터 바인딩
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface MetricData {
  timestamp: Date;
  cpu: number;
  memory: number;
  network: number;
}

interface RealtimeChartD3Props {
  serverId: string;
  maxDataPoints?: number;
  updateInterval?: number;
  width?: number;
  height?: number;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataPoints: number;
  domNodes: number;
}

export function RealtimeChartD3({
  serverId,
  maxDataPoints = 100,
  updateInterval = 1000,
  width = 800,
  height = 400,
}: RealtimeChartD3Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<MetricData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    dataPoints: 0,
    domNodes: 0,
  });

  const margin = { top: 20, right: 80, bottom: 50, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 실시간 데이터 생성
  const generateRealtimeData = useCallback((): MetricData => {
    return {
      timestamp: new Date(),
      cpu: Math.random() * 100,
      memory: 40 + Math.random() * 40,
      network: Math.random() * 1000,
    };
  }, []);

  // 메모리 사용량 측정
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }, []);

  // DOM 노드 수 계산
  const countDOMNodes = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return 0;
    return svg.querySelectorAll('*').length;
  }, []);

  // D3 차트 그리기
  const drawChart = useCallback((chartData: MetricData[]) => {
    const renderStart = performance.now();
    
    if (!svgRef.current || chartData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // 기존 요소 제거

    // 스케일 설정
    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.timestamp) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // 라인 생성기
    const cpuLine = d3.line<MetricData>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.cpu))
      .curve(d3.curveMonotoneX);

    const memoryLine = d3.line<MetricData>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.memory))
      .curve(d3.curveMonotoneX);

    const networkLine = d3.line<MetricData>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.network / 10)) // 스케일 조정
      .curve(d3.curveMonotoneX);

    // 메인 그룹
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 그라디언트 정의
    const defs = svg.append('defs');
    
    const cpuGradient = defs.append('linearGradient')
      .attr('id', 'cpu-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', innerHeight)
      .attr('x2', 0).attr('y2', 0);
    
    cpuGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0);
    
    cpuGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.3);

    // 영역 채우기 (Area)
    const cpuArea = d3.area<MetricData>()
      .x(d => xScale(d.timestamp))
      .y0(innerHeight)
      .y1(d => yScale(d.cpu))
      .curve(d3.curveMonotoneX);

    // CPU 영역 그리기
    g.append('path')
      .datum(chartData)
      .attr('fill', 'url(#cpu-gradient)')
      .attr('d', cpuArea);

    // 라인 그리기
    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', cpuLine);

    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2)
      .attr('d', memoryLine);

    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 2)
      .attr('d', networkLine);

    // X축
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%H:%M:%S'))
      .ticks(6);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6b7280');

    // Y축
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${d}%`)
      .ticks(5);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6b7280');

    // 축 라벨
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#374151')
      .text('사용률 (%)');

    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#374151')
      .text('시간');

    // 범례
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth - 70}, 20)`);

    const legendData = [
      { name: 'CPU', color: '#3b82f6' },
      { name: 'Memory', color: '#22c55e' },
      { name: 'Network', color: '#a855f7' },
    ];

    legendData.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', item.color);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .style('font-size', '12px')
        .style('fill', '#374151')
        .text(item.name);
    });

    // 호버 인터랙션
    const bisect = d3.bisector((d: MetricData) => d.timestamp).left;
    
    const focus = g.append('g')
      .attr('class', 'focus')
      .style('display', 'none');

    focus.append('line')
      .attr('class', 'x-hover-line hover-line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('stroke', '#999')
      .style('stroke-width', '1px')
      .style('stroke-dasharray', '3,3');

    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => focus.style('display', null))
      .on('mouseout', () => {
        focus.style('display', 'none');
        tooltip.style('opacity', 0);
      })
      .on('mousemove', function(event) {
        const x0 = xScale.invert(d3.pointer(event, this)[0]);
        const i = bisect(chartData, x0, 1);
        const d0 = chartData[i - 1];
        const d1 = chartData[i];
        const d = d1 && (x0.getTime() - d0.timestamp.getTime() > d1.timestamp.getTime() - x0.getTime()) ? d1 : d0;
        
        if (d) {
          focus.attr('transform', `translate(${xScale(d.timestamp)},0)`);
          
          tooltip.style('opacity', 1)
            .html(`
              <div>시간: ${d.timestamp.toLocaleTimeString()}</div>
              <div>CPU: ${d.cpu.toFixed(1)}%</div>
              <div>Memory: ${d.memory.toFixed(1)}%</div>
              <div>Network: ${d.network.toFixed(1)} MB/s</div>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        }
      });

    // 성능 메트릭 업데이트
    const renderTime = performance.now() - renderStart;
    const memoryUsage = measureMemoryUsage();
    const domNodes = countDOMNodes();
    
    setPerformanceMetrics({
      renderTime,
      memoryUsage,
      dataPoints: chartData.length,
      domNodes,
    });
  }, [innerWidth, innerHeight, measureMemoryUsage, countDOMNodes]);

  // 데이터 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = generateRealtimeData();
        const updatedData = [...prevData, newData];
        
        if (updatedData.length > maxDataPoints) {
          return updatedData.slice(-maxDataPoints);
        }
        
        return updatedData;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [generateRealtimeData, maxDataPoints, updateInterval]);

  // 차트 그리기
  useEffect(() => {
    if (data.length > 0) {
      drawChart(data);
    }
  }, [data, drawChart]);

  return (
    <div className="space-y-4">
      {/* 차트 */}
      <div className="overflow-hidden rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          D3.js 실시간 서버 모니터링 - {serverId}
        </h3>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ fontFamily: 'Arial, sans-serif' }}
        />
      </div>
      
      {/* 성능 메트릭 */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
        <div className="space-y-2">
          <h4 className="font-semibold text-purple-600">D3.js 성능</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>렌더링 시간:</span>
              <span className="font-mono">{performanceMetrics.renderTime.toFixed(2)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>DOM 노드:</span>
              <span className="font-mono">{performanceMetrics.domNodes}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-green-600">메모리 사용량</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>JS Heap:</span>
              <span className="font-mono">{performanceMetrics.memoryUsage.toFixed(1)}MB</span>
            </div>
            <div className="flex justify-between">
              <span>데이터 포인트:</span>
              <span className="font-mono">{performanceMetrics.dataPoints}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 특징 요약 */}
      <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
        <h4 className="mb-2 font-semibold text-purple-700 dark:text-purple-300">D3.js 특징</h4>
        <ul className="space-y-1 text-sm text-purple-600 dark:text-purple-400">
          <li>✅ 완전한 커스터마이징 가능</li>
          <li>✅ 복잡한 시각화와 인터랙션</li>
          <li>✅ SVG 기반 벡터 그래픽</li>
          <li>✅ 고성능 데이터 바인딩</li>
          <li>⚠️ 높은 학습 곡선</li>
          <li>⚠️ 많은 코드 작성 필요</li>
        </ul>
      </div>
    </div>
  );
}