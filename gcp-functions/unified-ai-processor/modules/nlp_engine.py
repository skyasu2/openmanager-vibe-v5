"""
NLP Engine Module (Extracted from enhanced-korean-nlp)
For use by Unified AI Processor - No internal HTTP calls
"""

import time
import numpy as np
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.calibration import CalibratedClassifierCV
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import spacy


@dataclass
class Entity:
    type: str
    value: str
    confidence: float
    normalized: str


@dataclass
class SemanticAnalysis:
    main_topic: str
    sub_topics: List[str]
    urgency_level: str
    technical_complexity: float


@dataclass
class ServerContext:
    target_servers: List[str]
    metrics: List[str]
    time_range: Optional[Dict[str, str]] = None
    comparison_type: Optional[str] = None


@dataclass
class ResponseGuidance:
    response_type: str
    detail_level: str
    visualization_suggestions: List[str]
    follow_up_questions: List[str]


@dataclass
class QualityMetrics:
    confidence: float
    processing_time: float
    analysis_depth: float
    context_relevance: float


@dataclass
class EnhancedKoreanAnalysis:
    intent: str
    entities: List[Entity]
    semantic_analysis: SemanticAnalysis
    server_context: ServerContext
    response_guidance: ResponseGuidance
    quality_metrics: QualityMetrics


class HybridIntentClassifier:
    """Hybrid Classifier combining Rule-based patterns with ML (TF-IDF + LR)"""

    def __init__(self):
        self.pipeline = None
        self.is_trained = False
        self.confidence_threshold = 0.6

        self.training_data = [
            ("서버 상태 확인해줘", "inquiry"),
            ("현재 CPU 사용량 알려줘", "inquiry"),
            ("웹서버가 죽었어", "troubleshooting"),
            ("에러 로그 분석해줘", "troubleshooting"),
            ("왜 이렇게 느리지?", "troubleshooting"),
            ("메모리 누수 원인 찾아줘", "analysis"),
            ("트래픽 패턴 분석해", "analysis"),
            ("성능 최적화 방법 알려줘", "optimization"),
            ("비용 절감 방안 제안해줘", "optimization"),
            ("디스크 용량 늘려야 할까?", "optimization"),
            ("안녕", "general"),
            ("반가워", "general"),
            ("도움말 보여줘", "general"),
            # English Data
            ("check server status", "inquiry"),
            ("show me cpu usage", "inquiry"),
            ("server is down", "troubleshooting"),
            ("analyze error logs", "troubleshooting"),
            ("why is it so slow?", "troubleshooting"),
            ("find memory leak cause", "analysis"),
            ("analyze traffic patterns", "analysis"),
            ("how to optimize performance", "optimization"),
            ("suggest cost saving", "optimization"),
            ("increase disk space?", "optimization"),
            ("hello", "general"),
            ("hi", "general"),
            ("help", "general")
        ]

    def train(self):
        """Train the lightweight model in-memory"""
        if self.is_trained:
            return

        X = [text for text, label in self.training_data]
        y = [label for text, label in self.training_data]

        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
            ('clf', LogisticRegression(random_state=42, C=10.0))
        ])

        self.pipeline.fit(X, y)
        self.is_trained = True

    def predict(self, text: str) -> Dict[str, Any]:
        """Predict intent with probabilities"""
        if not self.is_trained:
            self.train()

        # 1. Rule-based Check (Fast Path)
        rule_intent = self._check_rules(text)
        if rule_intent:
            return {"intent": rule_intent, "confidence": 0.95, "source": "rule"}

        # 2. ML Prediction (Fallback)
        try:
            probas = self.pipeline.predict_proba([text])[0]
            max_idx = np.argmax(probas)
            intent = self.pipeline.classes_[max_idx]
            confidence = probas[max_idx]

            if confidence < self.confidence_threshold:
                return {"intent": "general", "confidence": confidence, "source": "ml_low_confidence"}

            return {"intent": intent, "confidence": float(confidence), "source": "ml"}

        except Exception as e:
            return {"intent": "general", "confidence": 0.0, "source": "fallback"}

    def _check_rules(self, text: str) -> Optional[str]:
        rules = {
            'troubleshooting': ['에러', '오류', '장애', '다운', '죽었어', '안돼'],
            'optimization': ['최적화', '개선', '튜닝', '빠르게'],
            'analysis': ['분석', '원인', '이유', '패턴'],
            'inquiry': ['확인', '조회', '보여줘', '알려줘', '상태']
        }
        
        # English Rules
        english_rules = {
            'troubleshooting': ['error', 'fail', 'down', 'crash', 'dead', 'slow'],
            'optimization': ['optimize', 'improve', 'tune', 'fast'],
            'analysis': ['analyze', 'cause', 'reason', 'pattern', 'why'],
            'inquiry': ['check', 'show', 'status', 'usage', 'health'],
            'log_analysis': ['log', 'trace', 'dump', 'fatal', 'exception', 'stacktrace']
        }
        
        # Check Korean Rules
        for intent, keywords in rules.items():
            if any(k in text for k in keywords):
                return intent
                
        # Check English Rules (Case-insensitive)
        text_lower = text.lower()
        for intent, keywords in english_rules.items():
            if any(k in text_lower for k in keywords):
                return intent
                
        return None


class EnhancedKoreanNLPEngine:
    """High-performance Korean NLP Engine"""

    def __init__(self):
        self.initialized = False
        self.classifier = HybridIntentClassifier()
        self.domain_vocabulary = self._load_vocabulary()
        self.korean_patterns = self._load_patterns()
        self.nlp = None

    def _load_vocabulary(self):
        return {
            'servers': {
                'web_server': ['nginx', 'apache', 'iis', '웹서버'],
                'api_server': ['nodejs', 'express', 'API서버'],
                'database': ['mysql', 'postgresql', 'mongodb', 'redis', 'DB', '데이터베이스']
            },
            'metrics': {
                'CPU': ['cpu', '프로세서', '사용률'],
                'memory': ['메모리', '램', 'ram'],
                'disk': ['디스크', '용량', '저장소'],
                'network': ['네트워크', '트래픽', '대역폭']
            }
        }

    def _load_patterns(self):
        return {
            'server_names': r'([a-zA-Z0-9가-힣-]+서버|[a-zA-Z0-9가-힣-]+-\d+)',
            'time_expressions': [(r'(\d+)시간', 'hour'), (r'(\d+)분', 'minute')],
            'log_patterns': {
                'ip_address': r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
                'error_code': r'\b(500|404|403|502|503)\b',
                'severity': r'\b(FATAL|ERROR|WARN|INFO|DEBUG)\b'
            }
        }

    async def initialize(self):
        if self.initialized:
            return
        self.classifier.train()
        
        # Load English Model
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback if model requires download (for local dev)
            from spacy.cli import download
            download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")
            
        self.initialized = True

    async def analyze_query(self, query: str, context: Optional[Dict] = None) -> EnhancedKoreanAnalysis:
        await self.initialize()
        start_time = time.time()

        ml_result = self.classifier.predict(query)
        intent = ml_result['intent']
        entities = self._extract_entities(query)
        semantic_analysis = self._perform_semantic_analysis(query, intent)
        context_analysis = self._perform_context_analysis(query)
        response_guidance = self._generate_response_guidance(intent, semantic_analysis, context_analysis)

        quality_metrics = QualityMetrics(
            confidence=ml_result['confidence'],
            processing_time=(time.time() - start_time) * 1000,
            analysis_depth=0.8,
            context_relevance=0.9
        )

        return EnhancedKoreanAnalysis(
            intent=intent,
            entities=entities,
            semantic_analysis=semantic_analysis,
            server_context=context_analysis,
            response_guidance=response_guidance,
            quality_metrics=quality_metrics
        )

    def _extract_entities(self, query: str) -> List[Entity]:
        entities = []
        for category, types in self.domain_vocabulary.items():
            for type_name, keywords in types.items():
                if any(k in query.lower() for k in keywords):
                    entities.append(Entity(category[:-1], type_name, 0.9, type_name))
                if any(k in query.lower() for k in keywords):
                    entities.append(Entity(category[:-1], type_name, 0.9, type_name))
        
        # 0. Log Pattern Matching (Priority)
        import re
        for p_type, pattern in self.korean_patterns.get('log_patterns', {}).items():
            matches = re.finditer(pattern, query)
            for m in matches:
                 entities.append(Entity("log_pattern", p_type, 1.0, m.group()))
        
        # Helper for English NLP using spaCy
        if self.nlp:
            doc = self.nlp(query)
            
            # 1. Named Entities (NER)
            for ent in doc.ents:
                # Map spaCy labels to our domain
                e_type = "unknown"
                if ent.label_ in ["ORG", "PRODUCT"]:
                    e_type = "server_component"
                elif ent.label_ in ["PERCENT", "QUANTITY"]:
                    e_type = "metric_value"
                elif ent.label_ == "DATE":
                    e_type = "time_range"
                
                if not any(e.value == ent.text for e in entities):
                    entities.append(Entity("english_ner", e_type, 0.85, ent.text))
            
            # 2. Noun Chunks (better than TextBlob)
            for chunk in doc.noun_chunks:
                if not any(e.value == chunk.text for e in entities):
                    entities.append(Entity("english_phrase", "noun_chunk", 0.75, chunk.text))
            
        return entities

    def _perform_semantic_analysis(self, query: str, intent: str) -> SemanticAnalysis:
        return SemanticAnalysis(
            main_topic="Server Monitoring",
            sub_topics=["Performance"],
            urgency_level="high" if intent == "troubleshooting" else "low",
            technical_complexity=0.5
        )

    def _perform_context_analysis(self, query: str) -> ServerContext:
        return ServerContext(
            target_servers=[],
            metrics=["cpu"] if "cpu" in query.lower() else [],
            time_range=None,
            comparison_type=None
        )

    def _generate_response_guidance(self, intent: str, semantic: SemanticAnalysis, context: ServerContext) -> ResponseGuidance:
        return ResponseGuidance(
            response_type="analytical" if intent == "analysis" else "informational",
            detail_level="detailed",
            visualization_suggestions=["Line Chart"] if "cpu" in str(context.metrics) else [],
            follow_up_questions=["더 자세한 로그를 보시겠습니까?"]
        )
