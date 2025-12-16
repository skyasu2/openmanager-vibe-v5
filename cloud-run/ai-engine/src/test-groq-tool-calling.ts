/**
 * Groq Tool Calling Test Script
 *
 * Purpose: Test if llama-3.3-70b-versatile with ChatGroq supports
 * standard OpenAI-compatible tool calls for LangGraph supervisor.
 *
 * Run: npx tsx src/test-groq-tool-calling.ts
 */

import { tool } from '@langchain/core/tools';
import { ChatGroq } from '@langchain/groq';
import { z } from 'zod';

// Simple test tool
const testTransferTool = tool(
  async ({ targetAgent }) => {
    return `Successfully transferred to ${targetAgent}`;
  },
  {
    name: 'transfer_to_agent',
    description: 'Transfer the conversation to a specific agent',
    schema: z.object({
      targetAgent: z
        .enum(['nlq_agent', 'analyst_agent', 'reporter_agent'])
        .describe('The agent to transfer to'),
    }),
  }
);

async function testGroqToolCalling() {
  console.log('🧪 Testing Groq Tool Calling with llama-3.3-70b-versatile\n');

  const groqModel = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
  });

  // Test 1: Direct tool binding
  console.log('📋 Test 1: Direct bindTools()');
  try {
    const modelWithTools = groqModel.bindTools([testTransferTool], {
      tool_choice: 'auto',
    });

    const result1 = await modelWithTools.invoke([
      {
        role: 'system',
        content: `You are a routing supervisor. When the user asks about server status,
        use the transfer_to_agent tool to route to nlq_agent.`,
      },
      {
        role: 'user',
        content: '서버 상태 확인해줘',
      },
    ]);

    console.log('✅ Response received');
    console.log(
      '   Content:',
      typeof result1.content === 'string'
        ? result1.content.slice(0, 100) + '...'
        : JSON.stringify(result1.content).slice(0, 100)
    );
    console.log('   Tool Calls:', JSON.stringify(result1.tool_calls, null, 2));
    console.log(
      '   Additional kwargs:',
      JSON.stringify(result1.additional_kwargs, null, 2)
    );

    // Check tool call format
    if (result1.tool_calls && result1.tool_calls.length > 0) {
      const tc = result1.tool_calls[0];
      console.log('\n   ✅ Tool Call Format Analysis:');
      console.log(`      - name: ${tc.name}`);
      console.log(`      - args: ${JSON.stringify(tc.args)}`);
      console.log(`      - id: ${tc.id}`);
      console.log('   🎉 STANDARD OPENAI FORMAT CONFIRMED!');
    } else if (
      typeof result1.content === 'string' &&
      result1.content.includes('<function=')
    ) {
      console.log('\n   ❌ Non-standard format detected (XML-like)');
      console.log('      Content contains: <function=...>');
    } else {
      console.log('\n   ⚠️ No tool calls in response');
    }
  } catch (error) {
    console.error('❌ Test 1 Failed:', error);
  }

  // Test 2: With tool_choice: required
  console.log('\n📋 Test 2: bindTools() with tool_choice: required');
  try {
    const modelWithRequiredTools = groqModel.bindTools([testTransferTool], {
      tool_choice: 'required',
    });

    const result2 = await modelWithRequiredTools.invoke([
      {
        role: 'user',
        content: '분석 작업을 해줘',
      },
    ]);

    console.log('✅ Response received');
    console.log('   Tool Calls:', JSON.stringify(result2.tool_calls, null, 2));

    if (result2.tool_calls && result2.tool_calls.length > 0) {
      console.log('   🎉 FORCED TOOL CALL WORKS!');
    }
  } catch (error) {
    console.error('❌ Test 2 Failed:', error);
  }

  console.log('\n✅ Groq Tool Calling Test Complete');
}

// Run
testGroqToolCalling().catch(console.error);
