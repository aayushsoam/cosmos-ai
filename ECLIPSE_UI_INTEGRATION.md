# Eclipse UI Integration Guide

## Overview
The Eclipse UI design has been copied from the source project and integrated into the Cosmos AI project. All UI components, styles, and assets are now available.

## Files Created/Copied

### 1. CSS Styles
- **Location**: `pages/side-panel/src/styles/eclipse-ui.css`
- **Description**: Complete Eclipse UI styles including dark mode, animations, and all component styles
- **Status**: ✅ Created and ready to use

### 2. Components Created
- **EclipseHeader.tsx**: Header component with logo and title
- **EclipseContent.tsx**: Main content area with welcome message and chat messages
- **EclipseFooter.tsx**: Footer with input field, context buttons, mode selector, and submit button
- **EclipseMessageItem.tsx**: Individual message item component with editing support

### 3. Icons/Assets
- **Location**: `pages/side-panel/public/icons/`
- **Icons Copied**:
  - cosmos_logo.png
  - agent-mode-icon-2.svg
  - ask-icon.svg
  - checkmark.svg
  - delete.svg
  - logo.svg
  - select-tabs-icon.svg
  - submit-btn-icon.svg
  - tab.svg

## How to Use Eclipse UI

### Step 1: Import CSS
Add this to your `index.css` or `SidePanel.tsx`:
```typescript
import './styles/eclipse-ui.css';
```

### Step 2: Import Components
```typescript
import EclipseHeader from './components/EclipseHeader';
import EclipseContent from './components/EclipseContent';
import EclipseFooter from './components/EclipseFooter';
```

### Step 3: Use in Your Component
Replace your existing UI structure with:

```typescript
return (
  <div className="sidebar-container">
    <EclipseHeader 
      hasStartedChat={messages.length > 0} 
      title="Cosmos AI" 
    />
    <EclipseContent 
      messages={messages}
      isTyping={isTyping}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      welcomeMessage="Plan, search, do anything..."
      onChatStart={() => setHasStartedChat(true)}
    />
    <EclipseFooter
      onSendMessage={handleSendMessage}
      selectedTabs={selectedTabs}
      tabs={tabs}
      showCurrentTabIndicator={showCurrentTabIndicator}
      currentActiveTab={currentActiveTab}
      onRemoveTab={handleRemoveTab}
      onRemoveCurrentTab={handleRemoveCurrentTab}
      totalSelected={totalSelected}
      maxLimit={5}
      disabled={!inputEnabled}
    />
  </div>
);
```

## Features Included

### ✅ UI Design
- Minimalist dark mode design
- Smooth animations and transitions
- Responsive layout
- Beautiful message bubbles
- Context dropdown with tab selection
- Mode selector (Agent/Ask)
- Tab indicators with favicons

### ✅ Buttons & Interactions
- Submit button (circular, changes color when content exists)
- Context button (@ Add Context)
- Mode selector dropdown
- Tab selection indicators
- Message editing (click to edit user messages)
- Hover effects on all interactive elements

### ✅ Styling
- Dark theme (#141414 background, #1a1a1a cards)
- Green accent color (#00ff88) for code and links
- Smooth transitions
- Typing indicators
- Markdown rendering support
- Table styling
- Code block styling

## Component Props

### EclipseHeader
- `hasStartedChat?: boolean` - Show logo when chat has started
- `title?: string` - Header title (default: "Cosmos AI")

### EclipseContent
- `messages?: Message[]` - Array of messages to display
- `isTyping?: boolean` - Show typing indicator
- `isStreaming?: boolean` - Show streaming indicator
- `streamingContent?: string` - Streaming content HTML
- `welcomeMessage?: string` - Welcome message text
- `onChatStart?: () => void` - Callback when chat starts

### EclipseFooter
- `onSendMessage?: (text: string, mode?: string) => void` - Send message handler
- `selectedTabs?: Tab[]` - Selected tabs array
- `tabs?: Tab[]` - All available tabs
- `showCurrentTabIndicator?: boolean` - Show current tab indicator
- `currentActiveTab?: Tab | null` - Current active tab
- `onRemoveTab?: (tabId: number) => void` - Remove tab handler
- `onRemoveCurrentTab?: () => void` - Remove current tab handler
- `totalSelected?: number` - Total selected tabs count
- `maxLimit?: number` - Maximum tab selection limit
- `disabled?: boolean` - Disable input

### EclipseMessageItem
- `message: Message` - Message object
- `isEditing?: boolean` - Is message in edit mode
- `onStartEdit?: (id: string, content: string) => void` - Start editing
- `onUpdateContent?: (content: string) => void` - Update content
- `onBlur?: () => void` - Cancel edit
- `onConfirm?: () => void` - Confirm edit
- `onCancel?: () => void` - Cancel edit
- `editRef?: React.RefObject<HTMLSpanElement>` - Edit input ref

## Next Steps

1. **Integrate with existing SidePanel**: Update `SidePanel.tsx` to use Eclipse components
2. **Connect handlers**: Wire up the event handlers to your existing logic
3. **Test functionality**: Test all features including tab selection, message editing, etc.
4. **Customize**: Adjust colors, spacing, or add additional features as needed

## Notes

- The Eclipse UI uses a fixed footer design
- Message editing is supported for user messages (click to edit)
- Tab selection supports up to 5 tabs by default
- All icons are in SVG format for crisp display
- The design is fully responsive and works on different screen sizes

