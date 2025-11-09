/**
 * Room Manager
 * Handles multiple drawing rooms/sessions
 */

const DrawingState = require('./drawing-state');

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> DrawingState
  }

  /**
   * Get or create a room
   * @param {String} roomId - Room identifier
   * @returns {DrawingState} Room's drawing state
   */
  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new DrawingState(roomId));
      console.log(`[RoomManager] Created new room: ${roomId}`);
    }
    return this.rooms.get(roomId);
  }

  /**
   * Get a room if it exists
   * @param {String} roomId - Room identifier
   * @returns {DrawingState|undefined} Room's drawing state or undefined
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Remove a room (cleanup when empty)
   * @param {String} roomId - Room identifier
   */
  removeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room && room.users.size === 0) {
      this.rooms.delete(roomId);
      console.log(`[RoomManager] Removed empty room: ${roomId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all active rooms
   * @returns {Array} Array of room states
   */
  getAllRooms() {
    return Array.from(this.rooms.entries()).map(([roomId, state]) => ({
      roomId,
      ...state.getState()
    }));
  }

  /**
   * Clean up empty rooms
   */
  cleanupEmptyRooms() {
    const emptyRooms = [];
    for (const [roomId, state] of this.rooms.entries()) {
      if (state.users.size === 0) {
        emptyRooms.push(roomId);
      }
    }
    emptyRooms.forEach(roomId => this.rooms.delete(roomId));
    if (emptyRooms.length > 0) {
      console.log(`[RoomManager] Cleaned up ${emptyRooms.length} empty rooms`);
    }
    return emptyRooms.length;
  }
}

module.exports = RoomManager;
