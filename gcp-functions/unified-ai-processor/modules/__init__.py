# modules/__init__.py
"""
Unified AI Processor - Local Modules
Imports NLP and ML engines for direct integration (no HTTP calls)
"""

from .nlp_engine import EnhancedKoreanNLPEngine
from .ml_engine import MLAnalyticsEngine

__all__ = ['EnhancedKoreanNLPEngine', 'MLAnalyticsEngine']
