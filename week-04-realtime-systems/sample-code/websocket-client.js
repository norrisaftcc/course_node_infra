#!/usr/bin/env node

/**
 * 🏢 ALGOCRATIC FUTURES: CORPORATE WEBSOCKET CLIENT DEMONSTRATION
 * "Employee Terminal for Real-time Corporate Coordination"
 * 
 * 📡 Demonstrates WebSocket client patterns, connection management,
 * and integration with the Corporate Communications Hub
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class AlgoCraticEmployee {
  constructor(options = {}) {
    this.config = {
      serverUrl: options.serverUrl || 'ws://localhost:8080',
      employeeId: options.employeeId || `emp-${uuidv4().slice(0, 8)}`,
      department: options.department || 'Engineering',
      reconnectDelay: options.reconnectDelay || 5000,
      ...options
    };
    
    this.ws = null;
    this.isConnected = false;
    this.connectionId = null;
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  async connect() {
    console.log(`🔌 Employee ${this.config.employeeId} connecting to corporate hub...`);
    
    this.ws = new WebSocket(this.config.serverUrl);
    
    this.ws.on('open', () => {
      console.log(`✅ Connected to corporate communications hub`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join department
      this.joinDepartment(this.config.department);
      
      // Process queued messages
      this.processMessageQueue();
    });
    
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('📨 Invalid message received:', error.message);
      }
    });
    
    this.ws.on('close', (code, reason) => {
      console.log(`🔌 Disconnected from corporate hub: ${code} ${reason}`);
      this.isConnected = false;
      this.attemptReconnect();
    });
    
    this.ws.on('error', (error) => {
      console.error(`🚨 Connection error: ${error.message}`);
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'corporate:welcome':
        this.connectionId = message.data.connectionId;
        console.log(`🏢 Welcome message: ${message.data.message}`);
        break;
        
      case 'corporate:department_joined':
        console.log(`🏢 Joined department: ${message.data.department} (${message.data.memberCount} members)`);
        break;
        
      case 'corporate:department_broadcast':
        console.log(`📢 Department broadcast from ${message.data.fromUserId}: ${message.data.message}`);
        break;
        
      case 'corporate:direct_message':
        console.log(`📨 Direct message from ${message.data.fromUserId}: ${message.data.message}`);
        break;
        
      case 'error':
        console.error(`❌ Server error: ${message.data.message}`);
        break;
        
      default:
        console.log(`📨 Received: ${message.type}`, message.data);
    }
  }

  sendMessage(type, data) {
    const message = { type, data };
    
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.log(`📤 Queuing message: ${type}`);
      this.messageQueue.push(message);
    }
  }

  joinDepartment(department) {
    this.sendMessage('corporate:join_department', {
      department,
      userId: this.config.employeeId
    });
  }

  broadcast(message, priority = 'normal') {
    this.sendMessage('corporate:broadcast', { message, priority });
  }

  sendDirectMessage(targetUserId, message) {
    this.sendMessage('corporate:direct_message', { targetUserId, message });
  }

  setPresence(status, statusMessage = '') {
    this.sendMessage('corporate:set_presence', { status, statusMessage });
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`🚨 Max reconnection attempts reached. Giving up.`);
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.config.reconnectDelay}ms...`);
    
    setTimeout(() => {
      this.connect();
    }, this.config.reconnectDelay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
  }
}

// 🎭 DEMONSTRATION
async function demonstrateEmployeeConnection() {
  console.log('🏢 ALGOCRATIC EMPLOYEE DEMONSTRATION');
  console.log('===================================');
  
  // Create multiple employees
  const employees = [
    new AlgoCraticEmployee({ employeeId: 'alice-engineer', department: 'Engineering' }),
    new AlgoCraticEmployee({ employeeId: 'bob-sales', department: 'Sales' }),
    new AlgoCraticEmployee({ employeeId: 'carol-marketing', department: 'Marketing' })
  ];
  
  // Connect all employees
  for (const employee of employees) {
    await employee.connect();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Wait for connections to establish
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Send some messages
  employees[0].broadcast('Engineering standup starting in 5 minutes!');
  employees[1].broadcast('Q1 sales targets exceeded by 15%!');
  employees[2].broadcast('New marketing campaign launching tomorrow');
  
  // Send direct messages
  employees[0].sendDirectMessage('bob-sales', 'Can we schedule a product demo?');
  employees[1].sendDirectMessage('alice-engineer', 'Client wants technical details on the new API');
  
  // Set presence
  employees[0].setPresence('busy', 'In deep focus coding session');
  employees[1].setPresence('available', 'Ready for customer calls');
  employees[2].setPresence('away', 'In creative brainstorming session');
  
  // Keep demo running
  console.log('\\n📡 Demo running... Press Ctrl+C to stop');
  
  process.on('SIGINT', () => {
    console.log('\\n🛑 Disconnecting employees...');
    employees.forEach(emp => emp.disconnect());
    process.exit(0);
  });
}

if (require.main === module) {
  demonstrateEmployeeConnection().catch(error => {
    console.error('🚨 Employee demonstration failed:', error);
    process.exit(1);
  });
}

module.exports = { AlgoCraticEmployee };