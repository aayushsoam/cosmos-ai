import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  hasStartedChat?: boolean;
  title?: string;
  onNewChat?: () => void;
  onLoadHistory?: () => void;
  onOpenSettings?: () => void;
  onOpenSummarization?: () => void;
  onOpenLinkedIn?: () => void;
  showHistory?: boolean;
  onBackToChat?: () => void;
}

const EclipseHeader: React.FC<HeaderProps> = ({
  hasStartedChat = false,
  title = 'cosmos ai',
  onNewChat,
  onLoadHistory,
  onOpenSettings,
  onOpenSummarization,
  onOpenLinkedIn,
  showHistory = false,
  onBackToChat,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <header className="sidebar-header">
      <div className="header-content">
        {hasStartedChat && (
          <img
            src={logoPath}
            alt="Logo"
            className="header-logo"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <h1>{title}</h1>
      </div>

      {/* 3 Dots Menu */}
      <div className="header-menu" ref={menuRef}>
        <button className="menu-dots-button" onClick={() => setShowMenu(!showMenu)} aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="4" r="1.5" fill="currentColor" />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            <circle cx="10" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </button>

        {showMenu && (
          <div className="menu-dropdown">
            {showHistory ? (
              <button
                className="menu-option"
                onClick={() => {
                  onBackToChat?.();
                  setShowMenu(false);
                }}>
                Back to Chat
              </button>
            ) : (
              <>
                <button
                  className="menu-option"
                  onClick={() => {
                    onNewChat?.();
                    setShowMenu(false);
                  }}>
                  New Chat
                </button>
                <button
                  className="menu-option"
                  onClick={() => {
                    onLoadHistory?.();
                    setShowMenu(false);
                  }}>
                  History
                </button>
              </>
            )}
            <button
              className="menu-option"
              onClick={() => {
                onOpenSummarization?.();
                setShowMenu(false);
              }}>
              Summarization
            </button>
            <button
              className="menu-option"
              onClick={() => {
                onOpenLinkedIn?.();
                setShowMenu(false);
              }}>
              🔗 LinkedIn Auto Apply
            </button>

            <button
              className="menu-option"
              onClick={() => {
                onOpenSettings?.();
                setShowMenu(false);
              }}>
              Settings
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default EclipseHeader;
