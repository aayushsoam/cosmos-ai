# Side Panel Enhancement Guide

## Overview
This guide explains how to integrate the new components into the existing SidePanel component to create an enhanced AI interaction interface.

## New Components Created

### 1. **ShinyText.tsx** ✨
**Purpose**: Animated shimmer text effect like ChatGPT

**Features**:
- Smooth gradient animation
- Customizable speed (default: 3s)
- Can be disabled
- Perfect for "Processing..." status

**Usage**:
```tsx
import { ShinyTextDisplay } from './components/ShinyText';

<ShinyTextDisplay 
  text="Processing..." 
  disabled={false} 
  speed={2} 
  className='text-yellow-400'
/>
```

### 2. **BrowserTabs.tsx** 🔗
**Purpose**: Display all open browser tabs with icons and titles

**Features**:
- Auto-fetches tabs from Chrome API
- Scrollable tabs when many are open
- Shows favicon for each tab
- Can close tabs directly
- Responsive design

**Data Structure**:
```tsx
interface BrowserTab {
  id: number;
  title: string;
  url: string;
  favicon?: string;
}
```

**Usage**:
```tsx
import BrowserTabs from './components/BrowserTabs';

<BrowserTabs 
  isDarkMode={true}
  onTabSelect={(tab) => console.log(tab)}
  onTabClose={(tabId) => console.log(tabId)}
/>
```

### 3. **AgentStatus.tsx** 🤖
**Purpose**: Show real-time status of Thinker, Navigator, System agents

**Features**:
- Icon for each agent
- Status: pending, running, completed, error
- Shiny text for "running" state
- Message display
- Progress bar animation
- Sequential flow indicator

**Data Structure**:
```tsx
interface AgentStatusItem {
  type: 'thinker' | 'system' | 'navigation';
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}
```

**Usage**:
```tsx
import AgentStatus from './components/AgentStatus';

const agentStatuses: AgentStatusItem[] = [
  { type: 'thinker', status: 'running', message: 'Analyzing task...' },
  { type: 'navigation', status: 'pending' },
  { type: 'system', status: 'pending' }
];

<AgentStatus agents={agentStatuses} isDarkMode={true} />
```

### 4. **SummarizePage.tsx** 📄
**Purpose**: Modal to show AI-generated summaries of all tabs

**Features**:
- Modal overlay with summaries
- Selectable tabs (default: first tab)
- Shows title, URL, and favicon
- Key points display
- Done button to confirm selection
- Returns selected URL

**Data Structure**:
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

**Usage**:
```tsx
import SummarizePage from './components/SummarizePage';

const summaries: TabSummary[] = [
  {
    tabId: 1,
    title: "Example",
    url: "https://example.com",
    summary: "This page contains...",
    key_points: ["Point 1", "Point 2"]
  }
];

<SummarizePage 
  tabSummaries={summaries}
  isDarkMode={true}
  onClose={() => {}}
  onDone={(url) => console.log(url)}
/>
```

---

## Integration with SidePanel

### Step 1: Import Components

Add to `SidePanel.tsx`:
```tsx
import BrowserTabs from './components/BrowserTabs';
import AgentStatus, { type AgentStatusItem } from './components/AgentStatus';
import SummarizePage, { type TabSummary } from './components/SummarizePage';
```

### Step 2: Add State Variables

```tsx
const [agentStatuses, setAgentStatuses] = useState<AgentStatusItem[]>([]);
const [showSummarize, setShowSummarize] = useState(false);
const [tabSummaries, setTabSummaries] = useState<TabSummary[]>([]);
const [selectedTabUrl, setSelectedTabUrl] = useState<string | null>(null);
```

### Step 3: Update Message Handling

In your message handler, update agent statuses:

```tsx
const handleTaskState = useCallback(
  (event: AgentEvent) => {
    // ... existing code ...
    
    // Update agent status based on event
    if (event.actor === Actors.thinker) {
      setAgentStatuses(prev => [
        ...prev.filter(a => a.type !== 'thinker'),
        {
          type: 'thinker',
          status: 'running',
          message: event.data?.details || 'Thinking...'
        }
      ]);
    }
    // ... handle other actors ...
  },
  []
);
```

### Step 4: Update Layout

```tsx
return (
  <div className={`flex flex-col h-full ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
    {/* Browser Tabs - at the top */}
    <BrowserTabs isDarkMode={isDarkMode} />
    
    {/* Agent Status */}
    {agentStatuses.length > 0 && (
      <AgentStatus agents={agentStatuses} isDarkMode={isDarkMode} />
    )}
    
    {/* Message List */}
    <MessageList messages={messages} isDarkMode={isDarkMode} />
    
    {/* Chat Input */}
    <ChatInput 
      onSendMessage={onSendMessage}
      disabled={!inputEnabled}
      isDarkMode={isDarkMode}
    />
    
    {/* Done Button */}
    <button
      onClick={() => {
        // Fetch summaries and show modal
        fetchTabSummaries();
        setShowSummarize(true);
      }}
      className="m-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
    >
      ✓ Done
    </button>
    
    {/* Summarize Modal */}
    {showSummarize && (
      <SummarizePage
        tabSummaries={tabSummaries}
        isDarkMode={isDarkMode}
        onClose={() => setShowSummarize(false)}
        onDone={(url) => {
          console.log('Selected URL:', url);
          setSelectedTabUrl(url);
          // Send to AI or process as needed
        }}
      />
    )}
  </div>
);
```

---

## Component Layout Flow

```
┌─────────────────────────────────────┐
│     Browser Tabs (scrollable)        │  ← Shows all open browser tabs
├─────────────────────────────────────┤
│   Chat Input Box (user message)      │  ← Textarea for user input
├─────────────────────────────────────┤
│   Agent Status Display               │  ← Shows: Thinker → Navigation → System
│   [🧠 Thinker]  [Processing...]     │     with shiny text effect
│   [🤖 Navigator] [Pending...]       │
│   [⚙️ System]    [Pending...]       │
├─────────────────────────────────────┤
│   Message List                       │  ← Chat history
│   (scrollable)                       │
├─────────────────────────────────────┤
│ [Cancel] [Summarize] [✓ Done]       │  ← Action buttons
└─────────────────────────────────────┘

When "Done" is clicked:
┌─────────────────────────────────────┐
│        Summary Modal Opens           │
├─────────────────────────────────────┤
│ ☐ Tab 1: Title - summary text...    │
│ ☒ Tab 2: Title - summary text...    │  ← Selected
│ ☐ Tab 3: Title - summary text...    │
├─────────────────────────────────────┤
│            [Cancel]  [✓ Done]       │
└─────────────────────────────────────┘
```

---

## Event Flow

```
User Input
    ↓
BrowserTabs (shows context)
    ↓
ChatInput (accepts message)
    ↓
Send Message to Background
    ↓
AgentStatus Updates:
  1. Thinker (running) → Completed
  2. Navigation (running) → Completed
  3. System (running) → Completed
    ↓
Messages Display
    ↓
User Clicks "Done"
    ↓
SummarizePage Opens
    ↓
User Selects Tab & Clicks "Done"
    ↓
Selected URL Returned
```

---

## Styling Considerations

### Dark Mode Colors
```tsx
// Background
bg-black  // Main background
bg-black  // Secondary surface
bg-black  // Tertiary surface

// Text
text-white    // Primary text
text-gray-300 // Secondary text
text-gray-400 // Tertiary text

// Borders
border-slate-700

// Status Colors
text-yellow-400  // Running (with shiny effect)
text-green-400   // Completed
text-red-400     // Error
```

### Small Components
- Icons: `h-4 w-4` or `h-5 w-5`
- Padding: `p-2` or `p-3` (small)
- Text: `text-xs` or `text-sm`
- All components designed to be compact

---

## Tips & Best Practices

### 1. Agent Status Management
```tsx
// Update when task starts
const startTask = () => {
  setAgentStatuses([
    { type: 'thinker', status: 'running', message: 'Analyzing...' },
    { type: 'navigation', status: 'pending' },
    { type: 'system', status: 'pending' }
  ]);
};

// Update as agents complete
const completeAgent = (agentType: AgentType) => {
  setAgentStatuses(prev =>
    prev.map(a =>
      a.type === agentType ? { ...a, status: 'completed' } : a
    )
  );
};
```

### 2. Browser Tabs Caching
```tsx
// Tab data is auto-fetched from Chrome API
// But you can cache it for faster display
const [cachedTabs, setCachedTabs] = useState<BrowserTab[]>([]);

// Update cache when tabs change
const handleTabSelect = (tab: BrowserTab) => {
  setCachedTabs(prev => 
    [tab, ...prev.filter(t => t.id !== tab.id)]
  );
};
```

### 3. Summary Generation
```tsx
// Generate summaries using AI
const generateSummaries = async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  
  const summaries: TabSummary[] = await Promise.all(
    tabs.map(async (tab) => ({
      tabId: tab.id || 0,
      title: tab.title || 'Untitled',
      url: tab.url || '',
      favicon: tab.favIconUrl,
      summary: await callAI(`Summarize this page: ${tab.url}`),
      key_points: [] // Optional
    }))
  );
  
  setTabSummaries(summaries);
  setShowSummarize(true);
};
```

### 4. Message Formatting
```tsx
// Keep messages clean and organized
const appendMessage = (newMessage: Message) => {
  // Filter out progress messages (keep only user/assistant)
  setMessages(prev => 
    prev.filter(m => !m.isProgress)
      .concat(newMessage)
  );
};
```

---

## Testing Checklist

- [ ] Browser tabs display correctly
- [ ] Agent status updates in real-time
- [ ] Shiny text effect is smooth
- [ ] Summary modal opens/closes properly
- [ ] Tab selection works in summary
- [ ] Done button returns correct URL
- [ ] All dark mode colors are correct
- [ ] Components are responsive
- [ ] No layout shifts when showing/hiding
- [ ] Performance is good with multiple tabs

---

## Browser Permissions Required

Add to `manifest.json` if not already present:

```json
{
  "permissions": [
    "tabs",
    "activeTab",
    "scripting"
  ]
}
```

---

## Performance Notes

- **BrowserTabs**: Auto-updates via Chrome API listeners (minimal performance impact)
- **AgentStatus**: Renders frequently during processing (optimized with React.memo)
- **SummarizePage**: Modal only renders when shown
- **ShinyText**: Hardware-accelerated CSS animation

All components use virtualization where applicable for smooth performance.

---

## Future Enhancements

1. Add keyboard shortcuts (Cmd+Done)
2. Add export summary to PDF
3. Add tab filtering/search
4. Add agent performance metrics
5. Add undo/redo for actions
6. Add dark/light mode toggle

---

**Component Status**: ✅ Ready for Integration
