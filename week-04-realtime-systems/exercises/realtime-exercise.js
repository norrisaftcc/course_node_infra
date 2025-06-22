#!/usr/bin/env node

/**
 * 🏢 ALGOCRATIC FUTURES: WEEK 4 REAL-TIME SYSTEMS EXERCISES
 * "Corporate Real-time Communication Assessment"
 * 
 * 🎯 ASSESSMENT OBJECTIVE: Students must demonstrate mastery of:
 * - WebSocket server implementation and client handling
 * - Real-time message broadcasting and room management
 * - Server-Sent Events for one-way data streaming
 * - Integration with Week 3 message bus patterns
 * - Connection lifecycle management and error handling
 * 
 * 📚 PEDAGOGICAL NOTE: These exercises build on Week 3's event-driven
 * patterns, adding real-time bidirectional communication essential for
 * modern distributed systems and corporate coordination platforms.
 * 
 * ⚠️  COMMON STUDENT MISTAKES TO WATCH FOR:
 * - WebSocket connection state not properly tracked
 * - Memory leaks from unclosed connections
 * - Broadcasting without proper recipient filtering
 * - Missing error handling for network issues
 * - SSE streams not properly cleaned up
 * - Race conditions in concurrent message handling
 */

const WebSocket = require('ws');
const express = require('express');
const { createServer } = require('http');
const { performance } = require('perf_hooks');
const { v4: uuidv4 } = require('uuid');

/**
 * 🧪 REAL-TIME SYSTEMS EXERCISE FRAMEWORK
 * 
 * Provides automated validation of student real-time implementations
 * with comprehensive testing of WebSocket and SSE patterns.
 */
class RealTimeExerciseFramework {
  constructor() {
    this.exercises = new Map();
    this.results = [];
    this.totalScore = 0;
    this.maxScore = 0;
    this.testPort = 9000 + Math.floor(Math.random() * 1000);
  }

  registerExercise(name, description, testFn, points = 25) {
    this.exercises.set(name, {
      name,
      description,
      testFn,
      points,
      attempted: false,
      passed: false,
      score: 0,
      feedback: [],
      executionTime: 0
    });
    this.maxScore += points;
  }

  async runExercise(name, studentImplementation) {
    const exercise = this.exercises.get(name);
    if (!exercise) {
      throw new Error(`Exercise '${name}' not found`);
    }

    console.log(`\\n🎯 EXERCISE: ${exercise.name}`);
    console.log(`📝 ${exercise.description}`);
    console.log('='.repeat(60));

    exercise.attempted = true;
    const startTime = performance.now();

    try {
      const result = await exercise.testFn(studentImplementation, this.testPort++);
      const executionTime = performance.now() - startTime;
      
      exercise.passed = result.passed;
      exercise.score = result.passed ? exercise.points : (result.partialCredit || 0);
      exercise.feedback = result.feedback || [];
      exercise.executionTime = executionTime;
      
      this.totalScore += exercise.score;
      
      // 📊 Display results
      console.log(`${result.passed ? '✅' : '❌'} Result: ${result.passed ? 'PASSED' : 'FAILED'}`);
      console.log(`📊 Score: ${exercise.score}/${exercise.points} points`);
      console.log(`⏱️  Execution Time: ${executionTime.toFixed(2)}ms`);
      
      if (exercise.feedback.length > 0) {
        console.log('💡 Feedback:');
        exercise.feedback.forEach(fb => console.log(`   ${fb}`));
      }
      
      return result;
      
    } catch (error) {
      exercise.passed = false;
      exercise.score = 0;
      exercise.feedback = [`Execution error: ${error.message}`];
      exercise.executionTime = performance.now() - startTime;
      
      console.log('❌ Result: FAILED (Exception)');
      console.log(`🚨 Error: ${error.message}`);
      console.log(`📊 Score: 0/${exercise.points} points`);
      
      return { passed: false, error: error.message };
    }
  }

  async runAllExercises(studentSolutions) {
    console.log('🏢 ALGOCRATIC FUTURES: WEEK 4 REAL-TIME SYSTEMS ASSESSMENT');
    console.log('==========================================================');
    console.log('📡 Testing student mastery of WebSockets, SSE, and Real-time Patterns');
    console.log('');

    for (const [exerciseName] of this.exercises) {
      const solution = studentSolutions[exerciseName];
      if (solution) {
        await this.runExercise(exerciseName, solution);
      } else {
        console.log(`\\n⚠️  EXERCISE: ${exerciseName}`);
        console.log('❌ No solution provided');
        console.log('📊 Score: 0/25 points');
      }
    }

    this.generateFinalReport();
    return this.results;
  }

  generateFinalReport() {
    const percentage = (this.totalScore / this.maxScore * 100).toFixed(1);
    
    console.log('\\n📊 FINAL ASSESSMENT REPORT');
    console.log('==========================');
    console.log(`🏆 Total Score: ${this.totalScore}/${this.maxScore} (${percentage}%)`);
    
    let grade;
    if (percentage >= 90) grade = 'A (Outstanding)';
    else if (percentage >= 80) grade = 'B (Good)';
    else if (percentage >= 70) grade = 'C (Satisfactory)';
    else if (percentage >= 60) grade = 'D (Needs Improvement)';
    else grade = 'F (Not Passing)';
    
    console.log(`📝 Grade: ${grade}`);
    
    console.log('\\n📋 Exercise Breakdown:');
    for (const [name, exercise] of this.exercises) {
      const status = exercise.passed ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${exercise.score}/${exercise.points} (${exercise.executionTime.toFixed(0)}ms)`);
    }
    
    console.log('\\n🎓 READINESS FOR WEEK 5:');
    if (percentage >= 75) {
      console.log('✅ Student demonstrates strong real-time systems understanding');
      console.log('✅ Ready to proceed to Week 5: Saga Patterns & Distributed Transactions');
    } else {
      console.log('⚠️  Student should review real-time communication patterns before proceeding');
      console.log('📚 Recommended review: WebSocket lifecycle, SSE streams, message broadcasting');
    }
  }
}

/**
 * EXERCISE 1: Corporate WebSocket Server Implementation
 * Students must build a WebSocket server that handles multiple connections,
 * broadcasts messages, and manages connection lifecycle properly.
 */
async function testWebSocketServerImplementation(StudentWebSocketServer, testPort) {
  const feedback = [];
  let partialCredit = 0;
  let server = null;
  const testClients = [];
  
  try {
    // Test 1: Server instantiation and basic setup
    server = new StudentWebSocketServer({ port: testPort });
    
    if (!server) {
      return {
        passed: false,
        feedback: ['Server must be instantiable with port configuration']
      };
    }
    partialCredit += 5;
    
    // Test 2: Server startup
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 5000);
      
      if (typeof server.start === 'function') {
        server.start().then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch(reject);
      } else if (typeof server.listen === 'function') {
        server.listen(testPort, () => {
          clearTimeout(timeout);
          resolve();
        });
      } else {
        reject(new Error('Server must have start() or listen() method'));
      }
    });
    partialCredit += 5;
    
    // Test 3: Client connection handling
    await new Promise((resolve, reject) => {
      const client = new WebSocket(`ws://localhost:${testPort}`);
      testClients.push(client);
      
      client.on('open', () => {
        partialCredit += 5;
        resolve();
      });
      
      client.on('error', reject);
      
      setTimeout(() => reject(new Error('Client connection timeout')), 3000);
    });
    
    // Test 4: Message handling
    await new Promise((resolve, reject) => {
      const client = testClients[0];
      let messageReceived = false;
      
      client.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type) {
            messageReceived = true;
            partialCredit += 5;
            resolve();
          }
        } catch (error) {
          // Non-JSON messages are acceptable too
          messageReceived = true;
          partialCredit += 3;
          resolve();
        }
      });
      
      // Send test message
      client.send(JSON.stringify({
        type: 'test',
        data: { message: 'Hello Server' }
      }));
      
      setTimeout(() => {
        if (!messageReceived) {
          feedback.push('Server should respond to client messages');
        }
        resolve();
      }, 2000);
    });
    
    // Test 5: Multiple client handling
    const secondClient = new WebSocket(`ws://localhost:${testPort}`);
    testClients.push(secondClient);
    
    await new Promise((resolve, reject) => {
      secondClient.on('open', () => {
        partialCredit += 3;
        resolve();
      });
      
      secondClient.on('error', reject);
      setTimeout(() => reject(new Error('Second client connection failed')), 3000);
    });
    
    // Test 6: Broadcasting capability
    if (typeof server.broadcast === 'function') {
      let broadcastCount = 0;
      
      testClients.forEach(client => {
        client.on('message', () => {
          broadcastCount++;
        });
      });
      
      server.broadcast({ type: 'test-broadcast', message: 'Testing broadcast' });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (broadcastCount >= 2) {
        partialCredit += 4;
      } else {
        feedback.push('Broadcast should reach all connected clients');
      }
    } else {
      feedback.push('Server should implement broadcast functionality');
    }
    
    // Test 7: Connection tracking
    if (typeof server.getConnectionCount === 'function') {
      const connectionCount = server.getConnectionCount();
      if (connectionCount >= 2) {
        partialCredit += 3;
      } else {
        feedback.push('Server should track active connections');
      }
    } else {
      feedback.push('Implement getConnectionCount() for connection monitoring');
    }
    
    return {
      passed: partialCredit >= 20,
      partialCredit,
      feedback
    };
    
  } catch (error) {
    return {
      passed: false,
      partialCredit,
      feedback: [`Implementation error: ${error.message}`]
    };
  } finally {
    // Cleanup
    testClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    
    if (server && typeof server.close === 'function') {
      server.close();
    }
  }
}

/**
 * EXERCISE 2: Real-time Chat Room Implementation
 * Students must implement a chat room system with rooms, user management,
 * and message broadcasting within rooms.
 */
async function testChatRoomImplementation(StudentChatRoom, testPort) {
  const feedback = [];
  let partialCredit = 0;
  let chatRoom = null;
  const testClients = [];
  
  try {
    // Test 1: Chat room instantiation
    chatRoom = new StudentChatRoom({ port: testPort });
    
    if (!chatRoom) {
      return {
        passed: false,
        feedback: ['Chat room must be instantiable']
      };
    }
    partialCredit += 4;
    
    // Test 2: Start chat room server
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Chat room startup timeout')), 5000);
      
      if (typeof chatRoom.start === 'function') {
        chatRoom.start().then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch(reject);
      } else {
        reject(new Error('Chat room must have start() method'));
      }
    });
    partialCredit += 4;
    
    // Test 3: User join functionality
    const user1 = new WebSocket(`ws://localhost:${testPort}`);
    const user2 = new WebSocket(`ws://localhost:${testPort}`);
    testClients.push(user1, user2);
    
    await Promise.all([
      new Promise((resolve, reject) => {
        user1.on('open', resolve);
        user1.on('error', reject);
        setTimeout(() => reject(new Error('User1 connection timeout')), 3000);
      }),
      new Promise((resolve, reject) => {
        user2.on('open', resolve);
        user2.on('error', reject);
        setTimeout(() => reject(new Error('User2 connection timeout')), 3000);
      })
    ]);
    partialCredit += 4;
    
    // Test 4: Room joining
    let roomJoinConfirmed = false;
    
    user1.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'room-joined' || message.type === 'joined') {
          roomJoinConfirmed = true;
          partialCredit += 4;
        }
      } catch (error) {
        // Handle non-JSON messages
      }
    });
    
    user1.send(JSON.stringify({
      type: 'join-room',
      data: {
        roomId: 'engineering',
        userId: 'alice'
      }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!roomJoinConfirmed) {
      feedback.push('Chat room should confirm room join events');
    }
    
    // Test 5: Message broadcasting within room
    let messageBroadcasted = false;
    
    user2.send(JSON.stringify({
      type: 'join-room',
      data: {
        roomId: 'engineering',
        userId: 'bob'
      }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    user2.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'chat-message' || message.type === 'message') {
          messageBroadcasted = true;
          partialCredit += 5;
        }
      } catch (error) {
        // Handle non-JSON messages
      }
    });
    
    user1.send(JSON.stringify({
      type: 'chat-message',
      data: {
        roomId: 'engineering',
        message: 'Hello engineering team!',
        userId: 'alice'
      }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!messageBroadcasted) {
      feedback.push('Messages should be broadcasted to room members');
    }
    
    // Test 6: Room isolation (messages should not leak between rooms)
    const user3 = new WebSocket(`ws://localhost:${testPort}`);
    testClients.push(user3);
    
    await new Promise((resolve, reject) => {
      user3.on('open', resolve);
      user3.on('error', reject);
      setTimeout(() => reject(new Error('User3 connection timeout')), 3000);
    });
    
    let isolationTestPassed = true;
    
    user3.send(JSON.stringify({
      type: 'join-room',
      data: {
        roomId: 'sales',
        userId: 'charlie'
      }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    user3.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.data && message.data.roomId === 'engineering') {
          isolationTestPassed = false;
        }
      } catch (error) {
        // Handle non-JSON messages
      }
    });
    
    user1.send(JSON.stringify({
      type: 'chat-message',
      data: {
        roomId: 'engineering',
        message: 'This should not reach sales room',
        userId: 'alice'
      }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (isolationTestPassed) {
      partialCredit += 4;
    } else {
      feedback.push('Messages should be isolated to specific rooms');
    }
    
    // Test 7: User management
    if (typeof chatRoom.getRoomUsers === 'function') {
      const engineeringUsers = chatRoom.getRoomUsers('engineering');
      if (Array.isArray(engineeringUsers) && engineeringUsers.length >= 2) {
        partialCredit += 2;
      } else {
        feedback.push('Room user tracking not working properly');
      }
    } else {
      feedback.push('Implement getRoomUsers() for user management');
    }
    
    return {
      passed: partialCredit >= 20,
      partialCredit,
      feedback
    };
    
  } catch (error) {
    return {
      passed: false,
      partialCredit,
      feedback: [`Implementation error: ${error.message}`]
    };
  } finally {
    // Cleanup
    testClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    
    if (chatRoom && typeof chatRoom.close === 'function') {
      chatRoom.close();
    }
  }
}

/**
 * EXERCISE 3: Server-Sent Events Dashboard
 * Students must implement an SSE-based dashboard for real-time data streaming.
 */
async function testSSEDashboardImplementation(StudentSSEDashboard, testPort) {
  const feedback = [];
  let partialCredit = 0;
  let dashboard = null;
  
  try {
    // Test 1: Dashboard instantiation
    dashboard = new StudentSSEDashboard({ port: testPort });
    
    if (!dashboard) {
      return {
        passed: false,
        feedback: ['SSE Dashboard must be instantiable']
      };
    }
    partialCredit += 5;
    
    // Test 2: HTTP server startup
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Dashboard startup timeout')), 5000);
      
      if (typeof dashboard.start === 'function') {
        dashboard.start().then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch(reject);
      } else {
        reject(new Error('Dashboard must have start() method'));
      }
    });
    partialCredit += 5;
    
    // Test 3: SSE endpoint availability
    const response = await fetch(`http://localhost:${testPort}/events`).catch(() => null);
    
    if (response && response.headers.get('content-type') === 'text/event-stream') {
      partialCredit += 5;
    } else {
      // Try alternative endpoints
      const altResponse = await fetch(`http://localhost:${testPort}/stream`).catch(() => null);
      if (altResponse && altResponse.headers.get('content-type') === 'text/event-stream') {
        partialCredit += 5;
      } else {
        feedback.push('SSE endpoint should be available at /events or /stream with proper content-type');
      }
    }
    
    // Test 4: Event emission
    if (typeof dashboard.emitEvent === 'function' || typeof dashboard.sendEvent === 'function') {
      partialCredit += 5;
      
      const emitMethod = dashboard.emitEvent || dashboard.sendEvent;
      
      // Test event emission
      try {
        emitMethod.call(dashboard, 'test-event', { message: 'Test data' });
        partialCredit += 3;
      } catch (error) {
        feedback.push('Event emission method should handle events properly');
      }
    } else {
      feedback.push('Dashboard should have emitEvent() or sendEvent() method');
    }
    
    // Test 5: Multiple client support
    if (typeof dashboard.getClientCount === 'function') {
      const clientCount = dashboard.getClientCount();
      if (typeof clientCount === 'number') {
        partialCredit += 3;
      } else {
        feedback.push('getClientCount() should return a number');
      }
    } else {
      feedback.push('Implement getClientCount() for client tracking');
    }
    
    // Test 6: Event broadcasting
    if (typeof dashboard.broadcast === 'function') {
      try {
        dashboard.broadcast({ type: 'status', data: 'operational' });
        partialCredit += 4;
      } catch (error) {
        feedback.push('Broadcast method should handle events without errors');
      }
    } else {
      feedback.push('Dashboard should have broadcast() method for sending events');
    }
    
    return {
      passed: partialCredit >= 20,
      partialCredit,
      feedback
    };
    
  } catch (error) {
    return {
      passed: false,
      partialCredit,
      feedback: [`Implementation error: ${error.message}`]
    };
  } finally {
    // Cleanup
    if (dashboard && typeof dashboard.close === 'function') {
      dashboard.close();
    }
  }
}

/**
 * EXERCISE 4: Integrated Real-time System
 * Students must combine WebSockets, SSE, and message bus patterns
 * to create a comprehensive real-time communication system.
 */
async function testIntegratedRealTimeSystem(StudentIntegratedSystem, testPort) {
  const feedback = [];
  let partialCredit = 0;
  let system = null;
  
  try {
    // Test 1: System instantiation
    system = new StudentIntegratedSystem({ 
      wsPort: testPort,
      httpPort: testPort + 1
    });
    
    if (!system) {
      return {
        passed: false,
        feedback: ['Integrated system must be instantiable']
      };
    }
    partialCredit += 5;
    
    // Test 2: System startup
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('System startup timeout')), 8000);
      
      if (typeof system.start === 'function') {
        system.start().then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch(reject);
      } else {
        reject(new Error('System must have start() method'));
      }
    });
    partialCredit += 5;
    
    // Test 3: WebSocket functionality
    const wsClient = new WebSocket(`ws://localhost:${testPort}`);
    
    await new Promise((resolve, reject) => {
      wsClient.on('open', () => {
        partialCredit += 4;
        resolve();
      });
      wsClient.on('error', reject);
      setTimeout(() => reject(new Error('WebSocket connection timeout')), 3000);
    });
    
    // Test 4: Message bus integration
    if (typeof system.publishToMessageBus === 'function' || typeof system.publish === 'function') {
      partialCredit += 4;
      feedback.push('Good: Message bus integration detected');
    } else {
      feedback.push('Consider integrating with Week 3 message bus patterns');
    }
    
    // Test 5: Cross-protocol communication
    let crossProtocolWorking = false;
    
    if (typeof system.broadcastToAll === 'function') {
      try {
        system.broadcastToAll({
          type: 'system-announcement',
          message: 'Testing cross-protocol communication'
        });
        crossProtocolWorking = true;
        partialCredit += 4;
      } catch (error) {
        feedback.push('Cross-protocol broadcasting should work without errors');
      }
    }
    
    // Test 6: System monitoring
    if (typeof system.getSystemMetrics === 'function') {
      const metrics = system.getSystemMetrics();
      if (metrics && typeof metrics === 'object') {
        partialCredit += 3;
        
        if (metrics.wsConnections !== undefined && metrics.sseConnections !== undefined) {
          partialCredit += 2;
          feedback.push('Excellent: Comprehensive system metrics implemented');
        }
      }
    } else {
      feedback.push('Implement getSystemMetrics() for system monitoring');
    }
    
    // Test 7: Performance under load
    const startTime = performance.now();
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(new Promise((resolve) => {
        const client = new WebSocket(`ws://localhost:${testPort}`);
        client.on('open', () => {
          client.send(JSON.stringify({ type: 'load-test', id: i }));
          client.close();
          resolve();
        });
        client.on('error', resolve);
      }));
    }
    
    await Promise.all(promises);
    const endTime = performance.now();
    
    if (endTime - startTime < 3000) { // Less than 3 seconds
      partialCredit += 3;
      feedback.push(`Good performance: ${(endTime - startTime).toFixed(0)}ms for 5 connections`);
    } else {
      feedback.push('Consider optimizing connection handling performance');
    }
    
    wsClient.close();
    
    return {
      passed: partialCredit >= 20,
      partialCredit,
      feedback
    };
    
  } catch (error) {
    return {
      passed: false,
      partialCredit,
      feedback: [`Implementation error: ${error.message}`]
    };
  } finally {
    // Cleanup
    if (system && typeof system.close === 'function') {
      system.close();
    }
  }
}

// 🏗️ SETUP EXERCISE FRAMEWORK
function setupExercises() {
  const framework = new RealTimeExerciseFramework();
  
  framework.registerExercise(
    'websocket-server',
    'Build a WebSocket server with connection management and broadcasting',
    testWebSocketServerImplementation,
    25
  );
  
  framework.registerExercise(
    'chat-room-system',
    'Create a chat room system with rooms and user management',
    testChatRoomImplementation,
    25
  );
  
  framework.registerExercise(
    'sse-dashboard',
    'Implement a Server-Sent Events dashboard for real-time data streaming',
    testSSEDashboardImplementation,
    25
  );
  
  framework.registerExercise(
    'integrated-realtime-system',
    'Combine WebSockets, SSE, and message bus into unified real-time system',
    testIntegratedRealTimeSystem,
    25
  );
  
  return framework;
}

// 📚 EXAMPLE STUDENT SOLUTIONS (for testing framework)
class ExampleWebSocketServer {
  constructor(options = {}) {
    this.port = options.port || 8080;
    this.connections = new Set();
    this.wss = null;
  }
  
  async start() {
    const WebSocket = require('ws');
    this.wss = new WebSocket.Server({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      this.connections.add(ws);
      
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to WebSocket server'
      }));
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          ws.send(JSON.stringify({
            type: 'echo',
            data: message
          }));
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid JSON'
          }));
        }
      });
      
      ws.on('close', () => {
        this.connections.delete(ws);
      });
    });
  }
  
  broadcast(message) {
    const data = JSON.stringify(message);
    this.connections.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        ws.send(data);
      }
    });
  }
  
  getConnectionCount() {
    return this.connections.size;
  }
  
  close() {
    if (this.wss) {
      this.wss.close();
    }
  }
}

class ExampleChatRoom {
  constructor(options = {}) {
    this.port = options.port || 8080;
    this.rooms = new Map();
    this.users = new Map();
    this.wss = null;
  }
  
  async start() {
    const WebSocket = require('ws');
    this.wss = new WebSocket.Server({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid JSON'
          }));
        }
      });
      
      ws.on('close', () => {
        this.removeUserFromAllRooms(ws);
      });
    });
  }
  
  handleMessage(ws, message) {
    switch (message.type) {
      case 'join-room':
        this.joinRoom(ws, message.data.roomId, message.data.userId);
        break;
      case 'chat-message':
        this.broadcastToRoom(message.data.roomId, message.data);
        break;
    }
  }
  
  joinRoom(ws, roomId, userId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(ws);
    this.users.set(ws, { userId, roomId });
    
    ws.send(JSON.stringify({
      type: 'room-joined',
      data: { roomId, userId }
    }));
  }
  
  broadcastToRoom(roomId, messageData) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const message = JSON.stringify({
      type: 'chat-message',
      data: messageData
    });
    
    room.forEach(ws => {
      if (ws.readyState === 1) {
        ws.send(message);
      }
    });
  }
  
  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    
    return Array.from(room).map(ws => {
      const user = this.users.get(ws);
      return user ? user.userId : null;
    }).filter(Boolean);
  }
  
  removeUserFromAllRooms(ws) {
    for (const [roomId, room] of this.rooms) {
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
    this.users.delete(ws);
  }
  
  close() {
    if (this.wss) {
      this.wss.close();
    }
  }
}

class ExampleSSEDashboard {
  constructor(options = {}) {
    this.port = options.port || 8080;
    this.clients = new Set();
    this.server = null;
  }
  
  async start() {
    const express = require('express');
    const app = express();
    
    app.get('/events', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      this.clients.add(res);
      
      res.write('data: {"type":"connected","message":"SSE connection established"}\\n\\n');
      
      req.on('close', () => {
        this.clients.delete(res);
      });
    });
    
    this.server = app.listen(this.port);
  }
  
  emitEvent(eventType, data) {
    const message = `data: ${JSON.stringify({ type: eventType, data })}\\n\\n`;
    this.clients.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        this.clients.delete(client);
      }
    });
  }
  
  broadcast(event) {
    this.emitEvent(event.type || 'message', event.data || event);
  }
  
  getClientCount() {
    return this.clients.size;
  }
  
  close() {
    if (this.server) {
      this.server.close();
    }
  }
}

class ExampleIntegratedSystem {
  constructor(options = {}) {
    this.wsPort = options.wsPort || 8080;
    this.httpPort = options.httpPort || 8081;
    this.wsServer = new ExampleWebSocketServer({ port: this.wsPort });
    this.sseServer = new ExampleSSEDashboard({ port: this.httpPort });
  }
  
  async start() {
    await this.wsServer.start();
    await this.sseServer.start();
  }
  
  broadcastToAll(message) {
    this.wsServer.broadcast(message);
    this.sseServer.broadcast(message);
  }
  
  getSystemMetrics() {
    return {
      wsConnections: this.wsServer.getConnectionCount(),
      sseConnections: this.sseServer.getClientCount(),
      totalConnections: this.wsServer.getConnectionCount() + this.sseServer.getClientCount()
    };
  }
  
  close() {
    this.wsServer.close();
    this.sseServer.close();
  }
}

// 🚀 RUN DEMONSTRATION WITH EXAMPLE SOLUTIONS
async function demonstrateExerciseFramework() {
  console.log('🧪 WEEK 4 REAL-TIME EXERCISE FRAMEWORK DEMONSTRATION');
  console.log('==================================================');
  console.log('📡 Testing with example solutions to validate framework...');
  console.log('');
  
  const framework = setupExercises();
  
  const exampleSolutions = {
    'websocket-server': ExampleWebSocketServer,
    'chat-room-system': ExampleChatRoom,
    'sse-dashboard': ExampleSSEDashboard,
    'integrated-realtime-system': ExampleIntegratedSystem
  };
  
  await framework.runAllExercises(exampleSolutions);
  
  console.log('\\n📋 EXERCISE FRAMEWORK READY FOR STUDENT SUBMISSIONS!');
  console.log('====================================================');
  console.log('Students should implement the required classes and submit them for automated testing.');
}

// 🚀 EXECUTE DEMONSTRATION
if (require.main === module) {
  demonstrateExerciseFramework().catch(error => {
    console.error('🚨 Exercise framework demonstration failed:', error);
    process.exit(1);
  });
}

module.exports = {
  RealTimeExerciseFramework,
  setupExercises,
  // Export test functions for individual use
  testWebSocketServerImplementation,
  testChatRoomImplementation,
  testSSEDashboardImplementation,
  testIntegratedRealTimeSystem
};