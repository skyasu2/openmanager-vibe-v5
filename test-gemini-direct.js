// Minimal Gemini API test
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY_PRIMARY || 'AIzaSyCNKnp27rXOHvYwRyfUISeK4dOzajFFuRg';

async function test() {
  console.log('🧪 Testing Gemini API directly...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    console.log('✅ Client initialized');
    
    const result = await model.generateContent('Say hello in one word');
    const response = result.response;
    const text = response.text();
    
    console.log('✅ Response:', text);
    console.log('🎉 Test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

test();
