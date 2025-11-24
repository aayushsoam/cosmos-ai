import { useState, useEffect } from 'react';

interface Tab {
  id: number;
  title: string;
  url: string;
  favicon?: string;
}

interface TabSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedTabIds: number[]) => void;
  isDarkMode?: boolean;
}

export default function TabSelectorModal({ isOpen, onClose, onConfirm, isDarkMode = true }: TabSelectorModalProps) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [selectedTabIds, setSelectedTabIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch tabs when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTabs();
    } else {
      // Reset selection when modal closes
      setSelectedTabIds(new Set());
    }
  }, [isOpen]);

  const fetchTabs = async () => {
    setLoading(true);
    try {
      const currentTabs = await chrome.tabs.query({ currentWindow: true });
      const tabsData = currentTabs
        .filter(tab => tab.url?.startsWith('http')) // Only http/https tabs
        .map(tab => ({
          id: tab.id || 0,
          title: tab.title || 'Untitled',
          url: tab.url || '',
          favicon: tab.favIconUrl,
        }));
      setTabs(tabsData);
    } catch (error) {
      console.error('Error fetching tabs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTab = (tabId: number) => {
    const newSelected = new Set(selectedTabIds);
    if (newSelected.has(tabId)) {
      newSelected.delete(tabId);
    } else {
      newSelected.add(tabId);
    }
    setSelectedTabIds(newSelected);
  };

  const selectAll = () => {
    if (selectedTabIds.size === tabs.length) {
      setSelectedTabIds(new Set());
    } else {
      setSelectedTabIds(new Set(tabs.map(tab => tab.id)));
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedTabIds));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={`relative mx-4 w-full max-w-2xl rounded-xl border shadow-2xl ${
          isDarkMode ? 'border-white bg-black text-white' : 'bg-white text-gray-900'
        }`}>
        {/* Header */}
        <div className={`border-b px-6 py-4 ${isDarkMode ? 'border-white' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Select Tabs to Summarize</h2>
            <button
              onClick={onClose}
              className={`rounded-lg border p-1.5 transition-colors ${
                isDarkMode
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}>
              <span className="text-xl">×</span>
            </button>
          </div>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
            Choose one or more tabs to get AI-generated summaries
          </p>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            </div>
          ) : tabs.length === 0 ? (
            <div className={`py-8 text-center ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
              No tabs found to summarize
            </div>
          ) : (
            <>
              {/* Select All */}
              <button
                onClick={selectAll}
                className={`mb-3 rounded-lg border px-3 py-1 text-sm transition-colors ${
                  isDarkMode
                    ? 'border-white bg-black text-white hover:bg-white hover:text-black'
                    : 'text-blue-600 hover:text-blue-700'
                }`}>
                {selectedTabIds.size === tabs.length ? 'Deselect All' : 'Select All'}
              </button>

              {/* Tab List */}
              <div className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => toggleTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedTabIds.has(tab.id)
                        ? isDarkMode
                          ? 'border-white bg-white text-black'
                          : 'bg-blue-50 border-blue-200 border'
                        : isDarkMode
                          ? 'border-white bg-black text-white hover:bg-white hover:text-black'
                          : 'hover:bg-gray-50 border border-transparent'
                    }`}>
                    {/* Checkbox */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                        selectedTabIds.has(tab.id)
                          ? 'border-black bg-black'
                          : isDarkMode
                            ? 'border-white'
                            : 'border-gray-300'
                      }`}>
                      {selectedTabIds.has(tab.id) && <span className="text-white text-xs">✓</span>}
                    </div>

                    {/* Favicon */}
                    {tab.favicon ? (
                      <img src={tab.favicon} alt="" className="h-4 w-4 shrink-0" />
                    ) : (
                      <span className="text-lg">🌐</span>
                    )}

                    {/* Tab info */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-sm font-medium ${selectedTabIds.has(tab.id) && isDarkMode ? 'text-black' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {tab.title}
                      </div>
                      <div
                        className={`truncate text-xs ${selectedTabIds.has(tab.id) && isDarkMode ? 'text-black' : isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                        {tab.url}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t px-6 py-4 ${isDarkMode ? 'border-white' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
              {selectedTabIds.size} tab{selectedTabIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'border-white bg-black text-white hover:bg-white hover:text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedTabIds.size === 0}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTabIds.size === 0
                    ? 'cursor-not-allowed border-gray-600 bg-gray-600 text-gray-400 opacity-50'
                    : isDarkMode
                      ? 'border-white bg-black text-white hover:bg-white hover:text-black'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                Summarize
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
