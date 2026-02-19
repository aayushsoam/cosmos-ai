import React from 'react';
import { formatMessageContent } from '../utils/messageFormatter';
import '../utils/messageFormatter.css';
import TabDisplay from './TabDisplay';
import LinkDisplay from './LinkDisplay';

interface Tab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

interface Message {
  id?: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  tabs?: Tab[];
  links?: string[];
}

interface MessageItemProps {
  message: Message;
  isEditing?: boolean;
  onStartEdit?: (id: string, content: string) => void;
  onUpdateContent?: (content: string) => void;
  onBlur?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  editRef?: React.RefObject<HTMLSpanElement>;
}

const positionCursorAtEnd = (element: HTMLElement) => {
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(element);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
};

const EclipseMessageItem: React.FC<MessageItemProps> = ({
  message,
  isEditing = false,
  onStartEdit,
  onUpdateContent,
  onBlur,
  onConfirm,
  onCancel,
  editRef,
}) => {
  const handleClick = (): void => {
    if (message.type === 'user' && message.id && onStartEdit) {
      onStartEdit(message.id, message.content);
      setTimeout(() => {
        if (editRef?.current) {
          editRef.current.textContent = message.content;
          positionCursorAtEnd(editRef.current);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onConfirm?.();
    } else if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  const messageClasses = `message ${message.type === 'user' ? 'user-message' : 'ai-message'} ${isEditing ? 'editing' : ''}`;
  const messageStyle = message.type === 'user' ? { cursor: 'pointer' } : {};

  return (
    <div className={messageClasses} onClick={message.type === 'user' ? handleClick : undefined} style={messageStyle}>
      {message.type === 'user' ? (
        <div className="user-message-content">
          {isEditing ? (
            <div className="edit-mode">
              <span
                ref={editRef}
                contentEditable
                suppressContentEditableWarning={true}
                onInput={e => onUpdateContent?.(e.currentTarget.textContent || '')}
                onKeyDown={handleKeyDown}
                onBlur={onBlur}
                className="edit-content"
                data-placeholder="Edit message..."
              />
            </div>
          ) : (
            <span className="user-text">{message.content}</span>
          )}

          {/* Display tabs usage if available */}
          {message.tabs && message.tabs.length > 0 && <TabDisplay tabs={message.tabs} />}

          {/* Display links if available */}
          {message.links && message.links.length > 0 && (
            <div>
              {message.links.map((link, index) => (
                <LinkDisplay key={index} url={link} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="markdown-content">{formatMessageContent(message.content)}</div>
      )}
    </div>
  );
};

export default EclipseMessageItem;
