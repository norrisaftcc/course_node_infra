/**
 * Week 2: Enhanced MCP Server for Course Content Generation
 * 
 * Uses Express.js patterns learned in Week 2 to create a more sophisticated
 * MCP server capable of generating Week 3 content structure and beyond.
 * 
 * Features:
 * - RESTful API design with Express.js
 * - Service coordination patterns for content generation
 * - Circuit breaker for external API calls
 * - Comprehensive error handling
 * - Content validation and quality metrics
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { performance } = require('perf_hooks');

// Enhanced content generation service
class ContentGenerationService {
  constructor() {
    this.templates = new Map();
    this.generationMetrics = {
      totalRequests: 0,
      successfulGenerations: 0,
      averageResponseTime: 0,
      contentQualityScore: 0
    };
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Week 3: Event-Driven Architecture template
    this.templates.set('week-03-event-driven', {
      name: 'Event-Driven Architecture',
      description: 'Advanced event-driven patterns with Node.js Event Emitter, Streams, and message queues',
      structure: {
        'sample-code': [
          'event-emitter-demo.js',
          'stream-processing.js', 
          'message-queue-patterns.js',
          'pub-sub-system.js',
          'event-sourcing-demo.js'
        ],
        'exercises': [
          'event-driven-exercise.js',
          'stream-exercise.js',
          'test-runner.js'
        ],
        'solutions': [
          'event-emitter-solution.js',
          'stream-solution.js'
        ]
      },
      dependencies: ['events', 'stream', 'redis', 'socket.io'],
      learningObjectives: [
        'Master Node.js Event Emitter patterns',
        'Implement efficient stream processing',
        'Design pub/sub messaging systems',
        'Build event sourcing architectures',
        'Handle backpressure and flow control'
      ],
      buildRequirements: {
        baseFrom: 'week-02-service-coordination',
        patterns: ['observer', 'mediator', 'event-sourcing'],
        complexity: 'advanced'
      }
    });

    // Week 4: Real-time Systems template
    this.templates.set('week-04-realtime', {
      name: 'Real-time Systems & WebSockets',
      description: 'Building real-time applications with WebSockets, Server-Sent Events, and clustering',
      structure: {
        'sample-code': [
          'websocket-server.js',
          'sse-implementation.js',
          'realtime-chat.js',
          'clustering-demo.js',
          'load-balancing.js'
        ],
        'exercises': [
          'websocket-exercise.js',
          'clustering-exercise.js',
          'test-runner.js'
        ]
      },
      dependencies: ['ws', 'socket.io', 'cluster', 'sticky-session'],
      buildRequirements: {
        baseFrom: 'week-03-event-driven',
        patterns: ['pub-sub', 'fan-out', 'clustering'],
        complexity: 'advanced'
      }
    });

    // Week 5: Performance & Monitoring template
    this.templates.set('week-05-performance', {
      name: 'Performance Optimization & Monitoring',
      description: 'Advanced performance optimization, profiling, and monitoring techniques',
      structure: {
        'sample-code': [
          'performance-profiling.js',
          'memory-optimization.js',
          'cpu-optimization.js',
          'monitoring-setup.js',
          'load-testing.js'
        ],
        'exercises': [
          'optimization-exercise.js',
          'monitoring-exercise.js',
          'test-runner.js'
        ]
      },
      dependencies: ['clinic', 'autocannon', 'prometheus-client', '0x'],
      buildRequirements: {
        baseFrom: 'week-04-realtime',
        patterns: ['optimization', 'monitoring', 'profiling'],
        complexity: 'expert'
      }
    });
  }

  async generateWeekStructure(weekId, options = {}) {
    const startTime = performance.now();
    this.generationMetrics.totalRequests++;

    try {
      const template = this.templates.get(weekId);
      if (!template) {
        throw new Error(`Template for ${weekId} not found`);
      }

      // Simulate content generation with AI/analysis
      await this.simulateContentGeneration(template, options);

      const generatedContent = {
        metadata: {
          weekId,
          name: template.name,
          description: template.description,
          generatedAt: new Date().toISOString(),
          generationTime: performance.now() - startTime,
          contentQuality: this.calculateContentQuality(template),
          version: '2.0.0'
        },
        structure: await this.generateDirectoryStructure(template),
        packageJson: await this.generatePackageJson(template),
        files: await this.generateFileContents(template, options),
        buildInstructions: await this.generateBuildInstructions(template),
        testingSuite: await this.generateTestingSuite(template),
        documentation: await this.generateDocumentation(template)
      };

      this.generationMetrics.successfulGenerations++;
      this.updateMetrics(performance.now() - startTime, generatedContent.metadata.contentQuality);

      return generatedContent;

    } catch (error) {
      console.error(`Content generation failed for ${weekId}:`, error);
      throw error;
    }
  }

  async simulateContentGeneration(template, options) {
    // Simulate AI-powered content analysis and generation
    const complexity = template.buildRequirements?.complexity || 'intermediate';
    const baseDelay = {
      'beginner': 100,
      'intermediate': 200,
      'advanced': 300,
      'expert': 400
    }[complexity] || 200;

    await new Promise(resolve => setTimeout(resolve, baseDelay + Math.random() * 100));
  }

  calculateContentQuality(template) {
    // Simulate content quality assessment
    const factors = {
      structureComplexity: template.structure ? Object.keys(template.structure).length * 10 : 0,
      learningObjectives: template.learningObjectives ? template.learningObjectives.length * 5 : 0,
      dependencies: template.dependencies ? template.dependencies.length * 3 : 0,
      buildRequirements: template.buildRequirements ? 20 : 0
    };

    const baseScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
    const qualityScore = Math.min(100, baseScore + Math.random() * 10);
    
    return Math.round(qualityScore);
  }

  async generateDirectoryStructure(template) {
    return {
      directories: Object.keys(template.structure),
      files: Object.values(template.structure).flat(),
      totalItems: Object.values(template.structure).flat().length + Object.keys(template.structure).length
    };
  }

  async generatePackageJson(template) {
    return {
      name: `week-${template.name.toLowerCase().replace(/\s+/g, '-')}`,
      version: '1.0.0',
      description: template.description,
      main: template.structure['sample-code'] ? `sample-code/${template.structure['sample-code'][0]}` : 'index.js',
      scripts: {
        dev: `node sample-code/${template.structure['sample-code'] ? template.structure['sample-code'][0] : 'index.js'}`,
        test: 'node exercises/test-runner.js',
        'demo:all': 'npm run demo:basic && npm run demo:advanced',
        lint: 'eslint .',
        start: 'node server.js'
      },
      dependencies: template.dependencies.reduce((deps, dep) => {
        deps[dep] = this.getLatestVersion(dep);
        return deps;
      }, {}),
      devDependencies: {
        'eslint': '^8.0.0',
        'nodemon': '^3.0.0'
      },
      keywords: [
        'nodejs',
        'education',
        template.name.toLowerCase().replace(/\s+/g, '-'),
        ...template.buildRequirements.patterns
      ]
    };
  }

  getLatestVersion(packageName) {
    // Simulate version lookup (in real implementation, would use npm API)
    const versions = {
      'events': '^3.3.0',
      'stream': '^0.0.2',
      'redis': '^4.6.0',
      'socket.io': '^4.7.0',
      'ws': '^8.14.0',
      'cluster': '^0.7.7',
      'sticky-session': '^1.1.2',
      'clinic': '^12.1.0',
      'autocannon': '^7.15.0',
      'prometheus-client': '^15.1.0',
      '0x': '^5.7.0'
    };
    return versions[packageName] || '^1.0.0';
  }

  async generateFileContents(template, options) {
    const files = {};
    
    // Generate sample code files
    if (template.structure['sample-code']) {
      for (const filename of template.structure['sample-code']) {
        files[`sample-code/${filename}`] = await this.generateSampleCode(filename, template, options);
      }
    }

    // Generate exercise files
    if (template.structure['exercises']) {
      for (const filename of template.structure['exercises']) {
        files[`exercises/${filename}`] = await this.generateExerciseCode(filename, template, options);
      }
    }

    return files;
  }

  async generateSampleCode(filename, template, options) {
    // Generate contextual sample code based on filename and template
    const codeTemplates = {
      'event-emitter-demo.js': this.generateEventEmitterDemo(),
      'stream-processing.js': this.generateStreamProcessingDemo(),
      'message-queue-patterns.js': this.generateMessageQueueDemo(),
      'websocket-server.js': this.generateWebSocketDemo(),
      'performance-profiling.js': this.generatePerformanceDemo()
    };

    return codeTemplates[filename] || this.generateGenericSampleCode(filename, template);
  }

  generateEventEmitterDemo() {
    return `/**
 * Week 3: Event Emitter Demonstration
 * Advanced event-driven patterns building on Week 2 service coordination
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class OrderProcessingSystem extends EventEmitter {
  constructor() {
    super();
    this.orders = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.on('order:created', this.handleOrderCreated.bind(this));
    this.on('payment:processed', this.handlePaymentProcessed.bind(this));
    this.on('inventory:reserved', this.handleInventoryReserved.bind(this));
    this.on('order:shipped', this.handleOrderShipped.bind(this));
  }

  async createOrder(orderData) {
    const order = {
      id: \`order_\${Date.now()}\`,
      ...orderData,
      status: 'created',
      createdAt: new Date().toISOString()
    };
    
    this.orders.set(order.id, order);
    this.emit('order:created', order);
    return order;
  }

  handleOrderCreated(order) {
    console.log(\`📦 Order created: \${order.id}\`);
    // Trigger downstream processes
    this.emit('payment:process', order);
    this.emit('inventory:reserve', order);
  }

  handlePaymentProcessed(order) {
    console.log(\`💳 Payment processed for order: \${order.id}\`);
    order.paymentStatus = 'completed';
    this.checkOrderCompletion(order);
  }

  handleInventoryReserved(order) {
    console.log(\`📋 Inventory reserved for order: \${order.id}\`);
    order.inventoryStatus = 'reserved';
    this.checkOrderCompletion(order);
  }

  checkOrderCompletion(order) {
    if (order.paymentStatus === 'completed' && order.inventoryStatus === 'reserved') {
      order.status = 'ready_to_ship';
      this.emit('order:ready_to_ship', order);
    }
  }

  handleOrderShipped(order) {
    console.log(\`🚚 Order shipped: \${order.id}\`);
    order.status = 'shipped';
    order.shippedAt = new Date().toISOString();
  }
}

// Demo usage
async function demonstrateEventDrivenOrdering() {
  const orderSystem = new OrderProcessingSystem();
  
  // Simulate order processing
  const order = await orderSystem.createOrder({
    customerId: '12345',
    items: [{ productId: 'prod-1', quantity: 2 }],
    total: 99.99
  });
  
  // Simulate async operations
  setTimeout(() => orderSystem.emit('payment:processed', order), 100);
  setTimeout(() => orderSystem.emit('inventory:reserved', order), 150);
  setTimeout(() => orderSystem.emit('order:shipped', order), 200);
}

if (require.main === module) {
  demonstrateEventDrivenOrdering();
}

module.exports = { OrderProcessingSystem };`;
  }

  generateStreamProcessingDemo() {
    return `/**
 * Week 3: Stream Processing Demonstration
 * Building efficient data pipelines with Node.js streams
 */

const { Transform, Readable, Writable, pipeline } = require('stream');
const { promisify } = require('util');
const { performance } = require('perf_hooks');

class DataGenerator extends Readable {
  constructor(options = {}) {
    super({ objectMode: true });
    this.count = 0;
    this.maxRecords = options.maxRecords || 1000;
    this.batchSize = options.batchSize || 10;
  }

  _read() {
    if (this.count >= this.maxRecords) {
      this.push(null);
      return;
    }

    const batch = [];
    for (let i = 0; i < this.batchSize && this.count < this.maxRecords; i++) {
      batch.push({
        id: this.count++,
        timestamp: new Date().toISOString(),
        value: Math.random() * 100,
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
      });
    }

    this.push(batch);
  }
}

class DataValidator extends Transform {
  constructor() {
    super({ objectMode: true });
    this.validRecords = 0;
    this.invalidRecords = 0;
  }

  _transform(batch, encoding, callback) {
    const validatedBatch = batch.filter(record => {
      const isValid = record.value >= 0 && record.value <= 100 && record.category;
      if (isValid) {
        this.validRecords++;
      } else {
        this.invalidRecords++;
      }
      return isValid;
    });

    callback(null, validatedBatch);
  }
}

class DataAggregator extends Transform {
  constructor() {
    super({ objectMode: true });
    this.categoryStats = {};
  }

  _transform(batch, encoding, callback) {
    batch.forEach(record => {
      if (!this.categoryStats[record.category]) {
        this.categoryStats[record.category] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity
        };
      }

      const stats = this.categoryStats[record.category];
      stats.count++;
      stats.sum += record.value;
      stats.min = Math.min(stats.min, record.value);
      stats.max = Math.max(stats.max, record.value);
    });

    // Pass through the aggregated stats
    const aggregatedData = Object.entries(this.categoryStats).map(([category, stats]) => ({
      category,
      ...stats,
      average: stats.sum / stats.count
    }));

    callback(null, aggregatedData);
  }
}

class DataWriter extends Writable {
  constructor() {
    super({ objectMode: true });
    this.processedRecords = 0;
  }

  _write(data, encoding, callback) {
    console.log('📊 Aggregated Statistics:', data);
    this.processedRecords++;
    callback();
  }
}

async function demonstrateStreamProcessing() {
  console.log('🌊 Starting stream processing demonstration...');
  const startTime = performance.now();

  const pipelineAsync = promisify(pipeline);

  try {
    await pipelineAsync(
      new DataGenerator({ maxRecords: 100, batchSize: 5 }),
      new DataValidator(),
      new DataAggregator(),
      new DataWriter()
    );

    const executionTime = performance.now() - startTime;
    console.log(\`✅ Stream processing completed in \${executionTime.toFixed(2)}ms\`);

  } catch (error) {
    console.error('❌ Stream processing failed:', error);
  }
}

if (require.main === module) {
  demonstrateStreamProcessing();
}

module.exports = { DataGenerator, DataValidator, DataAggregator, DataWriter };`;
  }

  generateMessageQueueDemo() {
    return `/**
 * Week 3: Message Queue Patterns
 * Implementing pub/sub and message queue patterns for service coordination
 */

const EventEmitter = require('events');

class MessageQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queues = new Map();
    this.subscribers = new Map();
    this.deadLetterQueue = [];
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  createQueue(queueName, options = {}) {
    this.queues.set(queueName, {
      name: queueName,
      messages: [],
      subscribers: new Set(),
      options: {
        durable: options.durable || false,
        maxSize: options.maxSize || 1000,
        ...options
      }
    });
  }

  async publish(queueName, message, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(\`Queue '\${queueName}' does not exist\`);
    }

    const messageObj = {
      id: \`msg_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
      content: message,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      priority: options.priority || 0
    };

    if (queue.messages.length >= queue.options.maxSize) {
      throw new Error(\`Queue '\${queueName}' is full\`);
    }

    queue.messages.push(messageObj);
    this.emit('message:published', queueName, messageObj);
    
    // Notify subscribers
    this.notifySubscribers(queueName, messageObj);
    
    return messageObj.id;
  }

  subscribe(queueName, handler, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(\`Queue '\${queueName}' does not exist\`);
    }

    const subscriber = {
      id: \`sub_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
      handler,
      options: {
        autoAck: options.autoAck !== false,
        prefetch: options.prefetch || 1,
        ...options
      }
    };

    if (!this.subscribers.has(queueName)) {
      this.subscribers.set(queueName, new Set());
    }
    
    this.subscribers.get(queueName).add(subscriber);
    queue.subscribers.add(subscriber.id);

    return subscriber.id;
  }

  async notifySubscribers(queueName, message) {
    const subscribers = this.subscribers.get(queueName);
    if (!subscribers) return;

    for (const subscriber of subscribers) {
      try {
        await this.processMessage(subscriber, message);
      } catch (error) {
        console.error(\`Error processing message for subscriber \${subscriber.id}:\`, error);
        await this.handleMessageFailure(queueName, message, error);
      }
    }
  }

  async processMessage(subscriber, message) {
    try {
      message.attempts++;
      const result = await subscriber.handler(message.content, message);
      
      if (subscriber.options.autoAck) {
        this.acknowledge(message.id);
      }
      
      this.emit('message:processed', message);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async handleMessageFailure(queueName, message, error) {
    if (message.attempts >= message.maxRetries) {
      this.deadLetterQueue.push({
        ...message,
        failedAt: new Date().toISOString(),
        error: error.message
      });
      this.emit('message:dead_letter', message);
    } else {
      // Retry after delay
      setTimeout(() => {
        this.notifySubscribers(queueName, message);
      }, this.retryDelay * message.attempts);
    }
  }

  acknowledge(messageId) {
    // Remove message from queues after acknowledgment
    for (const [queueName, queue] of this.queues) {
      const messageIndex = queue.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        queue.messages.splice(messageIndex, 1);
        this.emit('message:acknowledged', messageId);
        break;
      }
    }
  }

  getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    return {
      name: queueName,
      messageCount: queue.messages.length,
      subscriberCount: queue.subscribers.size,
      deadLetterCount: this.deadLetterQueue.filter(msg => 
        queue.messages.some(qMsg => qMsg.id === msg.id)
      ).length
    };
  }
}

// Demonstration
async function demonstrateMessageQueue() {
  console.log('📨 Starting message queue demonstration...');
  
  const mq = new MessageQueue();
  
  // Create queues
  mq.createQueue('orders', { maxSize: 100 });
  mq.createQueue('notifications', { maxSize: 50 });
  
  // Subscribe to order processing
  mq.subscribe('orders', async (message) => {
    console.log('🛒 Processing order:', message);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (Math.random() < 0.1) {
      throw new Error('Order processing failed');
    }
    
    return { status: 'processed', orderId: message.orderId };
  });
  
  // Subscribe to notifications
  mq.subscribe('notifications', async (message) => {
    console.log('📧 Sending notification:', message);
    return { status: 'sent' };
  });
  
  // Publish messages
  for (let i = 0; i < 5; i++) {
    await mq.publish('orders', { 
      orderId: \`order-\${i}\`, 
      amount: Math.random() * 100 
    });
    
    await mq.publish('notifications', { 
      type: 'email', 
      recipient: \`user\${i}@example.com\` 
    });
  }
  
  // Wait for processing
  setTimeout(() => {
    console.log('📊 Queue Statistics:');
    console.log('Orders:', mq.getQueueStats('orders'));
    console.log('Notifications:', mq.getQueueStats('notifications'));
  }, 2000);
}

if (require.main === module) {
  demonstrateMessageQueue();
}

module.exports = { MessageQueue };`;
  }

  generateWebSocketDemo() {
    return `/**
 * Week 4: WebSocket Server Implementation
 * Real-time communication patterns
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');

class RealTimeServer {
  constructor(options = {}) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.clients = new Map();
    this.rooms = new Map();
    this.messageHistory = [];
    
    this.setupMiddleware();
    this.setupWebSocketHandlers();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      
      this.clients.set(clientId, {
        id: clientId,
        ws,
        joinedAt: new Date().toISOString(),
        rooms: new Set(),
        isAlive: true
      });

      console.log(\`🔌 Client \${clientId} connected\`);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(clientId, message);
        } catch (error) {
          this.sendError(clientId, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(clientId);
      });

      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) client.isAlive = true;
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        clientId,
        timestamp: new Date().toISOString()
      });
    });

    // Health check interval
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = Array.from(this.clients.values())
          .find(c => c.ws === ws);
        
        if (client && !client.isAlive) {
          ws.terminate();
          return;
        }
        
        if (client) {
          client.isAlive = false;
          ws.ping();
        }
      });
    }, 30000);
  }

  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'join_room':
        this.joinRoom(clientId, message.room);
        break;
      case 'leave_room':
        this.leaveRoom(clientId, message.room);
        break;
      case 'chat_message':
        this.broadcastToRoom(message.room, {
          type: 'chat_message',
          clientId,
          message: message.content,
          timestamp: new Date().toISOString()
        });
        break;
      case 'ping':
        this.sendToClient(clientId, { type: 'pong' });
        break;
      default:
        this.sendError(clientId, \`Unknown message type: \${message.type}\`);
    }
  }

  joinRoom(clientId, roomName) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }

    this.rooms.get(roomName).add(clientId);
    client.rooms.add(roomName);

    this.sendToClient(clientId, {
      type: 'room_joined',
      room: roomName,
      memberCount: this.rooms.get(roomName).size
    });

    this.broadcastToRoom(roomName, {
      type: 'user_joined',
      clientId,
      room: roomName
    }, clientId);
  }

  leaveRoom(clientId, roomName) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(clientId);
      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
      }
    }

    client.rooms.delete(roomName);

    this.sendToClient(clientId, {
      type: 'room_left',
      room: roomName
    });

    if (this.rooms.has(roomName)) {
      this.broadcastToRoom(roomName, {
        type: 'user_left',
        clientId,
        room: roomName
      });
    }
  }

  broadcastToRoom(roomName, message, excludeClientId = null) {
    const room = this.rooms.get(roomName);
    if (!room) return;

    for (const clientId of room) {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    }

    // Store message in history
    this.messageHistory.push({
      ...message,
      room: roomName,
      timestamp: new Date().toISOString()
    });

    // Limit history size
    if (this.messageHistory.length > 1000) {
      this.messageHistory = this.messageHistory.slice(-1000);
    }
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  sendError(clientId, error) {
    this.sendToClient(clientId, {
      type: 'error',
      error,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave all rooms
    for (const roomName of client.rooms) {
      this.leaveRoom(clientId, roomName);
    }

    this.clients.delete(clientId);
    console.log(\`🔌 Client \${clientId} disconnected\`);
  }

  generateClientId() {
    return \`client_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }

  setupRoutes() {
    this.app.get('/api/stats', (req, res) => {
      res.json({
        connectedClients: this.clients.size,
        activeRooms: this.rooms.size,
        messageHistory: this.messageHistory.length,
        rooms: Array.from(this.rooms.entries()).map(([name, clients]) => ({
          name,
          memberCount: clients.size
        }))
      });
    });
  }

  listen(port = 8080) {
    this.server.listen(port, () => {
      console.log(\`🚀 Real-time server listening on port \${port}\`);
    });
  }
}

if (require.main === module) {
  const server = new RealTimeServer();
  server.listen(8080);
}

module.exports = { RealTimeServer };`;
  }

  generatePerformanceDemo() {
    return `/**
 * Week 5: Performance Profiling and Optimization
 * Advanced performance monitoring and optimization techniques
 */

const { performance, PerformanceObserver } = require('perf_hooks');
const v8 = require('v8');
const process = require('process');

class PerformanceProfiler {
  constructor() {
    this.metrics = {
      cpuUsage: [],
      memoryUsage: [],
      eventLoopLag: [],
      gcMetrics: []
    };
    
    this.setupPerformanceObserver();
    this.startMonitoring();
  }

  setupPerformanceObserver() {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry);
      }
    });
    
    obs.observe({ entryTypes: ['measure', 'mark', 'gc'] });
  }

  handlePerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'gc':
        this.metrics.gcMetrics.push({
          type: entry.detail?.type || 'unknown',
          duration: entry.duration,
          timestamp: entry.startTime
        });
        break;
      case 'measure':
        console.log(\`📊 Performance measure '\${entry.name}': \${entry.duration.toFixed(2)}ms\`);
        break;
    }
  }

  startMonitoring() {
    setInterval(() => {
      this.collectMetrics();
    }, 1000);
  }

  collectMetrics() {
    // CPU usage
    const cpuUsage = process.cpuUsage();
    this.metrics.cpuUsage.push({
      user: cpuUsage.user,
      system: cpuUsage.system,
      timestamp: Date.now()
    });

    // Memory usage
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      timestamp: Date.now()
    });

    // V8 heap statistics
    const heapStats = v8.getHeapStatistics();
    this.metrics.heapStats = heapStats;

    // Keep only last 60 seconds of data
    const cutoff = Date.now() - 60000;
    this.metrics.cpuUsage = this.metrics.cpuUsage.filter(m => m.timestamp > cutoff);
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(m => m.timestamp > cutoff);
  }

  measureEventLoopLag() {
    const start = performance.now();
    setImmediate(() => {
      const lag = performance.now() - start;
      this.metrics.eventLoopLag.push({
        lag,
        timestamp: Date.now()
      });
      
      // Keep only recent measurements
      if (this.metrics.eventLoopLag.length > 100) {
        this.metrics.eventLoopLag = this.metrics.eventLoopLag.slice(-100);
      }
    });
  }

  async benchmarkFunction(fn, name, iterations = 1000) {
    console.log(\`🏃 Benchmarking '\${name}' with \${iterations} iterations...\`);
    
    const markStart = \`\${name}-start\`;
    const markEnd = \`\${name}-end\`;
    const measureName = \`\${name}-duration\`;
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    performance.mark(markStart);
    const startTime = performance.now();
    
    const results = [];
    for (let i = 0; i < iterations; i++) {
      const iterStart = performance.now();
      const result = await fn();
      const iterEnd = performance.now();
      
      results.push({
        iteration: i,
        duration: iterEnd - iterStart,
        result
      });
    }
    
    const endTime = performance.now();
    performance.mark(markEnd);
    performance.measure(measureName, markStart, markEnd);
    
    const totalDuration = endTime - startTime;
    const avgDuration = totalDuration / iterations;
    const minDuration = Math.min(...results.map(r => r.duration));
    const maxDuration = Math.max(...results.map(r => r.duration));
    
    console.log(\`📈 Benchmark Results for '\${name}':\`);
    console.log(\`  Total: \${totalDuration.toFixed(2)}ms\`);
    console.log(\`  Average: \${avgDuration.toFixed(2)}ms\`);
    console.log(\`  Min: \${minDuration.toFixed(2)}ms\`);
    console.log(\`  Max: \${maxDuration.toFixed(2)}ms\`);
    console.log(\`  Ops/sec: \${(1000 / avgDuration).toFixed(0)}\`);
    
    return {
      name,
      iterations,
      totalDuration,
      avgDuration,
      minDuration,
      maxDuration,
      opsPerSecond: 1000 / avgDuration,
      results
    };
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: {
        memory: this.getMemorySummary(),
        cpu: this.getCpuSummary(),
        eventLoop: this.getEventLoopSummary(),
        gc: this.getGcSummary()
      },
      v8: {
        heapStats: this.metrics.heapStats,
        version: process.version
      }
    };
    
    return report;
  }

  getMemorySummary() {
    if (this.metrics.memoryUsage.length === 0) return null;
    
    const recent = this.metrics.memoryUsage.slice(-10);
    const avgHeapUsed = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
    const avgRss = recent.reduce((sum, m) => sum + m.rss, 0) / recent.length;
    
    return {
      averageHeapUsed: Math.round(avgHeapUsed / 1024 / 1024), // MB
      averageRss: Math.round(avgRss / 1024 / 1024), // MB
      samples: recent.length
    };
  }

  getCpuSummary() {
    if (this.metrics.cpuUsage.length === 0) return null;
    
    const recent = this.metrics.cpuUsage.slice(-10);
    return {
      samples: recent.length,
      latest: recent[recent.length - 1]
    };
  }

  getEventLoopSummary() {
    if (this.metrics.eventLoopLag.length === 0) return null;
    
    const recent = this.metrics.eventLoopLag.slice(-10);
    const avgLag = recent.reduce((sum, m) => sum + m.lag, 0) / recent.length;
    const maxLag = Math.max(...recent.map(m => m.lag));
    
    return {
      averageLag: avgLag.toFixed(2),
      maxLag: maxLag.toFixed(2),
      samples: recent.length
    };
  }

  getGcSummary() {
    if (this.metrics.gcMetrics.length === 0) return null;
    
    const recent = this.metrics.gcMetrics.slice(-10);
    const totalDuration = recent.reduce((sum, gc) => sum + gc.duration, 0);
    
    return {
      totalCollections: recent.length,
      totalDuration: totalDuration.toFixed(2),
      averageDuration: (totalDuration / recent.length).toFixed(2)
    };
  }
}

// Demonstration functions
async function slowFunction() {
  // Simulate CPU-intensive work
  let result = 0;
  for (let i = 0; i < 100000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

async function memoryIntensiveFunction() {
  // Simulate memory allocation
  const largeArray = new Array(10000).fill(null).map((_, i) => ({
    id: i,
    data: new Array(100).fill(Math.random())
  }));
  return largeArray.length;
}

async function demonstratePerformanceProfiling() {
  console.log('🔍 Starting performance profiling demonstration...');
  
  const profiler = new PerformanceProfiler();
  
  // Run benchmarks
  await profiler.benchmarkFunction(slowFunction, 'cpu-intensive', 100);
  await profiler.benchmarkFunction(memoryIntensiveFunction, 'memory-intensive', 50);
  
  // Measure event loop lag periodically
  const lagInterval = setInterval(() => {
    profiler.measureEventLoopLag();
  }, 100);
  
  // Generate report after some time
  setTimeout(() => {
    clearInterval(lagInterval);
    const report = profiler.generateReport();
    console.log('📊 Performance Report:', JSON.stringify(report, null, 2));
  }, 5000);
}

if (require.main === module) {
  demonstratePerformanceProfiling();
}

module.exports = { PerformanceProfiler };`;
  }

  generateGenericSampleCode(filename, template) {
    return `/**
 * ${template.name} - ${filename}
 * ${template.description}
 * 
 * Generated by Enhanced MCP Server v2.0
 */

console.log('🚀 ${filename} implementation');
console.log('📚 Week: ${template.name}');
console.log('🎯 Learning objectives:');
${template.learningObjectives.map(obj => `console.log('  - ${obj}');`).join('\n')}

// TODO: Implement ${filename} functionality
module.exports = {};`;
  }

  async generateExerciseCode(filename, template, options) {
    // Generate exercise code based on template
    return `/**
 * ${template.name} - ${filename}
 * Student exercises for ${template.description.toLowerCase()}
 */

class ExerciseFramework {
  constructor() {
    this.exercises = [];
    this.results = [];
  }

  addExercise(name, description, testFn) {
    this.exercises.push({ name, description, testFn });
  }

  async runExercises(studentSolutions) {
    console.log('🎓 Running ${template.name} exercises...');
    
    for (const exercise of this.exercises) {
      const solution = studentSolutions[exercise.name];
      if (solution) {
        try {
          const result = await exercise.testFn(solution);
          this.results.push({ exercise: exercise.name, ...result });
        } catch (error) {
          this.results.push({ 
            exercise: exercise.name, 
            passed: false, 
            error: error.message 
          });
        }
      }
    }
    
    return this.results;
  }
}

// TODO: Add specific exercises for ${template.name}
const framework = new ExerciseFramework();

module.exports = { ExerciseFramework };`;
  }

  async generateBuildInstructions(template) {
    return {
      prerequisites: [
        'Node.js 16+ installed',
        'npm or yarn package manager',
        `Completion of ${template.buildRequirements.baseFrom || 'previous weeks'}`
      ],
      installation: [
        'npm install',
        'npm run dev'
      ],
      development: [
        'npm run dev - Start development server',
        'npm test - Run test suite', 
        'npm run demo:all - Run all demonstrations',
        'npm run lint - Check code style'
      ],
      buildSteps: template.buildRequirements.patterns.map(pattern => 
        `Implement ${pattern} pattern in appropriate modules`
      )
    };
  }

  async generateTestingSuite(template) {
    return {
      framework: 'Custom testing framework with automated validation',
      testTypes: [
        'Unit tests for individual components',
        'Integration tests for service coordination',
        'Performance benchmarks',
        'Error handling validation'
      ],
      coverage: {
        target: '80%',
        critical: 'All exported functions and classes'
      },
      commands: {
        runAll: 'npm test',
        runSpecific: 'npm run test:exercises',
        performance: 'npm run benchmark'
      }
    };
  }

  async generateDocumentation(template) {
    return {
      readme: `# ${template.name}

${template.description}

## Learning Objectives
${template.learningObjectives.map(obj => `- ${obj}`).join('\n')}

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`

## Architecture
Built on patterns from ${template.buildRequirements.baseFrom} with additional:
${template.buildRequirements.patterns.map(pattern => `- ${pattern} pattern`).join('\n')}

## Dependencies
${template.dependencies.map(dep => `- ${dep}`).join('\n')}
`,
      apiDocs: 'Generated API documentation for all public interfaces',
      examples: 'Comprehensive examples for each major pattern',
      troubleshooting: 'Common issues and solutions guide'
    };
  }

  updateMetrics(executionTime, qualityScore) {
    const currentAvg = this.generationMetrics.averageResponseTime;
    const currentCount = this.generationMetrics.successfulGenerations;
    
    this.generationMetrics.averageResponseTime = 
      ((currentAvg * (currentCount - 1)) + executionTime) / currentCount;
    
    const currentQuality = this.generationMetrics.contentQualityScore;
    this.generationMetrics.contentQualityScore = 
      ((currentQuality * (currentCount - 1)) + qualityScore) / currentCount;
  }

  getMetrics() {
    return {
      ...this.generationMetrics,
      templateCount: this.templates.size,
      availableTemplates: Array.from(this.templates.keys())
    };
  }
}

// Enhanced MCP Express Server
const app = express();
const contentService = new ContentGenerationService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging middleware with performance tracking
app.use((req, res, next) => {
  req.startTime = performance.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = performance.now() - req.startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    metrics: contentService.getMetrics()
  });
});

// Generate week structure endpoint
app.post('/api/generate-week/:weekId', async (req, res) => {
  try {
    const { weekId } = req.params;
    const options = req.body || {};
    
    console.log(`🎯 Generating content for ${weekId}...`);
    const content = await contentService.generateWeekStructure(weekId, options);
    
    res.json({
      success: true,
      data: content,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get available templates
app.get('/api/templates', (req, res) => {
  const templates = Array.from(contentService.templates.entries()).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
    complexity: template.buildRequirements?.complexity || 'intermediate',
    dependencies: template.dependencies.length,
    learningObjectives: template.learningObjectives.length
  }));
  
  res.json({
    templates,
    totalCount: templates.length,
    metrics: contentService.getMetrics()
  });
});

// Get specific template details
app.get('/api/templates/:templateId', (req, res) => {
  const { templateId } = req.params;
  const template = contentService.templates.get(templateId);
  
  if (!template) {
    return res.status(404).json({
      error: `Template '${templateId}' not found`,
      availableTemplates: Array.from(contentService.templates.keys())
    });
  }
  
  res.json({
    template,
    estimatedGenerationTime: contentService.calculateEstimatedTime(template),
    qualityScore: contentService.calculateContentQuality(template)
  });
});

// Batch generation endpoint
app.post('/api/generate-batch', async (req, res) => {
  try {
    const { weekIds, options = {} } = req.body;
    
    if (!Array.isArray(weekIds) || weekIds.length === 0) {
      return res.status(400).json({
        error: 'weekIds must be a non-empty array'
      });
    }
    
    console.log(`🎯 Batch generating content for ${weekIds.length} weeks...`);
    const startTime = performance.now();
    
    const results = await Promise.allSettled(
      weekIds.map(weekId => contentService.generateWeekStructure(weekId, options))
    );
    
    const executionTime = performance.now() - startTime;
    
    const processedResults = results.map((result, index) => ({
      weekId: weekIds[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
    
    const successful = processedResults.filter(r => r.status === 'fulfilled').length;
    
    res.json({
      success: true,
      results: processedResults,
      summary: {
        total: weekIds.length,
        successful,
        failed: weekIds.length - successful,
        executionTime: `${executionTime.toFixed(2)}ms`
      },
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Batch generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json({
    service: contentService.getMetrics(),
    server: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      version: process.version,
      platform: process.platform
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Enhanced MCP Server v2.0 running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Templates: http://localhost:${PORT}/api/templates`);
  console.log(`🎯 Generate Week 3: POST http://localhost:${PORT}/api/generate-week/week-03-event-driven`);
  console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`);
});

module.exports = { 
  app, 
  ContentGenerationService,
  contentService 
};