/**
 * Drawing State Manager
 * Manages the canvas state, operation history, and undo/redo functionality
 */

class DrawingState {
  constructor(roomId) {
    this.roomId = roomId;
    this.operations = []; // Global operation history
    this.currentOperationId = 0;
    this.users = new Map(); // userId -> user info
  }

  /**
   * Add a new drawing operation
   * @param {Object} operation - Drawing operation with type, data, userId, timestamp
   * @returns {Object} Operation with assigned ID
   */
  addOperation(operation) {
    const op = {
      ...operation,
      id: this.currentOperationId++,
      timestamp: Date.now()
    };
    this.operations.push(op);
    return op;
  }

  /**
   * Get all operations for new users joining
   * @returns {Array} All operations
   */
  getAllOperations() {
    return this.operations;
  }

  /**
   * Undo the last operation (global undo)
   * @returns {Object|null} Undone operation or null
   */
  undo() {
    if (this.operations.length === 0) {
      return null;
    }
    return this.operations.pop();
  }

  /**
   * Get the current state summary
   * @returns {Object} State information
   */
  getState() {
    return {
      roomId: this.roomId,
      operationCount: this.operations.length,
      userCount: this.users.size,
      users: Array.from(this.users.values())
    };
  }

  /**
   * Add a user to the room
   * @param {String} userId - User ID
   * @param {Object} userInfo - User information
   */
  addUser(userId, userInfo) {
    this.users.set(userId, {
      ...userInfo,
      userId,
      joinedAt: Date.now()
    });
  }

  /**
   * Remove a user from the room
   * @param {String} userId - User ID
   */
  removeUser(userId) {
    this.users.delete(userId);
  }

  /**
   * Get user information
   * @param {String} userId - User ID
   * @returns {Object|undefined} User info
   */
  getUser(userId) {
    return this.users.get(userId);
  }

  /**
   * Get all users in the room
   * @returns {Array} Array of user objects
   */
  getUsers() {
    return Array.from(this.users.values());
  }

  /**
   * Clear the entire canvas state
   */
  clear() {
    this.operations = [];
    this.currentOperationId = 0;
  }
}

module.exports = DrawingState;
