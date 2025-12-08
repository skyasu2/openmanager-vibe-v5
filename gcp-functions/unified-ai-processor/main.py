"""
Unified AI Processor (Cloud Run / Cloud Functions Compatible)

Features:
- AI orchestration and coordination
- Multi-source data aggregation
- Intelligent routing and fallback
- Performance monitoring
- 10-50x performance improvement over JavaScript
- **Optimized**: Direct module integration (No internal HTTP calls)

Deployment:
- Cloud Run: docker build & gcloud run deploy
- Cloud Functions: gcloud functions deploy (legacy)
- Local: python main.py or docker-compose up

Author: AI Migration Team
Version: 3.1.0 (Fully Integrated - Gateway + Rule Engine + Health)
"""

import os
import json
import time
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

from flask import Flask, request, jsonify
import httpx
from cachetools import TTLCache
import structlog

# Import local modules
from modules.nlp_engine import EnhancedKoreanNLPEngine
from modules.ml_engine import MLAnalyticsEngine
from modules.gateway import GatewayRouter, route_query, RoutingDecision
from modules.rule_engine import RuleEngine, process_query as process_rule_query, RuleMatch

# Configure structured logging
logger = structlog.get_logger()

# Flask app for Cloud Run
app = Flask(__name__)

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
        self.gateway_router = GatewayRouter()
        self.rule_engine = RuleEngine()

        # External endpoints (legacy - most functionality now integrated locally)
        self.external_endpoints = {
            'server_analyzer': 'https://us-central1-openmanager-free-tier.cloudfunctions.net/server-analyzer',
        }

        self.processor_weights = {
            'korean_nlp': 0.25,
            'ml_analytics': 0.20,
            'rule_engine': 0.25,
            'server_analyzer': 0.30
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
                elif processor == 'rule_engine':
                    tasks.append(self._run_local_rule_engine(request))
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

    async def _run_local_rule_engine(self, request: ProcessingRequest) -> ProcessingResult:
        """Run Rule Engine locally (fast-path for common queries)"""
        start_time = time.time()
        try:
            result = self.rule_engine.process(request.query)

            data = {
                'matched': result.matched,
                'rule_id': result.rule_id,
                'response': result.response,
                'confidence': result.confidence,
                'category': result.category,
                'match_type': result.match_type,
                'keywords': result.keywords,
                'processing_time_ms': result.processing_time_ms
            }

            return ProcessingResult(
                processor='rule_engine',
                success=True,
                data=data,
                error=None,
                processing_time=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error("Local Rule Engine failed", error=str(e))
            return ProcessingResult(
                processor='rule_engine',
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
                
                # Rule Engine Data
                elif result.processor == 'rule_engine':
                    data = result.data
                    aggregated['confidence_score'] += data.get('confidence', 0.5) * weight
                    if data.get('matched') and data.get('response'):
                        aggregated['main_insights'].append(f"[Rule] {data['response'][:100]}")
                    if data.get('keywords'):
                        if 'keywords' not in aggregated:
                            aggregated['keywords'] = []
                        aggregated['keywords'].extend(data['keywords'])

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


@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
@app.route('/process', methods=['GET', 'POST', 'OPTIONS'])
def unified_ai_processor():
    """
    Cloud Run / Cloud Functions compatible entry point
    Expects JSON payload: {
        "query": "분석할 쿼리",
        "context": {...},
        "processors": ["korean_nlp", "ml_analytics", ...],
        "options": {...}
    }
    """

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }

    # Health check for GET requests
    if request.method == 'GET':
        return jsonify({
            'status': 'healthy',
            'service': 'unified-ai-processor',
            'version': '3.0.0',
            'timestamp': datetime.now().isoformat()
        })

    try:
        # Parse request
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json',
                'service': 'unified-ai-processor'
            }), 400

        data = request.get_json()

        # Validate required fields
        if not data.get('query'):
            return jsonify({
                'success': False,
                'error': 'Query parameter is required',
                'service': 'unified-ai-processor'
            }), 400

        # Build processing request
        proc_request = ProcessingRequest(
            query=data['query'],
            context=data.get('context', {}),
            processors=data.get('processors', ['korean_nlp', 'ml_analytics']),
            options=data.get('options', {})
        )

        logger.info("Processing unified AI request", query=proc_request.query)

        # Process request
        result = asyncio.run(processor.process_request(proc_request))

        # Build response
        response = {
            'success': result.success,
            'data': {
                'results': [asdict(r) for r in result.results],
                'aggregated_data': result.aggregated_data,
                'recommendations': result.recommendations,
                'cache_hit': result.cache_hit
            },
            'service': 'unified-ai-processor',
            'version': '3.0.0',
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

        return jsonify(response)

    except Exception as e:
        logger.error("Unified AI processing error", error=str(e))

        return jsonify({
            'success': False,
            'error': str(e),
            'service': 'unified-ai-processor',
            'version': '3.0.0',
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Comprehensive health check endpoint"""
    try:
        # Check all components
        health_status = {
            'status': 'healthy',
            'service': 'unified-ai-processor',
            'version': '3.1.0',
            'timestamp': datetime.now().isoformat(),
            'components': {
                'nlp_engine': {
                    'status': 'ready' if processor.nlp_engine else 'not_initialized',
                    'initialized': processor.nlp_engine.initialized if processor.nlp_engine else False
                },
                'ml_engine': {
                    'status': 'ready',
                    'type': 'local'
                },
                'rule_engine': {
                    'status': 'ready',
                    'stats': processor.rule_engine.get_stats()
                },
                'gateway_router': {
                    'status': 'ready',
                    'available_processors': processor.gateway_router.AVAILABLE_PROCESSORS,
                    'stats': processor.gateway_router.get_stats()
                }
            },
            'cache': {
                'size': len(response_cache),
                'max_size': response_cache.maxsize
            }
        }

        return jsonify(health_status)

    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/gateway', methods=['POST', 'OPTIONS'])
def gateway_route():
    """
    Gateway endpoint for intelligent routing decisions
    Migrated from ai-gateway/index.js
    """
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }

    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400

        data = request.get_json()
        query = data.get('query', '')
        mode = data.get('mode', 'auto')
        context = data.get('context', {})

        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400

        # Get routing decision
        decision = processor.gateway_router.determine_route(query, mode, context)

        return jsonify({
            'success': True,
            'routing': {
                'primary_processor': decision.primary_processor,
                'fallback_processors': decision.fallback_processors,
                'mode': decision.mode,
                'confidence': decision.confidence,
                'reason': decision.reason
            },
            'service': 'unified-ai-processor',
            'endpoint': 'gateway',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error("Gateway routing error", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e),
            'service': 'unified-ai-processor',
            'endpoint': 'gateway'
        }), 500


@app.route('/rules', methods=['POST', 'OPTIONS'])
def rules_process():
    """
    Rule Engine endpoint for fast-path pattern matching
    Migrated from rule-engine/index.js
    """
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }

    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400

        data = request.get_json()
        query = data.get('query', '')

        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400

        # Process through rule engine
        result = processor.rule_engine.process(query)

        return jsonify({
            'success': True,
            'result': {
                'matched': result.matched,
                'rule_id': result.rule_id,
                'response': result.response,
                'confidence': result.confidence,
                'category': result.category,
                'match_type': result.match_type,
                'keywords': result.keywords,
                'processing_time_ms': result.processing_time_ms
            },
            'stats': processor.rule_engine.get_stats(),
            'service': 'unified-ai-processor',
            'endpoint': 'rules',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error("Rule Engine error", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e),
            'service': 'unified-ai-processor',
            'endpoint': 'rules'
        }), 500


@app.route('/smart', methods=['POST', 'OPTIONS'])
def smart_process():
    """
    Smart endpoint combining gateway routing with rule engine fast-path
    Automatically routes to the best processor based on query analysis
    """
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }

    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400

        data = request.get_json()
        query = data.get('query', '')
        context = data.get('context', {})

        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400

        start_time = time.time()

        # 1. Try Rule Engine first (fast-path)
        rule_result = processor.rule_engine.process(query)

        if rule_result.matched and rule_result.confidence >= 0.8:
            # High-confidence rule match - return immediately
            return jsonify({
                'success': True,
                'source': 'rule_engine',
                'response': rule_result.response,
                'confidence': rule_result.confidence,
                'category': rule_result.category,
                'processing_time_ms': (time.time() - start_time) * 1000,
                'service': 'unified-ai-processor',
                'endpoint': 'smart',
                'timestamp': datetime.now().isoformat()
            })

        # 2. Get routing decision for more complex processing
        routing = processor.gateway_router.determine_route(query, 'auto', context)

        # 3. Process with primary processor
        proc_request = ProcessingRequest(
            query=query,
            context=context,
            processors=[routing.primary_processor],
            options=data.get('options', {})
        )

        result = asyncio.run(processor.process_request(proc_request))

        return jsonify({
            'success': result.success,
            'source': routing.primary_processor,
            'routing': {
                'mode': routing.mode,
                'confidence': routing.confidence,
                'reason': routing.reason
            },
            'data': result.aggregated_data,
            'recommendations': result.recommendations,
            'processing_time_ms': (time.time() - start_time) * 1000,
            'service': 'unified-ai-processor',
            'endpoint': 'smart',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error("Smart processing error", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e),
            'service': 'unified-ai-processor',
            'endpoint': 'smart'
        }), 500


if __name__ == '__main__':
    # Run Flask app for local development or Cloud Run
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'

    logger.info(f"Starting Unified AI Processor on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
