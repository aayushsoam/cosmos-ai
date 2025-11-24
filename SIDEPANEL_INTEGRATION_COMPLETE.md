# Side Panel Complete Integration Guide

## Exact Layout You Need

```
┌─────────────────────────────────────┐
│  Tab1 | Tab2 | Tab3 | Tab4 [scroll] │ ← Browser tabs (scrollable, small)
├─────────────────────────────────────┤
│ [User types message here...]         │ ← ChatInput (existing)
├─────────────────────────────────────┤
│ 🧠 Thinker: running...              │ ← Agent status (text only)
│ 🤖 Navigator: pending...            │   (shiny effect on "running")
│ ⚙️  System: pending...              │
├─────────────────────────────────────┤
│ Messages here...                     │ ← MessageList (existing)
├─────────────────────────────────────┤
│ [Summarize] [Done]                  │ ← Buttons
└─────────────────────────────────────┘

When "Summarize" clicked:
┌─────────────────────────────────────┐
│ AI Summary         [✕]              │
├─────────────────────────────────────┤
│ ☐ Tab1: Google                      │
│   Summary: This page shows...       │
│                                     │
│ ☒ Tab2: GitHub (SELECTED)          │
│   Summary: GitHub is a platform...  │
│                                     │
│ ☐ Tab3: Stack Overflow              │
│   Summary: Q&A website for devs...  │
├─────────────────────────────────────┤
│ [Cancel]                  [✓ Done]  │
└─────────────────────────────────────┘
```

## Step 1: Add State to SidePanel.tsx

```tsx
const [agentStatuses, setAgentStatuses] = useState<{
  type: 'thinker' | 'navigation' | 'system';
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}[]>([]);

const [showSummarize, setShowSummarize] = useState(false);
const [tabSummaries, setTabSummaries] = useState<{
  tabId: number;
  title: string;
  url: string;
  favicon?: string;
  summary: string;
}[]>([]);

const [selectedTabUrl, setSelectedTabUrl] = useState<string>('');
```

## Step 2: Import Components

```tsx
import ShinyText from './components/ShinyText';
```

## Step 3: Update Message Handler

When task starts, set agent statuses:

```tsx
// In your handleTaskState or where you process events
if (event.actor === Actors.thinker && event.state === ExecutionState.STEP_START) {
  setAgentStatuses([
    { type: 'thinker', status: 'running', message: 'Analyzing...' },
    { type: 'navigation', status: 'pending' },
    { type: 'system', status: 'pending' }
  ]);
}

// When thinker completes
if (event.actor === Actors.thinker && event.state === ExecutionState.STEP_OK) {
  setAgentStatuses(prev =>
    prev.map(a => a.type === 'thinker' ? { ...a, status: 'completed' } : a)
  );
  // Start navigation
  setAgentStatuses(prev =>
    prev.map(a => a.type === 'navigation' ? { ...a, status: 'running' } : a)
  );
}

// Similar for navigation → system completion
```

## Step 4: Render Tabs at Top

```tsx
{/* Browser Tabs - at very top */}
<div className={`border-b flex overflow-x-auto gap-1 p-2 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
  {tabs.map((tab) => (
    <div key={tab.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs shrink-0 ${isDarkMode ? 'bg-slate-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
      {tab.favicon && <img src={tab.favicon} alt="" className="h-3 w-3 rounded" />}
      <span className="max-w-[80px] truncate">{new URL(tab.url).hostname.replace('www.', '')}</span>
    </div>
  ))}
</div>

{/* Chat Input */}
<ChatInput {...props} />

{/* Agent Status Display */}
{agentStatuses.length > 0 && (
  <div className={`text-xs space-y-1 px-3 py-2 ${isDarkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-gray-100 border-b border-gray-200'}`}>
    {agentStatuses.map((agent) => (
      <div key={agent.type} className="flex items-center gap-2">
        {agent.type === 'thinker' && <span>🧠</span>}
        {agent.type === 'navigation' && <span>🤖</span>}
        {agent.type === 'system' && <span>⚙️</span>}
        
        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
          {agent.type === 'thinker' ? 'Thinker' : agent.type === 'navigation' ? 'Navigator' : 'System'}:
        </span>
        
        {agent.status === 'running' ? (
          <ShinyText text="running..." speed={2} className="text-yellow-400" />
        ) : agent.status === 'completed' ? (
          <span className="text-green-400">✓</span>
        ) : agent.status === 'error' ? (
          <span className="text-red-400">✗</span>
        ) : (
          <span className="text-gray-400">○</span>
        )}
        
        {agent.message && <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>({agent.message})</span>}
      </div>
    ))}
  </div>
)}

{/* Message List */}
<MessageList messages={messages} isDarkMode={isDarkMode} />

{/* Action Buttons */}
<div className="flex gap-2 p-2">
  <button
    onClick={() => setShowSummarize(true)}
    className={`flex-1 px-3 py-2 text-sm rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
  >
    📄 Summarize
  </button>
  <button
    onClick={() => console.log('Done clicked. Selected URL:', selectedTabUrl)}
    className={`flex-1 px-3 py-2 text-sm rounded ${isDarkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
  >
    ✓ Done
  </button>
</div>

{/* Summary Modal */}
{showSummarize && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2">
    <div className={`rounded-lg shadow-xl max-h-[80vh] w-full max-w-md overflow-auto ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Modal Header */}
      <div className={`flex items-center justify-between border-b p-3 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-100'}`}>
        <h2 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          📄 AI Summary
        </h2>
        <button onClick={() => setShowSummarize(false)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}>
          ✕
        </button>
      </div>

      {/* Summaries List */}
      <div className="space-y-2 p-3">
        {tabSummaries.map((summary) => (
          <div
            key={summary.tabId}
            onClick={() => setSelectedTabUrl(summary.url)}
            className={`cursor-pointer rounded border-2 p-2 transition-all ${
              selectedTabUrl === summary.url
                ? isDarkMode
                  ? 'border-blue-500 bg-slate-800'
                  : 'border-blue-400 bg-blue-50'
                : isDarkMode
                  ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-2">
              {summary.favicon && <img src={summary.favicon} alt="" className="h-4 w-4 rounded flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {summary.title}
                </p>
                <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {summary.url}
                </p>
              </div>
              {selectedTabUrl === summary.url && <span className="text-blue-400">✓</span>}
            </div>
            <p className={`mt-2 text-xs line-clamp-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {summary.summary}
            </p>
          </div>
        ))}
      </div>

      {/* Modal Footer */}
      <div className={`flex gap-2 border-t p-3 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-100'}`}>
        <button
          onClick={() => setShowSummarize(false)}
          className={`flex-1 rounded px-2 py-1 text-xs font-medium ${isDarkMode ? 'bg-slate-700 text-gray-200 hover:bg-slate-600' : 'bg-gray-300 text-gray-800'}`}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            console.log('Selected URL:', selectedTabUrl);
            setShowSummarize(false);
            // Send to AI or process
          }}
          className={`flex-1 rounded px-2 py-1 text-xs font-medium text-white ${isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'}`}
        >
          ✓ Done
        </button>
      </div>
    </div>
  </div>
)}
```

## Step 5: Get Browser Tabs

Add this useEffect to get tabs:

```tsx
useEffect(() => {
  const fetchTabs = async () => {
    try {
      const currentTabs = await chrome.tabs.query({ currentWindow: true });
      const tabsData = currentTabs.map((tab) => ({
        id: tab.id || 0,
        title: tab.title || 'Untitled',
        url: tab.url || 'about:blank',
        favicon: tab.favIconUrl,
      }));
      // setTabs(tabsData);
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
```

## Summary Output

When user clicks "Done":
- Get `selectedTabUrl`
- Send to AI/process
- Output (6-7 lines):
  ```
  Page Analysis Complete
  URL: https://github.com/...
  Title: GitHub - Where the world builds software
  Summary: GitHub is a platform for version control...
  Status: ✓ Success
  ```

That's it! All integrated into SidePanel.tsx directly. No separate complex components needed.
