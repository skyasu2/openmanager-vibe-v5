from flask import Flask, request, jsonify
import time
from datetime import datetime

app = Flask(__name__)

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "mock-ai-server", "mode": "mock"})

@app.route('/process', methods=['POST'])
def process():
    """
    Mock endpoint for unified-ai-processor
    """
    data = request.get_json() or {}
    query = data.get('query', 'No query')
    
    # Simulate processing delay
    time.sleep(0.5)
    
    return jsonify({
        "success": True,
        "service": "mock-ai-server",
        "version": "1.0.0 (Mock)",
        "timestamp": datetime.now().isoformat(),
        "data": {
            "results": [
                {
                    "processor": "mock_engine",
                    "success": True,
                    "data": {
                        "intent": "mock_response",
                        "response": f"This is a MOCK response for query: {query}",
                        "entities": []
                    }
                }
            ],
            "aggregated_data": {
                "main_insights": [
                    "This is a simulated insight from Mock AI.",
                    "System performance is normal (Simulated)."
                ],
                "confidence_score": 0.99
            },
            "recommendations": [
                "Mock Recommendation 1",
                "Mock Recommendation 2"
            ]
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
