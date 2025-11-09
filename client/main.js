/**
 * Main Application
 * Initializes and coordinates all components
 */

// Global instances
let canvasManager;
let wsManager;

/**
 * Initialize the application
 */
function init() {
  console.log('[App] Initializing Collaborative Drawing Canvas...');
  
  // Initialize canvas
  const canvas = document.getElementById('canvas');
  canvasManager = new CanvasManager(canvas);
  window.canvasManager = canvasManager;
  
  // Initialize WebSocket
  wsManager = new WebSocketManager();
  window.wsManager = wsManager;
  
  // Setup WebSocket callbacks
  setupWebSocketCallbacks();
  
  // Setup UI event listeners
  setupUIEventListeners();
  
  // Connect to server
  wsManager.connect();
  
  console.log('[App] Application initialized');
}

/**
 * Setup WebSocket event callbacks
 */
function setupWebSocketCallbacks() {
  // Initial state received
  wsManager.onInitState = (data) => {
    console.log('[App] Loading initial state...');
    
    // Load operations
    canvasManager.loadOperations(data.operations);
    
    // Update users list
    updateUsersList(data.users);
    
    // Update operation counter
    updateOperationCounter();
  };

  // New drawing from another user
  wsManager.onDraw = (operation) => {
    canvasManager.addOperation(operation);
    updateOperationCounter();
  };

  // Undo operation
  wsManager.onUndo = (data) => {
    canvasManager.removeLastOperation();
    updateOperationCounter();
  };

  // Clear canvas
  wsManager.onClear = () => {
    canvasManager.clear();
    updateOperationCounter();
  };

  // User joined
  wsManager.onUserJoined = (userInfo) => {
    showNotification(`${userInfo.username} joined`, 'success');
  };

  // User left
  wsManager.onUserLeft = (data) => {
    showNotification(`User left`, 'info');
  };

  // Users list updated
  wsManager.onUsersUpdate = (users) => {
    updateUsersList(users);
  };

  // Cursor movement
  wsManager.onCursorMove = (data) => {
    wsManager.updateCursor(data.userId, data.username, data.color, data.x, data.y);
  };

  // Connection events
  wsManager.onConnected = () => {
    showNotification('Connected to server', 'success');
  };

  wsManager.onDisconnected = (reason) => {
    showNotification('Disconnected from server', 'error');
  };
}

/**
 * Setup UI event listeners
 */
function setupUIEventListeners() {
  // Tool selection
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Set tool
      const tool = btn.dataset.tool;
      canvasManager.setTool(tool);
      
      // Update cursor style
      const canvas = document.getElementById('canvas');
      if (tool === 'eraser') {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    });
  });

  // Color picker
  const colorPicker = document.getElementById('color-picker');
  colorPicker.addEventListener('input', (e) => {
    canvasManager.setColor(e.target.value);
  });

  // Color presets
  document.querySelectorAll('.color-preset').forEach(preset => {
    preset.addEventListener('click', () => {
      const color = preset.dataset.color;
      canvasManager.setColor(color);
      colorPicker.value = color;
    });
  });

  // Stroke width
  const strokeWidth = document.getElementById('stroke-width');
  const strokeWidthValue = document.getElementById('stroke-width-value');
  strokeWidth.addEventListener('input', (e) => {
    const width = parseInt(e.target.value);
    canvasManager.setStrokeWidth(width);
    strokeWidthValue.textContent = width;
  });

  // Undo button
  document.getElementById('undo-btn').addEventListener('click', () => {
    wsManager.sendUndo();
  });

  // Clear button
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas? This will affect all users.')) {
      wsManager.sendClear();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Z or Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      wsManager.sendUndo();
    }
    
    // B for brush
    if (e.key === 'b' || e.key === 'B') {
      document.querySelector('[data-tool="brush"]').click();
    }
    
    // E for eraser
    if (e.key === 'e' || e.key === 'E') {
      document.querySelector('[data-tool="eraser"]').click();
    }
  });

  // Update operation counter periodically
  setInterval(updateOperationCounter, 1000);
}

/**
 * Update users list UI
 */
function updateUsersList(users) {
  const usersList = document.getElementById('users-list');
  const userCount = document.getElementById('user-count');
  const userCountSidebar = document.getElementById('user-count-sidebar');
  
  // Update count
  const count = users.length;
  userCount.textContent = `${count} user${count !== 1 ? 's' : ''} online`;
  userCountSidebar.textContent = count;
  
  // Clear and rebuild list
  usersList.innerHTML = '';
  
  users.forEach(user => {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    
    const isCurrentUser = user.userId === wsManager.userId;
    
    userItem.innerHTML = `
      <div class="user-color" style="background: ${user.color}"></div>
      <span class="user-name">${user.username}</span>
      ${isCurrentUser ? '<span class="user-badge">You</span>' : ''}
    `;
    
    usersList.appendChild(userItem);
  });
}

/**
 * Update operation counter
 */
function updateOperationCounter() {
  const counter = document.getElementById('operation-counter');
  if (counter) {
    counter.textContent = canvasManager.getOperationCount();
  }
}

/**
 * Show notification (simple implementation)
 */
function showNotification(message, type = 'info') {
  console.log(`[Notification] ${type.toUpperCase()}: ${message}`);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
    animation: slideIn 0.3s ease;
    font-size: 0.875rem;
  `;
  
  // Add animation keyframes if not already added
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Handle page visibility changes
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('[App] Page hidden');
  } else {
    console.log('[App] Page visible');
  }
});

/**
 * Handle page unload
 */
window.addEventListener('beforeunload', () => {
  if (wsManager) {
    wsManager.disconnect();
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
