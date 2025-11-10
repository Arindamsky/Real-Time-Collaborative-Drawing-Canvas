#  Real-Time Collaborative Drawing Canvas

A multi-user drawing application where multiple people can draw simultaneously on the same canvas with real-time synchronization using WebSockets.

##  Features

### Core Functionality
- **Real-time Drawing Synchronization**: See other users' drawings as they draw (stroke-by-stroke)
- **Multiple Drawing Tools**: Brush and eraser with customizable stroke width
- **Color Selection**: Color picker with preset color palette
- **Global Undo**: Undo functionality that works across all users
- **User Cursor Tracking**: See where other users are currently drawing
- **User Management**: Display online users with assigned colors
- **Performance Monitoring**: Real-time FPS, latency, and operation count display

### Technical Features
- **Vanilla JavaScript**: No frontend frameworks (React/Vue), pure DOM manipulation
- **Custom Canvas Operations**: Raw Canvas API implementation without drawing libraries
- **WebSocket Communication**: Real-time bidirectional communication using Socket.io
- **Room System**: Support for multiple isolated drawing sessions
- **Client-side Prediction**: Smooth local drawing with server synchronization
- **Mobile Touch Support**: Works on touch devices
- **Responsive Design**: Adapts to different screen sizes

##  Prerequisites

- **Node.js** >= 14.0.0
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

##  Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Arindamsky/Real-Time-Collaborative-Drawing-Canvas.git
cd Real-Time-Collaborative-Drawing-Canvas
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```

The server will start on port 3000 by default. You should see:
```
[Server] Collaborative Drawing Canvas server running on port 3000
[Server] Access the app at http://localhost:3000
```

### 4. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

##  Testing with Multiple Users

### Method 1: Multiple Browser Windows
1. Open the application in your main browser window
2. Open additional windows/tabs at the same URL
3. Start drawing in any window and see real-time synchronization

### Method 2: Different Browsers
1. Open the application in Chrome: `http://localhost:3000`
2. Open the same URL in Firefox, Safari, or Edge
3. Test drawing and synchronization across browsers

### Method 3: Multiple Devices (Same Network)
1. Find your local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr` (look for inet)
2. On other devices, navigate to: `http://YOUR_IP:3000`
3. Test collaborative drawing across devices

### Method 4: Incognito/Private Windows
1. Open regular browser window
2. Open incognito/private window
3. Navigate to `http://localhost:3000` in both
4. Each will be treated as a separate user

##  How to Use

### Drawing Tools
- **Brush Tool**: Click the "✏️ Brush" button or press `B`
- **Eraser Tool**: Click the "🧹 Eraser" button or press `E`

### Color Selection
- Use the color picker to select any color
- Click preset color buttons for quick selection

### Stroke Width
- Use the slider to adjust stroke width (1-50px)
- Current width is displayed above the slider

### Actions
- **Undo**: Click "↶ Undo" or press `Ctrl+Z` (or `Cmd+Z` on Mac)
  - Works globally - undoes the last action by any user
- **Clear Canvas**: Click "🗑️ Clear" to clear the entire canvas
  - Requires confirmation as it affects all users

### User Interface
- **Online Users**: View all connected users in the sidebar
- **Your User**: Indicated with a "You" badge
- **Performance Metrics**: Monitor FPS, latency, and operation count
- **Connection Status**: Top-right indicator shows connection state

### Keyboard Shortcuts
- `B` - Switch to Brush tool
- `E` - Switch to Eraser tool
- `Ctrl+Z` / `Cmd+Z` - Undo last operation

##  Project Structure

```
collaborative-canvas/
├── client/                  # Frontend files
│   ├── index.html          # Main HTML structure
│   ├── style.css           # Styling and layout
│   ├── canvas.js           # Canvas drawing logic
│   ├── websocket.js        # WebSocket client manager
│   └── main.js             # App initialization and coordination
├── server/                  # Backend files
│   ├── server.js           # Express + Socket.io server
│   ├── rooms.js            # Room management system
│   └── drawing-state.js    # Canvas state and operations
├── package.json            # Dependencies and scripts
├── README.md               # This file
└── ARCHITECTURE.md         # Technical architecture documentation
```

##  Configuration

### Environment Variables
You can customize the server port by setting the `PORT` environment variable:

```bash
# Linux/Mac
PORT=8080 npm start

# Windows (Command Prompt)
set PORT=8080 && npm start

# Windows (PowerShell)
$env:PORT=8080; npm start
```

### Default Configuration
- **Port**: 3000
- **Default Room**: "default"
- **WebSocket Transports**: WebSocket (primary), Polling (fallback)
- **Reconnection**: Enabled with 5 attempts

##  Known Limitations

### Current Limitations
1. **No Redo Functionality**: Currently only supports undo, not redo
2. **No Drawing Persistence**: Canvas is cleared when all users disconnect
3. **Limited Shapes**: Only freehand drawing, no geometric shapes yet
4. **No Export**: Cannot save/export the canvas as an image
5. **Single Room UI**: UI only shows default room (backend supports multiple rooms)

### Performance Considerations
- **High-frequency events**: Mouse movements are throttled to 50ms intervals
- **Undo operation**: Requires full canvas redraw (O(n) complexity)
- **Large operation history**: Memory usage grows with drawing complexity

### Browser Compatibility
- Tested on Chrome, Firefox, Safari, Edge (latest versions)
- Requires modern browser with Canvas API and WebSocket support
- Mobile browser support is experimental

##  Known Issues

1. **Canvas resize**: Resizing the browser window may cause slight visual artifacts
2. **Network latency**: High latency (>200ms) may cause visible drawing lag
3. **Touch devices**: Cursor indicators may not work properly on touch-only devices
4. **Very fast drawing**: Extremely rapid strokes may skip points
5. **Undo button** : Undo doesn't work everytime.

##  Development Time

**Total Time Spent**: Approximately 10-12 hours

### Time Breakdown
- Architecture & Planning: 1 hour
- Backend Development: 2 hours
- Frontend Canvas Logic: 3 hours
- WebSocket Integration: 2 hours
- UI/UX Design & Styling: 1.5 hours
- Testing & Bug Fixes: 1 hour
- Documentation: 1.5 hours

##  Future Enhancements

### Planned Features
- [ ] Redo functionality
- [ ] Canvas persistence (save/load sessions)
- [ ] Export canvas as PNG/JPG
- [ ] Drawing shapes (rectangle, circle, line)
- [ ] Text tool
- [ ] Image upload and drawing
- [ ] Layer system
- [ ] Drawing history timeline
- [ ] User authentication
- [ ] Private rooms with access codes
- [ ] Canvas zoom and pan
- [ ] More brush types (spray, calligraphy)

### Performance Improvements
- [ ] Incremental canvas rendering
- [ ] Operation history pruning
- [ ] WebRTC data channels for peer-to-peer communication
- [ ] Canvas thumbnail for room selection
- [ ] Lazy loading of historical operations

##  Technologies Used

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web server framework
- **Socket.io**: Real-time WebSocket library

### Frontend
- **Vanilla JavaScript**: No frameworks
- **HTML5 Canvas API**: Drawing operations
- **CSS3**: Styling and animations
- **Socket.io Client**: WebSocket communication




##  Author

Created as part of a technical assessment to demonstrate:
- Canvas API mastery
- Real-time architecture design
- WebSocket implementation
- State synchronization
- Clean code practices




---

