import React, { useState, useRef, useEffect, useMemo } from 'react';
import './InputFooter.css';

export interface FooterTab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

interface FooterProps {
  onSendMessage: (text: string, mode: string, selectedTabs: FooterTab[]) => void;
  availableTabs: FooterTab[];
  initialSelectedTabs?: FooterTab[];
  disabled?: boolean;
}

// Helper function to get icon URL
const getIconUrl = (iconPath: string): string => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    try {
      return chrome.runtime.getURL(iconPath);
    } catch (e) {
      // Fallback
    }
  }
  return iconPath;
};

const getDefaultFavicon = (): string => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4K';
};

const ACTION_MODES = [
  { value: 'summary', label: 'Summarize', icon: getIconUrl('side-panel/icons/agent-mode-icon-2.svg') },
  { value: 'map', label: 'Generate Map', icon: getIconUrl('side-panel/icons/tab.svg') },
  { value: 'research_paper', label: 'Research Paper', icon: getIconUrl('side-panel/icons/ask-icon.svg') },
  { value: 'research', label: 'Paper', icon: getIconUrl('side-panel/icons/ask-icon.svg') }, // Mapping 'Paper' to 'research' kind
  { value: 'latex', label: 'AI LaTeX', icon: getIconUrl('side-panel/icons/agent-mode-icon-2.svg') },
  { value: 'manual_latex', label: 'LaTeX (Fast)', icon: getIconUrl('side-panel/icons/agent-mode-icon-2.svg') },
];

const ICONS = {
  submit: getIconUrl('side-panel/icons/submit-btn-icon.svg'),
  checkmark: getIconUrl('side-panel/icons/checkmark.svg'),
  tab: getIconUrl('side-panel/icons/tab.svg'),
  delete: getIconUrl('side-panel/icons/delete.svg'),
};

const formatTitleShort = (title: string, maxLength: number = 20): string => {
  if (!title) return '';
  return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
};

const InputFooter: React.FC<FooterProps> = ({
  onSendMessage,
  availableTabs = [],
  initialSelectedTabs = [],
  disabled = false,
}) => {
  const [content, setContent] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('summary');
  const [selectedTabs, setSelectedTabs] = useState<FooterTab[]>(initialSelectedTabs);
  const [isContextDropdownOpen, setIsContextDropdownOpen] = useState<boolean>(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState<boolean>(false);
  const [showTabSelection, setShowTabSelection] = useState<boolean>(false);
  const [hoveredIndicator, setHoveredIndicator] = useState<string | null>(null);

  const spanRef = useRef<HTMLSpanElement>(null);

  const selectedModeData = ACTION_MODES.find(m => m.value === selectedMode) || ACTION_MODES[0];

  const hasContent = content.trim().length > 0 || selectedTabs.length > 0;
  const showPlaceholder = !content && selectedTabs.length === 0;

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    setContent(e.currentTarget.textContent || '');
  };

  const clearContent = () => {
    setContent('');
    if (spanRef.current) {
      spanRef.current.innerHTML = '';
    }
  };

  const handleSubmit = () => {
    if (disabled) return;
    const text = content.trim();

    // If we have tabs but no text, we can still proceed (implies "process these tabs with selected mode")
    if (selectedTabs.length > 0 || text.length > 0) {
      onSendMessage(text, selectedMode, selectedTabs);
      clearContent();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleTabSelection = (tab: FooterTab) => {
    setSelectedTabs(prev => {
      const exists = prev.find(t => t.id === tab.id);
      if (exists) {
        return prev.filter(t => t.id !== tab.id);
      } else {
        return [...prev, tab];
      }
    });
  };

  const renderDropdownOptions = () => {
    if (showTabSelection) {
      return (
        <>
          <button className="context-dropdown-option go-back-option" onClick={() => setShowTabSelection(false)}>
            ← Go Back
          </button>
          <div className="dropdown-divider"></div>
          <div className="tabs-scroll-container">
            {availableTabs.length === 0 ? (
              <div style={{ padding: '8px', color: '#888', fontSize: '12px' }}>No tabs found</div>
            ) : (
              availableTabs.map(tab => {
                const isSelected = selectedTabs.some(t => t.id === tab.id);
                return (
                  <button
                    key={`tab-${tab.id}`}
                    className={`context-dropdown-option tab-option ${isSelected ? 'selected' : ''}`}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleTabSelection(tab);
                    }}
                    type="button">
                    <div className="tab-content">
                      <img
                        src={tab.favIconUrl || getDefaultFavicon()}
                        alt="Favicon"
                        className="tab-favicon"
                        onError={e => (e.currentTarget.src = getDefaultFavicon())}
                      />
                      <div className="tab-title">{tab.title}</div>
                      {isSelected && <img src={ICONS.checkmark} alt="Selected" className="tab-checkmark" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      );
    }

    return (
      <button className="context-dropdown-option" onClick={() => setShowTabSelection(true)}>
        <div className="context-option-content">
          <div className="context-option-left">
            <img
              src={ICONS.tab}
              alt="Select Tab"
              className="context-option-icon"
              onError={e => (e.currentTarget.src = getDefaultFavicon())}
            />
            <span>Select Tab</span>
          </div>
        </div>
      </button>
    );
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

        {selectedTabs.map(tab => {
          const isHovered = hoveredIndicator === `tab-${tab.id}`;
          const iconSrc = isHovered ? ICONS.delete : tab.favIconUrl || getDefaultFavicon();
          return (
            <div
              key={`selected-${tab.id}`}
              className="selected-tab-indicator"
              onMouseEnter={() => setHoveredIndicator(`tab-${tab.id}`)}
              onMouseLeave={() => setHoveredIndicator(null)}
              onClick={() => toggleTabSelection(tab)}>
              <img
                src={iconSrc}
                alt="Favicon"
                className="selected-tab-favicon"
                onError={e => {
                  if (!isHovered) e.currentTarget.src = getDefaultFavicon();
                }}
              />
              <span className="selected-tab-title">{formatTitleShort(tab.title)}</span>
            </div>
          );
        })}
      </div>

      <div className="footer-row">
        <span
          ref={spanRef}
          contentEditable
          className={`editable-span ${showPlaceholder ? 'placeholder' : ''}`}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder="Ask a question or request a summary..."
          suppressContentEditableWarning={true}></span>
      </div>

      <div className="footer-row" style={{ justifyContent: 'space-between', display: 'flex' }}>
        <div className="footer-column">
          <div className="custom-select">
            <button className="select-button" onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}>
              <img
                src={selectedModeData.icon}
                alt=""
                className="option-icon"
                onError={e => (e.currentTarget.src = getDefaultFavicon())}
              />
              {selectedModeData.label}
            </button>
            {isModeDropdownOpen && (
              <div className="dropdown-options">
                {ACTION_MODES.map(mode => (
                  <button
                    key={mode.value}
                    className={`dropdown-option ${selectedMode === mode.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedMode(mode.value);
                      setIsModeDropdownOpen(false);
                    }}>
                    <img
                      src={mode.icon}
                      alt=""
                      className="option-icon"
                      onError={e => (e.currentTarget.src = getDefaultFavicon())}
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
            className={`circular-button ${hasContent ? 'has-content' : ''}`}
            onClick={handleSubmit}
            disabled={!hasContent || disabled}
            title="Send">
            <img
              src={ICONS.submit}
              alt="Submit"
              className="submit-icon"
              onError={e => (e.currentTarget.src = getDefaultFavicon())}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputFooter;
