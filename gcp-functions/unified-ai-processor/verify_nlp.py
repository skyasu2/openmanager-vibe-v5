
import asyncio
from modules.nlp_engine import EnhancedKoreanNLPEngine

async def test_nlp():
    engine = EnhancedKoreanNLPEngine()
    await engine.initialize()
    
    test_queries = [
        "서버 상태 확인해줘",
        "Check server status",
        "Why is the server slow?",
        "Show me CPU usage",
        "Hello",
        "안녕"
    ]
    
    print("🚀 NLP Engine Verification (Korean + English)\n")
    
    for query in test_queries:
        result = await engine.analyze_query(query)
        print(f"Q: {query}")
        print(f"  -> Intent: {result.intent} (Confidence: {result.quality_metrics.confidence:.2f})")
        if result.entities:
            print(f"  -> Entities: {[e.value for e in result.entities]}")
        print("-" * 30)

if __name__ == "__main__":
    asyncio.run(test_nlp())
