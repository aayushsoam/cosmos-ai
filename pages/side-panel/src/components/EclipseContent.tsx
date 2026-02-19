import React, { useState, useEffect, useRef } from 'react';
import EclipseMessageItem from './EclipseMessageItem';
import EmailComposeCard from './EmailComposeCard';

interface Tab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

interface Message {
  id?: string;
  type: 'user' | 'assistant' | 'system' | 'email_compose';
  content: string;
  timestamp?: number;
  tabs?: Tab[];
  links?: string[];
  emailData?: {
    to?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    body?: string;
  };
}

interface ContentProps {
  messages?: Message[];
  isTyping?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  welcomeMessage?: string;
  onChatStart?: () => void;
  currentAgent?: {
    type: 'thinker' | 'navigation' | 'system';
    status: 'running' | 'completed' | 'error';
  } | null;
  selectedMode?: string;
  onSendEmail?: (emailData: any) => Promise<void>;
  onCloseEmailCompose?: () => void;
}

import { ShinyTextDisplay } from './ShinyText';

const EclipseContent: React.FC<ContentProps> = ({
  messages = [],
  isTyping = false,
  isStreaming = false,
  streamingContent = '',
  welcomeMessage = 'Your browser complex flows executed autonomously',
  onChatStart,
  currentAgent = null,
  selectedMode = 'ask',
  onSendEmail,
  onCloseEmailCompose,
}) => {
  const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const editRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (messages.length > 0 && !hasStartedChat) {
      setHasStartedChat(true);
      onChatStart?.();
    }
  }, [messages.length, hasStartedChat, onChatStart]);

  useEffect(() => {
    if (editingMessageId && editRef.current) {
      editRef.current.focus();
    }
  }, [editingMessageId]);

  const handleStartEdit = (id: string, content: string): string => {
    setEditingMessageId(id);
    setEditingContent(content);
    return content;
  };

  const handleUpdateContent = (content: string) => {
    setEditingContent(content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleConfirmEdit = (id: string) => {
    // You can implement edit confirmation logic here
    console.log('Confirm edit:', id, editingContent);
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Helper function to get icon URL
  const getIconUrl = (iconPath: string): string => {
    // Try chrome extension API first
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      try {
        return chrome.runtime.getURL(iconPath);
      } catch (e) {
        // Fallback to regular path
      }
    }
    // Fallback to regular path (works in Vite dev server)
    return iconPath.startsWith('/') ? iconPath : `/${iconPath}`;
  };

  const logoPath = getIconUrl('side-panel/icons/icon-32.svg');

  // Show welcome message if no messages
  if (messages.length === 0 && !isTyping && !isStreaming) {
    return (
      <main className="sidebar-content">
        <div className="welcome-container">
          <div className="welcome-message">
            <img
              src={logoPath}
              alt="Logo"
              className="welcome-logo"
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="welcome-text">{welcomeMessage}</span>
          </div>
        </div>
      </main>
    );
  }

  // Chat state
  return (
    <main className="sidebar-content chat-mode">
      <div className="chat-container">
        {messages.map((message, index) => {
          // Render email compose card for email_compose type
          if (message.type === 'email_compose' && message.emailData && onSendEmail && onCloseEmailCompose) {
            return (
              <EmailComposeCard
                key={message.id || index}
                emailData={message.emailData}
                onSend={onSendEmail}
                onClose={onCloseEmailCompose}
              />
            );
          }

          // Render normal message
          return (
            <EclipseMessageItem
              key={message.id || index}
              message={message as any}
              isEditing={editingMessageId === (message.id || String(index))}
              onStartEdit={handleStartEdit}
              onUpdateContent={handleUpdateContent}
              onBlur={handleCancelEdit}
              onConfirm={() => message.id && handleConfirmEdit(message.id)}
              onCancel={handleCancelEdit}
              editRef={editRef}
            />
          );
        })}

        {/* Show loading indicator for ask mode */}
        {selectedMode === 'ask' && isTyping && (
          <div className="message ai-message typing">
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        )}

        {/* Show agent status for agent mode - show when typing or when agent is running */}
        {selectedMode === 'agent' && (isTyping || currentAgent) && (
          <div className="message ai-message typing">
            <div className="agent-status-message">
              <span className="agent-status-label">
                {currentAgent?.type === 'thinker'
                  ? 'Planning'
                  : currentAgent?.type === 'navigation'
                    ? 'Navigation'
                    : currentAgent?.type === 'system'
                      ? 'System'
                      : 'Planning'}
                :
              </span>
              <ShinyTextDisplay text="running..." speed={2} className="agent-status-text" />
            </div>
          </div>
        )}

        {isStreaming && streamingContent && (
          <div className="message ai-message streaming">
            <div className="markdown-content" dangerouslySetInnerHTML={{ __html: streamingContent }} />
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        )}

        <div className="chat-bottom-spacer"></div>
      </div>
    </main>
  );
};

export default EclipseContent;
