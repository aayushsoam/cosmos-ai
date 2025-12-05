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

  return (
    <div className="tab-display-container">
      {tabs.map(tab => (
        <div key={tab.id} className="tab-display-item" onClick={() => handleTabClick(tab.url)} title={tab.url}>
          <div className="tab-display-icon">
            {tab.favIconUrl ? (
              <img
                src={tab.favIconUrl}
                alt=""
                className="tab-favicon"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`tab-fallback-icon ${tab.favIconUrl ? 'hidden' : ''}`}>📄</span>
          </div>
          <div className="tab-display-info">
            <div className="tab-display-title">{tab.title}</div>
            <div className="tab-display-url">{tab.url}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TabDisplay;
