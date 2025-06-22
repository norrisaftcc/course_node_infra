/**
 * 🏢 ALGOCRATIC FUTURES: WEEK 2 ENTERPRISE ESCALATION
 * "Advanced Multi-Service Coordination Protocol v2.0"
 * 
 * 📈 CORPORATE EVOLUTION: Having mastered async protocols in Week 1,
 * our algorithmic recalibration team now tackles enterprise-scale 
 * service coordination challenges using Express.js frameworks.
 * 
 * 🎯 PEDAGOGICAL PROGRESSION: Students build upon Week 1 async foundations
 * to orchestrate multiple corporate microservices with:
 * - Multi-department service coordination (Marketing, Sales, Analytics)
 * - Corporate resilience patterns (Circuit breakers for service failures)
 * - Executive-level graceful degradation strategies
 * - Real-world enterprise API gateway architectures
 * 
 * 💼 BUSINESS IMPACT: Students learn patterns they'll use to coordinate
 * distributed teams and services in their corporate careers!
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000, monitor = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.monitor = monitor;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      nextAttempt: new Date(this.nextAttempt).toISOString()
    };
  }
}

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.circuitBreakers = new Map();
  }

  register(name, config) {
    this.services.set(name, {
      ...config,
      lastHealthCheck: null,
      healthy: true
    });
    this.circuitBreakers.set(name, new CircuitBreaker());
  }

  async callService(name, operation) {
    const service = this.services.get(name);
    const breaker = this.circuitBreakers.get(name);
    
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }

    return breaker.execute(operation);
  }

  getServiceStatus(name) {
    const service = this.services.get(name);
    const breaker = this.circuitBreakers.get(name);
    
    return {
      service: service || null,
      circuitBreaker: breaker ? breaker.getStatus() : null
    };
  }

  getAllServicesStatus() {
    const status = {};
    for (const [name] of this.services) {
      status[name] = this.getServiceStatus(name);
    }
    return status;
  }
}

// Mock service implementations
class MockServices {
  static async userService(userId) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('User service temporarily unavailable');
    }
    
    return {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
      created: new Date().toISOString()
    };
  }

  static async orderService(userId) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
    
    if (Math.random() < 0.15) {
      throw new Error('Order service database error');
    }
    
    const orderCount = Math.floor(Math.random() * 10);
    return {
      userId,
      orders: Array.from({ length: orderCount }, (_, i) => ({
        id: `order-${userId}-${i}`,
        amount: (Math.random() * 1000).toFixed(2),
        status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)]
      }))
    };
  }

  static async recommendationService(userId) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
    
    if (Math.random() < 0.08) {
      throw new Error('Recommendation service ML model unavailable');
    }
    
    return {
      userId,
      recommendations: [
        { id: 'prod-1', name: 'Recommended Item 1', score: 0.95 },
        { id: 'prod-2', name: 'Recommended Item 2', score: 0.87 },
        { id: 'prod-3', name: 'Recommended Item 3', score: 0.76 }
      ]
    };
  }

  static async inventoryService(productIds = []) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 80));
    
    if (Math.random() < 0.12) {
      throw new Error('Inventory service connection timeout');
    }
    
    return {
      products: productIds.map(id => ({
        id,
        inStock: Math.random() > 0.3,
        quantity: Math.floor(Math.random() * 100)
      }))
    };
  }
}

// Initialize Express app
const app = express();
const serviceRegistry = new ServiceRegistry();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Register services
serviceRegistry.register('user', { url: 'mock://user-service' });
serviceRegistry.register('order', { url: 'mock://order-service' });
serviceRegistry.register('recommendation', { url: 'mock://recommendation-service' });
serviceRegistry.register('inventory', { url: 'mock://inventory-service' });

/**
 * Coordination Patterns Implementation
 */

// Pattern 1: Sequential with fallback (graceful degradation)
app.get('/api/user/:userId/profile', async (req, res) => {
  const { userId } = req.params;
  const startTime = Date.now();
  
  try {
    let user, orders, recommendations;
    
    // Get user info (critical - must succeed)
    try {
      user = await serviceRegistry.callService('user', 
        () => MockServices.userService(userId)
      );
    } catch (error) {
      return res.status(503).json({
        error: 'User service unavailable',
        message: 'Cannot load user profile'
      });
    }

    // Get orders with fallback
    try {
      orders = await serviceRegistry.callService('order',
        () => MockServices.orderService(userId)
      );
    } catch (error) {
      console.warn('Order service failed, using fallback:', error.message);
      orders = { userId, orders: [], error: 'Order history temporarily unavailable' };
    }

    // Get recommendations with fallback
    try {
      recommendations = await serviceRegistry.callService('recommendation',
        () => MockServices.recommendationService(userId)
      );
    } catch (error) {
      console.warn('Recommendation service failed, using fallback:', error.message);
      recommendations = { 
        userId, 
        recommendations: [], 
        error: 'Recommendations temporarily unavailable' 
      };
    }

    const responseTime = Date.now() - startTime;
    
    res.json({
      user,
      orders,
      recommendations,
      meta: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Profile endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Pattern 2: Parallel execution with Promise.allSettled
app.get('/api/user/:userId/dashboard', async (req, res) => {
  const { userId } = req.params;
  const startTime = Date.now();
  
  try {
    // Execute all services in parallel
    const servicePromises = [
      serviceRegistry.callService('user', () => MockServices.userService(userId))
        .then(data => ({ service: 'user', status: 'fulfilled', data }))
        .catch(error => ({ service: 'user', status: 'rejected', error: error.message })),
      
      serviceRegistry.callService('order', () => MockServices.orderService(userId))
        .then(data => ({ service: 'order', status: 'fulfilled', data }))
        .catch(error => ({ service: 'order', status: 'rejected', error: error.message })),
      
      serviceRegistry.callService('recommendation', () => MockServices.recommendationService(userId))
        .then(data => ({ service: 'recommendation', status: 'fulfilled', data }))
        .catch(error => ({ service: 'recommendation', status: 'rejected', error: error.message }))
    ];

    const results = await Promise.allSettled(servicePromises);
    const serviceResults = results.map(result => result.value);
    
    // Check if critical services failed
    const userResult = serviceResults.find(r => r.service === 'user');
    if (userResult.status === 'rejected') {
      return res.status(503).json({
        error: 'Critical service failure',
        message: 'User service must be available for dashboard'
      });
    }

    const responseTime = Date.now() - startTime;
    
    res.json({
      data: serviceResults.reduce((acc, result) => {
        acc[result.service] = result.status === 'fulfilled' 
          ? result.data 
          : { error: result.error };
        return acc;
      }, {}),
      meta: {
        responseTime: `${responseTime}ms`,
        servicesHealthy: serviceResults.filter(r => r.status === 'fulfilled').length,
        servicesTotal: serviceResults.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Pattern 3: Race condition with timeout
app.get('/api/quick-recommendations/:userId', async (req, res) => {
  const { userId } = req.params;
  const timeout = parseInt(req.query.timeout) || 500;
  
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    const recommendationPromise = serviceRegistry.callService('recommendation',
      () => MockServices.recommendationService(userId)
    );

    const result = await Promise.race([recommendationPromise, timeoutPromise]);
    
    res.json({
      recommendations: result.recommendations,
      meta: {
        timeout: `${timeout}ms`,
        source: 'live',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Fallback to cached/default recommendations
    res.json({
      recommendations: [
        { id: 'default-1', name: 'Popular Item 1', score: 0.8 },
        { id: 'default-2', name: 'Popular Item 2', score: 0.7 }
      ],
      meta: {
        timeout: `${timeout}ms`,
        source: 'fallback',
        reason: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Health check and monitoring endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: serviceRegistry.getAllServicesStatus()
  });
});

app.get('/api/services/status', (req, res) => {
  res.json({
    services: serviceRegistry.getAllServicesStatus(),
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Coordination Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Service status: http://localhost:${PORT}/api/services/status`);
  console.log(`👤 Try: http://localhost:${PORT}/api/user/123/profile`);
  console.log(`📈 Try: http://localhost:${PORT}/api/user/123/dashboard`);
});

module.exports = { app, serviceRegistry, CircuitBreaker };