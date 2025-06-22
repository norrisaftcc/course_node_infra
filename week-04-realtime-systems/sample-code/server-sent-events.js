#!/usr/bin/env node

/**
 * 🏢 ALGOCRATIC FUTURES: WEEK 4 SERVER-SENT EVENTS INFRASTRUCTURE
 * "Corporate Broadcasting: One-Way Real-time Data Streaming"
 * 
 * 📡 SSE CORPORATE CHALLENGE: Sometimes you need simple, one-way data streaming
 * without the complexity of WebSockets - live dashboards, system status feeds,
 * notification streams, and real-time corporate announcements.
 * 
 * 🎯 PEDAGOGICAL PURPOSE: Students learn Server-Sent Events as a simpler
 * alternative to WebSockets for one-way data streaming, with automatic
 * reconnection and HTTP-based transport that works through firewalls.
 * 
 * ⚠️  STUDENT CHALLENGES TO WATCH FOR:
 * - Understanding when to use SSE vs WebSockets
 * - Proper HTTP headers for SSE streams
 * - Handling client disconnections gracefully
 * - Memory management for long-running streams
 * - CORS issues with SSE in browsers
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');

/**
 * 📡 CORPORATE STREAMING HUB - SERVER-SENT EVENTS
 * 
 * Manages one-way data streams to corporate clients using HTTP-based
 * Server-Sent Events. Ideal for dashboards, notifications, and status feeds.
 */
class CorporateStreamingHub {
  constructor(options = {}) {
    this.config = {
      port: options.port || 8090,
      pingInterval: options.pingInterval || 30000,
      maxClients: options.maxClients || 500,
      streamTimeout: options.streamTimeout || 300000, // 5 minutes
      ...options
    };

    // 📊 Corporate streaming state
    this.streams = new Map(); // streamId -> stream metadata
    this.channels = new Map(); // channelName -> Set<streamIds>
    this.metrics = {
      totalStreams: 0,
      activeStreams: 0,
      totalEvents: 0,
      eventsPerSecond: 0,
      startTime: Date.now()
    };

    // 📋 Corporate data feeds
    this.corporateFeeds = {
      'executive-announcements': {
        description: 'C-level announcements and directives',
        subscribers: 0,
        eventCount: 0
      },
      'system-status': {
        description: 'Real-time system health and performance',
        subscribers: 0,
        eventCount: 0
      },
      'market-data': {
        description: 'Financial and market information',
        subscribers: 0,
        eventCount: 0
      },
      'employee-notifications': {
        description: 'HR and general employee communications',
        subscribers: 0,
        eventCount: 0
      },
      'security-alerts': {
        description: 'Security and compliance notifications',
        subscribers: 0,
        eventCount: 0
      }
    };

    this.initializeStreamingHub();
  }

  initializeStreamingHub() {
    console.log('📡 ALGOCRATIC STREAMING HUB: Initializing Server-Sent Events infrastructure...');
    
    this.app = express();
    
    // 🔧 Middleware for SSE
    this.app.use((req, res, next) => {
      // CORS headers for SSE
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Cache-Control');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    this.setupSSEEndpoints();
    this.setupHTTPEndpoints();
    this.setupCorporateDataGenerators();
    this.setupMaintenanceTasks();

    this.app.listen(this.config.port, () => {
      console.log(`✅ Corporate Streaming Hub operational on port ${this.config.port}`);
      console.log(`📊 Available feeds: ${Object.keys(this.corporateFeeds).join(', ')}`);
    });
  }

  setupSSEEndpoints() {
    // 📡 Main SSE endpoint for corporate feeds
    this.app.get('/stream/:channel', (req, res) => {
      this.handleSSEConnection(req, res);
    });

    // 📊 Multi-channel SSE endpoint
    this.app.get('/stream', (req, res) => {
      const channels = req.query.channels ? req.query.channels.split(',') : ['system-status'];
      this.handleMultiChannelSSE(req, res, channels);
    });

    console.log('📡 SSE endpoints configured');
  }

  setupHTTPEndpoints() {
    // 🏠 Main dashboard page
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // 📊 Stream metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json({
        ...this.metrics,
        feeds: this.corporateFeeds,
        activeChannels: Array.from(this.channels.keys()),
        streamCount: this.streams.size
      });
    });

    // 📢 Event injection endpoint (for testing)
    this.app.post('/broadcast/:channel', express.json(), (req, res) => {
      const channel = req.params.channel;
      const event = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        data: req.body.data || req.body,
        type: req.body.type || 'message',
        priority: req.body.priority || 'normal'
      };

      this.broadcastToChannel(channel, event);
      res.json({ success: true, event, subscriberCount: this.getChannelSubscriberCount(channel) });
    });

    console.log('🌐 HTTP endpoints configured');
  }

  handleSSEConnection(req, res) {
    const channel = req.params.channel;
    const streamId = uuidv4();
    const clientIP = req.ip || req.connection.remoteAddress;

    // 🔒 Validate channel
    if (!this.corporateFeeds.hasOwnProperty(channel)) {
      res.status(404).json({ error: `Channel '${channel}' not found` });
      return;
    }

    // 🔢 Check client limits
    if (this.metrics.activeStreams >= this.config.maxClients) {
      res.status(503).json({ error: 'Server at capacity' });
      return;
    }

    console.log(`📡 New SSE connection: ${streamId} to channel '${channel}' from ${clientIP}`);

    // 🔧 Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    // 📋 Register stream
    const streamMeta = {
      streamId,
      channel,
      clientIP,
      startTime: Date.now(),
      lastEventTime: Date.now(),
      eventCount: 0,
      response: res
    };

    this.streams.set(streamId, streamMeta);
    this.addToChannel(channel, streamId);
    this.metrics.totalStreams++;
    this.metrics.activeStreams++;
    this.corporateFeeds[channel].subscribers++;

    // 📤 Send welcome message
    this.sendSSEEvent(res, {
      id: uuidv4(),
      event: 'connected',
      data: {
        streamId,
        channel,
        message: `Connected to ${channel} feed`,
        timestamp: new Date().toISOString()
      }
    });

    // 📤 Send recent events if available
    this.sendRecentEvents(res, channel);

    // 🔌 Handle client disconnect
    req.on('close', () => {
      this.handleSSEDisconnection(streamId);
    });

    req.on('error', (error) => {
      console.error(`📡 SSE error for ${streamId}:`, error.message);
      this.handleSSEDisconnection(streamId);
    });
  }

  handleMultiChannelSSE(req, res, channels) {
    const streamId = uuidv4();
    const clientIP = req.ip || req.connection.remoteAddress;

    console.log(`📡 Multi-channel SSE connection: ${streamId} to [${channels.join(', ')}] from ${clientIP}`);

    // 🔧 Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // 📋 Register stream for multiple channels
    const streamMeta = {
      streamId,
      channels: new Set(channels),
      clientIP,
      startTime: Date.now(),
      lastEventTime: Date.now(),
      eventCount: 0,
      response: res
    };

    this.streams.set(streamId, streamMeta);
    
    // 📊 Add to all requested channels
    for (const channel of channels) {
      if (this.corporateFeeds.hasOwnProperty(channel)) {
        this.addToChannel(channel, streamId);
        this.corporateFeeds[channel].subscribers++;
      }
    }

    this.metrics.totalStreams++;
    this.metrics.activeStreams++;

    // 📤 Send welcome message
    this.sendSSEEvent(res, {
      id: uuidv4(),
      event: 'connected',
      data: {
        streamId,
        channels: channels,
        message: `Connected to multi-channel feed`,
        timestamp: new Date().toISOString()
      }
    });

    // 🔌 Handle client disconnect
    req.on('close', () => {
      this.handleSSEDisconnection(streamId);
    });
  }

  handleSSEDisconnection(streamId) {
    const streamMeta = this.streams.get(streamId);
    if (!streamMeta) return;

    console.log(`🔌 SSE disconnection: ${streamId}`);

    // 📊 Remove from channels
    if (streamMeta.channel) {
      this.removeFromChannel(streamMeta.channel, streamId);
      this.corporateFeeds[streamMeta.channel].subscribers--;
    } else if (streamMeta.channels) {
      for (const channel of streamMeta.channels) {
        this.removeFromChannel(channel, streamId);
        if (this.corporateFeeds[channel]) {
          this.corporateFeeds[channel].subscribers--;
        }
      }
    }

    // 🧹 Cleanup
    this.streams.delete(streamId);
    this.metrics.activeStreams--;
  }

  addToChannel(channel, streamId) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel).add(streamId);
  }

  removeFromChannel(channel, streamId) {
    const channelStreams = this.channels.get(channel);
    if (channelStreams) {
      channelStreams.delete(streamId);
      if (channelStreams.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  sendSSEEvent(response, event) {
    try {
      // 🔍 Format SSE event
      let sseData = '';
      
      if (event.id) {
        sseData += `id: ${event.id}\\n`;
      }
      
      if (event.event) {
        sseData += `event: ${event.event}\\n`;
      }
      
      if (event.retry) {
        sseData += `retry: ${event.retry}\\n`;
      }
      
      // 📊 Ensure data is properly formatted
      const eventData = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
      sseData += `data: ${eventData}\\n\\n`;
      
      response.write(sseData);
      return true;
    } catch (error) {
      console.error('📡 SSE send error:', error.message);
      return false;
    }
  }

  broadcastToChannel(channel, event) {
    const channelStreams = this.channels.get(channel);
    if (!channelStreams) {
      console.log(`📡 No subscribers for channel: ${channel}`);
      return 0;
    }

    let sentCount = 0;
    for (const streamId of channelStreams) {
      const streamMeta = this.streams.get(streamId);
      if (streamMeta) {
        if (this.sendSSEEvent(streamMeta.response, event)) {
          streamMeta.eventCount++;
          streamMeta.lastEventTime = Date.now();
          sentCount++;
        }
      }
    }

    // 📊 Update feed statistics
    if (this.corporateFeeds[channel]) {
      this.corporateFeeds[channel].eventCount++;
    }

    this.metrics.totalEvents++;
    
    console.log(`📡 Broadcast to '${channel}': ${sentCount} recipients`);
    return sentCount;
  }

  sendRecentEvents(response, channel) {
    // 📊 In a real implementation, you'd fetch recent events from storage
    // For demo, send a sample recent event
    this.sendSSEEvent(response, {
      id: uuidv4(),
      event: 'recent-event',
      data: {
        message: `Welcome to ${channel} - you're now receiving live updates`,
        timestamp: new Date().toISOString()
      }
    });
  }

  getChannelSubscriberCount(channel) {
    const channelStreams = this.channels.get(channel);
    return channelStreams ? channelStreams.size : 0;
  }

  setupCorporateDataGenerators() {
    // 📊 System status updates
    setInterval(() => {
      this.broadcastToChannel('system-status', {
        id: uuidv4(),
        event: 'status-update',
        data: {
          timestamp: new Date().toISOString(),
          cpu: (Math.random() * 40 + 30).toFixed(1) + '%',
          memory: (Math.random() * 30 + 50).toFixed(1) + '%',
          activeConnections: this.metrics.activeStreams,
          status: 'operational'
        }
      });
    }, 10000);

    // 📈 Market data simulation
    setInterval(() => {
      this.broadcastToChannel('market-data', {
        id: uuidv4(),
        event: 'market-update',
        data: {
          timestamp: new Date().toISOString(),
          stockPrice: (Math.random() * 20 + 100).toFixed(2),
          marketCap: '$' + (Math.random() * 100 + 500).toFixed(1) + 'B',
          trend: Math.random() > 0.5 ? 'up' : 'down'
        }
      });
    }, 15000);

    // 📢 Executive announcements (less frequent)
    setInterval(() => {
      const announcements = [
        'Q1 revenue targets exceeded by 12%',
        'New partnership announced with Fortune 500 company',
        'Employee satisfaction survey results available',
        'Upcoming all-hands meeting scheduled for next Friday',
        'New product launch scheduled for next quarter'
      ];
      
      this.broadcastToChannel('executive-announcements', {
        id: uuidv4(),
        event: 'announcement',
        data: {
          timestamp: new Date().toISOString(),
          message: announcements[Math.floor(Math.random() * announcements.length)],
          priority: 'high',
          from: 'Executive Team'
        }
      });
    }, 45000);

    // 🔔 Employee notifications
    setInterval(() => {
      this.broadcastToChannel('employee-notifications', {
        id: uuidv4(),
        event: 'notification',
        data: {
          timestamp: new Date().toISOString(),
          message: 'Cafeteria serving special lunch menu today',
          category: 'facilities',
          priority: 'low'
        }
      });
    }, 20000);

    console.log('🎭 Corporate data generators started');
  }

  setupMaintenanceTasks() {
    // 💓 Send periodic ping to detect dead connections
    setInterval(() => {
      for (const [streamId, streamMeta] of this.streams) {
        if (!this.sendSSEEvent(streamMeta.response, {
          event: 'ping',
          data: { timestamp: Date.now() }
        })) {
          this.handleSSEDisconnection(streamId);
        }
      }
    }, this.config.pingInterval);

    // 📊 Calculate metrics
    setInterval(() => {
      const now = Date.now();
      const uptimeSeconds = (now - this.metrics.startTime) / 1000;
      this.metrics.eventsPerSecond = Math.round(this.metrics.totalEvents / uptimeSeconds);
    }, 5000);

    // 🧹 Clean up stale connections
    setInterval(() => {
      const now = Date.now();
      for (const [streamId, streamMeta] of this.streams) {
        if (now - streamMeta.lastEventTime > this.config.streamTimeout) {
          console.log(`🧹 Cleaning up stale connection: ${streamId}`);
          this.handleSSEDisconnection(streamId);
        }
      }
    }, 60000);

    console.log('🔧 SSE maintenance tasks configured');
  }

  generateDashboardHTML() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>🏢 AlgoCratic Corporate Streaming Dashboard</title>
        <style>
          body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff00; margin: 0; padding: 20px; }
          .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .feed { border: 1px solid #00ff00; padding: 15px; background: #111; margin: 10px 0; }
          .event { padding: 8px; margin: 5px 0; border-left: 3px solid #00ff00; background: #112211; font-size: 12px; }
          .high-priority { border-left-color: #ff6600; background: #221100; }
          .critical { border-left-color: #ff0000; background: #220000; }
          .log { height: 200px; overflow-y: scroll; }
          h1, h2 { color: #00ffff; }
          .status { color: #00ff00; }
          .controls { margin: 10px 0; }
          button { background: #003300; color: #00ff00; border: 1px solid #00ff00; padding: 5px 10px; margin: 5px; cursor: pointer; }
          button:hover { background: #005500; }
          .metrics { display: flex; gap: 20px; margin: 10px 0; }
          .metric { padding: 5px 10px; border: 1px solid #666; }
        </style>
      </head>
      <body>
        <h1>🏢 ALGOCRATIC CORPORATE STREAMING DASHBOARD</h1>
        <div class="metrics">
          <div class="metric">Active Streams: <span id="activeStreams">0</span></div>
          <div class="metric">Events/Sec: <span id="eventsPerSec">0</span></div>
          <div class="metric">Total Events: <span id="totalEvents">0</span></div>
        </div>
        
        <div class="controls">
          <button onclick="subscribeToFeed('system-status')">📊 System Status</button>
          <button onclick="subscribeToFeed('executive-announcements')">📢 Executive</button>
          <button onclick="subscribeToFeed('market-data')">📈 Market Data</button>
          <button onclick="subscribeToFeed('employee-notifications')">🔔 Notifications</button>
          <button onclick="subscribeToMultiple()">🔄 Multi-Channel</button>
          <button onclick="clearLogs()">🧹 Clear</button>
        </div>

        <div class="dashboard">
          <div class="feed">
            <h2>📡 Live Corporate Feeds</h2>
            <div id="feeds" class="log">Select a feed to start streaming...</div>
          </div>
          
          <div class="feed">
            <h2>📊 Connection Status</h2>
            <div id="status" class="log">Ready to connect...</div>
          </div>
        </div>

        <script>
          let eventSources = new Map();
          
          function log(container, message, priority = 'normal') {
            const logDiv = document.getElementById(container);
            const time = new Date().toLocaleTimeString();
            const eventClass = priority === 'high' ? 'event high-priority' : 
                              priority === 'critical' ? 'event critical' : 'event';
            logDiv.innerHTML += '<div class="' + eventClass + '">[' + time + '] ' + message + '</div>';
            logDiv.scrollTop = logDiv.scrollHeight;
            
            // Keep only last 100 events
            const events = logDiv.children;
            if (events.length > 100) {
              logDiv.removeChild(events[0]);
            }
          }
          
          function subscribeToFeed(channel) {
            if (eventSources.has(channel)) {
              log('status', '⚠️ Already subscribed to ' + channel);
              return;
            }
            
            log('status', '🔌 Connecting to ' + channel + '...');
            
            const eventSource = new EventSource('/stream/' + channel);
            eventSources.set(channel, eventSource);
            
            eventSource.onopen = function() {
              log('status', '✅ Connected to ' + channel);
            };
            
            eventSource.onmessage = function(event) {
              const data = JSON.parse(event.data);
              log('feeds', '[' + channel + '] ' + (data.message || JSON.stringify(data)));
            };
            
            eventSource.addEventListener('connected', function(event) {
              const data = JSON.parse(event.data);
              log('status', '🏢 ' + data.message);
            });
            
            eventSource.addEventListener('status-update', function(event) {
              const data = JSON.parse(event.data);
              log('feeds', '[SYSTEM] CPU: ' + data.cpu + ', Memory: ' + data.memory + ', Status: ' + data.status);
            });
            
            eventSource.addEventListener('announcement', function(event) {
              const data = JSON.parse(event.data);
              log('feeds', '[EXECUTIVE] ' + data.message, data.priority);
            });
            
            eventSource.addEventListener('market-update', function(event) {
              const data = JSON.parse(event.data);
              log('feeds', '[MARKET] Stock: $' + data.stockPrice + ', Cap: ' + data.marketCap + ', Trend: ' + data.trend);
            });
            
            eventSource.addEventListener('notification', function(event) {
              const data = JSON.parse(event.data);
              log('feeds', '[NOTIFY] ' + data.message + ' (' + data.category + ')');
            });
            
            eventSource.onerror = function(error) {
              log('status', '🚨 Connection error for ' + channel);
              eventSources.delete(channel);
            };
          }
          
          function subscribeToMultiple() {
            const channels = ['system-status', 'executive-announcements', 'market-data'];
            const channelParam = channels.join(',');
            
            if (eventSources.has('multi')) {
              log('status', '⚠️ Already subscribed to multi-channel');
              return;
            }
            
            log('status', '🔌 Connecting to multi-channel feed...');
            
            const eventSource = new EventSource('/stream?channels=' + channelParam);
            eventSources.set('multi', eventSource);
            
            eventSource.onopen = function() {
              log('status', '✅ Connected to multi-channel feed');
            };
            
            eventSource.onmessage = function(event) {
              const data = JSON.parse(event.data);
              log('feeds', '[MULTI] ' + (data.message || JSON.stringify(data)));
            };
            
            eventSource.onerror = function(error) {
              log('status', '🚨 Multi-channel connection error');
              eventSources.delete('multi');
            };
          }
          
          function clearLogs() {
            document.getElementById('feeds').innerHTML = '';
            document.getElementById('status').innerHTML = '';
          }
          
          // Update metrics periodically
          setInterval(function() {
            fetch('/metrics')
              .then(response => response.json())
              .then(data => {
                document.getElementById('activeStreams').textContent = data.activeStreams;
                document.getElementById('eventsPerSec').textContent = data.eventsPerSecond;
                document.getElementById('totalEvents').textContent = data.totalEvents;
              })
              .catch(error => {
                log('status', '📊 Metrics fetch error: ' + error.message);
              });
          }, 5000);
          
          log('status', '🎛️ Dashboard ready - select a feed to begin');
        </script>
      </body>
      </html>
    `;
  }

  shutdown() {
    console.log('🛑 Shutting down Corporate Streaming Hub...');
    
    // 📡 Close all active streams
    for (const [streamId, streamMeta] of this.streams) {
      this.sendSSEEvent(streamMeta.response, {
        event: 'server-shutdown',
        data: { message: 'Server shutting down for maintenance' }
      });
    }
    
    console.log('✅ Streaming hub shutdown complete');
  }
}

// 🎭 DEMONSTRATION FUNCTION
async function demonstrateCorporateSSE() {
  console.log('📡 ALGOCRATIC CORPORATE SERVER-SENT EVENTS DEMONSTRATION');
  console.log('======================================================');
  console.log('📊 Initializing one-way corporate data streaming infrastructure...');
  console.log('');

  const streamingHub = new CorporateStreamingHub({
    port: 8090,
    pingInterval: 30000,
    maxClients: 100
  });

  // 🛑 Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down SSE demonstration...');
    streamingHub.shutdown();
    process.exit(0);
  });

  console.log('\\n🎓 PEDAGOGICAL TAKEAWAYS:');
  console.log('========================');
  console.log('✅ Server-Sent Events provide simple one-way real-time streaming');
  console.log('✅ SSE uses standard HTTP, works through firewalls and proxies');
  console.log('✅ Automatic client reconnection built into the protocol');
  console.log('✅ Perfect for dashboards, notifications, and status feeds');
  console.log('✅ Simpler than WebSockets when bidirectional communication not needed');
  console.log('✅ Integrates well with existing HTTP infrastructure');
  console.log('');
  console.log('🌐 Dashboard available at: http://localhost:8090');
  console.log('📡 SSE endpoints: http://localhost:8090/stream/{channel}');
  console.log('📊 Metrics: http://localhost:8090/metrics');
}

// 🚀 EXECUTE DEMONSTRATION
if (require.main === module) {
  demonstrateCorporateSSE().catch(error => {
    console.error('🚨 SSE demonstration failed:', error);
    process.exit(1);
  });
}

module.exports = {
  CorporateStreamingHub
};