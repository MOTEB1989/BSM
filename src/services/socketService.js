import { Server } from 'socket.io';
import { getRealTimeMetrics, getAgentMetrics, getTokenUsageByAgent } from './observatoryService.js';
import { checkAlerts } from './alertService.js';
import logger from '../utils/logger.js';

let io = null;

// Initialize Socket.io
export function initializeSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST']
    }
  });
  
  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Observatory client connected');
    
    // Join observatory room
    socket.join('observatory');
    
    // Handle client requests for specific agent metrics
    socket.on('subscribe:agent', async (agentId) => {
      try {
        socket.join(`agent:${agentId}`);
        const metrics = await getAgentMetrics(agentId, '1h');
        socket.emit('agent:metrics', { agentId, metrics });
      } catch (err) {
        logger.error({ err, agentId }, 'Failed to subscribe to agent metrics');
        socket.emit('error', { message: 'Failed to subscribe to agent metrics' });
      }
    });
    
    // Unsubscribe from agent
    socket.on('unsubscribe:agent', (agentId) => {
      socket.leave(`agent:${agentId}`);
    });
    
    // Request dashboard data
    socket.on('request:dashboard', async () => {
      try {
        const metrics = await getRealTimeMetrics('1h');
        const tokenUsage = await getTokenUsageByAgent('1h');
        socket.emit('dashboard:data', { metrics, tokenUsage });
      } catch (err) {
        logger.error({ err }, 'Failed to send dashboard data');
        socket.emit('error', { message: 'Failed to load dashboard data' });
      }
    });
    
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Observatory client disconnected');
    });
  });
  
  // Start broadcasting metrics every 5 seconds
  startMetricsBroadcast();
  
  // Start alert checking every 30 seconds
  startAlertChecking();
  
  logger.info('Observatory Socket.io initialized');
  
  return io;
}

// Broadcast metrics to all connected clients
function startMetricsBroadcast() {
  setInterval(async () => {
    try {
      const metrics = await getRealTimeMetrics('1h');
      io.to('observatory').emit('metrics:update', metrics);
    } catch (err) {
      logger.error({ err }, 'Failed to broadcast metrics');
    }
  }, 5000); // Every 5 seconds
}

// Check alerts periodically
function startAlertChecking() {
  setInterval(async () => {
    try {
      const triggeredAlerts = await checkAlerts();
      if (triggeredAlerts.length > 0) {
        io.to('observatory').emit('alerts:triggered', triggeredAlerts);
      }
    } catch (err) {
      logger.error({ err }, 'Failed to check alerts');
    }
  }, 30000); // Every 30 seconds
}

// Emit custom event to all observatory clients
export function emitToObservatory(event, data) {
  if (io) {
    io.to('observatory').emit(event, data);
  }
}

// Emit event to specific agent subscribers
export function emitToAgent(agentId, event, data) {
  if (io) {
    io.to(`agent:${agentId}`).emit(event, data);
  }
}

export default {
  initializeSocketIO,
  emitToObservatory,
  emitToAgent
};
