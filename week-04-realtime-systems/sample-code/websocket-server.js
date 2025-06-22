#!/usr/bin/env node

/**
 * 🏢 ALGOCRATIC FUTURES: WEEK 4 CORPORATE REAL-TIME COMMUNICATION HUB
 * "Instantaneous Corporate Coordination Through WebSocket Infrastructure"
 * 
 * 📡 CORPORATE COMMUNICATIONS CHALLENGE: Moving beyond message queues to
 * real-time, bidirectional communication that enables instant coordination
 * across all corporate departments, systems, and decision-making hierarchies.
 * 
 * 🎯 PEDAGOGICAL PURPOSE: Students learn WebSocket protocol fundamentals,
 * connection lifecycle management, real-time broadcasting patterns, and
 * integration with existing event-driven architectures from Week 3.
 * 
 * ⚠️  STUDENT CHALLENGES TO WATCH FOR:
 * - WebSocket connection state management
 * - Handling disconnections and reconnections gracefully
 * - Message broadcasting without memory leaks
 * - Integrating with HTTP servers properly
 * - Rate limiting and security considerations
 * - Scaling WebSocket connections across processes
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');

/**
 * 🏢 ALGOCRATIC CORPORATE COMMUNICATIONS HUB
 * 
 * Central WebSocket server that manages real-time communication across
 * all corporate departments, enabling instant coordination and decision
 * propagation throughout the organizational hierarchy.
 */
class AlgoCraticCommunicationsHub extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      port: options.port || 8080,
      maxConnections: options.maxConnections || 1000,
      pingInterval: options.pingInterval || 30000,
      connectionTimeout: options.connectionTimeout || 60000,
      rateLimitWindow: options.rateLimitWindow || 60000,
      rateLimitMax: options.rateLimitMax || 100,
      ...options
    };

    // 🏢 Corporate infrastructure state
    this.departments = new Map(); // departmentId -> Set<connections>
    this.connections = new Map(); // connectionId -> connection metadata
    this.rooms = new Map(); // roomId -> Set<connectionIds>
    this.presence = new Map(); // userId -> presence info
    
    // 📊 Real-time metrics and monitoring
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      messagesPerSecond: 0,
      departmentStats: new Map(),
      uptime: Date.now(),
      lastActivity: Date.now()
    };
    
    // 🛡️ Security and rate limiting
    this.rateLimits = new Map(); // connectionId -> { count, window }
    
    this.initializeCorporateHub();
  }

  async initializeCorporateHub() {
    console.log('🏢 ALGOCRATIC CORPORATE COMMUNICATIONS: Initializing real-time coordination infrastructure...');
    
    // 🌐 Create Express app for HTTP endpoints
    this.app = express();
    this.server = http.createServer(this.app);
    
    // 📡 Initialize WebSocket server
    this.wss = new WebSocket.Server({ 
      server: this.server,
      maxPayload: 16 * 1024, // 16KB max message size
      perMessageDeflate: {
        zlibDeflateOptions: {
          level: 3
        }
      }
    });
    
    this.setupWebSocketHandlers();
    this.setupHTTPEndpoints();
    this.setupMaintenanceTasks();
    
    // 🚀 Start server
    this.server.listen(this.config.port, () => {
      console.log(`✅ Corporate Communications Hub operational on port ${this.config.port}`);
      console.log(`📊 Configuration: Max Connections=${this.config.maxConnections}, Rate Limit=${this.config.rateLimitMax}/min`);
    });
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, request) => {
      this.handleNewConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      console.error('🚨 WebSocket Server Error:', error.message);
      this.emit('server:error', error);
    });

    console.log('📡 WebSocket handlers configured');
  }

  setupHTTPEndpoints() {
    // 📊 Corporate dashboard endpoint
    this.app.get('/dashboard', (req, res) => {
      res.json({
        status: 'operational',
        metrics: this.getMetrics(),
        departments: Array.from(this.departments.keys()),
        activeRooms: Array.from(this.rooms.keys()),
        presenceCount: this.presence.size
      });
    });

    // 🏢 Department status endpoint
    this.app.get('/departments', (req, res) => {
      const departmentStats = {};
      for (const [dept, connections] of this.departments) {
        departmentStats[dept] = {
          activeConnections: connections.size,
          connectionIds: Array.from(connections).map(conn => conn.connectionId)
        };
      }
      res.json(departmentStats);
    });

    // 📡 Health check for load balancers
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Date.now() - this.metrics.uptime,
        connections: this.metrics.activeConnections,
        lastActivity: this.metrics.lastActivity
      });
    });

    console.log('🌐 HTTP endpoints configured');
  }

  handleNewConnection(ws, request) {
    // 🔒 Connection limits enforcement
    if (this.metrics.activeConnections >= this.config.maxConnections) {
      console.log('⚠️  Connection limit reached, rejecting new connection');
      ws.close(1013, 'Server overloaded');
      return;
    }

    // 🆔 Generate unique connection identifier
    const connectionId = uuidv4();
    const clientIP = request.socket.remoteAddress;
    
    const connectionMeta = {
      connectionId,
      ws,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      clientIP,
      department: null,
      userId: null,
      rooms: new Set(),
      messageCount: 0,
      isAlive: true
    };

    // 📋 Register connection
    this.connections.set(connectionId, connectionMeta);
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    console.log(`📡 New corporate connection: ${connectionId} from ${clientIP} (${this.metrics.activeConnections} active)`);

    // 🔧 Setup connection handlers
    this.setupConnectionHandlers(ws, connectionMeta);

    // 📤 Send welcome message
    this.sendToConnection(connectionId, {
      type: 'corporate:welcome',
      data: {
        connectionId,
        timestamp: new Date().toISOString(),
        message: 'Welcome to AlgoCratic Corporate Communications Hub',
        availableDepartments: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Executive'],
        serverCapabilities: ['chat', 'notifications', 'presence', 'broadcasting', 'rooms']
      }
    });

    this.emit('connection:established', { connectionId, clientIP });
  }

  setupConnectionHandlers(ws, connectionMeta) {
    const { connectionId } = connectionMeta;

    // 📨 Message handling
    ws.on('message', async (data) => {
      try {
        await this.handleIncomingMessage(connectionMeta, data);
      } catch (error) {
        console.error(`🚨 Message handling error for ${connectionId}:`, error.message);
        this.sendToConnection(connectionId, {
          type: 'error',
          data: { message: 'Message processing failed', error: error.message }
        });
      }
    });

    // 🔌 Disconnection handling
    ws.on('close', (code, reason) => {
      this.handleDisconnection(connectionId, code, reason);
    });

    // 🚨 Error handling
    ws.on('error', (error) => {
      console.error(`🚨 Connection error for ${connectionId}:`, error.message);
      this.handleDisconnection(connectionId, 1006, 'Connection error');
    });

    // 💓 Heartbeat handling
    ws.on('pong', () => {
      connectionMeta.isAlive = true;
      connectionMeta.lastActivity = Date.now();
    });
  }

  async handleIncomingMessage(connectionMeta, rawData) {
    const { connectionId } = connectionMeta;
    
    // 🛡️ Rate limiting check
    if (!this.checkRateLimit(connectionId)) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Rate limit exceeded', retryAfter: this.config.rateLimitWindow }
      });
      return;
    }

    let message;
    try {
      message = JSON.parse(rawData.toString());
    } catch (error) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Invalid JSON format' }
      });
      return;
    }

    // 📊 Update connection stats
    connectionMeta.messageCount++;
    connectionMeta.lastActivity = Date.now();
    this.metrics.totalMessages++;
    this.metrics.lastActivity = Date.now();

    console.log(`📨 Message from ${connectionId}: ${message.type}`);

    // 🎯 Route message based on type
    switch (message.type) {
      case 'corporate:join_department':
        await this.handleJoinDepartment(connectionMeta, message.data);
        break;
        
      case 'corporate:leave_department':
        await this.handleLeaveDepartment(connectionMeta, message.data);
        break;
        
      case 'corporate:broadcast':
        await this.handleDepartmentBroadcast(connectionMeta, message.data);
        break;
        
      case 'corporate:join_room':
        await this.handleJoinRoom(connectionMeta, message.data);
        break;
        
      case 'corporate:leave_room':
        await this.handleLeaveRoom(connectionMeta, message.data);
        break;
        
      case 'corporate:room_message':
        await this.handleRoomMessage(connectionMeta, message.data);
        break;
        
      case 'corporate:set_presence':
        await this.handleSetPresence(connectionMeta, message.data);
        break;
        
      case 'corporate:direct_message':
        await this.handleDirectMessage(connectionMeta, message.data);
        break;
        
      case 'corporate:ping':
        this.sendToConnection(connectionId, {
          type: 'corporate:pong',
          data: { timestamp: Date.now() }
        });
        break;
        
      default:
        this.sendToConnection(connectionId, {
          type: 'error',
          data: { message: `Unknown message type: ${message.type}` }
        });
    }
  }

  async handleJoinDepartment(connectionMeta, data) {
    const { connectionId } = connectionMeta;
    const { department, userId } = data;

    if (!department) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Department name required' }
      });
      return;
    }

    // 🏢 Leave current department if any
    if (connectionMeta.department) {
      await this.handleLeaveDepartment(connectionMeta, { department: connectionMeta.department });
    }

    // 👥 Join new department
    if (!this.departments.has(department)) {
      this.departments.set(department, new Set());
      this.metrics.departmentStats.set(department, {
        totalConnections: 0,
        messagesExchanged: 0,
        createdAt: Date.now()
      });
    }

    const departmentConnections = this.departments.get(department);
    departmentConnections.add(connectionMeta);
    connectionMeta.department = department;
    connectionMeta.userId = userId || `user-${connectionId.slice(0, 8)}`;

    console.log(`🏢 ${connectionId} joined department: ${department} as ${connectionMeta.userId}`);

    // 📊 Update department stats
    const deptStats = this.metrics.departmentStats.get(department);
    deptStats.totalConnections++;

    // 📢 Notify department of new member
    this.broadcastToDepartment(department, {
      type: 'corporate:department_join',
      data: {
        userId: connectionMeta.userId,
        department,
        timestamp: new Date().toISOString(),
        memberCount: departmentConnections.size
      }
    }, connectionId);

    // ✅ Confirm join to user
    this.sendToConnection(connectionId, {
      type: 'corporate:department_joined',
      data: {
        department,
        userId: connectionMeta.userId,
        memberCount: departmentConnections.size,
        departmentMembers: Array.from(departmentConnections)
          .map(conn => conn.userId)
          .filter(Boolean)
      }
    });

    this.emit('department:joined', { connectionId, department, userId: connectionMeta.userId });
  }

  async handleLeaveDepartment(connectionMeta, data) {
    const { connectionId, department: currentDept } = connectionMeta;
    const department = data.department || currentDept;

    if (!department || !this.departments.has(department)) {
      return;
    }

    const departmentConnections = this.departments.get(department);
    departmentConnections.delete(connectionMeta);
    
    if (departmentConnections.size === 0) {
      this.departments.delete(department);
      this.metrics.departmentStats.delete(department);
    }

    connectionMeta.department = null;

    console.log(`🏢 ${connectionId} left department: ${department}`);

    // 📢 Notify remaining department members
    this.broadcastToDepartment(department, {
      type: 'corporate:department_leave',
      data: {
        userId: connectionMeta.userId,
        department,
        timestamp: new Date().toISOString(),
        memberCount: departmentConnections.size
      }
    });

    this.emit('department:left', { connectionId, department });
  }

  async handleDepartmentBroadcast(connectionMeta, data) {
    const { connectionId, department } = connectionMeta;
    const { message, priority = 'normal' } = data;

    if (!department) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Must join a department before broadcasting' }
      });
      return;
    }

    if (!message) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Broadcast message required' }
      });
      return;
    }

    console.log(`📢 Broadcast from ${connectionMeta.userId} in ${department}: ${message.substring(0, 50)}...`);

    // 📊 Update department stats
    const deptStats = this.metrics.departmentStats.get(department);
    if (deptStats) {
      deptStats.messagesExchanged++;
    }

    // 📡 Broadcast to department
    this.broadcastToDepartment(department, {
      type: 'corporate:department_broadcast',
      data: {
        fromUserId: connectionMeta.userId,
        fromConnectionId: connectionId,
        department,
        message,
        priority,
        timestamp: new Date().toISOString()
      }
    }, connectionId);

    this.emit('department:broadcast', { department, fromUserId: connectionMeta.userId, message });
  }

  async handleJoinRoom(connectionMeta, data) {
    const { connectionId } = connectionMeta;
    const { roomId } = data;

    if (!roomId) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Room ID required' }
      });
      return;
    }

    // 🏢 Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    const room = this.rooms.get(roomId);
    room.add(connectionId);
    connectionMeta.rooms.add(roomId);

    console.log(`🏠 ${connectionId} joined room: ${roomId} (${room.size} members)`);

    // 📢 Notify room members
    this.broadcastToRoom(roomId, {
      type: 'corporate:room_join',
      data: {
        userId: connectionMeta.userId,
        roomId,
        timestamp: new Date().toISOString(),
        memberCount: room.size
      }
    }, connectionId);

    // ✅ Confirm room join
    this.sendToConnection(connectionId, {
      type: 'corporate:room_joined',
      data: {
        roomId,
        memberCount: room.size
      }
    });
  }

  async handleLeaveRoom(connectionMeta, data) {
    const { connectionId } = connectionMeta;
    const { roomId } = data;

    if (!this.rooms.has(roomId)) {
      return;
    }

    const room = this.rooms.get(roomId);
    room.delete(connectionId);
    connectionMeta.rooms.delete(roomId);

    if (room.size === 0) {
      this.rooms.delete(roomId);
    }

    console.log(`🏠 ${connectionId} left room: ${roomId}`);

    // 📢 Notify remaining room members
    this.broadcastToRoom(roomId, {
      type: 'corporate:room_leave',
      data: {
        userId: connectionMeta.userId,
        roomId,
        timestamp: new Date().toISOString(),
        memberCount: room.size
      }
    });
  }

  async handleRoomMessage(connectionMeta, data) {
    const { connectionId } = connectionMeta;
    const { roomId, message } = data;

    if (!roomId || !message) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Room ID and message required' }
      });
      return;
    }

    if (!connectionMeta.rooms.has(roomId)) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Not a member of this room' }
      });
      return;
    }

    console.log(`💬 Room message from ${connectionMeta.userId} in ${roomId}: ${message.substring(0, 50)}...`);

    // 📡 Broadcast to room
    this.broadcastToRoom(roomId, {
      type: 'corporate:room_message',
      data: {
        fromUserId: connectionMeta.userId,
        fromConnectionId: connectionId,
        roomId,
        message,
        timestamp: new Date().toISOString()
      }
    }, connectionId);
  }

  async handleSetPresence(connectionMeta, data) {
    const { connectionId } = connectionMeta;
    const { status, statusMessage } = data;

    const presenceInfo = {
      userId: connectionMeta.userId,
      connectionId,
      status: status || 'online',
      statusMessage: statusMessage || '',
      lastSeen: Date.now(),
      department: connectionMeta.department
    };

    this.presence.set(connectionMeta.userId || connectionId, presenceInfo);

    console.log(`👤 Presence update for ${connectionMeta.userId}: ${status}`);

    // 📢 Broadcast presence to department if joined
    if (connectionMeta.department) {
      this.broadcastToDepartment(connectionMeta.department, {
        type: 'corporate:presence_update',
        data: presenceInfo
      }, connectionId);
    }
  }

  async handleDirectMessage(connectionMeta, data) {
    const { connectionId } = connectionMeta;
    const { targetUserId, message } = data;

    if (!targetUserId || !message) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Target user ID and message required' }
      });
      return;
    }

    // 🔍 Find target connection
    const targetConnection = Array.from(this.connections.values())
      .find(conn => conn.userId === targetUserId);

    if (!targetConnection) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: `User ${targetUserId} not found or offline` }
      });
      return;
    }

    console.log(`📨 Direct message from ${connectionMeta.userId} to ${targetUserId}`);

    // 📤 Send direct message
    this.sendToConnection(targetConnection.connectionId, {
      type: 'corporate:direct_message',
      data: {
        fromUserId: connectionMeta.userId,
        message,
        timestamp: new Date().toISOString()
      }
    });

    // ✅ Confirm delivery to sender
    this.sendToConnection(connectionId, {
      type: 'corporate:message_delivered',
      data: {
        targetUserId,
        timestamp: new Date().toISOString()
      }
    });
  }

  checkRateLimit(connectionId) {
    const now = Date.now();
    const limit = this.rateLimits.get(connectionId);

    if (!limit) {
      this.rateLimits.set(connectionId, { count: 1, window: now });
      return true;
    }

    if (now - limit.window > this.config.rateLimitWindow) {
      // Reset window
      limit.count = 1;
      limit.window = now;
      return true;
    }

    limit.count++;
    return limit.count <= this.config.rateLimitMax;
  }

  sendToConnection(connectionId, message) {
    const connectionMeta = this.connections.get(connectionId);
    if (!connectionMeta || connectionMeta.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connectionMeta.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`📡 Send error to ${connectionId}:`, error.message);
      this.handleDisconnection(connectionId, 1006, 'Send error');
      return false;
    }
  }

  broadcastToDepartment(department, message, excludeConnectionId = null) {
    const departmentConnections = this.departments.get(department);
    if (!departmentConnections) return 0;

    let sentCount = 0;
    for (const connectionMeta of departmentConnections) {
      if (connectionMeta.connectionId !== excludeConnectionId) {
        if (this.sendToConnection(connectionMeta.connectionId, message)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  broadcastToRoom(roomId, message, excludeConnectionId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return 0;

    let sentCount = 0;
    for (const connectionId of room) {
      if (connectionId !== excludeConnectionId) {
        if (this.sendToConnection(connectionId, message)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  broadcastToAll(message, excludeConnectionId = null) {
    let sentCount = 0;
    for (const [connectionId] of this.connections) {
      if (connectionId !== excludeConnectionId) {
        if (this.sendToConnection(connectionId, message)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  handleDisconnection(connectionId, code, reason) {
    const connectionMeta = this.connections.get(connectionId);
    if (!connectionMeta) return;

    console.log(`🔌 Connection ${connectionId} disconnected: ${code} ${reason}`);

    // 🏢 Leave department
    if (connectionMeta.department) {
      this.handleLeaveDepartment(connectionMeta, { department: connectionMeta.department });
    }

    // 🏠 Leave all rooms
    for (const roomId of connectionMeta.rooms) {
      this.handleLeaveRoom(connectionMeta, { roomId });
    }

    // 👤 Remove presence
    if (connectionMeta.userId) {
      this.presence.delete(connectionMeta.userId);
    }

    // 🧹 Cleanup
    this.connections.delete(connectionId);
    this.rateLimits.delete(connectionId);
    this.metrics.activeConnections--;

    this.emit('connection:closed', { connectionId, code, reason });
  }

  setupMaintenanceTasks() {
    // 💓 Heartbeat/ping to detect dead connections
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const connectionMeta = Array.from(this.connections.values())
          .find(conn => conn.ws === ws);

        if (connectionMeta) {
          if (!connectionMeta.isAlive) {
            console.log(`💀 Terminating dead connection: ${connectionMeta.connectionId}`);
            ws.terminate();
            return;
          }

          connectionMeta.isAlive = false;
          ws.ping();
        }
      });
    }, this.config.pingInterval);

    // 🧹 Rate limit cleanup
    setInterval(() => {
      const now = Date.now();
      for (const [connectionId, limit] of this.rateLimits) {
        if (now - limit.window > this.config.rateLimitWindow * 2) {
          this.rateLimits.delete(connectionId);
        }
      }
    }, this.config.rateLimitWindow);

    // 📊 Metrics calculation
    setInterval(() => {
      this.calculateMetrics();
    }, 5000);

    console.log('🔧 Maintenance tasks configured');
  }

  calculateMetrics() {
    const now = Date.now();
    
    // Calculate messages per second (last 5 seconds)
    const recentMessages = this.metrics.totalMessages;
    const timeDiff = (now - this.metrics.uptime) / 1000;
    this.metrics.messagesPerSecond = Math.round(recentMessages / timeDiff);

    this.emit('metrics:updated', this.getMetrics());
  }

  getMetrics() {
    return {
      ...this.metrics,
      departments: Array.from(this.departments.keys()),
      rooms: Array.from(this.rooms.keys()),
      presenceCount: this.presence.size,
      uptime: Date.now() - this.metrics.uptime
    };
  }

  // 🛑 Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down Corporate Communications Hub...');

    // 📢 Notify all clients
    this.broadcastToAll({
      type: 'corporate:server_shutdown',
      data: {
        message: 'Server is shutting down for maintenance',
        timestamp: new Date().toISOString()
      }
    });

    // ⏳ Give clients time to handle shutdown message
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 🔌 Close all connections
    for (const [connectionId] of this.connections) {
      const connectionMeta = this.connections.get(connectionId);
      if (connectionMeta && connectionMeta.ws.readyState === WebSocket.OPEN) {
        connectionMeta.ws.close(1001, 'Server shutdown');
      }
    }

    // 🛑 Close server
    this.server.close();
    console.log('✅ Corporate Communications Hub shutdown complete');
  }
}

// 🎭 DEMONSTRATION FUNCTION
async function demonstrateCorporateRealtimeCommunications() {
  console.log('🏢 ALGOCRATIC CORPORATE REAL-TIME COMMUNICATIONS DEMONSTRATION');
  console.log('===========================================================');
  console.log('📡 Initializing corporate WebSocket infrastructure...');
  console.log('');

  const hub = new AlgoCraticCommunicationsHub({
    port: 8080,
    maxConnections: 100,
    rateLimitMax: 50
  });

  // 📊 Monitor hub events
  hub.on('connection:established', ({ connectionId, clientIP }) => {
    console.log(`✅ Corporate connection established: ${connectionId} from ${clientIP}`);
  });

  hub.on('department:joined', ({ connectionId, department, userId }) => {
    console.log(`🏢 Department coordination: ${userId} joined ${department}`);
  });

  hub.on('department:broadcast', ({ department, fromUserId, message }) => {
    console.log(`📢 Department broadcast in ${department}: ${message}`);
  });

  hub.on('metrics:updated', (metrics) => {
    if (metrics.activeConnections > 0) {
      console.log(`📊 Hub metrics: ${metrics.activeConnections} active, ${metrics.messagesPerSecond} msg/sec, ${metrics.departments.length} departments`);
    }
  });

  // 🛑 Graceful shutdown handler
  process.on('SIGINT', async () => {
    console.log('\\n🛑 Received shutdown signal...');
    await hub.shutdown();
    process.exit(0);
  });

  console.log('\\n🎓 PEDAGOGICAL TAKEAWAYS:');
  console.log('========================');
  console.log('✅ WebSocket servers enable real-time bidirectional communication');
  console.log('✅ Connection lifecycle management prevents resource leaks');
  console.log('✅ Broadcasting patterns enable efficient multi-client coordination');
  console.log('✅ Rate limiting and security prevent abuse and overload');
  console.log('✅ Room/department concepts organize users into logical groups');
  console.log('✅ Presence tracking enables awareness of user status');
  console.log('✅ Integration with HTTP servers provides RESTful management');
}

// 🚀 EXECUTE DEMONSTRATION
if (require.main === module) {
  demonstrateCorporateRealtimeCommunications().catch(error => {
    console.error('🚨 Corporate communications demonstration failed:', error);
    process.exit(1);
  });
}

module.exports = {
  AlgoCraticCommunicationsHub
};