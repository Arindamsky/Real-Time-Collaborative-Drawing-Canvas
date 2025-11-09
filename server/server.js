/**
 * WebSocket Server for Real-Time Collaborative Drawing
 * Handles client connections, drawing operations, and state synchronization
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const RoomManager = require('./rooms');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const roomManager = new RoomManager();
const PORT = process.env.PORT || 3000;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: roomManager.getAllRooms().length,
    uptime: process.uptime()
  });
});

// User color palette for assignment
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B739', '#52B788', '#E63946', '#A8DADC'
];

let colorIndex = 0;

/**
 * Generate a random username
 */
function generateUsername() {
  const adjectives = ['Swift', 'Creative', 'Bold', 'Clever', 'Bright', 'Quick', 'Happy', 'Zen'];
  const nouns = ['Artist', 'Painter', 'Designer', 'Creator', 'Sketcher', 'Drawer', 'Maker', 'Crafter'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 999)}`;
}

/**
 * WebSocket connection handler
 */
io.on('connection', (socket) => {
  console.log(`[Server] New connection: ${socket.id}`);
  
  let currentRoom = null;
  let userInfo = null;

  /**
   * Handle user joining a room
   */
  socket.on('join-room', (data) => {
    const roomId = data.roomId || 'default';
    const username = data.username || generateUsername();
    
    // Leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom);
      const oldRoom = roomManager.getRoom(currentRoom);
      if (oldRoom) {
        oldRoom.removeUser(socket.id);
        socket.to(currentRoom).emit('user-left', { userId: socket.id });
      }
    }

    // Join new room
    currentRoom = roomId;
    socket.join(roomId);
    
    const room = roomManager.getOrCreateRoom(roomId);
    
    // Assign user color
    const userColor = USER_COLORS[colorIndex % USER_COLORS.length];
    colorIndex++;
    
    userInfo = {
      userId: socket.id,
      username,
      color: userColor
    };
    
    room.addUser(socket.id, userInfo);
    
    console.log(`[Server] User ${username} (${socket.id}) joined room: ${roomId}`);
    
    // Send current state to the new user
    socket.emit('init-state', {
      userId: socket.id,
      userInfo,
      operations: room.getAllOperations(),
      users: room.getUsers()
    });
    
    // Notify other users
    socket.to(roomId).emit('user-joined', userInfo);
    
    // Send updated user list to everyone
    io.to(roomId).emit('users-update', room.getUsers());
  });

  /**
   * Handle drawing operations
   */
  socket.on('draw', (data) => {
    if (!currentRoom) return;
    
    const room = roomManager.getRoom(currentRoom);
    if (!room) return;
    
    // Add operation to room state
    const operation = room.addOperation({
      type: 'draw',
      data,
      userId: socket.id,
      username: userInfo?.username
    });
    
    // Broadcast to other users in the room (not to sender)
    socket.to(currentRoom).emit('draw', operation);
  });

  /**
   * Handle cursor movement
   */
  socket.on('cursor-move', (data) => {
    if (!currentRoom) return;
    
    // Broadcast cursor position to other users
    socket.to(currentRoom).emit('cursor-move', {
      userId: socket.id,
      username: userInfo?.username,
      color: userInfo?.color,
      x: data.x,
      y: data.y
    });
  });

  /**
   * Handle undo operation (global)
   */
  socket.on('undo', () => {
    if (!currentRoom) return;
    
    const room = roomManager.getRoom(currentRoom);
    if (!room) return;
    
    const undoneOperation = room.undo();
    
    if (undoneOperation) {
      console.log(`[Server] Undo operation ${undoneOperation.id} in room ${currentRoom}`);
      // Broadcast undo to all users including sender
      io.to(currentRoom).emit('undo', { operationId: undoneOperation.id });
    }
  });

  /**
   * Handle clear canvas
   */
  socket.on('clear-canvas', () => {
    if (!currentRoom) return;
    
    const room = roomManager.getRoom(currentRoom);
    if (!room) return;
    
    room.clear();
    console.log(`[Server] Canvas cleared in room ${currentRoom}`);
    
    // Broadcast to all users including sender
    io.to(currentRoom).emit('clear-canvas');
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    console.log(`[Server] User disconnected: ${socket.id}`);
    
    if (currentRoom) {
      const room = roomManager.getRoom(currentRoom);
      if (room) {
        room.removeUser(socket.id);
        socket.to(currentRoom).emit('user-left', { userId: socket.id });
        io.to(currentRoom).emit('users-update', room.getUsers());
        
        // Clean up empty room after delay
        setTimeout(() => {
          roomManager.removeRoom(currentRoom);
        }, 5000);
      }
    }
  });

  /**
   * Handle errors
   */
  socket.on('error', (error) => {
    console.error(`[Server] Socket error for ${socket.id}:`, error);
  });
});

// Periodic cleanup of empty rooms
setInterval(() => {
  roomManager.cleanupEmptyRooms();
}, 60000); // Every minute

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Collaborative Drawing Canvas server running on port ${PORT}`);
  console.log(`[Server] Access the app at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
