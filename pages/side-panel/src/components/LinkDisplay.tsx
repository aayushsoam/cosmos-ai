import React, { useState, useEffect } from 'react';
import './LinkDisplay.css';

interface LinkDisplayProps {
  url: string;
}

const LinkDisplay: React.FC<LinkDisplayProps> = ({ url }) => {
  const [title, setTitle] = useState<string>('');
  const [favicon, setFavicon] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinkInfo = async () => {
      try {
        // Extract domain for favicon
        const domain = new URL(url).hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        setFavicon(faviconUrl);

        // Try to get page title (this would need to be done via background script in real implementation)
        // For now, use domain as title
        setTitle(domain);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching link info:', error);
        setTitle(new URL(url).hostname);
        setLoading(false);
      }
    };

    if (url) {
      fetchLinkInfo();
    }
  }, [url]);

  const handleClick = () => {
    chrome.tabs.create({ url });
  };

  if (loading) {
    return (
      <div className="link-display-item">
        <div className="link-display-icon">
          <div className="link-loading-spinner"></div>
        </div>
        <div className="link-display-info">
          <div className="link-display-title">Loading...</div>
          <div className="link-display-url">{url}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="link-display-item" onClick={handleClick} title={url}>
      <div className="link-display-icon">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="link-favicon"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <span className={`link-fallback-icon ${favicon ? 'hidden' : ''}`}>🔗</span>
      </div>
      <div className="link-display-info">
        <div className="link-display-title">{title}</div>
        <div className="link-display-url">{url}</div>
      </div>
    </div>
  );
};

export default LinkDisplay;
