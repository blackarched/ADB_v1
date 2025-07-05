import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path'; // Import path module
import { fileURLToPath } from 'url'; // To handle __dirname in ES modules

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Allow all origins for now, restrict in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.BACKEND_PORT || 3001; // Example port, can be configured via .env

import apiRateLimiter from './middleware/rateLimiter.js';

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Apply rate limiter to all /api routes
app.use('/api', apiRateLimiter);

// Basic Routes (examples, to be expanded)
import adbRoutes from './routes/adb.js';
import adbRoutes from './routes/adb.js';
import pentestRoutes from './routes/pentest.js';
import { metricsEndpoint, activeWebSocketConnections } from './prometheus.js';

app.get('/', (req, res) => {
  res.send('ADB Pentest Dashboard Backend Running!');
});

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// API routes
app.use('/api/adb', adbRoutes);
app.use('/api/pentest', pentestRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  activeWebSocketConnections.inc();
  console.log('A user connected via WebSocket:', socket.id, `- Total connections: ${activeWebSocketConnections.get().values[0].value}`);
  addLogToClient(socket, 'Socket connection established to backend.', 'SYSTEM');

  socket.on('disconnect', () => {
    activeWebSocketConnections.dec();
    console.log('User disconnected:', socket.id, `- Total connections: ${activeWebSocketConnections.get().values[0].value}`);
  });

  // Example: Echo back messages sent from client
  socket.on('client:message', (data) => {
    console.log(`Message from ${socket.id}:`, data);
    socket.emit('server:message', { text: `Backend received: ${data.text}` });
  });

  // ADB Logcat Streaming
  let logcatProcess = null;
  socket.on('subscribe:adb:logcat', async ({ deviceId, filter }) => {
    if (logcatProcess) {
      logcatProcess.kill(); // Kill previous logcat process if any for this socket
      logcatProcess = null;
      addLogToClient(socket, 'Previous logcat stream stopped.', 'SYSTEM');
    }

    if (!deviceId) {
      addLogToClient(socket, 'Device ID is required for logcat subscription.', 'ERROR');
      return;
    }

    addLogToClient(socket, `Subscribing to logcat for ${deviceId} with filter: "${filter || 'none'}"`, 'SYSTEM');

    try {
      logcatProcess = adb.getDeviceLogcat(
        deviceId,
        filter,
        (line) => {
          socket.emit('adb:logcat', { deviceId, line, timestamp: new Date() });
        },
        (error) => {
          addLogToClient(socket, `Logcat stream error for ${deviceId}: ${error.message}`, 'ERROR');
          socket.emit('adb:logcat:error', { deviceId, error: error.message });
          if (logcatProcess && !logcatProcess.killed) logcatProcess.kill();
          logcatProcess = null;
        },
        () => {
          addLogToClient(socket, `Logcat stream closed for ${deviceId}.`, 'SYSTEM');
          socket.emit('adb:logcat:closed', { deviceId });
          logcatProcess = null;
        }
      );

      if (!logcatProcess) {
         addLogToClient(socket, `Failed to start logcat for ${deviceId}.`, 'ERROR');
      }
    } catch (error) {
        addLogToClient(socket, `Error starting logcat for ${deviceId}: ${error.message}`, 'ERROR');
    }
  });

  socket.on('unsubscribe:adb:logcat', () => {
    if (logcatProcess) {
      logcatProcess.kill();
      logcatProcess = null;
      addLogToClient(socket, 'Logcat stream unsubscribed and stopped.', 'SYSTEM');
    }
  });

  // Ensure logcat process is killed if socket disconnects while streaming
  socket.on('disconnect', () => {
    activeWebSocketConnections.dec();
    console.log('User disconnected:', socket.id, `- Total connections: ${activeWebSocketConnections.get().values[0].value}`);
    if (logcatProcess) {
      logcatProcess.kill();
      logcatProcess = null;
      console.log(`Logcat stream for socket ${socket.id} stopped due to disconnect.`);
    }
  });
});

// Function to send logs to a specific client (could be useful)
function addLogToClient(socket, message, type = 'INFO') {
  const timestamp = new Date().toLocaleTimeString();
  socket.emit('backend:log', { timestamp, type, message });
}

// Start the server
server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
  console.log(`ADB_HOST: ${process.env.ADB_HOST || 'Not Set (default will be used)'}`);
  console.log(`ADB_PORT: ${process.env.ADB_PORT || 'Not Set (default will be used)'}`);
  console.log(`PENTEST_SCRIPT_PATH: ${process.env.PENTEST_SCRIPT_PATH}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Application specific logging, exiting the process, or other logic here
  // process.exit(1); // It's often recommended to exit on uncaught exceptions
});

export { app, server, io }; // Export for potential testing or programmatic use
