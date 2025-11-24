// Glowing border effect for task execution
let borderElement: HTMLDivElement | null = null;
let outerGlowElement: HTMLDivElement | null = null;

export function showGlowingBorder() {
  console.log('[NanoBrowser] showGlowingBorder called');
  try {
    if (borderElement) {
      console.log('[NanoBrowser] Border already showing');
      return; // Already showing
    }

    // Ensure document body exists
    if (!document.body) {
      console.warn('[NanoBrowser] Document body not available, retrying...');
      setTimeout(showGlowingBorder, 100);
      return;
    }

    // Create outer glow element (for outer glow effect)
    outerGlowElement = document.createElement('div');
    outerGlowElement.id = 'nano-browser-outer-glow';
    Object.assign(outerGlowElement.style, {
      position: 'fixed',
      top: '-10px',
      left: '-10px',
      right: '-10px',
      bottom: '-10px',
      pointerEvents: 'none',
      zIndex: '2147483646',
      borderRadius: '0px',
      boxShadow: '0 0 60px rgba(59, 130, 246, 0.9), 0 0 100px rgba(59, 130, 246, 0.6)',
      animation: 'nano-outer-glow 3s ease-in-out infinite',
    });

    // Create main border element
    borderElement = document.createElement('div');
    borderElement.id = 'nano-browser-glow';

    // Apply styles with enhanced visibility
    Object.assign(borderElement.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      pointerEvents: 'none',
      zIndex: '2147483647', // Max z-index
      border: '3px solid rgba(59, 130, 246, 0.8)',
      borderRadius: '0px',
      boxShadow:
        'inset 0 0 30px rgba(59, 130, 246, 0.8), inset 0 0 60px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.8)',
      animation: 'nano-glow-pulse 2s ease-in-out infinite',
    });

    // Add keyframes animation
    if (!document.getElementById('nano-glow-animation')) {
      const style = document.createElement('style');
      style.id = 'nano-glow-animation';
      style.textContent = `
        @keyframes nano-glow-pulse {
          0%, 100% {
            box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.6), inset 0 0 40px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.6);
            border-color: rgba(59, 130, 246, 0.6);
          }
          50% {
            box-shadow: inset 0 0 40px rgba(59, 130, 246, 1), inset 0 0 80px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 1);
            border-color: rgba(59, 130, 246, 1);
          }
        }
        
        @keyframes nano-outer-glow {
          0%, 100% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 80px rgba(59, 130, 246, 0.9), 0 0 120px rgba(59, 130, 246, 0.6);
          }
        }
        
        /* Ensure the border is always on top */
        #nano-browser-outer-glow, #nano-browser-glow {
          position: fixed !important;
          pointer-events: none !important;
          z-index: 2147483647 !important; /* Max z-index */
        }
      `;
      document.head.appendChild(style);
      console.log('[NanoBrowser] Added glow animation styles');
    }

    document.body.appendChild(outerGlowElement);
    document.body.appendChild(borderElement);
    console.log('[NanoBrowser] Glowing border elements added to DOM');
  } catch (error) {
    console.error('[NanoBrowser] Error showing glowing border:', error);
  }
}

export function hideGlowingBorder() {
  if (borderElement) {
    borderElement.remove();
    borderElement = null;
  }
  if (outerGlowElement) {
    outerGlowElement.remove();
    outerGlowElement = null;
  }
  console.log('[NanoBrowser] Glowing border elements removed from DOM');
}

// Function to handle task start
function handleTaskStart() {
  console.log('[NanoBrowser] Showing glowing border');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[NanoBrowser] DOM loaded, showing border');
      showGlowingBorder();
    });
  } else {
    console.log('[NanoBrowser] DOM already loaded, showing border immediately');
    showGlowingBorder();
  }
}

// Function to handle task end
function handleTaskEnd() {
  console.log('[NanoBrowser] Hiding glowing border');
  hideGlowingBorder();
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  console.log('[NanoBrowser] Received message:', message);
  try {
    if (message.type === 'task_start') {
      handleTaskStart();
    } else if (message.type === 'task_end') {
      handleTaskEnd();
    }
  } catch (error) {
    console.error('[NanoBrowser] Error in message handler:', error);
  }
  return true; // Keep the message channel open for async response
});

// Check if we should show the border when the script loads
chrome.runtime.sendMessage({ type: 'check_task_status' }, response => {
  if (chrome.runtime.lastError) {
    console.warn('[NanoBrowser] Could not check task status:', chrome.runtime.lastError);
    return;
  }
  if (response && response.isTaskRunning) {
    console.log('[NanoBrowser] Task is already running, showing border');
    handleTaskStart();
  }
});
