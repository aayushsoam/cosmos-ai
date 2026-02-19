import React from 'react';
import './TabDisplay.css';

interface Tab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

interface TabDisplayProps {
  tabs: Tab[];
}

const TabDisplay: React.FC<TabDisplayProps> = ({ tabs }) => {
  if (tabs.length === 0) return null;

  const handleTabClick = (url: string) => {
    chrome.tabs.create({ url });
  };

  const getFavicon = (tab: Tab) => {
    if (tab.favIconUrl) return tab.favIconUrl;
    try {
      const domain = new URL(tab.url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="tab-display-container">
      {tabs.map(tab => (
        <div key={tab.id} className="tab-display-item" onClick={() => handleTabClick(tab.url)} title={tab.url}>
          <div className="tab-display-icon">
            <img
              src={getFavicon(tab)}
              alt=""
              className="tab-favicon"
              onError={e => {
                // If customized favicon fails, try google service as fallback if not already using it
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('google.com/s2/favicons')) {
                  const domain = getHostname(tab.url);
                  target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                } else {
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }
              }}
            />
            <span className="tab-fallback-icon hidden">📄</span>
          </div>
          <div className="tab-display-info">
            <div className="tab-display-title">{tab.title}</div>
            <div className="tab-display-url">{getHostname(tab.url)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TabDisplay;
