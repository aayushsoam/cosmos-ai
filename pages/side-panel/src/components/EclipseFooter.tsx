import React, { useState, useRef, useEffect, useMemo } from 'react';

interface Tab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

interface FooterProps {
  onSendMessage?: (text: string, mode?: string) => void;
  selectedTabs?: Tab[];
  tabs?: Tab[];
  showCurrentTabIndicator?: boolean;
  currentActiveTab?: Tab | null;
  onAddTab?: (tab: Tab) => boolean | void;
  onRemoveTab?: (tabId: number) => void;
  onToggleCurrentTab?: () => void;
  onRemoveCurrentTab?: () => void;
  totalSelected?: number;
  maxLimit?: number;
  disabled?: boolean;
  onModeChange?: (mode: string) => void;
}

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

const MODES = [
  { value: 'agent', label: 'Agent', icon: getIconUrl('side-panel/icons/agent-mode-icon-2.svg') },
  { value: 'ask', label: 'Ask', icon: getIconUrl('side-panel/icons/ask-icon.svg') },
];

const CONTEXT_OPTIONS = [
  { value: 'current-tab', label: 'Current Tab Content', icon: getIconUrl('side-panel/icons/tab.svg') },
  { value: 'select-tab', label: 'Select Tab', icon: getIconUrl('side-panel/icons/select-tabs-icon.svg') },
];

const ICONS = {
  submit: getIconUrl('side-panel/icons/submit-btn-icon.svg'),
  checkmark: getIconUrl('side-panel/icons/checkmark.svg'),
  tab: getIconUrl('side-panel/icons/tab.svg'),
  delete: getIconUrl('side-panel/icons/delete.svg'),
};

const TAB_LIMITS = {
  MAX_SELECTIONS: 5,
  TITLE_MAX_LENGTH: 25,
  TITLE_SHORT_MAX_LENGTH: 15,
};

const getDefaultFavicon = (): string => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4K';
};

const formatTabTitle = (title: string, maxLength: number = 25): string => {
  if (!title || typeof title !== 'string') return '';
  return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
};

const formatTabTitleShort = (title: string, maxLength: number = 15): string => {
  if (!title || typeof title !== 'string') return '';
  return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
};

const EclipseFooter: React.FC<FooterProps> = ({
  onSendMessage,
  selectedTabs = [],
  tabs = [],
  showCurrentTabIndicator = false,
  currentActiveTab = null,
  onAddTab,
  onRemoveTab,
  onToggleCurrentTab,
  onRemoveCurrentTab,
  totalSelected = 0,
  maxLimit = 5,
  disabled = false,
  onModeChange,
}) => {
  const [content, setContent] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<string>('agent');
  const [isContextDropdownOpen, setIsContextDropdownOpen] = useState<boolean>(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState<boolean>(false);
  const [showTabSelection, setShowTabSelection] = useState<boolean>(false);
  const [hoveredIndicator, setHoveredIndicator] = useState<string | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  const selectedModeData = MODES.find(mode => mode.value === selectedMode);
  const showPlaceholder = !content && !isFocused;

  const hasContent = (): boolean => {
    return content.trim().length > 0 || selectedTabs.length > 0 || showCurrentTabIndicator;
  };

  const clearContent = () => {
    setContent('');
    if (spanRef.current) {
      spanRef.current.innerHTML = '&nbsp;';
    }
  };

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    const text = e.currentTarget.textContent || '';
    setContent(text);
  };

  const handleSubmit = () => {
    if (hasContent() && onSendMessage && !disabled) {
      // If tabs are selected, include them in the message
      let messageText = content.trim();

      // Add selected tabs info if any tabs are selected
      if (selectedTabs.length > 0 || showCurrentTabIndicator) {
        let tabInfo = '';
        if (showCurrentTabIndicator && currentActiveTab) {
          tabInfo += `\n\nCurrent Tab:\nTitle: ${currentActiveTab.title}\nURL: ${currentActiveTab.url}`;
        }
        selectedTabs.forEach((tab, index) => {
          tabInfo += `\n\nTab ${index + 1}:\nTitle: ${tab.title}\nURL: ${tab.url}`;
        });

        if (tabInfo) {
          messageText += tabInfo;
        }
      }

      onSendMessage(messageText, selectedMode);
      clearContent();
    } else if ((selectedTabs.length > 0 || showCurrentTabIndicator) && onSendMessage && !disabled) {
      // If no text but tabs are selected, send summarize request
      let tabInfo = '';
      if (showCurrentTabIndicator && currentActiveTab) {
        tabInfo += `\n\nCurrent Tab:\nTitle: ${currentActiveTab.title}\nURL: ${currentActiveTab.url}`;
      }
      selectedTabs.forEach((tab, index) => {
        tabInfo += `\n\nTab ${index + 1}:\nTitle: ${tab.title}\nURL: ${tab.url}`;
      });

      const totalTabs = selectedTabs.length + (showCurrentTabIndicator ? 1 : 0);
      onSendMessage(`Summarize ${totalTabs} selected tab(s):${tabInfo}`, selectedMode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleContextOptionClick = (option: { value: string }) => {
    if (option.value === 'select-tab') {
      setShowTabSelection(true);
    } else if (option.value === 'current-tab') {
      // Toggle current tab
      if (currentActiveTab) {
        if (showCurrentTabIndicator) {
          onRemoveCurrentTab?.();
        } else {
          onToggleCurrentTab?.();
        }
      }
      setIsContextDropdownOpen(false);
    } else {
      setIsContextDropdownOpen(false);
    }
  };

  const handleTabSelectionClick = (e: React.MouseEvent, tab: Tab) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔵 Tab clicked:', tab.title, 'ID:', tab.id);
    console.log('Current selectedTabs count:', selectedTabs.length);
    console.log('onAddTab exists:', !!onAddTab, 'onRemoveTab exists:', !!onRemoveTab);

    // Handle current tab indicator removal and manual selection
    if (showCurrentTabIndicator && currentActiveTab && currentActiveTab.id === tab.id) {
      console.log('🔄 Removing current tab indicator and adding to selected');
      if (onRemoveCurrentTab) {
        onRemoveCurrentTab();
      }
      const totalSelected = selectedTabs.length;
      if (totalSelected < (maxLimit || 5)) {
        console.log('✅ Calling onAddTab for current tab');
        if (onAddTab) {
          const result = onAddTab(tab);
          console.log('onAddTab result:', result);
        }
      }
      return;
    }

    // Toggle tab selection
    const isSelected = isTabSelected(tab);
    console.log('Is tab selected?', isSelected);

    if (isSelected) {
      console.log('❌ Removing tab:', tab.title);
      if (onRemoveTab) {
        onRemoveTab(tab.id);
      } else {
        console.error('❌ onRemoveTab is not defined!');
      }
    } else {
      // Check if we can add more tabs
      const totalSelected = selectedTabs.length + (showCurrentTabIndicator ? 1 : 0);
      console.log('Total selected:', totalSelected, 'Max limit:', maxLimit || 5);
      if (totalSelected < (maxLimit || 5)) {
        console.log('➕ Adding tab:', tab.title);
        if (onAddTab) {
          const result = onAddTab(tab);
          console.log('onAddTab returned:', result);
        } else {
          console.error('❌ onAddTab is not defined!');
        }
      } else {
        console.log('⚠️ Cannot add more tabs - limit reached');
      }
    }
    // Don't close dropdown, allow multiple selections
  };

  // Memoize selected tab IDs for faster lookup
  const selectedTabIds = useMemo(() => new Set(selectedTabs.map(t => t.id)), [selectedTabs]);

  const isTabSelected = (tab: Tab): boolean => {
    return selectedTabIds.has(tab.id);
  };

  const isCurrentActive = (tab: Tab): boolean => {
    return !!(showCurrentTabIndicator && currentActiveTab && currentActiveTab.id === tab.id);
  };

  // Debug: Log when selectedTabs changes
  useEffect(() => {
    console.log('🔄 Footer: selectedTabs updated:', selectedTabs.length, selectedTabs);
  }, [selectedTabs]);

  const renderDropdownOptions = () => {
    if (showTabSelection) {
      return (
        <>
          <button className="context-dropdown-option go-back-option" onClick={() => setShowTabSelection(false)}>
            ← Go Back
          </button>
          <div className="dropdown-divider"></div>
          <div className="tabs-scroll-container">
            {tabs.map(tab => {
              const isSelected = isTabSelected(tab);
              const isCurrentActiveTab = isCurrentActive(tab);
              const shouldShowCheckmark = isSelected || isCurrentActiveTab;

              return (
                <button
                  key={`tab-${tab.id}-${isSelected}-${selectedTabs.length}`}
                  className={`context-dropdown-option tab-option ${isSelected ? 'selected' : ''}`}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTabSelectionClick(e, tab);
                  }}
                  type="button">
                  <div className="tab-content">
                    {tab.favIconUrl ? (
                      <img
                        src={tab.favIconUrl}
                        alt="Favicon"
                        className="tab-favicon"
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = getDefaultFavicon();
                        }}
                      />
                    ) : (
                      <img src={getDefaultFavicon()} alt="Favicon" className="tab-favicon" />
                    )}
                    <div className="tab-title">{formatTabTitle(tab.title, TAB_LIMITS.TITLE_MAX_LENGTH)}</div>
                    {shouldShowCheckmark && (
                      <img
                        src={ICONS.checkmark}
                        alt="Selected"
                        className="tab-checkmark"
                        onError={e => {
                          console.error('Checkmark icon failed to load:', ICONS.checkmark);
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      );
    }

    return CONTEXT_OPTIONS.map(option => (
      <button key={option.value} className="context-dropdown-option" onClick={() => handleContextOptionClick(option)}>
        <div className="context-option-content">
          <div className="context-option-left">
            <img
              src={option.icon}
              alt={option.label}
              className="context-option-icon"
              onError={e => {
                console.error('Context option icon failed to load:', option.icon);
              }}
            />
            <span>{option.label}</span>
          </div>
          {option.value === 'current-tab' && showCurrentTabIndicator && (
            <img src={ICONS.checkmark} alt="Selected" className="context-checkmark" />
          )}
        </div>
      </button>
    ));
  };

  const createTabIcon = (tab: Tab, hoveredIndicator: string | null) => {
    const isHovered = hoveredIndicator === `tab-${tab.id}`;
    return isHovered ? ICONS.delete : tab.favIconUrl || getDefaultFavicon();
  };

  const createCurrentTabIcon = () => {
    return hoveredIndicator === 'current-tab' ? ICONS.delete : ICONS.tab;
  };

  return (
    <div className="footer-container">
      <div className="footer-row">
        <div className="context-dropdown">
          <button className="context-button" onClick={() => setIsContextDropdownOpen(!isContextDropdownOpen)}>
            @ Add Context
          </button>
          {isContextDropdownOpen && <div className="context-dropdown-options">{renderDropdownOptions()}</div>}
        </div>

        {showCurrentTabIndicator && (
          <div
            className="current-tab-indicator"
            onMouseEnter={() => setHoveredIndicator('current-tab')}
            onMouseLeave={() => setHoveredIndicator(null)}
            onClick={onRemoveCurrentTab}>
            <img src={createCurrentTabIcon()} alt="Current Tab" className="current-tab-icon" />
            Current tab
          </div>
        )}

        {selectedTabs.map(tab => {
          const isHovered = hoveredIndicator === `tab-${tab.id}`;
          const iconSrc = isHovered ? ICONS.delete : tab.favIconUrl || getDefaultFavicon();

          return (
            <div
              key={`selected-tab-${tab.id}`}
              className="selected-tab-indicator"
              onMouseEnter={() => setHoveredIndicator(`tab-${tab.id}`)}
              onMouseLeave={() => setHoveredIndicator(null)}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Removing selected tab:', tab.title);
                if (onRemoveTab) {
                  onRemoveTab(tab.id);
                }
              }}>
              <img
                src={iconSrc}
                alt="Favicon"
                className="selected-tab-favicon"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  if (!isHovered) {
                    target.src = getDefaultFavicon();
                  }
                }}
              />
              <span className="selected-tab-title">
                {formatTabTitleShort(tab.title, TAB_LIMITS.TITLE_SHORT_MAX_LENGTH)}
              </span>
            </div>
          );
        })}

        {totalSelected >= 4 && (
          <div className="selection-counter">
            {totalSelected}/{maxLimit}
          </div>
        )}
      </div>

      <div className="footer-row">
        <span
          ref={spanRef}
          contentEditable
          className={`editable-span ${showPlaceholder ? 'placeholder' : ''}`}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder="Plan, search, do anything..."
          suppressContentEditableWarning={true}></span>
      </div>

      <div className="footer-row">
        <div className="footer-column">
          <div className="custom-select">
            <button className="select-button" onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}>
              <img
                src={selectedModeData?.icon}
                alt={selectedModeData?.label}
                className="option-icon"
                onError={e => {
                  console.error('Mode icon failed to load:', selectedModeData?.icon);
                }}
              />
              {selectedModeData?.label}
            </button>
            {isModeDropdownOpen && (
              <div className="dropdown-options">
                {MODES.map(mode => (
                  <button
                    key={mode.value}
                    className={`dropdown-option ${selectedMode === mode.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedMode(mode.value);
                      setIsModeDropdownOpen(false);
                      onModeChange?.(mode.value);
                    }}>
                    <img
                      src={mode.icon}
                      alt={mode.label}
                      className="option-icon"
                      onError={e => {
                        console.error('Mode dropdown icon failed to load:', mode.icon);
                      }}
                    />
                    {mode.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="footer-column">
          <button
            className={`circular-button ${hasContent() ? 'has-content' : ''}`}
            onClick={handleSubmit}
            disabled={disabled}
            title={hasContent() ? 'Send message' : 'Type a message or select tabs'}>
            <img
              src={ICONS.submit}
              alt="Submit"
              className="submit-icon"
              onError={e => {
                console.error('Submit icon failed to load:', ICONS.submit);
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EclipseFooter;
