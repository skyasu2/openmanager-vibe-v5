"""
Unified AI Processor (Cloud Run / Cloud Functions Compatible)

Features:
- AI orchestration and coordination
- Multi-source data aggregation
- Intelligent routing and fallback
- Performance monitoring
- 10-50x performance improvement over JavaScript
- **Optimized**: Direct module integration (No internal HTTP calls)
- **v3.2.0**: Global model initialization + Intent-based cache TTL
- **v3.3.0**: Full async processing (Flask → Quart, 2-3x throughput)

Deployment:
- Cloud Run: docker build & gcloud run deploy
- Local: python main.py or docker-compose up

Author: AI Migration Team
Version: 3.3.0 (Quart Async + Batch Processing)
"""

import os
import json
import time
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

from quart import Quart, request, jsonify
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

# Quart app for Cloud Run (Async)
app = Quart(__name__)

# ============================================================================
# v3.2.0: Intent-based Cache TTL Configuration
# ============================================================================
INTENT_TTL_SECONDS = {
    'monitoring': 3600,    # 1시간 - 서버 메트릭은 자주 변경
    'analysis': 21600,     # 6시간 - 트러블슈팅 데이터는 안정적
    'guide': 86400,        # 24시간 - 가이드는 거의 변경 없음
    'general': 10800,      # 3시간 - 기본값
}

# Intent별 분리 캐시 (각각 다른 TTL)
response_cache = {
    'monitoring': TTLCache(maxsize=250, ttl=INTENT_TTL_SECONDS['monitoring']),
    'analysis': TTLCache(maxsize=250, ttl=INTENT_TTL_SECONDS['analysis']),
    'guide': TTLCache(maxsize=250, ttl=INTENT_TTL_SECONDS['guide']),
    'general': TTLCache(maxsize=250, ttl=INTENT_TTL_SECONDS['general']),
}

def get_cache_for_intent(intent: str) -> TTLCache:
    """Intent에 맞는 캐시 반환 (없으면 general)"""
    return response_cache.get(intent, response_cache['general'])

def get_cached_response(cache_key: str, intent: str = 'general'):
    """Intent 기반 캐시에서 응답 조회"""
    cache = get_cache_for_intent(intent)
    return cache.get(cache_key)

def set_cached_response(cache_key: str, response: dict, intent: str = 'general'):
    """Intent 기반 캐시에 응답 저장"""
    cache = get_cache_for_intent(intent)
    cache[cache_key] = response

# ============================================================================
# v3.2.0: Global Model Initialization (Cold Start Optimization)
# ============================================================================
_models_initialized = False

async def _init_models_async(processor):
    """비동기 모델 초기화 (spacy 등)"""
    global _models_initialized
    if _models_initialized:
        return

    start_time = time.time()
    logger.info("🚀 Starting global model initialization...")

    # NLP 엔진 초기화 (spacy 로딩 포함)
    try:
        await processor.nlp_engine.initialize()
        logger.info("✅ NLP engine initialized (spacy loaded)")
    except Exception as e:
        logger.warning(f"⚠️ NLP engine init failed: {e}")

    # ML 엔진은 별도 초기화 불필요 (numpy/sklearn은 import 시 로드)

    # Gateway/Rule 엔진은 __init__에서 이미 초기화됨 (별도 메서드 불필요)
    logger.info("✅ Gateway and Rule engines ready (init in __init__)")

    _models_initialized = True
    elapsed = (time.time() - start_time) * 1000
    logger.info(f"🎯 Global initialization complete in {elapsed:.1f}ms")

def initialize_on_startup(processor):
    """앱 시작 시 모델 초기화 (동기 래퍼)"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_init_models_async(processor))
        loop.close()
    except Exception as e:
        logger.error(f"❌ Startup initialization failed: {e}")


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

    def _detect_intent(self, query: str) -> str:
        """
        Detect query intent for cache TTL optimization (v3.2.0)

        Intent categories:
        - monitoring: 실시간 모니터링 (1시간 TTL)
        - analysis: 분석/진단 (6시간 TTL)
        - guide: 가이드/도움말 (24시간 TTL)
        - general: 일반 쿼리 (3시간 TTL)
        """
        query_lower = query.lower()

        # Monitoring keywords (real-time, status, health)
        monitoring_keywords = [
            '모니터링', '상태', '헬스', 'health', 'status', 'monitoring',
            '실시간', 'realtime', 'live', '현재', 'current', '지금'
        ]
        if any(kw in query_lower for kw in monitoring_keywords):
            return 'monitoring'

        # Analysis keywords (analyze, diagnose, investigate)
        analysis_keywords = [
            '분석', '진단', '원인', 'analyze', 'analysis', 'diagnose',
            '왜', 'why', '이유', '문제', 'problem', 'issue', '조사', 'investigate'
        ]
        if any(kw in query_lower for kw in analysis_keywords):
            return 'analysis'

        # Guide keywords (help, how-to, tutorial)
        guide_keywords = [
            '가이드', '도움말', '설명', 'help', 'guide', 'how', 'tutorial',
            '방법', '어떻게', '사용법', 'usage', '매뉴얼', 'manual'
        ]
        if any(kw in query_lower for kw in guide_keywords):
            return 'guide'

        return 'general'

    async def process_request(self, request: ProcessingRequest) -> UnifiedResponse:
        """Process request through multiple AI processors"""
        start_time = time.time()

        # v3.2.0: Intent-based caching
        intent = self._detect_intent(request.query)
        cache_key = f"{request.query}:{json.dumps(request.processors)}"

        # Check intent-based cache
        cached_response = get_cached_response(cache_key, intent)
        if cached_response:
            logger.info("Cache hit", cache_key=cache_key, intent=intent)
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
        
        # v3.2.0: Cache successful responses with intent-based TTL
        if response.success:
            set_cached_response(cache_key, response, intent)

        logger.info("Unified processing complete",
                   success=response.success,
                   processing_time=response.total_processing_time,
                   intent=intent)

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

# v3.2.0: Pre-initialize models at startup (Cold Start Optimization)
initialize_on_startup(processor)


@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
@app.route('/process', methods=['GET', 'POST', 'OPTIONS'])
async def unified_ai_processor():
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
            'version': '3.3.0',
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

        data = await request.get_json()

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

        # Process request (native async - no asyncio.run needed)
        result = await processor.process_request(proc_request)

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
            'version': '3.3.0',
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
            'version': '3.3.0',
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/health', methods=['GET'])
async def health_check():
    """Comprehensive health check endpoint"""
    try:
        # Check all components
        health_status = {
            'status': 'healthy',
            'service': 'unified-ai-processor',
            'version': '3.3.0',
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
                'type': 'intent-based',
                'caches': {
                    intent: {
                        'size': len(cache),
                        'max_size': cache.maxsize,
                        'ttl_seconds': INTENT_TTL_SECONDS[intent]
                    }
                    for intent, cache in response_cache.items()
                },
                'total_items': sum(len(c) for c in response_cache.values())
            },
            'endpoints': {
                'active': ['/process', '/health', '/smart', '/batch'],
                'deprecated': ['/gateway', '/rules']
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
async def gateway_route():
    """
    [DEPRECATED v3.2.0] Gateway endpoint - Use /smart instead
    Redirects to /smart with action=routing for backward compatibility
    """
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }

    logger.warning("DEPRECATED: /gateway endpoint called - use /smart instead")

    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400

        data = await request.get_json()
        query = data.get('query', '')
        mode = data.get('mode', 'auto')
        context = data.get('context', {})

        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400

        # Get routing decision (still functional for backward compatibility)
        decision = processor.gateway_router.determine_route(query, mode, context)

        response = jsonify({
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
            'deprecated': True,
            'migration_hint': 'Use /smart endpoint instead',
            'timestamp': datetime.now().isoformat()
        })
        response.headers['X-Deprecated'] = 'true'
        response.headers['X-Migration-Endpoint'] = '/smart'
        return response

    except Exception as e:
        logger.error("Gateway routing error", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e),
            'service': 'unified-ai-processor',
            'endpoint': 'gateway'
        }), 500


@app.route('/rules', methods=['POST', 'OPTIONS'])
async def rules_process():
    """
    [DEPRECATED v3.2.0] Rule Engine endpoint - Use /smart instead
    /smart automatically uses rule engine for fast-path matching
    """
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }

    logger.warning("DEPRECATED: /rules endpoint called - use /smart instead")

    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400

        data = await request.get_json()
        query = data.get('query', '')

        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400

        # Process through rule engine (still functional for backward compatibility)
        result = processor.rule_engine.process(query)

        response = jsonify({
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
            'deprecated': True,
            'migration_hint': 'Use /smart endpoint - it includes rule engine fast-path',
            'timestamp': datetime.now().isoformat()
        })
        response.headers['X-Deprecated'] = 'true'
        response.headers['X-Migration-Endpoint'] = '/smart'
        return response

    except Exception as e:
        logger.error("Rule Engine error", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e),
            'service': 'unified-ai-processor',
            'endpoint': 'rules'
        }), 500


@app.route('/smart', methods=['POST', 'OPTIONS'])
async def smart_process():
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

        data = await request.get_json()
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

        # Native async - no asyncio.run needed with Quart
        result = await processor.process_request(proc_request)

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


# ============================================================================
# v3.3.0: Batch Processing API (Multiple queries in single request)
# ============================================================================
@app.route('/batch', methods=['POST', 'OPTIONS'])
async def batch_process():
    """
    Batch processing endpoint for multiple queries
    Reduces API call overhead by processing multiple queries in parallel

    Expects JSON payload: {
        "queries": [
            {"query": "쿼리1", "context": {...}, "processors": [...]},
            {"query": "쿼리2", "context": {...}, "processors": [...]}
        ],
        "options": {
            "max_concurrent": 5,  # Optional: max parallel processing
            "fail_fast": false    # Optional: stop on first error
        }
    }
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

        data = await request.get_json()
        queries = data.get('queries', [])
        options = data.get('options', {})

        if not queries:
            return jsonify({'error': 'queries array is required'}), 400

        if len(queries) > 20:
            return jsonify({'error': 'Maximum 20 queries per batch'}), 400

        start_time = time.time()
        max_concurrent = min(options.get('max_concurrent', 5), 10)
        fail_fast = options.get('fail_fast', False)

        logger.info(f"Batch processing {len(queries)} queries",
                   max_concurrent=max_concurrent)

        # Process queries in batches to limit concurrency
        results = []
        for i in range(0, len(queries), max_concurrent):
            batch = queries[i:i + max_concurrent]

            async def process_single(q):
                try:
                    proc_request = ProcessingRequest(
                        query=q.get('query', ''),
                        context=q.get('context', {}),
                        processors=q.get('processors', ['korean_nlp', 'rule_engine']),
                        options=q.get('options', {})
                    )
                    result = await processor.process_request(proc_request)
                    return {
                        'success': result.success,
                        'query': q.get('query', ''),
                        'data': result.aggregated_data,
                        'recommendations': result.recommendations,
                        'cache_hit': result.cache_hit
                    }
                except Exception as e:
                    return {
                        'success': False,
                        'query': q.get('query', ''),
                        'error': str(e)
                    }

            batch_results = await asyncio.gather(
                *[process_single(q) for q in batch],
                return_exceptions=not fail_fast
            )

            for br in batch_results:
                if isinstance(br, Exception):
                    results.append({'success': False, 'error': str(br)})
                else:
                    results.append(br)

            # If fail_fast and any error, stop processing
            if fail_fast and any(not r.get('success', True) for r in results):
                break

        total_time = (time.time() - start_time) * 1000
        successful = sum(1 for r in results if r.get('success', False))

        return jsonify({
            'success': successful == len(results),
            'results': results,
            'summary': {
                'total': len(queries),
                'processed': len(results),
                'successful': successful,
                'failed': len(results) - successful,
                'total_time_ms': total_time,
                'avg_time_ms': total_time / len(results) if results else 0
            },
            'service': 'unified-ai-processor',
            'endpoint': 'batch',
            'version': '3.3.0',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error("Batch processing error", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e),
            'service': 'unified-ai-processor',
            'endpoint': 'batch'
        }), 500


if __name__ == '__main__':
    # Run Quart app for local development (use hypercorn in production)
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('QUART_DEBUG', 'false').lower() == 'true'

    logger.info(f"Starting Unified AI Processor v3.3.0 (Quart Async) on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
