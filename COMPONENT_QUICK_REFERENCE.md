# Component Quick Reference

## 🚀 Quick Start

All new components are ready in `pages/side-panel/src/components/`:

```
✅ ShinyText.tsx          - Animated shimmer text effect
✅ BrowserTabs.tsx        - Browser tabs display
✅ AgentStatus.tsx        - Agent status indicators
✅ SummarizePage.tsx      - Summary modal
```

---

## 📋 Component Matrix

| Component | Purpose | Location | Status |
|-----------|---------|----------|--------|
| **ShinyText** | Animated text | `components/ShinyText.tsx` | ✅ Ready |
| **BrowserTabs** | Tab display | `components/BrowserTabs.tsx` | ✅ Ready |
| **AgentStatus** | Agent indicators | `components/AgentStatus.tsx` | ✅ Ready |
| **SummarizePage** | Summary modal | `components/SummarizePage.tsx` | ✅ Ready |

---

## 1️⃣ ShinyText Component

### Import
```tsx
import { ShinyTextDisplay } from './components/ShinyText';
```

### Usage
```tsx
<ShinyTextDisplay 
  text="Processing..." 
  disabled={false} 
  speed={2}
  className='text-yellow-400 text-sm'
/>
```

### Props
```tsx
{
  text: string              // Text to display
  disabled?: boolean        // Disable animation (default: false)
  speed?: number           // Animation speed in seconds (default: 3)
  className?: string       // Additional Tailwind classes
}
```

### Example: Status Display
```tsx
{status === 'processing' ? (
  <ShinyTextDisplay text="Processing..." speed={2} />
) : (
  <span>Completed ✓</span>
)}
```

---

## 2️⃣ BrowserTabs Component

### Import
```tsx
import BrowserTabs from './components/BrowserTabs';
```

### Usage
```tsx
<BrowserTabs 
  isDarkMode={true}
  onTabSelect={(tab) => handleTabClick(tab)}
  onTabClose={(tabId) => handleTabClose(tabId)}
/>
```

### Props
```tsx
{
  isDarkMode?: boolean                    // Dark mode styling
  onTabSelect?: (tab: BrowserTab) => void // When tab clicked
  onTabClose?: (tabId: number) => void   // When close clicked
}
```

### Data Type
```tsx
interface BrowserTab {
  id: number;
  title: string;
  url: string;
  favicon?: string;
}
```

### Features
- ✅ Auto-fetches from Chrome API
- ✅ Scrollable when many tabs
- ✅ Shows favicons
- ✅ Close button
- ✅ Responsive design

---

## 3️⃣ AgentStatus Component

### Import
```tsx
import AgentStatus, { type AgentStatusItem } from './components/AgentStatus';
```

### Usage
```tsx
const agents: AgentStatusItem[] = [
  { type: 'thinker', status: 'running', message: 'Analyzing...' },
  { type: 'navigation', status: 'pending' },
  { type: 'system', status: 'pending' }
];

<AgentStatus agents={agents} isDarkMode={true} />
```

### Props
```tsx
{
  agents: AgentStatusItem[]  // Array of agent statuses
  isDarkMode?: boolean       // Dark mode styling
}
```

### Data Type
```tsx
interface AgentStatusItem {
  type: 'thinker' | 'system' | 'navigation'
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
}
```

### Status Flow
```
1. Thinker (pending) → running → completed ✓
2. Navigation (pending) → running → completed ✓
3. System (pending) → running → completed ✓
```

### Features
- ✅ Icons for each agent (🧠 🤖 ⚙️)
- ✅ Shiny text for running state
- ✅ Progress bar animation
- ✅ Sequential indicator
- ✅ Color-coded status

---

## 4️⃣ SummarizePage Component

### Import
```tsx
import SummarizePage, { type TabSummary } from './components/SummarizePage';
```

### Usage
```tsx
const summaries: TabSummary[] = [
  {
    tabId: 1,
    title: "Example Site",
    url: "https://example.com",
    favicon: "https://...",
    summary: "This page contains important information about...",
    key_points: [
      "Point 1: Key information",
      "Point 2: Another detail",
      "Point 3: Third point"
    ]
  },
  // ... more tabs
];

{showSummarize && (
  <SummarizePage 
    tabSummaries={summaries}
    isDarkMode={true}
    onClose={() => setShowSummarize(false)}
    onDone={(url) => {
      console.log('Selected:', url);
      // Process URL
    }}
  />
)}
```

### Props
```tsx
{
  tabSummaries: TabSummary[]           // Array of summaries
  isDarkMode?: boolean                 // Dark mode styling
  onClose?: () => void                 // Close button handler
  onDone?: (url: string) => void      // Done button handler
}
```

### Data Type
```tsx
interface TabSummary {
  tabId: number;
  title: string;
  url: string;
  favicon?: string;
  summary: string;
  key_points?: string[];
}
```

### Features
- ✅ Modal overlay
- ✅ Tab selection
- ✅ Shows favicon + title + URL
- ✅ Key points display
- ✅ Done button returns URL
- ✅ Responsive layout

---

## 🔄 Integration Pattern

### Step 1: Import All Components
```tsx
import BrowserTabs from './components/BrowserTabs';
import AgentStatus, { type AgentStatusItem } from './components/AgentStatus';
import SummarizePage, { type TabSummary } from './components/SummarizePage';
import { ShinyTextDisplay } from './components/ShinyText';
```

### Step 2: Add State
```tsx
const [agentStatuses, setAgentStatuses] = useState<AgentStatusItem[]>([]);
const [showSummarize, setShowSummarize] = useState(false);
const [tabSummaries, setTabSummaries] = useState<TabSummary[]>([]);
```

### Step 3: Update Agent Status
```tsx
// When task starts
setAgentStatuses([
  { type: 'thinker', status: 'running', message: 'Analyzing task...' },
  { type: 'navigation', status: 'pending' },
  { type: 'system', status: 'pending' }
]);

// When thinker completes
setAgentStatuses(prev =>
  prev.map(a => a.type === 'thinker' ? { ...a, status: 'completed' } : a)
);

// When navigator starts
setAgentStatuses(prev =>
  prev.map(a => a.type === 'navigation' ? { ...a, status: 'running' } : a)
);
```

### Step 4: Render Layout
```tsx
return (
  <div className="flex flex-col h-full">
    {/* Tabs at top */}
    <BrowserTabs isDarkMode={true} />
    
    {/* Chat input */}
    <ChatInput {...props} />
    
    {/* Agent status during processing */}
    {agentStatuses.length > 0 && (
      <AgentStatus agents={agentStatuses} isDarkMode={true} />
    )}
    
    {/* Messages */}
    <MessageList messages={messages} />
    
    {/* Done button */}
    <button onClick={() => setShowSummarize(true)}>
      ✓ Done
    </button>
    
    {/* Summary modal */}
    {showSummarize && (
      <SummarizePage
        tabSummaries={tabSummaries}
        isDarkMode={true}
        onClose={() => setShowSummarize(false)}
        onDone={(url) => console.log('Selected:', url)}
      />
    )}
  </div>
);
```

---

## 🎨 Dark Mode Support

All components support dark mode out of the box:

```tsx
// Light mode
<Component isDarkMode={false} />

// Dark mode (default)
<Component isDarkMode={true} />

// Or detect from preference
<Component isDarkMode={isDarkMode} />
```

### Color Palette
```tsx
// Dark mode
bg-black   // Main background
bg-black   // Secondary
border-slate-700
text-white
text-gray-300  // Secondary text

// Status colors (both modes)
text-yellow-400  // Running/Processing
text-green-400   // Completed
text-red-400     // Error
```

---

## 🎯 Common Patterns

### Pattern 1: Sequential Agent Execution
```tsx
const executeTask = async () => {
  // Start thinker
  setAgentStatuses([
    { type: 'thinker', status: 'running' },
    { type: 'navigation', status: 'pending' },
    { type: 'system', status: 'pending' }
  ]);
  
  await processThinker(); // Wait
  
  // Thinker done, start navigator
  setAgentStatuses(p => p.map(a => 
    a.type === 'thinker' ? { ...a, status: 'completed' }
    : a.type === 'navigation' ? { ...a, status: 'running' }
    : a
  ));
  
  await processNavigator(); // Wait
  
  // Navigator done, start system
  setAgentStatuses(p => p.map(a => 
    a.type === 'navigation' ? { ...a, status: 'completed' }
    : a.type === 'system' ? { ...a, status: 'running' }
    : a
  ));
  
  await processSystem(); // Wait
  
  // All done
  setAgentStatuses(p => p.map(a => ({ ...a, status: 'completed' })));
};
```

### Pattern 2: Generate Summaries
```tsx
const handleDone = async () => {
  // Get all tabs
  const tabs = await chrome.tabs.query({ currentWindow: true });
  
  // Generate summaries
  const summaries: TabSummary[] = await Promise.all(
    tabs.map(async (tab) => ({
      tabId: tab.id || 0,
      title: tab.title || 'Untitled',
      url: tab.url || '',
      favicon: tab.favIconUrl,
      // Call your AI to generate summary
      summary: await aiService.summarize(tab.url),
    }))
  );
  
  setTabSummaries(summaries);
  setShowSummarize(true);
};
```

### Pattern 3: Handle Summary Selection
```tsx
const handleSummaryDone = async (selectedUrl: string) => {
  // Close modal
  setShowSummarize(false);
  
  // Send to AI or process
  await processSelectedPage(selectedUrl);
  
  // Show result
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: `Processing: ${selectedUrl}`
  }]);
};
```

---

## 🐛 Troubleshooting

### Components not showing?
- ✅ Check imports are correct
- ✅ Verify isDarkMode prop
- ✅ Check console for errors
- ✅ Verify data types match interfaces

### Shiny text not animating?
- ✅ Check disabled prop is false
- ✅ Verify CSS animations are enabled
- ✅ Check browser support for CSS animations
- ✅ Try changing speed prop

### Agent status not updating?
- ✅ Verify state is being updated
- ✅ Check component receives updated agents array
- ✅ Use React DevTools to inspect state

### Browser tabs not showing?
- ✅ Check tabs permission in manifest.json
- ✅ Verify window has open tabs
- ✅ Check console for Chrome API errors

---

## 📊 Performance Tips

1. **Memoize components**: Use `React.memo()` for expensive renders
2. **Lazy load summaries**: Generate on demand, not upfront
3. **Debounce updates**: Avoid updating status too frequently
4. **Virtual scroll**: For many messages, consider virtualization
5. **Use keys**: Proper React keys for lists

---

## 🎓 Learning Resources

- **Tailwind CSS**: https://tailwindcss.com
- **React Hooks**: https://react.dev/reference/react
- **Chrome Extensions API**: https://developer.chrome.com/docs/extensions
- **Icons**: react-icons documentation

---

## ✨ Complete Example

```tsx
import { useState, useCallback } from 'react';
import BrowserTabs from './components/BrowserTabs';
import AgentStatus, { type AgentStatusItem } from './components/AgentStatus';
import SummarizePage, { type TabSummary } from './components/SummarizePage';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';

export const EnhancedSidePanel = () => {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatusItem[]>([]);
  const [showSummarize, setShowSummarize] = useState(false);
  const [tabSummaries, setTabSummaries] = useState<TabSummary[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const handleSendMessage = useCallback(async (text: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    // Update agent status
    setAgentStatuses([
      { type: 'thinker', status: 'running', message: 'Analyzing...' },
      { type: 'navigation', status: 'pending' },
      { type: 'system', status: 'pending' }
    ]);
    
    // Process message (your implementation)
    // ...
  }, []);

  const handleDone = useCallback(async () => {
    // Generate summaries (your implementation)
    const summaries: TabSummary[] = [];
    setTabSummaries(summaries);
    setShowSummarize(true);
  }, []);

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <BrowserTabs isDarkMode={true} />
      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={false}
        isDarkMode={true}
      />
      {agentStatuses.length > 0 && (
        <AgentStatus agents={agentStatuses} isDarkMode={true} />
      )}
      <MessageList messages={messages} isDarkMode={true} />
      <button 
        onClick={handleDone}
        className="m-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
      >
        ✓ Done
      </button>
      {showSummarize && (
        <SummarizePage
          tabSummaries={tabSummaries}
          isDarkMode={true}
          onClose={() => setShowSummarize(false)}
          onDone={(url) => console.log('Selected:', url)}
        />
      )}
    </div>
  );
};

export default EnhancedSidePanel;
```

---

**Status**: ✅ All Components Ready  
**Last Updated**: November 11, 2025  
**Version**: 1.0
