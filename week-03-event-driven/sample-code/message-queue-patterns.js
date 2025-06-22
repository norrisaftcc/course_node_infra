#!/usr/bin/env node

/**
 * 🏢 ALGOCRATIC FUTURES: WEEK 3 ENTERPRISE MESSAGE BUS ARCHITECTURE
 * "Kafka-Inspired Corporate Communication Infrastructure"
 * 
 * 📡 EDUCATIONAL STRATEGY: Instead of requiring external Kafka setup,
 * we've built a "Kafka-enough" message bus that teaches the core patterns:
 * - Topics and partitions
 * - Producer/Consumer architecture
 * - Message persistence and replay
 * - Consumer groups and load balancing
 * - Offset management and at-least-once delivery
 * 
 * 🎯 PEDAGOGICAL ADVANTAGE: Students learn distributed messaging concepts
 * without infrastructure complexity, then can easily transition to real
 * Kafka in production environments.
 * 
 * ⚠️  STUDENT CHALLENGES TO WATCH FOR:
 * - Message ordering guarantees vs performance trade-offs
 * - Consumer lag and backpressure management
 * - Handling duplicate messages (idempotency)
 * - Partition key selection for load balancing
 * - Dead letter queue handling for failed messages
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

/**
 * 📨 ALGOCRATIC MESSAGE BUS - "KAFKA-ENOUGH" IMPLEMENTATION
 * 
 * Core Kafka-like features for educational purposes:
 * - Topics with configurable partitions
 * - Producer/Consumer pattern with consumer groups
 * - Message persistence to disk (optional)
 * - Offset tracking and consumer resume capability
 * - Load balancing across consumer group members
 */
class AlgoCraticMessageBus extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      persistToDisk: options.persistToDisk || false,
      dataDir: options.dataDir || './corporate-message-data',
      maxPartitionSize: options.maxPartitionSize || 10000,
      retentionMs: options.retentionMs || 7 * 24 * 60 * 60 * 1000, // 7 days
      ...options
    };
    
    // 📊 Core message bus state
    this.topics = new Map(); // topic -> { partitions, config }
    this.consumerGroups = new Map(); // groupId -> { consumers, offsets }
    this.producers = new Map(); // producerId -> producer instance
    this.messageStorage = new Map(); // topic:partition -> messages[]
    this.offsets = new Map(); // topic:partition:groupId -> offset
    
    // 📈 Performance and monitoring
    this.metrics = {
      totalMessages: 0,
      totalTopics: 0,
      totalConsumers: 0,
      messagesPerSecond: 0,
      lastMessageTime: Date.now(),
      startTime: Date.now()
    };
    
    this.initializeMessageBus();
  }

  async initializeMessageBus() {
    console.log('🏢 ALGOCRATIC MESSAGE BUS: Initializing enterprise communication infrastructure...');
    
    if (this.config.persistToDisk) {
      await this.ensureDataDirectory();
    }
    
    // 🧹 Setup cleanup and monitoring
    this.setupMaintenanceTasks();
    
    console.log('✅ Corporate message bus operational!');
    console.log(`📊 Configuration: Persistence=${this.config.persistToDisk}, Max Partition Size=${this.config.maxPartitionSize}`);
  }

  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.config.dataDir, { recursive: true });
      console.log(`📁 Message persistence directory ready: ${this.config.dataDir}`);
    } catch (error) {
      console.error('❌ Failed to create persistence directory:', error.message);
    }
  }

  setupMaintenanceTasks() {
    // 🧹 Periodic cleanup of old messages
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, 60000); // Every minute
    
    // 📊 Performance metrics calculation
    setInterval(() => {
      this.calculatePerformanceMetrics();
    }, 5000); // Every 5 seconds
  }

  /**
   * 📝 CREATE TOPIC - Similar to Kafka's topic creation
   */
  async createTopic(topicName, options = {}) {
    if (this.topics.has(topicName)) {
      console.log(`⚠️  Topic '${topicName}' already exists`);
      return;
    }

    const topicConfig = {
      partitionCount: options.partitionCount || 3,
      replicationFactor: options.replicationFactor || 1, // Simulated
      retentionMs: options.retentionMs || this.config.retentionMs,
      compactionEnabled: options.compactionEnabled || false,
      createdAt: new Date().toISOString()
    };

    // 🏗️ Initialize partitions
    const partitions = [];
    for (let i = 0; i < topicConfig.partitionCount; i++) {
      partitions.push({
        id: i,
        messages: [],
        highWaterMark: 0, // Kafka concept: highest offset
        logStartOffset: 0
      });
      
      // Initialize message storage for each partition
      this.messageStorage.set(`${topicName}:${i}`, []);
    }

    this.topics.set(topicName, {
      config: topicConfig,
      partitions: partitions
    });

    this.metrics.totalTopics++;
    
    console.log(`📝 Topic '${topicName}' created with ${topicConfig.partitionCount} partitions`);
    
    this.emit('topic:created', { topicName, config: topicConfig });
  }

  /**
   * 📤 PRODUCER - Kafka-like message publishing
   */
  async createProducer(producerId, options = {}) {
    const producer = new CorporateMessageProducer(producerId, this, options);
    this.producers.set(producerId, producer);
    
    console.log(`📤 Producer '${producerId}' registered`);
    return producer;
  }

  async publishMessage(topicName, message, options = {}) {
    const topic = this.topics.get(topicName);
    if (!topic) {
      throw new Error(`Topic '${topicName}' does not exist`);
    }

    // 🎯 Partition selection (Kafka-like behavior)
    let partitionId;
    if (options.partition !== undefined) {
      partitionId = options.partition;
    } else if (options.key) {
      // Hash-based partitioning (simplified)
      partitionId = this.hashPartition(options.key, topic.config.partitionCount);
    } else {
      // Round-robin partitioning
      partitionId = this.metrics.totalMessages % topic.config.partitionCount;
    }

    const partition = topic.partitions[partitionId];
    
    // 📦 Create message record (Kafka-like format)
    const messageRecord = {
      offset: partition.highWaterMark,
      timestamp: Date.now(),
      key: options.key || null,
      value: message,
      headers: options.headers || {},
      partition: partitionId,
      topic: topicName,
      producerId: options.producerId || 'unknown'
    };

    // 💾 Store message
    const storageKey = `${topicName}:${partitionId}`;
    const messages = this.messageStorage.get(storageKey);
    messages.push(messageRecord);
    
    // 📈 Update partition metadata
    partition.highWaterMark++;
    partition.messages.push(messageRecord);
    
    // 💾 Persist to disk if configured
    if (this.config.persistToDisk) {
      await this.persistMessage(topicName, partitionId, messageRecord);
    }
    
    // 📊 Update metrics
    this.metrics.totalMessages++;
    this.metrics.lastMessageTime = Date.now();
    
    // 📡 Notify consumers
    this.emit('message:published', {
      topic: topicName,
      partition: partitionId,
      offset: messageRecord.offset,
      message: messageRecord
    });
    
    return {
      topic: topicName,
      partition: partitionId,
      offset: messageRecord.offset
    };
  }

  hashPartition(key, partitionCount) {
    // Simple hash function for partition selection
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % partitionCount;
  }

  /**
   * 📥 CONSUMER - Kafka-like message consumption
   */
  async createConsumer(groupId, options = {}) {
    const consumer = new CorporateMessageConsumer(groupId, this, options);
    
    // 👥 Register consumer in group
    if (!this.consumerGroups.has(groupId)) {
      this.consumerGroups.set(groupId, {
        consumers: new Set(),
        offsets: new Map(), // topic:partition -> offset
        createdAt: Date.now()
      });
    }
    
    const group = this.consumerGroups.get(groupId);
    group.consumers.add(consumer);
    
    this.metrics.totalConsumers++;
    
    console.log(`📥 Consumer joined group '${groupId}' (${group.consumers.size} total consumers)`);
    
    return consumer;
  }

  /**
   * 🔄 CONSUMER GROUP REBALANCING
   * 
   * When consumers join/leave, redistribute partition assignments
   * (Simplified version of Kafka's rebalancing protocol)
   */
  rebalanceConsumerGroup(groupId) {
    const group = this.consumerGroups.get(groupId);
    if (!group || group.consumers.size === 0) return;

    console.log(`🔄 Rebalancing consumer group '${groupId}' with ${group.consumers.size} consumers`);
    
    // 📊 Collect all partitions across subscribed topics
    const allPartitions = [];
    for (const consumer of group.consumers) {
      for (const topicName of consumer.subscribedTopics) {
        const topic = this.topics.get(topicName);
        if (topic) {
          for (let i = 0; i < topic.config.partitionCount; i++) {
            allPartitions.push({ topic: topicName, partition: i });
          }
        }
      }
    }

    // 🎯 Assign partitions to consumers (round-robin)
    const consumers = Array.from(group.consumers);
    const assignments = new Map();
    
    allPartitions.forEach((partition, index) => {
      const consumerIndex = index % consumers.length;
      const consumer = consumers[consumerIndex];
      
      if (!assignments.has(consumer)) {
        assignments.set(consumer, []);
      }
      assignments.get(consumer).push(partition);
    });

    // 📋 Update consumer assignments
    for (const [consumer, partitions] of assignments) {
      consumer.assignedPartitions = partitions;
      console.log(`📋 Consumer ${consumer.consumerId} assigned ${partitions.length} partitions`);
    }

    this.emit('group:rebalanced', { groupId, assignments: Array.from(assignments.entries()) });
  }

  /**
   * 📖 CONSUME MESSAGES - Fetch messages from assigned partitions
   */
  async consumeMessages(groupId, consumerId, maxMessages = 100) {
    const group = this.consumerGroups.get(groupId);
    if (!group) {
      throw new Error(`Consumer group '${groupId}' not found`);
    }

    const consumer = Array.from(group.consumers).find(c => c.consumerId === consumerId);
    if (!consumer || !consumer.assignedPartitions) {
      return []; // No partitions assigned yet
    }

    const messages = [];
    
    // 📥 Fetch from each assigned partition
    for (const { topic: topicName, partition: partitionId } of consumer.assignedPartitions) {
      const offsetKey = `${topicName}:${partitionId}`;
      const currentOffset = group.offsets.get(offsetKey) || 0;
      
      const storageKey = `${topicName}:${partitionId}`;
      const partitionMessages = this.messageStorage.get(storageKey) || [];
      
      // 📖 Get messages from current offset
      const availableMessages = partitionMessages.slice(currentOffset, currentOffset + maxMessages);
      messages.push(...availableMessages);
      
      if (messages.length >= maxMessages) break;
    }

    return messages.slice(0, maxMessages);
  }

  /**
   * ✅ COMMIT OFFSETS - Mark messages as processed
   */
  async commitOffsets(groupId, offsets) {
    const group = this.consumerGroups.get(groupId);
    if (!group) {
      throw new Error(`Consumer group '${groupId}' not found`);
    }

    for (const { topic, partition, offset } of offsets) {
      const offsetKey = `${topic}:${partition}`;
      group.offsets.set(offsetKey, offset + 1); // Commit next offset to read
      
      // 💾 Persist offset if configured
      if (this.config.persistToDisk) {
        await this.persistOffset(groupId, topic, partition, offset + 1);
      }
    }

    this.emit('offsets:committed', { groupId, offsets });
  }

  // 💾 PERSISTENCE METHODS
  async persistMessage(topic, partition, message) {
    try {
      const filePath = path.join(this.config.dataDir, `${topic}-${partition}.log`);
      const logEntry = JSON.stringify(message) + '\n';
      await fs.appendFile(filePath, logEntry);
    } catch (error) {
      console.error(`💾 Failed to persist message: ${error.message}`);
    }
  }

  async persistOffset(groupId, topic, partition, offset) {
    try {
      const filePath = path.join(this.config.dataDir, `offsets-${groupId}.json`);
      const offsetKey = `${topic}:${partition}`;
      
      let offsets = {};
      try {
        const data = await fs.readFile(filePath, 'utf8');
        offsets = JSON.parse(data);
      } catch (error) {
        // File doesn't exist yet, start with empty offsets
      }
      
      offsets[offsetKey] = offset;
      await fs.writeFile(filePath, JSON.stringify(offsets, null, 2));
    } catch (error) {
      console.error(`💾 Failed to persist offset: ${error.message}`);
    }
  }

  // 🧹 MAINTENANCE METHODS
  cleanupExpiredMessages() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [storageKey, messages] of this.messageStorage) {
      const retentionMs = this.config.retentionMs;
      const originalLength = messages.length;
      
      // Remove messages older than retention period
      const filteredMessages = messages.filter(msg => 
        (now - msg.timestamp) < retentionMs
      );
      
      if (filteredMessages.length !== originalLength) {
        this.messageStorage.set(storageKey, filteredMessages);
        cleanedCount += (originalLength - filteredMessages.length);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired messages`);
    }
  }

  calculatePerformanceMetrics() {
    const now = Date.now();
    const uptimeMs = now - this.metrics.startTime;
    const recentMessages = this.metrics.totalMessages;
    
    this.metrics.messagesPerSecond = Math.round((recentMessages / uptimeMs) * 1000);
    
    // Emit metrics for monitoring
    this.emit('metrics:updated', { ...this.metrics, uptimeMs });
  }

  // 📊 STATUS AND MONITORING
  getTopicInfo(topicName) {
    const topic = this.topics.get(topicName);
    if (!topic) return null;
    
    return {
      name: topicName,
      config: topic.config,
      partitions: topic.partitions.map(p => ({
        id: p.id,
        messageCount: p.messages.length,
        highWaterMark: p.highWaterMark,
        logStartOffset: p.logStartOffset
      }))
    };
  }

  getConsumerGroupInfo(groupId) {
    const group = this.consumerGroups.get(groupId);
    if (!group) return null;
    
    return {
      groupId,
      consumerCount: group.consumers.size,
      offsets: Object.fromEntries(group.offsets),
      createdAt: group.createdAt
    };
  }

  getAllMetrics() {
    return {
      ...this.metrics,
      topics: Array.from(this.topics.keys()),
      consumerGroups: Array.from(this.consumerGroups.keys()),
      activeProducers: this.producers.size
    };
  }
}

/**
 * 📤 CORPORATE MESSAGE PRODUCER
 */
class CorporateMessageProducer {
  constructor(producerId, messageBus, options = {}) {
    this.producerId = producerId;
    this.messageBus = messageBus;
    this.config = {
      batchSize: options.batchSize || 100,
      compressionType: options.compressionType || 'none',
      acks: options.acks || 'all', // Kafka concept
      retries: options.retries || 3,
      ...options
    };
    
    this.messagesSent = 0;
    this.messagesFailed = 0;
  }

  async send(topicName, message, options = {}) {
    try {
      const result = await this.messageBus.publishMessage(topicName, message, {
        ...options,
        producerId: this.producerId
      });
      
      this.messagesSent++;
      return result;
      
    } catch (error) {
      this.messagesFailed++;
      
      if (this.config.retries > 0) {
        console.log(`🔄 Retrying failed message (${this.config.retries} retries left)`);
        return this.send(topicName, message, { ...options, retries: this.config.retries - 1 });
      }
      
      throw error;
    }
  }

  async sendBatch(topicName, messages) {
    const results = [];
    const errors = [];
    
    for (const message of messages) {
      try {
        const result = await this.send(topicName, message.value, {
          key: message.key,
          headers: message.headers
        });
        results.push(result);
      } catch (error) {
        errors.push({ message, error });
      }
    }
    
    return { results, errors };
  }

  getStats() {
    return {
      producerId: this.producerId,
      messagesSent: this.messagesSent,
      messagesFailed: this.messagesFailed,
      successRate: this.messagesSent / (this.messagesSent + this.messagesFailed) || 0
    };
  }
}

/**
 * 📥 CORPORATE MESSAGE CONSUMER
 */
class CorporateMessageConsumer extends EventEmitter {
  constructor(groupId, messageBus, options = {}) {
    super();
    
    this.consumerId = options.consumerId || `consumer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.groupId = groupId;
    this.messageBus = messageBus;
    this.subscribedTopics = new Set();
    this.assignedPartitions = [];
    
    this.config = {
      autoCommit: options.autoCommit !== false,
      autoCommitInterval: options.autoCommitInterval || 5000,
      maxPollRecords: options.maxPollRecords || 500,
      ...options
    };
    
    this.messagesConsumed = 0;
    this.messagesProcessed = 0;
    this.isPolling = false;
    this.pendingOffsets = [];
    
    if (this.config.autoCommit) {
      this.startAutoCommit();
    }
  }

  async subscribe(topics) {
    const topicArray = Array.isArray(topics) ? topics : [topics];
    
    for (const topic of topicArray) {
      this.subscribedTopics.add(topic);
    }
    
    console.log(`📥 Consumer ${this.consumerId} subscribed to: ${Array.from(this.subscribedTopics).join(', ')}`);
    
    // 🔄 Trigger rebalancing
    this.messageBus.rebalanceConsumerGroup(this.groupId);
  }

  async poll(timeout = 1000) {
    if (this.isPolling) return [];
    
    this.isPolling = true;
    
    try {
      const messages = await this.messageBus.consumeMessages(
        this.groupId,
        this.consumerId,
        this.config.maxPollRecords
      );
      
      this.messagesConsumed += messages.length;
      
      // 📋 Track offsets for potential commit
      for (const message of messages) {
        this.pendingOffsets.push({
          topic: message.topic,
          partition: message.partition,
          offset: message.offset
        });
      }
      
      return messages;
      
    } finally {
      this.isPolling = false;
    }
  }

  async commitSync(offsets = null) {
    const offsetsToCommit = offsets || this.pendingOffsets;
    
    if (offsetsToCommit.length === 0) return;
    
    await this.messageBus.commitOffsets(this.groupId, offsetsToCommit);
    
    this.messagesProcessed += offsetsToCommit.length;
    this.pendingOffsets = [];
    
    this.emit('offsets:committed', offsetsToCommit);
  }

  startAutoCommit() {
    setInterval(async () => {
      if (this.pendingOffsets.length > 0) {
        try {
          await this.commitSync();
        } catch (error) {
          console.error(`❌ Auto-commit failed: ${error.message}`);
        }
      }
    }, this.config.autoCommitInterval);
  }

  getStats() {
    return {
      consumerId: this.consumerId,
      groupId: this.groupId,
      subscribedTopics: Array.from(this.subscribedTopics),
      assignedPartitions: this.assignedPartitions,
      messagesConsumed: this.messagesConsumed,
      messagesProcessed: this.messagesProcessed,
      pendingOffsets: this.pendingOffsets.length
    };
  }

  async close() {
    console.log(`📥 Closing consumer ${this.consumerId}`);
    
    // Commit any pending offsets
    if (this.pendingOffsets.length > 0) {
      await this.commitSync();
    }
    
    // Remove from consumer group
    const group = this.messageBus.consumerGroups.get(this.groupId);
    if (group) {
      group.consumers.delete(this);
      
      // Trigger rebalancing for remaining consumers
      if (group.consumers.size > 0) {
        this.messageBus.rebalanceConsumerGroup(this.groupId);
      }
    }
    
    this.removeAllListeners();
  }
}

/**
 * 🎭 CORPORATE MESSAGING DEMONSTRATION
 * 
 * Simulates realistic enterprise messaging scenarios:
 * - Order processing pipeline
 * - Real-time notifications
 * - Analytics data streaming
 * - Cross-department coordination
 */
async function demonstrateEnterpriseMessaging() {
  console.log('🏢 ALGOCRATIC FUTURES ENTERPRISE MESSAGING DEMONSTRATION');
  console.log('========================================================');
  console.log('📡 Initializing Kafka-like corporate communication infrastructure...');
  console.log('');

  const messageBus = new AlgoCraticMessageBus({
    persistToDisk: false, // For demo simplicity
    maxPartitionSize: 1000
  });

  // 📝 Create enterprise topics
  await messageBus.createTopic('corporate.orders', { partitionCount: 3 });
  await messageBus.createTopic('corporate.notifications', { partitionCount: 2 });
  await messageBus.createTopic('corporate.analytics', { partitionCount: 4 });
  await messageBus.createTopic('corporate.hr.events', { partitionCount: 1 });

  // 📤 Create producers for different departments
  const orderProducer = await messageBus.createProducer('order-service');
  const notificationProducer = await messageBus.createProducer('notification-service');
  const analyticsProducer = await messageBus.createProducer('analytics-service');

  // 📥 Create consumer groups
  const orderProcessingConsumer = await messageBus.createConsumer('order-processing-group');
  const notificationConsumer = await messageBus.createConsumer('notification-group');
  const analyticsConsumer = await messageBus.createConsumer('analytics-group');

  // 📋 Subscribe consumers to topics
  await orderProcessingConsumer.subscribe(['corporate.orders']);
  await notificationConsumer.subscribe(['corporate.notifications', 'corporate.hr.events']);
  await analyticsConsumer.subscribe(['corporate.analytics', 'corporate.orders']);

  console.log('🎬 SCENARIO 1: Order Processing Pipeline');
  console.log('---------------------------------------');
  
  // 📦 Generate order events
  for (let i = 0; i < 20; i++) {
    const order = {
      orderId: `order-${i + 1}`,
      customerId: `customer-${Math.floor(Math.random() * 100)}`,
      amount: Math.floor(Math.random() * 1000) + 50,
      products: [`product-${Math.floor(Math.random() * 50)}`],
      timestamp: new Date().toISOString()
    };

    await orderProducer.send('corporate.orders', order, {
      key: order.customerId, // Partition by customer for ordering
      headers: { 'event-type': 'order-created' }
    });
  }

  console.log('📡 SCENARIO 2: Real-time Notifications');
  console.log('-------------------------------------');
  
  // 📢 Send notifications
  const notifications = [
    { type: 'system-alert', message: 'Server maintenance scheduled for tonight', priority: 'high' },
    { type: 'promotion', message: 'Q1 sales targets exceeded by 15%!', priority: 'medium' },
    { type: 'security', message: 'New security policy requires 2FA', priority: 'critical' }
  ];

  for (const notification of notifications) {
    await notificationProducer.send('corporate.notifications', notification, {
      headers: { 'notification-type': notification.type }
    });
  }

  console.log('📊 SCENARIO 3: Analytics Data Streaming');
  console.log('--------------------------------------');
  
  // 📈 Stream analytics data
  for (let i = 0; i < 15; i++) {
    const analyticsEvent = {
      eventType: 'user-interaction',
      userId: `user-${Math.floor(Math.random() * 200)}`,
      action: ['click', 'view', 'purchase', 'search'][Math.floor(Math.random() * 4)],
      timestamp: Date.now(),
      metadata: {
        sessionId: `session-${Math.random().toString(36).substr(2, 9)}`,
        userAgent: 'corporate-app-v1.0'
      }
    };

    await analyticsProducer.send('corporate.analytics', analyticsEvent, {
      key: analyticsEvent.userId
    });
  }

  console.log('\n🔄 CONSUMING MESSAGES FROM CORPORATE MESSAGE BUS');
  console.log('===============================================');

  // 📥 Consume and process messages
  console.log('📋 Order Processing Consumer:');
  const orderMessages = await orderProcessingConsumer.poll();
  console.log(`   Received ${orderMessages.length} order messages`);
  
  for (const message of orderMessages.slice(0, 3)) {
    console.log(`   📦 Order ${message.value.orderId}: $${message.value.amount} (Partition: ${message.partition})`);
  }
  
  await orderProcessingConsumer.commitSync();

  console.log('\n📢 Notification Consumer:');
  const notificationMessages = await notificationConsumer.poll();
  console.log(`   Received ${notificationMessages.length} notification messages`);
  
  for (const message of notificationMessages) {
    console.log(`   📢 ${message.value.type}: ${message.value.message} (Priority: ${message.value.priority})`);
  }
  
  await notificationConsumer.commitSync();

  console.log('\n📊 Analytics Consumer:');
  const analyticsMessages = await analyticsConsumer.poll();
  console.log(`   Received ${analyticsMessages.length} analytics messages`);
  
  for (const message of analyticsMessages.slice(0, 3)) {
    console.log(`   📈 ${message.value.eventType}: ${message.value.action} by ${message.value.userId}`);
  }
  
  await analyticsConsumer.commitSync();

  // 📊 Display system metrics
  console.log('\n📊 CORPORATE MESSAGE BUS METRICS');
  console.log('================================');
  
  const metrics = messageBus.getAllMetrics();
  console.log(`📨 Total Messages: ${metrics.totalMessages}`);
  console.log(`📝 Topics: ${metrics.topics.length} (${metrics.topics.join(', ')})`);
  console.log(`👥 Consumer Groups: ${metrics.consumerGroups.length}`);
  console.log(`📤 Active Producers: ${metrics.activeProducers}`);
  console.log(`⚡ Messages/Second: ${metrics.messagesPerSecond}`);

  // 📋 Topic information
  console.log('\n📋 TOPIC INFORMATION:');
  for (const topicName of metrics.topics) {
    const topicInfo = messageBus.getTopicInfo(topicName);
    const totalMessages = topicInfo.partitions.reduce((sum, p) => sum + p.messageCount, 0);
    console.log(`   ${topicName}: ${totalMessages} messages across ${topicInfo.partitions.length} partitions`);
  }

  // 🧹 Cleanup
  console.log('\n🧹 CLEANING UP CONSUMERS...');
  await orderProcessingConsumer.close();
  await notificationConsumer.close();
  await analyticsConsumer.close();

  console.log('\n🎓 PEDAGOGICAL TAKEAWAYS:');
  console.log('========================');
  console.log('✅ Topics and partitions enable scalable message distribution');
  console.log('✅ Producer/Consumer pattern decouples message senders and receivers');
  console.log('✅ Consumer groups provide load balancing and fault tolerance');
  console.log('✅ Offset management ensures at-least-once message delivery');
  console.log('✅ Partition keys enable message ordering within partitions');
  console.log('✅ This "Kafka-enough" system teaches core distributed messaging concepts');
  console.log('✅ Students can easily transition to production Kafka after this foundation');
}

// 🚀 EXECUTE DEMONSTRATION
if (require.main === module) {
  demonstrateEnterpriseMessaging().catch(error => {
    console.error('🚨 Enterprise messaging demonstration failed:', error);
    process.exit(1);
  });
}

module.exports = {
  AlgoCraticMessageBus,
  CorporateMessageProducer,
  CorporateMessageConsumer
};