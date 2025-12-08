"""
Gateway Module (Migrated from ai-gateway/index.js)
Intelligent routing based on query content and mode.
"""

import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class RoutingDecision:
    """Result of gateway routing decision"""
    primary_processor: str
    fallback_processors: List[str]
    mode: str
    confidence: float
    reason: str


def is_korean(text: str) -> bool:
    """Check if text contains Korean characters"""
    korean_pattern = re.compile(r'[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]')
    return bool(korean_pattern.search(text))


def detect_query_complexity(query: str) -> str:
    """Detect query complexity level"""
    # Complex indicators
    complex_keywords = ['분석', '예측', 'analyze', 'predict', '추세', 'trend', '패턴', 'pattern']
    simple_keywords = ['상태', 'status', '확인', 'check', '보여줘', 'show']

    query_lower = query.lower()

    # Check length
    if len(query) > 100:
        return 'complex'

    # Check keywords
    if any(kw in query_lower for kw in complex_keywords):
        return 'complex'

    if len(query) < 50 and any(kw in query_lower for kw in simple_keywords):
        return 'simple'

    return 'medium'


def needs_server_context(query: str) -> bool:
    """Check if query needs server/system context"""
    context_keywords = ['서버', '시스템', '상태', '모니터링', 'server', 'system', 'status', 'monitoring']
    query_lower = query.lower()
    return any(kw in query_lower for kw in context_keywords)


class GatewayRouter:
    """Intelligent gateway router for AI processors"""

    # Available processors in unified-ai-processor
    AVAILABLE_PROCESSORS = ['korean_nlp', 'ml_analytics', 'rule_engine']

    # Mode to processor mapping
    MODE_MAPPING = {
        'korean': ['korean_nlp', 'rule_engine', 'ml_analytics'],
        'rule': ['rule_engine', 'korean_nlp', 'ml_analytics'],
        'ml': ['ml_analytics', 'korean_nlp', 'rule_engine'],
        'unified': ['korean_nlp', 'ml_analytics', 'rule_engine'],
    }

    def __init__(self):
        self.request_count = 0
        self.mode_stats = {}

    def determine_route(self, query: str, mode: str = 'auto', context: Optional[Dict] = None) -> RoutingDecision:
        """Determine optimal processing route for a query"""
        self.request_count += 1

        # Handle explicit mode
        if mode in self.MODE_MAPPING:
            processors = self.MODE_MAPPING[mode]
            return RoutingDecision(
                primary_processor=processors[0],
                fallback_processors=processors[1:],
                mode=mode,
                confidence=0.95,
                reason=f"Explicit mode: {mode}"
            )

        # Auto mode - intelligent routing
        is_korean_query = is_korean(query)
        complexity = detect_query_complexity(query)
        needs_context = needs_server_context(query)

        # Decision logic
        if is_korean_query and complexity == 'simple':
            # Simple Korean query -> Rule Engine first (fast path)
            return RoutingDecision(
                primary_processor='rule_engine',
                fallback_processors=['korean_nlp', 'ml_analytics'],
                mode='auto_rule',
                confidence=0.85,
                reason="Simple Korean query - using rule engine for fast response"
            )

        elif is_korean_query:
            # Complex Korean query -> NLP first
            return RoutingDecision(
                primary_processor='korean_nlp',
                fallback_processors=['rule_engine', 'ml_analytics'],
                mode='auto_nlp',
                confidence=0.80,
                reason="Korean query detected - using NLP engine"
            )

        elif complexity == 'complex' or needs_context:
            # Complex query or needs server context -> ML Analytics
            return RoutingDecision(
                primary_processor='ml_analytics',
                fallback_processors=['korean_nlp', 'rule_engine'],
                mode='auto_ml',
                confidence=0.75,
                reason="Complex query or server context needed - using ML analytics"
            )

        else:
            # Default: Rule engine for fast response
            return RoutingDecision(
                primary_processor='rule_engine',
                fallback_processors=['ml_analytics', 'korean_nlp'],
                mode='auto_default',
                confidence=0.70,
                reason="Default routing - rule engine first"
            )

    def get_processors_for_route(self, decision: RoutingDecision) -> List[str]:
        """Get list of processors to use based on routing decision"""
        all_processors = [decision.primary_processor] + decision.fallback_processors
        return [p for p in all_processors if p in self.AVAILABLE_PROCESSORS]

    def get_stats(self) -> Dict[str, Any]:
        """Get gateway statistics"""
        return {
            'total_requests': self.request_count,
            'mode_stats': self.mode_stats,
            'available_processors': self.AVAILABLE_PROCESSORS
        }


# Singleton instance
_router: Optional[GatewayRouter] = None


def get_router() -> GatewayRouter:
    """Get or create gateway router instance"""
    global _router
    if _router is None:
        _router = GatewayRouter()
    return _router


def route_query(query: str, mode: str = 'auto', context: Optional[Dict] = None) -> RoutingDecision:
    """Convenience function to route a query"""
    router = get_router()
    return router.determine_route(query, mode, context)
