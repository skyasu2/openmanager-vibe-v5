const { GoogleGenerativeAI } = require('@google/generative-ai');
const API_KEY = 'AIzaSyCNKnp27rXOHvYwRyfUISeK4dOzajFFuRg';

async function test() {
  console.log('🧪 Testing gemini-2.5-flash-lite...');
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent('Say hello');
    console.log('✅ Response:', result.response.text());
  } catch (error) {
    console.error('❌ Error:', error.message.substring(0, 200));
  }
}
test();
