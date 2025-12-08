"""
Rule Engine Module (Migrated from rule-engine/index.js)
Fast-path rule-based responses for common queries.
"""

import re
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class RuleMatch:
    """Result of rule matching"""
    matched: bool
    rule_id: str
    response: str
    confidence: float
    category: str
    match_type: str  # 'pattern', 'keyword', 'fuzzy', 'fallback'
    keywords: List[str]
    processing_time_ms: float


# Pattern-based rules (highest priority)
PATTERN_RULES: Dict[str, List[Dict[str, Any]]] = {
    # Server status rules
    'server': [
        {
            'pattern': r'서버\s*(상태|상황|정보)',
            'response': '서버 상태를 확인해보겠습니다. 현재 모든 서버가 정상 운영 중입니다.',
            'confidence': 0.9
        },
        {
            'pattern': r'(서버|시스템)\s*(다운|죽음|중지|멈춤)',
            'response': '서버 중지 상황을 점검하겠습니다. 즉시 복구 작업을 진행하겠습니다.',
            'confidence': 0.95
        },
        {
            'pattern': r'(서버|시스템)\s*(느림|지연|렉|버벅)',
            'response': '서버 성능 이슈를 확인하겠습니다. 성능 최적화 작업을 수행하겠습니다.',
            'confidence': 0.9
        },
        {
            'pattern': r'서버\s*(목록|리스트|전체)',
            'response': '등록된 서버 목록을 조회하겠습니다. 현재 관리 중인 서버 정보를 제공하겠습니다.',
            'confidence': 0.85
        },
        {
            'pattern': r'서버\s*(추가|등록|생성)',
            'response': '새로운 서버 등록을 도와드리겠습니다. 서버 정보를 입력해주세요.',
            'confidence': 0.8
        },
    ],

    # Monitoring rules
    'monitoring': [
        {
            'pattern': r'(모니터링|감시|추적)\s*(시작|활성화|켜기)',
            'response': '모니터링 시스템을 활성화하겠습니다. 실시간 모니터링을 시작합니다.',
            'confidence': 0.9
        },
        {
            'pattern': r'(모니터링|감시|추적)\s*(중지|비활성화|끄기)',
            'response': '모니터링 시스템을 비활성화하겠습니다. 모니터링을 중지합니다.',
            'confidence': 0.9
        },
        {
            'pattern': r'(CPU|메모리|디스크|네트워크)\s*(사용량|상태|정보)',
            'response': '시스템 리소스 사용량을 확인하겠습니다. 상세한 메트릭 정보를 제공하겠습니다.',
            'confidence': 0.85
        },
        {
            'pattern': r'(로그|에러|오류)\s*(확인|조회|검색)',
            'response': '로그 정보를 검색하겠습니다. 최근 에러 및 경고 메시지를 확인하겠습니다.',
            'confidence': 0.8
        },
    ],

    # Notification rules
    'notification': [
        {
            'pattern': r'(알림|경고|통지)\s*(설정|구성|변경)',
            'response': '알림 설정을 구성하겠습니다. 알림 조건과 대상을 지정해주세요.',
            'confidence': 0.85
        },
        {
            'pattern': r'(알림|경고|통지)\s*(목록|리스트|전체)',
            'response': '현재 알림 목록을 조회하겠습니다. 활성화된 알림 규칙을 확인하겠습니다.',
            'confidence': 0.8
        },
        {
            'pattern': r'(긴급|중요|즉시)\s*(알림|경고)',
            'response': '긴급 알림을 확인하겠습니다. 즉시 처리가 필요한 상황을 점검하겠습니다.',
            'confidence': 0.95
        },
    ],

    # FAQ rules
    'faq': [
        {
            'pattern': r'(안녕|반갑|안녕하세요|처음)',
            'response': '안녕하세요! OpenManager에 오신 것을 환영합니다. 무엇을 도와드릴까요?',
            'confidence': 0.9
        },
        {
            'pattern': r'(도움|도움말|헬프|사용법)',
            'response': '사용법을 안내해드리겠습니다. 서버 모니터링, 알림 설정, 로그 조회 등의 기능을 제공합니다.',
            'confidence': 0.85
        },
        {
            'pattern': r'(기능|할 수 있는|가능한)',
            'response': '주요 기능으로는 서버 모니터링, 실시간 알림, 로그 관리, 성능 분석 등이 있습니다.',
            'confidence': 0.8
        },
        {
            'pattern': r'(감사|고마워|고맙습니다|잘했어)',
            'response': '도움이 되어 기쁩니다! 추가로 궁금한 점이 있으시면 언제든 말씀해주세요.',
            'confidence': 0.9
        },
        {
            'pattern': r'(문제|오류|에러|안됨|실패)',
            'response': '문제 상황을 확인해보겠습니다. 어떤 문제가 발생했는지 자세히 알려주세요.',
            'confidence': 0.85
        },
    ],

    # System commands
    'commands': [
        {
            'pattern': r'^(시간|현재시간|지금몇시)',
            'response': None,  # Dynamic response
            'confidence': 0.95,
            'dynamic': 'current_time'
        },
        {
            'pattern': r'(날씨|기상|온도)',
            'response': '죄송합니다. 날씨 정보는 제공하지 않습니다. 서버 관리 관련 질문을 해주세요.',
            'confidence': 0.7
        },
        {
            'pattern': r'(재시작|리부팅|reboot)',
            'response': '시스템 재시작을 요청하셨습니다. 안전한 재시작을 위해 확인 절차를 진행하겠습니다.',
            'confidence': 0.9
        },
        {
            'pattern': r'(백업|복원|restore)',
            'response': '백업 및 복원 작업을 도와드리겠습니다. 어떤 데이터를 백업하시겠습니까?',
            'confidence': 0.85
        },
    ],
}

# Keyword-based rules (medium priority)
KEYWORD_RULES: Dict[str, Dict[str, Any]] = {
    '서버': {
        'response': '서버 관련 작업을 도와드리겠습니다. 구체적으로 어떤 도움이 필요하신가요?',
        'confidence': 0.6
    },
    '모니터링': {
        'response': '모니터링 시스템을 확인하겠습니다. 어떤 항목을 모니터링하시겠습니까?',
        'confidence': 0.6
    },
    '알림': {
        'response': '알림 시스템을 설정하겠습니다. 어떤 알림을 받으시겠습니까?',
        'confidence': 0.6
    },
    '로그': {
        'response': '로그 시스템을 확인하겠습니다. 어떤 로그를 조회하시겠습니까?',
        'confidence': 0.6
    },
    '성능': {
        'response': '시스템 성능을 분석하겠습니다. 어떤 부분의 성능이 궁금하신가요?',
        'confidence': 0.6
    },
    '에러': {
        'response': '에러 상황을 확인하겠습니다. 어떤 에러가 발생했는지 알려주세요.',
        'confidence': 0.6
    },
}

# Important terms for keyword extraction
IMPORTANT_TERMS = [
    '서버', '모니터링', '알림', '로그', '성능', '에러',
    '시스템', '상태', '확인', '설정', 'CPU', '메모리', '디스크'
]


def _get_current_time_response() -> str:
    """Generate current time response"""
    now = datetime.now()
    return f"현재 시간은 {now.strftime('%Y년 %m월 %d일 %H시 %M분')}입니다."


def _extract_keywords(query: str) -> List[str]:
    """Extract important keywords from query"""
    query_lower = query.lower()
    return [term for term in IMPORTANT_TERMS if term.lower() in query_lower]


def _match_patterns(query: str) -> Optional[Dict[str, Any]]:
    """Match query against pattern rules"""
    normalized_query = query.lower().strip()

    for category, rules in PATTERN_RULES.items():
        for rule in rules:
            if re.search(rule['pattern'], normalized_query, re.IGNORECASE):
                response = rule['response']

                # Handle dynamic responses
                if rule.get('dynamic') == 'current_time':
                    response = _get_current_time_response()

                return {
                    'matched': True,
                    'rule_id': f"{category}-pattern",
                    'response': response,
                    'confidence': rule['confidence'],
                    'category': category,
                    'match_type': 'pattern'
                }

    return None


def _match_keywords(query: str) -> Optional[Dict[str, Any]]:
    """Match query against keyword rules"""
    normalized_query = query.lower()

    for keyword, rule in KEYWORD_RULES.items():
        if keyword in normalized_query:
            return {
                'matched': True,
                'rule_id': f"keyword-{keyword}",
                'response': rule['response'],
                'confidence': rule['confidence'],
                'category': 'keyword',
                'match_type': 'keyword'
            }

    return None


def _fuzzy_match(query: str) -> Optional[Dict[str, Any]]:
    """Fuzzy matching as fallback"""
    common_phrases = [
        ('서버 상태', '서버 상태를 확인해보겠습니다.', 0.5),
        ('도움말', '사용법을 안내해드리겠습니다.', 0.5),
        ('모니터링', '모니터링 시스템을 확인하겠습니다.', 0.5),
        ('알림 설정', '알림 설정을 도와드리겠습니다.', 0.5),
    ]

    query_lower = query.lower()

    for phrase, response, confidence in common_phrases:
        if phrase in query_lower:
            return {
                'matched': True,
                'rule_id': f"fuzzy-{phrase}",
                'response': response,
                'confidence': confidence,
                'category': 'fuzzy',
                'match_type': 'fuzzy'
            }

    return None


class RuleEngine:
    """Rule-based query processing engine"""

    def __init__(self):
        self.total_queries = 0
        self.match_stats = {
            'pattern': 0,
            'keyword': 0,
            'fuzzy': 0,
            'fallback': 0
        }

    def process(self, query: str) -> RuleMatch:
        """Process query through rule engine"""
        start_time = time.time()
        self.total_queries += 1

        # 1. Pattern matching (highest priority)
        result = _match_patterns(query)
        if result:
            self.match_stats['pattern'] += 1
            return RuleMatch(
                matched=True,
                rule_id=result['rule_id'],
                response=result['response'],
                confidence=result['confidence'],
                category=result['category'],
                match_type='pattern',
                keywords=_extract_keywords(query),
                processing_time_ms=(time.time() - start_time) * 1000
            )

        # 2. Keyword matching (medium priority)
        result = _match_keywords(query)
        if result:
            self.match_stats['keyword'] += 1
            return RuleMatch(
                matched=True,
                rule_id=result['rule_id'],
                response=result['response'],
                confidence=result['confidence'],
                category=result['category'],
                match_type='keyword',
                keywords=_extract_keywords(query),
                processing_time_ms=(time.time() - start_time) * 1000
            )

        # 3. Fuzzy matching (low priority)
        result = _fuzzy_match(query)
        if result:
            self.match_stats['fuzzy'] += 1
            return RuleMatch(
                matched=True,
                rule_id=result['rule_id'],
                response=result['response'],
                confidence=result['confidence'],
                category=result['category'],
                match_type='fuzzy',
                keywords=_extract_keywords(query),
                processing_time_ms=(time.time() - start_time) * 1000
            )

        # 4. Fallback response
        self.match_stats['fallback'] += 1
        return RuleMatch(
            matched=False,
            rule_id='no-match',
            response='죄송합니다. 정확한 답변을 드리기 어렵습니다. 다른 방식으로 질문해주시거나 도움말을 요청해주세요.',
            confidence=0.2,
            category='fallback',
            match_type='fallback',
            keywords=_extract_keywords(query),
            processing_time_ms=(time.time() - start_time) * 1000
        )

    def get_stats(self) -> Dict[str, Any]:
        """Get engine statistics"""
        total_patterns = sum(len(rules) for rules in PATTERN_RULES.values())
        total_keywords = len(KEYWORD_RULES)

        return {
            'total_queries': self.total_queries,
            'match_stats': self.match_stats,
            'rule_counts': {
                'patterns': total_patterns,
                'keywords': total_keywords
            }
        }


# Singleton instance
_engine: Optional[RuleEngine] = None


def get_rule_engine() -> RuleEngine:
    """Get or create rule engine instance"""
    global _engine
    if _engine is None:
        _engine = RuleEngine()
    return _engine


def process_query(query: str) -> RuleMatch:
    """Convenience function to process a query"""
    engine = get_rule_engine()
    return engine.process(query)
