import { HumanMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';
import express from 'express';
import { createGraph } from './agent';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Main Agent Invocation Endpoint
app.post('/invoke', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`📨 Received request: ${query}`);

    // Initialize Graph
    const graph = createGraph();

    // Run Graph
    const result = await graph.invoke({
      messages: [new HumanMessage(query)],
    });

    // Extract last message
    const lastMessage = result.messages[result.messages.length - 1];

    res.json({
      success: true,
      reply: lastMessage.content,
      trace: result.messages,
    });
  } catch (error) {
    console.error('❌ Agent Error:', error);
    res.status(500).json({ error: 'Internal Agent Error' });
  }
});

// Health Check (for Cloud Run)
app.get('/', (req, res) => {
  res.send('OpenManager Agent Graph Service is Running 🚀');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
