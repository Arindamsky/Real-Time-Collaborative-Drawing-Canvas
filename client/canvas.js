/**
 * Canvas Drawing Manager
 * Handles all canvas operations including drawing, erasing, and rendering
 */

class CanvasManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { willReadFrequently: false });
    
    // Drawing state
    this.isDrawing = false;
    this.currentTool = 'brush';
    this.currentColor = '#000000';
    this.strokeWidth = 5;
    
    // Path optimization
    this.currentPath = [];
    this.lastPoint = null;
    
    // Performance tracking
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();
    this.fps = 60;
    
    // Operation history (for rendering)
    this.operations = [];
    
    // Initialize canvas size
    this.resizeCanvas();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Start FPS counter
    this.startFpsCounter();
  }

  /**
   * Resize canvas to fill container
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    // Store current image data before resize
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Set canvas size
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Restore image data if canvas had content
    if (imageData.width > 0 && imageData.height > 0) {
      this.ctx.putImageData(imageData, 0, 0);
    }
    
    // Set default context properties
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Setup canvas event listeners
   */
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleDrawStart.bind(this));
    this.canvas.addEventListener('mousemove', this.handleDrawMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleDrawEnd.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleDrawEnd.bind(this));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleDrawEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.handleDrawEnd.bind(this));
    
    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.redrawCanvas();
    });
  }

  /**
   * Get mouse/touch position relative to canvas
   */
  getPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  /**
   * Handle touch start event
   */
  handleTouchStart(event) {
    event.preventDefault();
    this.handleDrawStart(event);
  }

  /**
   * Handle touch move event
   */
  handleTouchMove(event) {
    event.preventDefault();
    this.handleDrawMove(event);
  }

  /**
   * Start drawing
   */
  handleDrawStart(event) {
    this.isDrawing = true;
    const pos = this.getPosition(event);
    this.lastPoint = pos;
    this.currentPath = [pos];
  }

  /**
   * Continue drawing
   */
  handleDrawMove(event) {
    // Emit cursor position for other users
    const pos = this.getPosition(event);
    if (window.wsManager) {
      window.wsManager.sendCursorPosition(pos.x, pos.y);
    }
    
    if (!this.isDrawing) return;
    
    this.currentPath.push(pos);
    
    // Draw locally with client-side prediction
    this.drawLine(this.lastPoint, pos, this.currentColor, this.strokeWidth, this.currentTool);
    
    this.lastPoint = pos;
    this.frameCount++;
  }

  /**
   * Stop drawing
   */
  handleDrawEnd(event) {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    
    // Send the complete path to server
    if (this.currentPath.length > 0 && window.wsManager) {
      const drawData = {
        path: this.currentPath,
        color: this.currentColor,
        width: this.strokeWidth,
        tool: this.currentTool
      };
      
      window.wsManager.sendDrawing(drawData);
    }
    
    this.currentPath = [];
    this.lastPoint = null;
  }

  /**
   * Draw a line between two points
   */
  drawLine(start, end, color, width, tool) {
    this.ctx.save();
    
    if (tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = color;
    }
    
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  /**
   * Draw a complete path (for remote users)
   */
  drawPath(path, color, width, tool) {
    if (!path || path.length === 0) return;
    
    this.ctx.save();
    
    if (tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = color;
    }
    
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(path[0].x, path[0].y);
    
    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x, path[i].y);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
    
    this.frameCount++;
  }

  /**
   * Add operation to history and draw it
   */
  addOperation(operation) {
    this.operations.push(operation);
    this.drawPath(operation.data.path, operation.data.color, operation.data.width, operation.data.tool);
  }

  /**
   * Redraw entire canvas from operations
   */
  redrawCanvas() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Redraw all operations
    for (const operation of this.operations) {
      this.drawPath(operation.data.path, operation.data.color, operation.data.width, operation.data.tool);
    }
  }

  /**
   * Remove last operation and redraw
   */
  removeLastOperation() {
    if (this.operations.length > 0) {
      this.operations.pop();
      this.redrawCanvas();
    }
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.operations = [];
  }

  /**
   * Set current tool
   */
  setTool(tool) {
    this.currentTool = tool;
  }

  /**
   * Set current color
   */
  setColor(color) {
    this.currentColor = color;
  }

  /**
   * Set stroke width
   */
  setStrokeWidth(width) {
    this.strokeWidth = width;
  }

  /**
   * Load initial state (operations from server)
   */
  loadOperations(operations) {
    this.operations = operations;
    this.redrawCanvas();
  }

  /**
   * Start FPS counter
   */
  startFpsCounter() {
    setInterval(() => {
      const now = Date.now();
      const delta = now - this.lastFpsUpdate;
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      // Update UI
      const fpsElement = document.getElementById('fps-counter');
      if (fpsElement) {
        fpsElement.textContent = this.fps;
      }
    }, 1000);
  }

  /**
   * Get current FPS
   */
  getFps() {
    return this.fps;
  }

  /**
   * Get operation count
   */
  getOperationCount() {
    return this.operations.length;
  }
}
