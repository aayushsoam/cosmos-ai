import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import { CodeBlock } from './CodeBlock';
import { CombinedWebCodeBlock } from './CombinedWebCodeBlock';
import TypingEffect from './TypingEffect';
import { Loader2 } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'latex' | 'map';
  metadata?: any;
}

interface ChatMessageProps {
  message: Message;
}

// Detection logic ported from vo.tsx
const detectCodeBlocks = (text: string) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
  const parts = [];
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

  return parts;
};

const ChatMessage = memo(({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  // Format content with detection for web groups (html/css/js)
  const renderContent = () => {
    if (isUser) {
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    }

    const parts = detectCodeBlocks(message.content);
    const groupedParts: any[] = [];
    let currentWebGroup: any = { html: '', css: '', js: '', hasWebCode: false };

    parts.forEach((part, index) => {
      if (part.isCode && ['html', 'css', 'javascript', 'js'].includes(part.language?.toLowerCase() || '')) {
        currentWebGroup.hasWebCode = true;
        if (part.language?.toLowerCase() === 'html') {
          currentWebGroup.html = part.content || '';
        } else if (part.language?.toLowerCase() === 'css') {
          currentWebGroup.css = part.content || '';
        } else if (['javascript', 'js'].includes(part.language?.toLowerCase() || '')) {
          currentWebGroup.js = part.content || '';
        }
      } else {
        if (currentWebGroup.hasWebCode) {
          groupedParts.push({ type: 'webGroup', ...currentWebGroup });
          currentWebGroup = { html: '', css: '', js: '', hasWebCode: false };
        }
        groupedParts.push(part);
      }
    });

    if (currentWebGroup.hasWebCode) {
      groupedParts.push({ type: 'webGroup', ...currentWebGroup });
    }

    return groupedParts.map((part, index) => {
      if (part.type === 'webGroup') {
        return <CombinedWebCodeBlock key={index} html={part.html} css={part.css} js={part.js} />;
      } else if (part.isCode) {
        return <CodeBlock key={index} code={part.content} language={part.language} />;
      } else {
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]} // Highlight handled manually above for blocks
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0 leading-7">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mb-4 mt-6 border-b border-gray-700 pb-2">{children}</h1>
              ),
              h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-4">
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                  {children}
                </a>
              ),
            }}>
            {part.content}
          </ReactMarkdown>
        );
      }
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`flex max-w-[95%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-[#1e1e1e] border border-gray-700'}`}>
          {isUser ? (
            <span className="text-xs text-white">U</span>
          ) : (
            <img
              src={chrome.runtime.getURL('side-panel/icons/cosmos-logo.png')}
              alt="AI"
              className="w-5 h-5 opacity-80"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
          <div
            className={`px-4 py-3 rounded-2xl w-full ${
              isUser ? 'bg-[#2f2f2f] text-white rounded-tr-sm' : 'bg-transparent text-gray-100 px-0 py-0'
            }`}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatMessage;
