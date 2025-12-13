import { AIMessage, type HumanMessage } from '@langchain/core/messages';
import { END, StateGraph } from '@langchain/langgraph';

// 1. Define State
interface IState {
  messages: AnyMessage[];
  context?: string;
}

// Helper type for messages
type AnyMessage = HumanMessage | AIMessage;

// 2. Nodes (The "Brain" steps)
const analysisNode = async (state: IState) => {
  console.log('🧠 Processing Analysis Node...');
  // TODO: Connect real AI model here
  return {
    messages: [
      new AIMessage(
        'Analysis Complete: System appears normal based on initial scan.'
      ),
    ],
  };
};

// 3. Graph Definition
export const createGraph = () => {
  const builder = new StateGraph<IState>({
    channels: {
      messages: {
        value: (x: AnyMessage[], y: AnyMessage[]) => x.concat(y),
        default: () => [],
      },
      context: {
        value: (x: string, y: string) => y ?? x,
        default: () => 'initial',
      },
    },
  });

  // Add Nodes
  builder.addNode('analyze', analysisNode);

  // Set Entry
  builder.addEdge('__start__', 'analyze');
  builder.addEdge('analyze', '__end__');

  return builder.compile();
};
