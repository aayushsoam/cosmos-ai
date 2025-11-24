import type { Message } from '@extension/storage';
import { ACTOR_PROFILES } from '../types/message';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageListProps {
  messages: Message[];
  isDarkMode?: boolean;
}

export default memo(function MessageList({ messages, isDarkMode = false }: MessageListProps) {
  return (
    <div className="max-w-full space-y-4">
      {messages.map((message, index) => (
        <MessageBlock
          key={`${message.actor}-${message.timestamp}-${index}`}
          message={message}
          isSameActor={index > 0 ? messages[index - 1].actor === message.actor : false}
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  );
});

interface MessageBlockProps {
  message: Message;
  isSameActor: boolean;
  isDarkMode?: boolean;
}

function MessageBlock({ message, isSameActor, isDarkMode = false }: MessageBlockProps) {
  if (!message.actor) {
    console.error('No actor found');
    return <div />;
  }
  const actor = ACTOR_PROFILES[message.actor as keyof typeof ACTOR_PROFILES];
  const isProgress = message.content === 'Showing progress...';

  return (
    <div
      className={`flex max-w-full gap-3 ${
        !isSameActor
          ? `mt-4 border-t ${isDarkMode ? 'border-white' : 'border-sky-200/50'} pt-4 first:mt-0 first:border-t-0 first:pt-0`
          : ''
      }`}>
      {!isSameActor && (
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: actor.iconBackground }}>
          <img src={actor.icon} alt={actor.name} className="size-6" />
        </div>
      )}
      {isSameActor && <div className="w-8" />}

      <div className="min-w-0 flex-1">
        {!isSameActor && (
          <div className={`mb-1 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {actor.name}
          </div>
        )}

        <div className="space-y-0.5">
          <div className={`break-words text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
            {isProgress ? (
              <div className={`h-1 overflow-hidden rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="h-full animate-progress bg-blue-500" />
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="markdown-content"
                components={{
                  h1: ({ children }) => <h1 className="mb-3 mt-4 text-2xl font-bold text-white">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-2 mt-3 text-xl font-bold text-white">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-2 mt-3 text-lg font-bold text-white">{children}</h3>,
                  h4: ({ children }) => <h4 className="mb-2 mt-2 text-base font-bold text-white">{children}</h4>,
                  p: ({ children }) => <p className="mb-2 text-white">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-white">{children}</em>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="rounded bg-gray-800 px-1.5 py-0.5 text-sm text-white">{children}</code>
                    ) : (
                      <code className="block overflow-x-auto rounded bg-gray-800 p-3 text-sm text-white">
                        {children}
                      </code>
                    ),
                  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded bg-gray-800 p-3">{children}</pre>,
                  ul: ({ children }) => <ul className="mb-2 ml-6 list-disc text-white">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 ml-6 list-decimal text-white">{children}</ol>,
                  li: ({ children }) => <li className="mb-1 text-white">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-4 border-gray-600 pl-4 italic text-gray-300">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-blue-400 underline hover:text-blue-300"
                      target="_blank"
                      rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  hr: () => <hr className="my-4 border-t border-gray-700" />,
                  table: ({ children }) => (
                    <table className="mb-2 w-full border-collapse border border-gray-700">{children}</table>
                  ),
                  thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => <tr className="border-b border-gray-700">{children}</tr>,
                  th: ({ children }) => (
                    <th className="border border-gray-700 px-3 py-2 text-left font-bold text-white">{children}</th>
                  ),
                  td: ({ children }) => <td className="border border-gray-700 px-3 py-2 text-white">{children}</td>,
                  del: ({ children }) => <del className="text-gray-500 line-through">{children}</del>,
                  input: ({ checked, disabled }) => (
                    <input type="checkbox" checked={checked} disabled={disabled} className="mr-2" readOnly />
                  ),
                }}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          {!isProgress && (
            <div className={`text-right text-xs ${isDarkMode ? 'text-white' : 'text-gray-300'}`}>
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Formats a timestamp (in milliseconds) to a readable time string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted time string
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // Check if the message is from today
  const isToday = date.toDateString() === now.toDateString();

  // Check if the message is from yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  // Check if the message is from this year
  const isThisYear = date.getFullYear() === now.getFullYear();

  // Format the time (HH:MM)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return timeStr; // Just show the time for today's messages
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  if (isThisYear) {
    // Show month and day for this year
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  }

  // Show full date for older messages
  return `${date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}, ${timeStr}`;
}
