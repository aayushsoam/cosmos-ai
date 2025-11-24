import { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaLink } from 'react-icons/fa';
import type { BrowserTab } from './BrowserTabs';

export interface TabSummary {
  tabId: number;
  title: string;
  url: string;
  favicon?: string;
  summary: string;
  key_points?: string[];
}

interface SummarizePageProps {
  tabSummaries: TabSummary[];
  isDarkMode?: boolean;
  onClose?: () => void;
  onDone?: (url: string) => void;
}

export const SummarizePage: React.FC<SummarizePageProps> = ({ tabSummaries, isDarkMode = true, onClose, onDone }) => {
  const [selectedUrl, setSelectedUrl] = useState<string>('');

  useEffect(() => {
    if (tabSummaries.length > 0) {
      setSelectedUrl(tabSummaries[0].url);
    }
  }, [tabSummaries]);

  const handleDone = () => {
    if (selectedUrl) {
      onDone?.(selectedUrl);
    }
  };

  if (tabSummaries.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden ${
        isDarkMode ? 'bg-black/80' : 'bg-white/80'
      }`}>
      <div
        className={`relative max-h-[90vh] w-[90vw] max-w-4xl overflow-hidden rounded-lg shadow-2xl ${
          isDarkMode ? 'bg-slate-900' : 'bg-white'
        }`}>
        {/* Header */}
        <div
          className={`border-b px-6 py-4 flex items-center justify-between ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
          }`}>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Content Summary</h2>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
            title="Close">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto p-6 space-y-4`} style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {tabSummaries.map(summary => (
            <div
              key={summary.tabId}
              className={`rounded-lg border-2 p-4 transition-all cursor-pointer ${
                selectedUrl === summary.url
                  ? isDarkMode
                    ? 'border-blue-500 bg-slate-800'
                    : 'border-blue-400 bg-blue-50'
                  : isDarkMode
                    ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
              onClick={() => setSelectedUrl(summary.url)}>
              {/* Tab header */}
              <div className="flex items-start gap-3 mb-3">
                {/* Favicon */}
                {summary.favicon && (
                  <img
                    src={summary.favicon}
                    alt={summary.title}
                    className="h-5 w-5 rounded flex-shrink-0 mt-0.5"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                {/* Title and URL */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {summary.title}
                  </h3>
                  <p
                    className={`text-xs truncate flex items-center gap-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    <FaLink className="h-3 w-3 flex-shrink-0" />
                    {summary.url}
                  </p>
                </div>

                {/* Selection indicator */}
                {selectedUrl === summary.url && (
                  <div className="flex-shrink-0 rounded-full bg-blue-500 p-2">
                    <FaCheck className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Summary text */}
              <p className={`text-sm leading-relaxed line-clamp-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {summary.summary}
              </p>

              {/* Key points */}
              {summary.key_points && summary.key_points.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Key Points:</p>
                  <ul className="space-y-1">
                    {summary.key_points.slice(0, 3).map((point, idx) => (
                      <li
                        key={idx}
                        className={`text-xs flex items-start gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="mt-1 h-1 w-1 rounded-full flex-shrink-0 bg-blue-400" />
                        <span className="line-clamp-1">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className={`border-t px-6 py-4 flex items-center justify-between ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
          }`}>
          <div className="text-sm">
            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Selected Page</p>
            <p className={`text-xs truncate max-w-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {tabSummaries.find(s => s.url === selectedUrl)?.title}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                isDarkMode
                  ? 'bg-slate-700 text-gray-200 hover:bg-slate-600'
                  : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
              }`}>
              Cancel
            </button>
            <button
              onClick={handleDone}
              disabled={!selectedUrl}
              className={`rounded-lg px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                selectedUrl
                  ? isDarkMode
                    ? 'bg-green-600 text-white hover:bg-green-500'
                    : 'bg-green-500 text-white hover:bg-green-600'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}>
              <FaCheck className="h-4 w-4" />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummarizePage;
