
import asyncio
from modules.nlp_engine import EnhancedKoreanNLPEngine

async def test_mixed_nlp():
    engine = EnhancedKoreanNLPEngine()
    await engine.initialize()
    
    test_queries = [
        # Mixed Language
        "Server CPU usage가 갑자기 90%를 넘었습니다.",
        "Nginx process가 down 되었습니다.",
        "Error log 분석해줘",
        
        # Log-style
        "FATAL ERROR: Connection refused at 192.168.1.1",
        "WARN: Memory usage high (85%)"
    ]
    
    print("🚀 Mixed Language & Log Verification\n")
    
    for query in test_queries:
        result = await engine.analyze_query(query)
        print(f"Q: {query}")
        print(f"  -> Intent: {result.intent} (Confidence: {result.quality_metrics.confidence:.2f})")
        
        entities_str = [f"{e.value}({e.type})" for e in result.entities]
        print(f"  -> Entities: {entities_str}")
        print("-" * 30)

if __name__ == "__main__":
    asyncio.run(test_mixed_nlp())
