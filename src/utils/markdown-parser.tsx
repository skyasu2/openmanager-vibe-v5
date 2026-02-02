/**
 * 📝 Markdown Parser Utility
 *
 * Parses AI response content and extracts code blocks for execution.
 * Renders content with CodeExecutionBlock for Python code.
 *
 * @version 1.0.0
 * @created 2025-12-18
 */

'use client';

import type React from 'react';
import { CodeExecutionBlock } from '@/components/ai/CodeExecutionBlock';

export interface ContentBlock {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

/**
 * Parse markdown content into text and code blocks
 */
export function parseMarkdownContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        blocks.push({
          type: 'text',
          content: textContent,
        });
      }
    }

    // Add code block
    const language = match[1] || 'text';
    const code = (match[2] || '').trim();

    blocks.push({
      type: 'code',
      content: code,
      language,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim();
    if (textContent) {
      blocks.push({
        type: 'text',
        content: textContent,
      });
    }
  }

  // If no code blocks found, return entire content as text
  if (blocks.length === 0 && content.trim()) {
    blocks.push({
      type: 'text',
      content: content.trim(),
    });
  }

  return blocks;
}

/**
 * Check if content contains executable Python code
 */
export function hasExecutableCode(content: string): boolean {
  const pythonCodeRegex = /```(?:python|py)\n[\s\S]*?```/i;
  return pythonCodeRegex.test(content);
}

export interface RenderMarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Render markdown content with executable code blocks
 */
export function RenderMarkdownContent({
  content,
  className = '',
}: RenderMarkdownContentProps): React.ReactNode {
  const blocks = parseMarkdownContent(content);

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          const isPython =
            block.language?.toLowerCase() === 'python' ||
            block.language?.toLowerCase() === 'py';

          return (
            <CodeExecutionBlock
              key={index}
              code={block.content}
              language={block.language || 'text'}
              showRunButton={isPython}
            />
          );
        }

        // Render text content with basic formatting
        return (
          <div
            key={index}
            className="whitespace-pre-wrap break-words text-chat leading-relaxed"
          >
            {renderFormattedText(block.content)}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Render text with basic inline formatting (bold, italic, inline code)
 */
function renderFormattedText(text: string): React.ReactNode {
  // Split by inline code first
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    // Inline code
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-pink-600 dark:bg-gray-800 dark:text-pink-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process bold and italic
    let processed: React.ReactNode = part;

    // Bold (**text**)
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    if (boldParts.length > 1) {
      processed = boldParts.map((bp, i) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold">
              {bp.slice(2, -2)}
            </strong>
          );
        }
        return bp;
      });
    }

    return <span key={index}>{processed}</span>;
  });
}

export default RenderMarkdownContent;
