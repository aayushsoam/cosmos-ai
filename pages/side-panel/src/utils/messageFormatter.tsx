import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../components/CodeBlock';
import TableFormatter from '../components/TableFormatter';

// Detect code blocks in text
const detectCodeBlocks = (text: string): Array<{ isCode: boolean; language?: string; content: string }> => {
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const parts: Array<{ isCode: boolean; language?: string; content: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const [fullMatch, language, code] = match;
    const preText = text.substring(lastIndex, match.index);

    if (preText) {
      parts.push({ isCode: false, content: preText });
    }

    parts.push({ isCode: true, language: language || 'plaintext', content: code.trim() });
    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push({ isCode: false, content: text.substring(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ isCode: false, content: text }];
};

// Detect tables in text
const detectTable = (
  text: string,
): { hasTable: boolean; tableContent?: string; beforeText?: string; afterText?: string } => {
  const tableMatch = text.match(/(\|.*\|(\n\|.*\|)*\s*)/);
  if (!tableMatch) {
    return { hasTable: false };
  }

  const tableContent = tableMatch[0];
  const beforeText = text.split(tableContent)[0].trim();
  const afterText = text.split(tableContent)[1]?.trim() || '';

  return {
    hasTable: true,
    tableContent,
    beforeText,
    afterText,
  };
};

// Format message content with code blocks, tables, and markdown
export const formatMessageContent = (content: string): React.ReactNode => {
  // First check for tables
  const tableInfo = detectTable(content);

  if (tableInfo.hasTable && tableInfo.tableContent) {
    return (
      <div className="formatted-message">
        {tableInfo.beforeText && (
          <div className="message-text-before">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {tableInfo.beforeText}
            </ReactMarkdown>
          </div>
        )}
        <TableFormatter content={tableInfo.tableContent} />
        {tableInfo.afterText && (
          <div className="message-text-after">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {tableInfo.afterText}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  // Check for code blocks
  const parts = detectCodeBlocks(content);

  if (parts.some(p => p.isCode)) {
    return (
      <div className="formatted-message">
        {parts.map((part, index) => {
          if (part.isCode) {
            return <CodeBlock key={index} code={part.content} language={part.language} />;
          } else {
            return (
              <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {part.content}
              </ReactMarkdown>
            );
          }
        })}
      </div>
    );
  }

  // Regular markdown rendering
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
};

// Markdown components with dark theme
const markdownComponents = {
  h1: ({ children }: any) => <h1 className="markdown-h1">{children}</h1>,
  h2: ({ children }: any) => <h2 className="markdown-h2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="markdown-h3">{children}</h3>,
  h4: ({ children }: any) => <h4 className="markdown-h4">{children}</h4>,
  p: ({ children }: any) => <p className="markdown-p">{children}</p>,
  strong: ({ children }: any) => <strong className="markdown-strong">{children}</strong>,
  em: ({ children }: any) => <em className="markdown-em">{children}</em>,
  code: ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match;

    if (isInline) {
      return (
        <code className="markdown-inline-code" {...props}>
          {children}
        </code>
      );
    }
    return null; // Code blocks handled separately
  },
  pre: ({ children }: any) => {
    // Skip pre tags as we handle code blocks separately
    return <>{children}</>;
  },
  ul: ({ children }: any) => <ul className="markdown-ul">{children}</ul>,
  ol: ({ children }: any) => <ol className="markdown-ol">{children}</ol>,
  li: ({ children }: any) => <li className="markdown-li">{children}</li>,
  blockquote: ({ children }: any) => <blockquote className="markdown-blockquote">{children}</blockquote>,
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
      {children}
    </a>
  ),
  table: ({ children }: any) => <table className="markdown-table">{children}</table>,
  thead: ({ children }: any) => <thead className="markdown-thead">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="markdown-tbody">{children}</tbody>,
  tr: ({ children }: any) => <tr className="markdown-tr">{children}</tr>,
  th: ({ children }: any) => <th className="markdown-th">{children}</th>,
  td: ({ children }: any) => <td className="markdown-td">{children}</td>,
};
