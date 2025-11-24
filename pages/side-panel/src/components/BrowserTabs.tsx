import { useEffect, useState, useRef } from 'react';
import { FaChrome, FaGlobe, FaTimes } from 'react-icons/fa';

export interface BrowserTab {
  id: number;
  title: string;
  url: string;
  favicon?: string;
}

interface BrowserTabsProps {
  isDarkMode?: boolean;
  onTabSelect?: (tab: BrowserTab) => void;
  onTabClose?: (tabId: number) => void;
}

export const BrowserTabs: React.FC<BrowserTabsProps> = ({ isDarkMode = true, onTabSelect, onTabClose }) => {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get active tabs from Chrome API
  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const currentTabs = await chrome.tabs.query({ currentWindow: true });
        const formattedTabs = currentTabs.map(tab => ({
          id: tab.id || 0,
          title: tab.title || 'Untitled',
          url: tab.url || 'about:blank',
          favicon: tab.favIconUrl,
        }));
        setTabs(formattedTabs);
        if (formattedTabs.length > 0) {
          setSelectedTabId(formattedTabs[0].id);
        }
      } catch (error) {
        console.error('Error fetching tabs:', error);
      }
    };

    fetchTabs();

    // Listen for tab changes
    const handleTabUpdated = (tabId: number) => {
      fetchTabs();
    };

    const handleTabActivated = (activeInfo: chrome.tabs.TabActivatedInfo) => {
      setSelectedTabId(activeInfo.tabId);
      fetchTabs();
    };

    const handleTabRemoved = (tabId: number) => {
      setTabs(prev => prev.filter(tab => tab.id !== tabId));
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
    };
  }, []);

  const handleTabClick = (tab: BrowserTab) => {
    setSelectedTabId(tab.id);
    onTabSelect?.(tab);
  };

  const handleClose = (e: React.MouseEvent, tabId: number) => {
    e.stopPropagation();
    onTabClose?.(tabId);
    chrome.tabs.remove(tabId);
  };

  const getFaviconElement = (tab: BrowserTab) => {
    if (tab.favicon) {
      return (
        <img
          src={tab.favicon}
          alt={tab.title}
          className="h-4 w-4 rounded-sm"
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    return <FaGlobe className="h-4 w-4 text-blue-400" />;
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Browser';
    }
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={`border-b ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
      {/* Scrollable tabs container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scroll-smooth"
        style={{
          scrollBehavior: 'smooth',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}>
        {/* Hide scrollbar for Firefox */}
        <style>{`
          .browser-tabs-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div className="flex gap-1 p-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`group relative flex shrink-0 items-center gap-2 rounded-t-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                selectedTabId === tab.id
                  ? isDarkMode
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-gray-900'
                  : isDarkMode
                    ? 'bg-slate-700 text-gray-400 hover:bg-slate-600 hover:text-gray-300'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800'
              }`}
              title={tab.title}>
              {/* Favicon */}
              <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center">{getFaviconElement(tab)}</div>

              {/* Title - truncated */}
              <span className="max-w-[120px] truncate">{getDomainFromUrl(tab.url)}</span>

              {/* Close button */}
              <button
                onClick={e => handleClose(e, tab.id)}
                className={`ml-1 rounded p-0.5 transition-all duration-150 ${
                  isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-300'
                }`}
                title="Close tab">
                <FaTimes className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Tab info bar */}
      <div
        className={`flex items-center justify-between border-t px-3 py-1 text-xs ${
          isDarkMode ? 'border-slate-700 bg-slate-800 text-gray-400' : 'border-gray-200 bg-gray-100 text-gray-600'
        }`}>
        <span>
          {tabs.length} tab{tabs.length !== 1 ? 's' : ''} open
        </span>
        {selectedTabId && (
          <span className="text-gray-500">{tabs.find(t => t.id === selectedTabId)?.title.substring(0, 50)}</span>
        )}
      </div>
    </div>
  );
};

export default BrowserTabs;
