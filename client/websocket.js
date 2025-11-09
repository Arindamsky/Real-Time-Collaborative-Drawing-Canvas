/**
 * WebSocket Manager
 * Handles real-time communication with the server
 */

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.userInfo = null;
    this.connected = false;
    this.latency = 0;
    this.lastPingTime = 0;
    
    // Cursor tracking
    this.remoteCursors = new Map();
    this.cursorUpdateInterval = 50; // ms
    this.lastCursorUpdate = 0;
    
    // Callbacks
    this.onConnected = null;
    this.onDisconnected = null;
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onUsersUpdate = null;
    this.onDraw = null;
    this.onUndo = null;
    this.onClear = null;
    this.onInitState = null;
    this.onCursorMove = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect(serverUrl = '') {
    console.log('[WebSocket] Connecting to server...');
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    this.setupEventHandlers();
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected to server');
      this.connected = true;
      this.updateConnectionStatus(true);
      
      // Join default room
      this.joinRoom('default');
      
      if (this.onConnected) {
        this.onConnected();
      }
      
      // Start latency monitoring
      this.startLatencyMonitoring();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.connected = false;
      this.updateConnectionStatus(false);
      
      if (this.onDisconnected) {
        this.onDisconnected(reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.updateConnectionStatus(false);
    });

    // Room events
    this.socket.on('init-state', (data) => {
      console.log('[WebSocket] Received initial state:', data);
      this.userId = data.userId;
      this.userInfo = data.userInfo;
      
      if (this.onInitState) {
        this.onInitState(data);
      }
    });

    this.socket.on('user-joined', (userInfo) => {
      console.log('[WebSocket] User joined:', userInfo);
      if (this.onUserJoined) {
        this.onUserJoined(userInfo);
      }
    });

    this.socket.on('user-left', (data) => {
      console.log('[WebSocket] User left:', data.userId);
      
      // Remove cursor
      this.removeCursor(data.userId);
      
      if (this.onUserLeft) {
        this.onUserLeft(data);
      }
    });

    this.socket.on('users-update', (users) => {
      if (this.onUsersUpdate) {
        this.onUsersUpdate(users);
      }
    });

    // Drawing events
    this.socket.on('draw', (operation) => {
      if (this.onDraw) {
        this.onDraw(operation);
      }
    });

    this.socket.on('undo', (data) => {
      console.log('[WebSocket] Undo operation:', data.operationId);
      if (this.onUndo) {
        this.onUndo(data);
      }
    });

    this.socket.on('clear-canvas', () => {
      console.log('[WebSocket] Canvas cleared');
      if (this.onClear) {
        this.onClear();
      }
    });

    // Cursor events
    this.socket.on('cursor-move', (data) => {
      if (this.onCursorMove) {
        this.onCursorMove(data);
      }
    });

    // Latency response
    this.socket.on('pong', () => {
      this.latency = Date.now() - this.lastPingTime;
      this.updateLatencyDisplay();
    });
  }

  /**
   * Join a room
   */
  joinRoom(roomId, username = null) {
    console.log('[WebSocket] Joining room:', roomId);
    this.socket.emit('join-room', {
      roomId,
      username
    });
  }

  /**
   * Send drawing data to server
   */
  sendDrawing(drawData) {
    if (!this.connected) return;
    
    this.socket.emit('draw', drawData);
  }

  /**
   * Send undo command
   */
  sendUndo() {
    if (!this.connected) return;
    
    this.socket.emit('undo');
  }

  /**
   * Send clear canvas command
   */
  sendClear() {
    if (!this.connected) return;
    
    this.socket.emit('clear-canvas');
  }

  /**
   * Send cursor position (throttled)
   */
  sendCursorPosition(x, y) {
    if (!this.connected) return;
    
    const now = Date.now();
    if (now - this.lastCursorUpdate < this.cursorUpdateInterval) {
      return;
    }
    
    this.lastCursorUpdate = now;
    this.socket.emit('cursor-move', { x, y });
  }

  /**
   * Update connection status UI
   */
  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    const indicator = statusElement?.querySelector('.status-indicator');
    const text = statusElement?.querySelector('.status-text');
    
    if (connected) {
      indicator?.classList.add('connected');
      indicator?.classList.remove('disconnected');
      if (text) text.textContent = 'Connected';
    } else {
      indicator?.classList.remove('connected');
      indicator?.classList.add('disconnected');
      if (text) text.textContent = 'Disconnected';
    }
  }

  /**
   * Start latency monitoring
   */
  startLatencyMonitoring() {
    setInterval(() => {
      if (this.connected) {
        this.lastPingTime = Date.now();
        this.socket.emit('ping');
      }
    }, 2000);
  }

  /**
   * Update latency display
   */
  updateLatencyDisplay() {
    const latencyElement = document.getElementById('latency-counter');
    if (latencyElement) {
      latencyElement.textContent = `${this.latency}ms`;
    }
  }

  /**
   * Create or update remote cursor
   */
  updateCursor(userId, username, color, x, y) {
    const container = document.getElementById('cursors-container');
    if (!container) return;
    
    let cursor = this.remoteCursors.get(userId);
    
    if (!cursor) {
      // Create new cursor
      cursor = document.createElement('div');
      cursor.className = 'user-cursor';
      cursor.innerHTML = `
        <div class="cursor-dot" style="background: ${color}"></div>
        <div class="cursor-label">${username}</div>
      `;
      container.appendChild(cursor);
      this.remoteCursors.set(userId, cursor);
    }
    
    // Update position
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }

  /**
   * Remove a remote cursor
   */
  removeCursor(userId) {
    const cursor = this.remoteCursors.get(userId);
    if (cursor) {
      cursor.remove();
      this.remoteCursors.delete(userId);
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
