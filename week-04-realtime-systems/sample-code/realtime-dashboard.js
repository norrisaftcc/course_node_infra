#!/usr/bin/env node

/**
 * 🏢 ALGOCRATIC FUTURES: EXECUTIVE REAL-TIME DASHBOARD
 * "Corporate Command Center with Live System Monitoring"
 * 
 * 🎯 Integrates Week 4 WebSockets with Week 3 Message Bus for comprehensive
 * real-time monitoring of corporate systems, bridging toward Kafka-scale architecture
 */

const express = require('express');
const WebSocket = require('ws');
const { Server } = require('socket.io');
const { createServer } = require('http');
const { AlgoCraticMessageBus } = require('../../week-03-event-driven/sample-code/message-queue-patterns');

/**
 * 🎛️ CORPORATE EXECUTIVE DASHBOARD HUB
 * 
 * Combines WebSocket real-time communication with message bus patterns
 * to create a unified monitoring and coordination system suitable for
 * scaling up to enterprise Kafka deployments.
 */
class CorporateExecutiveDashboard {
  constructor(options = {}) {
    this.config = {
      httpPort: options.httpPort || 3000,
      wsPort: options.wsPort || 8080,
      messageBusEnabled: options.messageBusEnabled !== false,
      kafkaMode: options.kafkaMode || false, // Future: bridge to Kafka
      ...options
    };

    // 🏢 Corporate monitoring state
    this.dashboardClients = new Set();
    this.systemMetrics = {
      realTimeConnections: 0,
      messagesThroughput: 0,
      departmentActivity: new Map(),
      systemHealth: 'operational',
      alertLevel: 'normal'
    };

    // 📊 Performance tracking
    this.metricsHistory = [];
    this.alertQueue = [];
    
    this.initializeDashboard();
  }

  async initializeDashboard() {
    console.log('🎛️ ALGOCRATIC EXECUTIVE DASHBOARD: Initializing corporate command center...');
    
    // 🌐 Setup HTTP server with Socket.IO
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // 📡 Initialize message bus (Week 3 integration)
    if (this.config.messageBusEnabled) {
      this.messageBus = new AlgoCraticMessageBus({
        persistToDisk: false,
        maxPartitionSize: 5000
      });
      await this.setupMessageBusIntegration();
    }

    // 🔧 Setup dashboard components
    this.setupHTTPEndpoints();
    this.setupSocketIOHandlers();
    this.setupSystemMonitoring();
    
    // 🚀 Start dashboard server
    this.server.listen(this.config.httpPort, () => {
      console.log(`✅ Executive Dashboard operational on http://localhost:${this.config.httpPort}`);
      console.log(`📊 WebSocket endpoint: ws://localhost:${this.config.httpPort}`);
      if (this.config.messageBusEnabled) {
        console.log(`📡 Integrated with AlgoCratic Message Bus (Kafka-ready architecture)`);
      }
    });
  }

  async setupMessageBusIntegration() {
    console.log('📡 Integrating with Week 3 Message Bus for comprehensive monitoring...');
    
    // 📝 Create monitoring topics (Kafka-like structure)
    await this.messageBus.createTopic('corporate.metrics', { partitionCount: 3 });
    await this.messageBus.createTopic('corporate.alerts', { partitionCount: 2 });
    await this.messageBus.createTopic('corporate.system.health', { partitionCount: 1 });
    await this.messageBus.createTopic('corporate.dashboard.events', { partitionCount: 2 });

    // 📤 Create monitoring producer
    this.metricsProducer = await this.messageBus.createProducer('dashboard-metrics');
    this.alertProducer = await this.messageBus.createProducer('dashboard-alerts');

    // 📥 Create monitoring consumers
    this.metricsConsumer = await this.messageBus.createConsumer('dashboard-monitoring-group');
    this.alertConsumer = await this.messageBus.createConsumer('dashboard-alert-group');

    // 📋 Subscribe to relevant topics
    await this.metricsConsumer.subscribe(['corporate.metrics', 'corporate.system.health']);
    await this.alertConsumer.subscribe(['corporate.alerts']);

    // 🔄 Start consuming messages for dashboard updates
    this.startMessageBusConsumption();
    
    console.log('✅ Message Bus integration complete - ready for Kafka migration');
  }

  async startMessageBusConsumption() {
    // 📊 Metrics consumption loop
    setInterval(async () => {
      try {
        const messages = await this.metricsConsumer.poll(1000);
        for (const message of messages) {
          this.processMetricsMessage(message);
        }
        if (messages.length > 0) {
          await this.metricsConsumer.commitSync();
        }
      } catch (error) {
        console.error('📊 Metrics consumption error:', error.message);
      }
    }, 2000);

    // 🚨 Alert consumption loop
    setInterval(async () => {
      try {
        const messages = await this.alertConsumer.poll(1000);
        for (const message of messages) {
          this.processAlertMessage(message);
        }
        if (messages.length > 0) {
          await this.alertConsumer.commitSync();
        }
      } catch (error) {
        console.error('🚨 Alert consumption error:', error.message);
      }
    }, 1000);
  }

  processMetricsMessage(message) {
    const metrics = message.value;
    
    // 📊 Update dashboard metrics
    this.systemMetrics.messagesThroughput = metrics.messagesPerSecond || 0;
    this.systemMetrics.realTimeConnections = metrics.activeConnections || 0;
    
    if (metrics.departmentActivity) {
      this.systemMetrics.departmentActivity = new Map(Object.entries(metrics.departmentActivity));
    }

    // 📈 Store metrics history
    this.metricsHistory.push({
      timestamp: Date.now(),
      ...metrics
    });

    // 🧹 Keep only last 100 metrics points
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }

    // 📡 Broadcast to dashboard clients
    this.broadcastToDashboard('metrics:update', {
      current: this.systemMetrics,
      history: this.metricsHistory.slice(-20) // Last 20 points
    });
  }

  processAlertMessage(message) {
    const alert = message.value;
    
    // 🚨 Add to alert queue
    this.alertQueue.unshift({
      id: `alert-${Date.now()}`,
      timestamp: Date.now(),
      ...alert
    });

    // 🧹 Keep only last 50 alerts
    if (this.alertQueue.length > 50) {
      this.alertQueue.length = 50;
    }

    // 📊 Update system alert level
    this.updateSystemAlertLevel(alert);

    // 📡 Broadcast to dashboard clients
    this.broadcastToDashboard('alert:new', alert);
    this.broadcastToDashboard('alerts:update', this.alertQueue);
  }

  updateSystemAlertLevel(alert) {
    if (alert.severity === 'critical' || alert.priority === 'critical') {
      this.systemMetrics.alertLevel = 'critical';
      this.systemMetrics.systemHealth = 'degraded';
    } else if (alert.severity === 'high' || alert.priority === 'high') {
      this.systemMetrics.alertLevel = 'high';
    } else if (this.systemMetrics.alertLevel === 'normal') {
      this.systemMetrics.alertLevel = 'medium';
    }
  }

  setupHTTPEndpoints() {
    // 📊 Dashboard HTML interface
    this.app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>🏢 AlgoCratic Executive Dashboard</title>
          <script src="/socket.io/socket.io.js"></script>
          <style>
            body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff00; margin: 0; padding: 20px; }
            .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .panel { border: 1px solid #00ff00; padding: 15px; background: #111; }
            .metric { margin: 10px 0; }
            .alert { padding: 8px; margin: 5px 0; border-left: 4px solid #ff6600; background: #221100; }
            .critical { border-left-color: #ff0000; background: #220000; }
            .log { height: 300px; overflow-y: scroll; font-size: 12px; }
            h1, h2 { color: #00ffff; }
            .status-operational { color: #00ff00; }
            .status-degraded { color: #ff6600; }
            .status-critical { color: #ff0000; }
          </style>
        </head>
        <body>
          <h1>🏢 ALGOCRATIC FUTURES - EXECUTIVE COMMAND CENTER</h1>
          <div class="dashboard">
            <div class="panel">
              <h2>📊 System Metrics</h2>
              <div class="metric">Real-time Connections: <span id="connections">0</span></div>
              <div class="metric">Messages/Second: <span id="throughput">0</span></div>
              <div class="metric">System Health: <span id="health" class="status-operational">OPERATIONAL</span></div>
              <div class="metric">Alert Level: <span id="alertLevel">NORMAL</span></div>
            </div>
            
            <div class="panel">
              <h2>🏢 Department Activity</h2>
              <div id="departments">No department data</div>
            </div>
            
            <div class="panel">
              <h2>🚨 System Alerts</h2>
              <div id="alerts" class="log">No alerts</div>
            </div>
            
            <div class="panel">
              <h2>📡 Real-time Log</h2>
              <div id="log" class="log">Dashboard initializing...</div>
            </div>
          </div>

          <script>
            const socket = io();
            
            function log(message) {
              const logDiv = document.getElementById('log');
              const time = new Date().toLocaleTimeString();
              logDiv.innerHTML += '<div>[' + time + '] ' + message + '</div>';
              logDiv.scrollTop = logDiv.scrollHeight;
            }
            
            socket.on('connect', () => {
              log('🔌 Connected to Executive Dashboard');
            });
            
            socket.on('metrics:update', (data) => {
              document.getElementById('connections').textContent = data.current.realTimeConnections;
              document.getElementById('throughput').textContent = data.current.messagesThroughput;
              
              const health = document.getElementById('health');
              health.textContent = data.current.systemHealth.toUpperCase();
              health.className = 'status-' + data.current.systemHealth;
              
              document.getElementById('alertLevel').textContent = data.current.alertLevel.toUpperCase();
              
              // Update departments
              const deptDiv = document.getElementById('departments');
              let deptHtml = '';
              data.current.departmentActivity.forEach((activity, dept) => {
                deptHtml += '<div>' + dept + ': ' + (activity.activeUsers || 0) + ' active</div>';
              });
              deptDiv.innerHTML = deptHtml || 'No department activity';
            });
            
            socket.on('alert:new', (alert) => {
              log('🚨 NEW ALERT: ' + alert.message + ' (' + alert.priority + ')');
            });
            
            socket.on('alerts:update', (alerts) => {
              const alertsDiv = document.getElementById('alerts');
              let alertsHtml = '';
              alerts.slice(0, 10).forEach(alert => {
                const alertClass = alert.priority === 'critical' ? 'alert critical' : 'alert';
                alertsHtml += '<div class="' + alertClass + '">[' + new Date(alert.timestamp).toLocaleTimeString() + '] ' + alert.message + '</div>';
              });
              alertsDiv.innerHTML = alertsHtml || 'No alerts';
            });
            
            socket.on('system:event', (event) => {
              log('📊 ' + event.message);
            });
            
            log('🎛️ Dashboard ready for corporate monitoring');
          </script>
        </body>
        </html>
      `);
    });

    // 📊 API endpoints for external monitoring
    this.app.get('/api/metrics', (req, res) => {
      res.json({
        current: this.systemMetrics,
        history: this.metricsHistory,
        alerts: this.alertQueue
      });
    });

    // 🚨 Alert injection endpoint (for testing)
    this.app.post('/api/alert', express.json(), async (req, res) => {
      const alert = {
        message: req.body.message || 'Test alert',
        priority: req.body.priority || 'medium',
        source: req.body.source || 'manual',
        timestamp: new Date().toISOString()
      };

      if (this.config.messageBusEnabled) {
        await this.alertProducer.send('corporate.alerts', alert);
      } else {
        this.processAlertMessage({ value: alert });
      }

      res.json({ success: true, alert });
    });

    console.log('🌐 Dashboard HTTP endpoints configured');
  }

  setupSocketIOHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🎛️ Dashboard client connected: ${socket.id}`);
      this.dashboardClients.add(socket);

      // 📊 Send initial state
      socket.emit('metrics:update', {
        current: this.systemMetrics,
        history: this.metricsHistory.slice(-20)
      });
      
      socket.emit('alerts:update', this.alertQueue);

      socket.on('disconnect', () => {
        console.log(`🎛️ Dashboard client disconnected: ${socket.id}`);
        this.dashboardClients.delete(socket);
      });

      // 🎯 Allow dashboard clients to trigger actions
      socket.on('dashboard:refresh', () => {
        this.generateSystemSnapshot();
      });
    });

    console.log('📡 Socket.IO handlers configured');
  }

  setupSystemMonitoring() {
    // 📊 Generate periodic system metrics
    setInterval(async () => {
      await this.generateSystemMetrics();
    }, 5000);

    // 🔍 System health checks
    setInterval(async () => {
      await this.performHealthChecks();
    }, 15000);

    // 🧹 Cleanup old data
    setInterval(() => {
      this.cleanupOldData();
    }, 60000);

    console.log('🔍 System monitoring configured');
  }

  async generateSystemMetrics() {
    // 📊 Simulate real system metrics (in production, collect from actual systems)
    const metrics = {
      timestamp: Date.now(),
      realTimeConnections: Math.floor(Math.random() * 50) + 10,
      messagesThroughput: Math.floor(Math.random() * 100) + 20,
      cpuUsage: Math.random() * 40 + 30,
      memoryUsage: Math.random() * 30 + 40,
      diskUsage: Math.random() * 20 + 60,
      departmentActivity: {
        Engineering: { activeUsers: Math.floor(Math.random() * 20) + 5 },
        Sales: { activeUsers: Math.floor(Math.random() * 15) + 3 },
        Marketing: { activeUsers: Math.floor(Math.random() * 10) + 2 },
        HR: { activeUsers: Math.floor(Math.random() * 8) + 1 }
      }
    };

    // 📡 Publish to message bus if enabled
    if (this.config.messageBusEnabled) {
      await this.metricsProducer.send('corporate.metrics', metrics);
    } else {
      // 📊 Process directly if no message bus
      this.processMetricsMessage({ value: metrics });
    }
  }

  async performHealthChecks() {
    const checks = [
      { name: 'WebSocket Server', status: 'healthy' },
      { name: 'Message Bus', status: this.config.messageBusEnabled ? 'healthy' : 'disabled' },
      { name: 'Dashboard Clients', status: this.dashboardClients.size > 0 ? 'active' : 'idle' }
    ];

    // 🚨 Generate alerts for unhealthy systems
    for (const check of checks) {
      if (check.status === 'unhealthy') {
        await this.generateAlert({
          message: `Health check failed: ${check.name}`,
          priority: 'high',
          source: 'health-monitor'
        });
      }
    }

    // 📡 Broadcast system event
    this.broadcastToDashboard('system:event', {
      message: `Health checks completed: ${checks.length} systems checked`
    });
  }

  async generateAlert(alert) {
    if (this.config.messageBusEnabled) {
      await this.alertProducer.send('corporate.alerts', alert);
    } else {
      this.processAlertMessage({ value: alert });
    }
  }

  cleanupOldData() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    // 🧹 Clean metrics history
    this.metricsHistory = this.metricsHistory.filter(
      metric => (now - metric.timestamp) < maxAge
    );

    // 🧹 Clean alert queue
    this.alertQueue = this.alertQueue.filter(
      alert => (now - alert.timestamp) < maxAge
    );
  }

  broadcastToDashboard(event, data) {
    this.io.emit(event, data);
  }

  generateSystemSnapshot() {
    return {
      timestamp: Date.now(),
      metrics: this.systemMetrics,
      alerts: this.alertQueue.length,
      dashboardClients: this.dashboardClients.size,
      messageBusEnabled: this.config.messageBusEnabled
    };
  }

  async shutdown() {
    console.log('🛑 Shutting down Executive Dashboard...');
    
    if (this.messageBus) {
      await this.metricsConsumer.close();
      await this.alertConsumer.close();
    }
    
    this.server.close();
    console.log('✅ Dashboard shutdown complete');
  }
}

// 🎭 DEMONSTRATION FUNCTION
async function demonstrateExecutiveDashboard() {
  console.log('🎛️ ALGOCRATIC EXECUTIVE DASHBOARD DEMONSTRATION');
  console.log('==============================================');
  console.log('📊 Initializing corporate command center with Message Bus integration...');
  console.log('');

  const dashboard = new CorporateExecutiveDashboard({
    httpPort: 3000,
    messageBusEnabled: true,
    kafkaMode: false // Set to true for future Kafka bridge
  });

  // 🚨 Generate some test alerts
  setTimeout(async () => {
    await dashboard.generateAlert({
      message: 'High CPU usage detected on web servers',
      priority: 'medium',
      source: 'infrastructure-monitor'
    });
  }, 5000);

  setTimeout(async () => {
    await dashboard.generateAlert({
      message: 'New employee onboarding system deployment successful',
      priority: 'low',
      source: 'deployment-system'
    });
  }, 10000);

  setTimeout(async () => {
    await dashboard.generateAlert({
      message: 'Unusual network traffic pattern detected',
      priority: 'high',
      source: 'security-monitor'
    });
  }, 15000);

  // 🛑 Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\\n🛑 Shutting down Executive Dashboard...');
    await dashboard.shutdown();
    process.exit(0);
  });

  console.log('\\n🎓 PEDAGOGICAL TAKEAWAYS:');
  console.log('========================');
  console.log('✅ Real-time dashboards combine WebSockets with message bus patterns');
  console.log('✅ Socket.IO provides enhanced WebSocket features for complex UIs');
  console.log('✅ Message bus integration bridges to enterprise Kafka architectures');
  console.log('✅ Monitoring systems require both push and pull patterns');
  console.log('✅ Executive dashboards aggregate data from multiple distributed sources');
  console.log('✅ This architecture scales from simple demos to enterprise deployments');
  console.log('');
  console.log('🌐 Dashboard available at: http://localhost:3000');
  console.log('📊 API endpoint: http://localhost:3000/api/metrics');
  console.log('🚨 Test alerts: POST to http://localhost:3000/api/alert');
}

// 🚀 EXECUTE DEMONSTRATION
if (require.main === module) {
  demonstrateExecutiveDashboard().catch(error => {
    console.error('🚨 Executive dashboard demonstration failed:', error);
    process.exit(1);
  });
}

module.exports = {
  CorporateExecutiveDashboard
};