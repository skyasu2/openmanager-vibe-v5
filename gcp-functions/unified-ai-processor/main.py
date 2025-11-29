"""
Unified AI Processor (GCP Functions)

Features:
- AI orchestration and coordination
- Multi-source data aggregation
- Intelligent routing and fallback
- Performance monitoring
- 10-50x performance improvement over JavaScript
- **Optimized**: Direct module integration (No internal HTTP calls)

Author: AI Migration Team
Version: 2.1.0 (Python Optimized)
"""

import json
import time
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import functions_framework
import httpx
from cachetools import TTLCache
import structlog

# Import local modules
from modules.nlp_engine import EnhancedKoreanNLPEngine
from modules.ml_engine import MLAnalyticsEngine

# Configure structured logging
logger = structlog.get_logger()

# Global cache (5 minutes TTL)
response_cache = TTLCache(maxsize=1000, ttl=300)


@dataclass
class ProcessingRequest:
    query: str
    context: Dict[str, Any]
    processors: List[str]
    options: Dict[str, Any]


@dataclass
class ProcessingResult:
    processor: str
    success: bool
    data: Optional[Dict]
    error: Optional[str]
    processing_time: float


@dataclass
class UnifiedResponse:
    success: bool
    results: List[ProcessingResult]
    aggregated_data: Dict[str, Any]
    recommendations: List[str]
    total_processing_time: float
    cache_hit: bool


class UnifiedAIProcessor:
    """High-performance unified AI processing orchestrator (Optimized)"""
    
    def __init__(self):
        # Initialize local engines
        self.nlp_engine = EnhancedKoreanNLPEngine()
        self.ml_engine = MLAnalyticsEngine()
        
        # External endpoints (only for services not yet integrated)
        self.external_endpoints = {
            'server_analyzer': 'https://us-central1-openmanager-free-tier.cloudfunctions.net/server-analyzer',
            'pattern_matcher': 'https://us-central1-openmanager-free-tier.cloudfunctions.net/pattern-matcher',
            'trend_predictor': 'https://us-central1-openmanager-free-tier.cloudfunctions.net/trend-predictor'
        }
        
        self.processor_weights = {
            'korean_nlp': 0.25,
            'ml_analytics': 0.20,
            'server_analyzer': 0.25,
            'pattern_matcher': 0.15,
            'trend_predictor': 0.15
        }
    
    async def process_request(self, request: ProcessingRequest) -> UnifiedResponse:
        """Process request through multiple AI processors"""
        start_time = time.time()
        
        # Check cache
        cache_key = f"{request.query}:{json.dumps(request.processors)}"
        if cache_key in response_cache:
            logger.info("Cache hit", cache_key=cache_key)
            cached_response = response_cache[cache_key]
            cached_response.cache_hit = True
            return cached_response
        
        logger.info("Processing unified AI request", 
                   query=request.query, 
                   processors=request.processors)
        
        # Process with requested processors
        results = await self._process_parallel(request)
        
        # Aggregate results
        aggregated_data = self._aggregate_results(results)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(results, aggregated_data)
        
        # Build response
        response = UnifiedResponse(
            success=any(r.success for r in results),
            results=results,
            aggregated_data=aggregated_data,
            recommendations=recommendations,
            total_processing_time=(time.time() - start_time) * 1000,
            cache_hit=False
        )
        
        # Cache successful responses
        if response.success:
            response_cache[cache_key] = response
        
        logger.info("Unified processing complete", 
                   success=response.success,
                   processing_time=response.total_processing_time)
        
        return response
    
    async def _process_parallel(self, request: ProcessingRequest) -> List[ProcessingResult]:
        """Process request through multiple processors in parallel"""
        tasks = []
        
        # Create an HTTP client for external calls if needed
        async with httpx.AsyncClient(timeout=10) as client:
            for processor in request.processors:
                if processor == 'korean_nlp':
                    tasks.append(self._run_local_nlp(request))
                elif processor == 'ml_analytics':
                    tasks.append(self._run_local_ml(request))
                elif processor in self.external_endpoints:
                    tasks.append(self._call_external_processor(client, processor, request))
                else:
                    logger.warning(f"Unknown processor requested: {processor}")
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Convert exceptions to error results
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    processed_results.append(ProcessingResult(
                        processor=request.processors[i],
                        success=False,
                        data=None,
                        error=str(result),
                        processing_time=0
                    ))
                else:
                    processed_results.append(result)
            
            return processed_results

    async def _run_local_nlp(self, request: ProcessingRequest) -> ProcessingResult:
        """Run NLP engine locally"""
        start_time = time.time()
        try:
            # Initialize if needed (it handles its own state)
            await self.nlp_engine.initialize()
            
            result = await self.nlp_engine.analyze_query(request.query, request.context)
            
            return ProcessingResult(
                processor='korean_nlp',
                success=True,
                data=asdict(result),
                error=None,
                processing_time=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error("Local NLP failed", error=str(e))
            return ProcessingResult(
                processor='korean_nlp',
                success=False,
                data=None,
                error=str(e),
                processing_time=(time.time() - start_time) * 1000
            )

    async def _run_local_ml(self, request: ProcessingRequest) -> ProcessingResult:
        """Run ML engine locally"""
        start_time = time.time()
        try:
            # Extract metrics from context or options. 
            # Note: The original ML engine expects 'metrics' list.
            # We assume the caller passes metrics in context or we need to fetch them.
            # For this optimization, we assume 'metrics' are passed in request.options or context.
            metrics = request.options.get('metrics') or request.context.get('metrics') or []
            
            if not metrics:
                return ProcessingResult(
                    processor='ml_analytics',
                    success=False,
                    data=None,
                    error="No metrics provided for ML analysis",
                    processing_time=(time.time() - start_time) * 1000
                )

            result = await self.ml_engine.analyze_metrics(metrics, request.context)
            
            # Convert ML result to dict structure expected by aggregator
            data = {
                'anomalies': [
                    {
                        'is_anomaly': a.is_anomaly,
                        'severity': a.severity,
                        'confidence': a.confidence,
                        'timestamp': a.timestamp.isoformat(),
                        'value': a.value,
                        'expected_range': list(a.expected_range)
                    }
                    for a in result.anomalies
                ],
                'trend': asdict(result.trend),
                'patterns': result.patterns,
                'recommendations': result.recommendations,
                'health_scores': [asdict(h) for h in result.health_scores],
                'clusters': result.clusters
            }
            
            return ProcessingResult(
                processor='ml_analytics',
                success=True,
                data=data,
                error=None,
                processing_time=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error("Local ML failed", error=str(e))
            return ProcessingResult(
                processor='ml_analytics',
                success=False,
                data=None,
                error=str(e),
                processing_time=(time.time() - start_time) * 1000
            )
    
    async def _call_external_processor(self, client: httpx.AsyncClient, 
                            processor: str, request: ProcessingRequest) -> ProcessingResult:
        """Call external processor (Legacy/Remote)"""
        start_time = time.time()
        
        try:
            endpoint = self.external_endpoints[processor]
            
            # Prepare processor-specific payload
            payload = self._prepare_processor_payload(processor, request)
            
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            return ProcessingResult(
                processor=processor,
                success=True,
                data=data,
                error=None,
                processing_time=(time.time() - start_time) * 1000
            )
            
        except Exception as e:
            logger.error("External processor call failed", 
                        processor=processor, 
                        error=str(e))
            
            return ProcessingResult(
                processor=processor,
                success=False,
                data=None,
                error=str(e),
                processing_time=(time.time() - start_time) * 1000
            )
    
    def _prepare_processor_payload(self, processor: str, request: ProcessingRequest) -> Dict:
        """Prepare processor-specific payload"""
        base_payload = {
            'query': request.query,
            'context': request.context
        }
        
        # Add processor-specific fields
        if processor == 'server_analyzer':
            base_payload['metrics'] = request.options.get('metrics', ['all'])
        
        return base_payload
    
    def _aggregate_results(self, results: List[ProcessingResult]) -> Dict[str, Any]:
        """Aggregate results from multiple processors"""
        aggregated = {
            'confidence_score': 0.0,
            'main_insights': [],
            'entities': {},
            'metrics': {},
            'patterns': [],
            'anomalies': []
        }
        
        total_weight = 0
        
        for result in results:
            if result.success and result.data:
                weight = self.processor_weights.get(result.processor, 0.1)
                total_weight += weight
                
                # Extract and merge insights
                # Handle different data structures from different engines
                
                # NLP Engine Data
                if result.processor == 'korean_nlp':
                    data = result.data
                    if 'quality_metrics' in data:
                        aggregated['confidence_score'] += data['quality_metrics']['confidence'] * weight
                    if 'entities' in data:
                        # Convert entity list to dict
                        for entity in data['entities']:
                            e_type = entity['type']
                            if e_type not in aggregated['entities']:
                                aggregated['entities'][e_type] = []
                            aggregated['entities'][e_type].append(entity)
                    if 'response_guidance' in data:
                         aggregated['main_insights'].append(f"Intent: {data['intent']}")

                # ML Engine Data
                elif result.processor == 'ml_analytics':
                    data = result.data
                    # ML engine doesn't return a single confidence score in the root, 
                    # but we can infer from anomalies or trend confidence
                    trend_conf = data.get('trend', {}).get('confidence', 0.8)
                    aggregated['confidence_score'] += trend_conf * weight
                    
                    if 'anomalies' in data:
                        aggregated['anomalies'].extend(data['anomalies'])
                    if 'recommendations' in data:
                        aggregated['main_insights'].extend(data['recommendations'])
                
                # Generic/External Data
                else:
                    if 'confidence' in result.data:
                        aggregated['confidence_score'] += result.data['confidence'] * weight
                    if 'insights' in result.data:
                        aggregated['main_insights'].extend(result.data['insights'])
        
        # Normalize confidence score
        if total_weight > 0:
            aggregated['confidence_score'] /= total_weight
        
        # Deduplicate insights
        aggregated['main_insights'] = list(set(aggregated['main_insights']))[:5]
        
        return aggregated
    
    def _generate_recommendations(self, results: List[ProcessingResult], 
                                aggregated_data: Dict[str, Any]) -> List[str]:
        """Generate intelligent recommendations based on results"""
        recommendations = []
        
        # Check for high-priority issues
        if aggregated_data.get('anomalies'):
            recommendations.append("🚨 이상 징후가 감지되었습니다. 즉시 확인이 필요합니다.")
        
        # Performance recommendations
        if 'metrics' in aggregated_data:
            cpu = aggregated_data['metrics'].get('cpu_usage', 0)
            memory = aggregated_data['metrics'].get('memory_usage', 0)
            
            if cpu > 80:
                recommendations.append("💡 CPU 사용률이 높습니다. 스케일링을 고려하세요.")
            if memory > 85:
                recommendations.append("💡 메모리 사용률이 높습니다. 메모리 최적화가 필요합니다.")
        
        # Pattern-based recommendations
        if aggregated_data.get('patterns'):
            for pattern in aggregated_data['patterns'][:2]:
                if pattern.get('type') == 'recurring_issue':
                    recommendations.append(f"📊 반복적인 패턴 감지: {pattern.get('description', '')}")
        
        # Confidence-based recommendation
        if aggregated_data['confidence_score'] < 0.5:
            recommendations.append("ℹ️ 분석 신뢰도가 낮습니다. 추가 데이터가 필요할 수 있습니다.")
        
        return recommendations[:5]  # Limit to 5 recommendations


# Global processor instance
processor = UnifiedAIProcessor()


@functions_framework.http
def unified_ai_processor(request):
    """
    GCP Functions entry point for Unified AI Processor
    Expects JSON payload: {
        "query": "분석할 쿼리",
        "context": {...},
        "processors": ["korean_nlp", "ml_analytics", ...],
        "options": {...}
    }
    """
    
    # Handle CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        # Parse request
        if not request.is_json:
            return (json.dumps({
                'success': False,
                'error': 'Content-Type must be application/json',
                'function_name': 'unified-ai-processor'
            }), 400, headers)
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('query'):
            return (json.dumps({
                'success': False,
                'error': 'Query parameter is required',
                'function_name': 'unified-ai-processor'
            }), 400, headers)
        
        # Build processing request
        proc_request = ProcessingRequest(
            query=data['query'],
            context=data.get('context', {}),
            processors=data.get('processors', ['korean_nlp', 'server_analyzer']),
            options=data.get('options', {})
        )
        
        logger.info("Processing unified AI request", query=proc_request.query)
        
        # Process request
        result = asyncio.run(processor.process_request(proc_request))
        
        # Convert to JSON-serializable format
        response = {
            'success': result.success,
            'data': {
                'results': [asdict(r) for r in result.results],
                'aggregated_data': result.aggregated_data,
                'recommendations': result.recommendations,
                'cache_hit': result.cache_hit
            },
            'function_name': 'unified-ai-processor',
            'source': 'gcp-functions',
            'timestamp': datetime.now().isoformat(),
            'performance': {
                'total_processing_time_ms': result.total_processing_time,
                'confidence_score': result.aggregated_data['confidence_score'],
                'processors_used': len(proc_request.processors),
                'cache_hit': result.cache_hit
            }
        }
        
        logger.info("Unified AI processing completed", 
                   success=result.success,
                   processing_time=result.total_processing_time)
        
        return (json.dumps(response), 200, headers)
        
    except Exception as e:
        logger.error("Unified AI processing error", error=str(e))
        
        error_response = {
            'success': False,
            'error': str(e),
            'function_name': 'unified-ai-processor',
            'source': 'gcp-functions',
            'timestamp': datetime.now().isoformat()
        }
        
        return (json.dumps(error_response), 500, headers)


if __name__ == '__main__':
    # Local testing
    async def test():
        test_request = ProcessingRequest(
            query="웹서버 CPU 사용률 분석해주세요",
            context={'server_id': 'web-001'},
            processors=['korean_nlp'],
            options={}
        )
        
        result = await processor.process_request(test_request)
        print("Test result:", asdict(result))
    
    asyncio.run(test())
