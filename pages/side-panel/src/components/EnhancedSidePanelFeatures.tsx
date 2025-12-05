import { useEffect, useState } from 'react';
import { FiGlobe } from 'react-icons/fi';
import { FaTimes, FaBrain, FaRobot, FaCog } from 'react-icons/fa';

// Browser tab interface
export interface BrowserTabItem {
  id: number;
  title: string;
  url: string;
  favicon?: string;
}

// Agent status interface
export type AgentType = 'thinker' | 'navigation' | 'system';

// ========== 1. BROWSER TABS DISPLAY ==========
export const BrowserTabsDisplay: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [tabs, setTabs] = useState<BrowserTabItem[]>([]);

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const currentTabs = await chrome.tabs.query({ currentWindow: true });
        setTabs(
          currentTabs.map(tab => ({
            id: tab.id || 0,
            title: tab.title || 'Untitled',
            url: tab.url || 'about:blank',
            favicon: tab.favIconUrl,
          })),
        );
      } catch (error) {
        console.error('Error fetching tabs:', error);
      }
    };

    fetchTabs();
    chrome.tabs.onUpdated.addListener(() => fetchTabs());
    chrome.tabs.onRemoved.addListener(() => fetchTabs());

    return () => {
      chrome.tabs.onUpdated.removeListener(() => fetchTabs());
      chrome.tabs.onRemoved.removeListener(() => fetchTabs());
    };
  }, []);

  if (tabs.length === 0) return null;

  return (
    <div
      className={`border-b flex overflow-x-auto gap-1 p-2 ${
        isDarkMode ? 'border-slate-700 bg-black' : 'border-gray-200 bg-gray-50'
      }`}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs shrink-0 ${
            isDarkMode ? 'bg-black text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
          title={tab.title}>
          {tab.favicon ? <img src={tab.favicon} alt="" className="h-3 w-3 rounded" /> : <FiGlobe className="h-3 w-3" />}
          <span className="max-w-[80px] truncate">{new URL(tab.url).hostname.replace('www.', '')}</span>
        </div>
      ))}
    </div>
  );
};

// ========== 2. SHINY TEXT EFFECT ==========
export const ShinyText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 2 }) => {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shiny-text {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.9) 0%,
            rgba(255,255,255,0.9) 40%,
            rgba(255,255,255,0.3) 50%,
            rgba(255,255,255,0.9) 60%,
            rgba(255,255,255,0.9) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer ${speed}s linear infinite;
          font-weight: 500;
        }
      `}</style>
      <span className="shiny-text">{text}</span>
    </>
  );
};

// ========== 3. AGENT STATUS DISPLAY ==========
interface AgentStatusProps {
  agents: {
    type: AgentType;
    status: 'pending' | 'running' | 'completed' | 'error';
    message?: string;
  }[];
  isDarkMode?: boolean;
}

export const AgentStatusDisplay: React.FC<AgentStatusProps> = ({ agents, isDarkMode = true }) => {
  const getIcon = (type: AgentType) => {
    switch (type) {
      case 'thinker':
        return <FaBrain className="h-4 w-4 text-purple-400" />;
      case 'navigation':
        return <FaRobot className="h-4 w-4 text-blue-400" />;
      case 'system':
        return <FaCog className="h-4 w-4 text-green-400" />;
    }
  };

  const getLabel = (type: AgentType) => {
    switch (type) {
      case 'thinker':
        return 'Thinker';
      case 'navigation':
        return 'Navigator';
      case 'system':
        return 'System';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-yellow-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (agents.length === 0) return null;

  return (
    <div
      className={`text-xs space-y-1 px-3 py-2 ${
        isDarkMode ? 'bg-black border-b border-slate-700' : 'bg-gray-100 border-b border-gray-200'
      }`}>
      {agents.map(agent => (
        <div key={agent.type} className="flex items-center gap-2">
          {getIcon(agent.type)}
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{getLabel(agent.type)}</span>
          {agent.status === 'running' ? (
            <ShinyText text={`${agent.status}...`} speed={2} />
          ) : (
            <span className={getStatusColor(agent.status)}>
              {agent.status === 'completed' ? '✓' : agent.status === 'error' ? '✗' : '○'}
            </span>
          )}
          {agent.message && (
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>({agent.message})</span>
          )}
        </div>
      ))}
    </div>
  );
};

// ========== 4. SUMMARIZE MODAL ==========
interface SummarizeModalProps {
  isOpen: boolean;
  summaries: {
    tabId: number;
    title: string;
    url: string;
    favicon?: string;
    summary: string;
  }[];
  isDarkMode?: boolean;
  onClose: () => void;
  onDone: (url: string) => void;
}

export const SummarizeModal: React.FC<SummarizeModalProps> = ({
  isOpen,
  summaries,
  isDarkMode = true,
  onClose,
  onDone,
}) => {
  const [selected, setSelected] = useState<string>(summaries[0]?.url || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2">
      <div
        className={`rounded-lg shadow-xl max-h-[80vh] w-full max-w-md overflow-auto ${
          isDarkMode ? 'bg-black' : 'bg-white'
        }`}>
        <div
          className={`flex items-center justify-between border-b p-3 ${
            isDarkMode ? 'border-slate-700 bg-black' : 'border-gray-200 bg-gray-100'
          }`}>
          <h2 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Content Summary</h2>
          <button onClick={onClose} className={`p-1 rounded ${isDarkMode ? 'hover:bg-black' : 'hover:bg-gray-200'}`}>
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 p-3">
          {summaries.map(summary => (
            <div
              key={summary.tabId}
              onClick={() => setSelected(summary.url)}
              className={`cursor-pointer rounded border-2 p-2 transition-all ${
                selected === summary.url
                  ? isDarkMode
                    ? 'border-blue-500 bg-black'
                    : 'border-blue-400 bg-blue-50'
                  : isDarkMode
                    ? 'border-slate-700 bg-black/50 hover:border-slate-600'
                    : 'border-gray-300 bg-gray-50'
              }`}>
              <div className="flex items-start gap-2">
                {summary.favicon && <img src={summary.favicon} alt="" className="h-4 w-4 rounded flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {summary.title}
                  </p>
                  <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{summary.url}</p>
                </div>
              </div>
              <p className={`mt-1 text-xs line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {summary.summary}
              </p>
            </div>
          ))}
        </div>

        <div
          className={`flex gap-2 border-t p-3 ${
            isDarkMode ? 'border-slate-700 bg-black' : 'border-gray-200 bg-gray-100'
          }`}>
          <button
            onClick={onClose}
            className={`flex-1 rounded px-2 py-1 text-xs font-medium ${
              isDarkMode ? 'bg-black text-gray-200 hover:bg-black' : 'bg-gray-300 text-gray-800'
            }`}>
            Cancel
          </button>
          <button
            onClick={() => {
              onDone(selected);
              onClose();
            }}
            className={`flex-1 rounded px-2 py-1 text-xs font-medium text-white ${
              isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'
            }`}>
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default {
  BrowserTabsDisplay,
  ShinyText,
  AgentStatusDisplay,
  SummarizeModal,
};
