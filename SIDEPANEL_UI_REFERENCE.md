# Enhanced SidePanel UI - Visual Reference Guide

## Main Chat Interface Layout

```
┌──────────────────────────────────────────────────┐
│  ◀ Back/New Chat   History   Settings           │  ← Header
├──────────────────────────────────────────────────┤
│ [Google] [GitHub] [StackOF] [Reddit] →           │  ← Browser Tabs (scrollable)
├──────────────────────────────────────────────────┤
│ 💬 Type your message here...        🎤 ▶ Stop   │  ← Chat Input
├──────────────────────────────────────────────────┤
│ 🧠 Thinker: running...                          │  ← Agent Status
│ 🤖 Navigator: ○                                 │     (Shiny animation on running)
│ ⚙️  System: ○                                   │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Previous messages here...]                    │  ← Message List
│                                                  │  (scrollable area)
│  User: What is on this page?                    │
│  Agent: This page is a Q&A platform...          │
│                                                  │
├──────────────────────────────────────────────────┤
│ [📄 Summarize]              [✓ Done]            │  ← Action Buttons
└──────────────────────────────────────────────────┘
```

## Browser Tabs Display

When hovering over tabs:
```
┌──────────────────────────────────────────────────┐
│ [G] google.com  [G] github.com  [S] stackoverflow.com  [R] reddit.com →│
│  ▲              ▲                  ▲                      ▲
│  │              │                  │                      │
│  └──────────────┴──────────────────┴──────────────────────┘
│  Hover effect: Darker background
│  
│ - Favicon (3x3 px) shown if available
│ - Domain name without www.
│ - Small compact style (text-xs)
│ - Horizontally scrollable when many tabs
```

## Agent Status Display Details

```
┌──────────────────────────────────────────────────┐
│ 🧠 Thinker: ✨✨✨ running... ✨✨✨           │
│             └─ Shiny animation effect ─┘
│
│ Shiny effect: Gradient shimmer moving across text
│ Animation speed: 2s (configurable)
│ Color: Yellow-400 (#FACC15)
├──────────────────────────────────────────────────┤
│ 🤖 Navigator: ○                                  │
│              └─ Gray circle (pending)
│
│ Gray color: text-gray-400 (#9CA3AF)
├──────────────────────────────────────────────────┤
│ ⚙️  System: ○                                    │
│            └─ Gray circle (pending)
└──────────────────────────────────────────────────┘

Status Indicators:
  running...  → Yellow text with shiny animation
  ✓           → Green checkmark (completed)
  ✗           → Red X (error)
  ○           → Gray circle (pending)
```

## Summarize Modal

When "Summarize" button is clicked:

```
┌─────────────────────────────────────────────────────┐
│  📄 AI Summary                                  [✕]  │ ← Modal Header
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ [G] Google                                  │   │
│  │ google.com                                  │   │
│  │ Summary: Google is a search engine that     │   │
│  │ indexes web pages. It uses AI to understand │   │
│  │ user queries...                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ☑ [G] GitHub                            [✓] │   │
│  │ github.com                                  │   │
│  │ Summary: GitHub is a platform for version  │   │
│  │ control and collaboration. It provides Git │   │
│  │ repositories and code hosting...            │   │
│  └─────────────────────────────────────────────┘   │ ← Selected (blue border)
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ [ ] Stack Overflow                          │   │
│  │ stackoverflow.com                           │   │
│  │ Summary: Stack Overflow is a Q&A website    │   │
│  │ for programmers...                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Cancel]                         [✓ Done]         │ ← Modal Footer
└─────────────────────────────────────────────────────┘

Modal Features:
- Fixed overlay with semi-transparent black background
- Max width: 420px (md)
- Max height: 80vh (scrollable)
- Each tab card is clickable to select
- Selected tab has blue border and highlight
- Small checkmark shown on selected tab
```

## Action Buttons

```
┌──────────────────────────────────────────────┐
│ [📄 Summarize]        [✓ Done]              │
│  ▲                     ▲                     │
│  │                     │                     │
│  └─ Blue button        └─ Green button
│     bg-blue-600           bg-green-600
│     Hover: bg-blue-500    Hover: bg-green-500
│
│  Equal width (flex-1)
│  Gap between: 8px
│  Padding: 12px 16px
│  Font size: small
│  Text: white
│  Border radius: 6px
└──────────────────────────────────────────────┘
```

## Dark Mode Colors

All elements use the dark mode palette:

```
Header:          bg-black, text-sky-400
Tabs:            bg-slate-800, text-gray-300, hover: bg-slate-700
Chat Input:      border-sky-900, bg-black
Agent Status:    bg-slate-900, text-gray-300
  Running:       text-yellow-400 (shiny)
  Completed:     text-green-400
  Error:         text-red-400
  Pending:       text-gray-400
Messages:        bg-black, text-sky-300
Buttons:
  Summarize:     bg-blue-600, hover: bg-blue-500
  Done:          bg-green-600, hover: bg-green-500
Modal:           bg-slate-900, border-sky-800
Modal Header:    bg-slate-800, text-white
Selected Tab:    border-blue-500, bg-slate-800
```

## Interaction Flow

### Opening Summarize Modal
```
User clicks "Summarize" button
            ↓
Modal opens with overlay
            ↓
Show list of all tabs with their summaries
            ↓
User clicks on a tab (or one is pre-selected)
            ↓
Tab highlight changes to blue border
            ↓
User clicks "Done" to confirm selection
            ↓
Modal closes, selectedTabUrl is set
```

### Agent Status Updates
```
Task starts
  ↓
Thinker begins (🧠 Thinker: ✨running...✨)
  ↓
Thinker completes (🧠 Thinker: ✓)
  ↓
Navigator begins (🤖 Navigator: ✨running...✨)
  ↓
Navigator completes (🤖 Navigator: ✓)
  ↓
System begins (⚙️  System: ✨running...✨)
  ↓
System completes (⚙️  System: ✓)
  ↓
All statuses cleared when new task starts
```

## Responsive Behavior

```
Small Width (< 400px):
  - Tabs: Single row, more horizontal scroll needed
  - Buttons: Stack if needed, but flex layout maintains
  - Modal: Takes full width with 8px padding
  - Font: text-xs for tabs, text-sm for buttons

Normal Width (400px+):
  - All elements display normally
  - Modal max-width: 420px
  - Good spacing all around
```

## Accessibility Features

- All buttons have clear labels with emojis
- Color combinations meet contrast requirements in dark mode
- Text sizes are readable (min 12px)
- Interactive elements have hover states
- Modal has overlay to focus user attention
- Close button (✕) clearly visible in modal header

## Performance Notes

- Tab fetching happens once on mount
- Tab updates only when chrome.tabs events fire
- Agent status updates tied to existing handleTaskState
- Modal is conditionally rendered (not always in DOM)
- No additional API calls or heavy processing

---

## Summary

The enhanced SidePanel provides:
1. ✅ Browser tabs at top for quick context
2. ✅ Agent status with shiny animation for visual feedback
3. ✅ Summarize modal for tab management
4. ✅ Action buttons for workflow control
5. ✅ Full dark mode support throughout
6. ✅ Responsive and performant design
