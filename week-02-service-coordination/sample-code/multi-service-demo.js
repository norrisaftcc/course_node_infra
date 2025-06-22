/**
 * Week 2: Multi-Service Coordination Demo
 * 
 * Demonstrates 3+ services working together with:
 * - Circuit breaker patterns for resilience
 * - Performance comparison between blocking/non-blocking
 * - Advanced Promise coordination patterns
 * - Service dependency management
 */

const { performance } = require('perf_hooks');

// Enhanced Circuit Breaker with monitoring
class AdvancedCircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    this.successThreshold = options.successThreshold || 3;
    
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = Date.now();
    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      averageResponseTime: 0,
      lastFailure: null,
      lastSuccess: null
    };
    
    this.startMonitoring();
  }

  async execute(operation, timeout = 5000) {
    this.metrics.totalRequests++;
    const startTime = performance.now();

    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker OPEN for ${this.name}`);
      }
      this.state = 'HALF_OPEN';
      console.log(`🔄 Circuit breaker ${this.name} transitioning to HALF_OPEN`);
    }

    try {
      // Add timeout wrapper
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ]);
      
      const responseTime = performance.now() - startTime;
      this.onSuccess(responseTime);
      return result;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.onFailure(error, responseTime);
      throw error;
    }
  }

  onSuccess(responseTime) {
    this.failures = 0;
    this.successes++;
    this.metrics.totalSuccesses++;
    this.metrics.lastSuccess = Date.now();
    this.updateAverageResponseTime(responseTime);

    if (this.state === 'HALF_OPEN' && this.successes >= this.successThreshold) {
      this.state = 'CLOSED';
      console.log(`✅ Circuit breaker ${this.name} CLOSED after successful recovery`);
    }
  }

  onFailure(error, responseTime) {
    this.failures++;
    this.successes = 0;
    this.metrics.totalFailures++;
    this.metrics.lastFailure = Date.now();
    this.updateAverageResponseTime(responseTime);

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
      console.log(`🔴 Circuit breaker ${this.name} OPENED due to failures`);
    }
  }

  updateAverageResponseTime(responseTime) {
    const total = this.metrics.totalRequests;
    const current = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = ((current * (total - 1)) + responseTime) / total;
  }

  startMonitoring() {
    setInterval(() => {
      console.log(`📊 Circuit Breaker ${this.name} Status:`, {
        state: this.state,
        failures: this.failures,
        metrics: this.metrics
      });
    }, this.monitoringPeriod);
  }

  getMetrics() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      nextAttempt: new Date(this.nextAttempt).toISOString(),
      ...this.metrics
    };
  }
}

// Service implementations with realistic failure patterns
class ServiceCluster {
  constructor() {
    this.services = {
      userService: new AdvancedCircuitBreaker('UserService', { failureThreshold: 3 }),
      paymentService: new AdvancedCircuitBreaker('PaymentService', { failureThreshold: 2 }),
      inventoryService: new AdvancedCircuitBreaker('InventoryService', { failureThreshold: 4 }),
      notificationService: new AdvancedCircuitBreaker('NotificationService', { failureThreshold: 6 }),
      auditService: new AdvancedCircuitBreaker('AuditService', { failureThreshold: 5 })
    };
  }

  // Simulate user service with occasional database locks
  async getUserData(userId) {
    return this.services.userService.execute(async () => {
      await this.simulateNetworkDelay(50, 200);
      
      if (Math.random() < 0.15) {
        throw new Error('Database connection timeout');
      }
      
      return {
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`,
        preferences: { theme: 'dark', notifications: true }
      };
    });
  }

  // Simulate payment service with higher failure rate
  async processPayment(userId, amount) {
    return this.services.paymentService.execute(async () => {
      await this.simulateNetworkDelay(100, 500);
      
      if (Math.random() < 0.25) {
        throw new Error('Payment gateway temporarily unavailable');
      }
      
      if (amount > 1000 && Math.random() < 0.4) {
        throw new Error('Fraud detection triggered');
      }
      
      return {
        transactionId: `txn_${Date.now()}_${userId}`,
        amount,
        status: 'completed',
        processedAt: new Date().toISOString()
      };
    });
  }

  // Simulate inventory service with stock checks
  async checkInventory(productIds) {
    return this.services.inventoryService.execute(async () => {
      await this.simulateNetworkDelay(30, 150);
      
      if (Math.random() < 0.12) {
        throw new Error('Inventory database unavailable');
      }
      
      return productIds.map(id => ({
        productId: id,
        available: Math.random() > 0.2,
        quantity: Math.floor(Math.random() * 100),
        lastUpdated: new Date().toISOString()
      }));
    });
  }

  // Simulate notification service
  async sendNotification(userId, message) {
    return this.services.notificationService.execute(async () => {
      await this.simulateNetworkDelay(20, 100);
      
      if (Math.random() < 0.08) {
        throw new Error('Notification service rate limit exceeded');
      }
      
      return {
        notificationId: `notif_${Date.now()}`,
        userId,
        message,
        channel: 'email',
        sentAt: new Date().toISOString()
      };
    });
  }

  // Simulate audit service for compliance
  async auditLog(action, userId, data) {
    return this.services.auditService.execute(async () => {
      await this.simulateNetworkDelay(10, 50);
      
      if (Math.random() < 0.05) {
        throw new Error('Audit service storage full');
      }
      
      return {
        auditId: `audit_${Date.now()}`,
        action,
        userId,
        data,
        timestamp: new Date().toISOString()
      };
    });
  }

  async simulateNetworkDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  getAllMetrics() {
    return Object.keys(this.services).reduce((acc, serviceName) => {
      acc[serviceName] = this.services[serviceName].getMetrics();
      return acc;
    }, {});
  }
}

// Coordination patterns demonstration
class CoordinationPatterns {
  constructor(serviceCluster) {
    this.services = serviceCluster;
  }

  // Pattern 1: Sequential execution (blocking approach)
  async sequentialOrderProcessing(userId, productIds, amount) {
    console.log('🔄 Starting sequential order processing...');
    const startTime = performance.now();
    const results = {};

    try {
      console.log('1️⃣ Getting user data...');
      results.user = await this.services.getUserData(userId);
      
      console.log('2️⃣ Checking inventory...');
      results.inventory = await this.services.checkInventory(productIds);
      
      console.log('3️⃣ Processing payment...');
      results.payment = await this.services.processPayment(userId, amount);
      
      console.log('4️⃣ Sending notification...');
      results.notification = await this.services.sendNotification(
        userId, 
        'Your order has been processed successfully!'
      );
      
      console.log('5️⃣ Logging audit trail...');
      results.audit = await this.services.auditLog('order_processed', userId, {
        productIds,
        amount,
        transactionId: results.payment.transactionId
      });

      const totalTime = performance.now() - startTime;
      console.log(`✅ Sequential processing completed in ${totalTime.toFixed(2)}ms`);
      
      return {
        success: true,
        results,
        executionTime: totalTime,
        pattern: 'sequential'
      };

    } catch (error) {
      const totalTime = performance.now() - startTime;
      console.log(`❌ Sequential processing failed after ${totalTime.toFixed(2)}ms:`, error.message);
      
      return {
        success: false,
        error: error.message,
        results,
        executionTime: totalTime,
        pattern: 'sequential'
      };
    }
  }

  // Pattern 2: Parallel execution with dependencies
  async parallelOrderProcessing(userId, productIds, amount) {
    console.log('⚡ Starting parallel order processing...');
    const startTime = performance.now();
    
    try {
      // Phase 1: Independent operations in parallel
      console.log('Phase 1: Parallel independent operations...');
      const [userResult, inventoryResult] = await Promise.allSettled([
        this.services.getUserData(userId),
        this.services.checkInventory(productIds)
      ]);

      // Check if critical operations succeeded
      if (userResult.status === 'rejected') {
        throw new Error(`User service failed: ${userResult.reason.message}`);
      }
      
      if (inventoryResult.status === 'rejected') {
        throw new Error(`Inventory service failed: ${inventoryResult.reason.message}`);
      }

      const user = userResult.value;
      const inventory = inventoryResult.value;

      // Check inventory availability
      const availableProducts = inventory.filter(item => item.available);
      if (availableProducts.length === 0) {
        throw new Error('No products available in inventory');
      }

      // Phase 2: Payment processing (depends on inventory check)
      console.log('Phase 2: Processing payment with dependency...');
      const payment = await this.services.processPayment(userId, amount);

      // Phase 3: Post-processing operations in parallel
      console.log('Phase 3: Parallel post-processing...');
      const [notificationResult, auditResult] = await Promise.allSettled([
        this.services.sendNotification(
          userId,
          'Your order has been processed successfully!'
        ),
        this.services.auditLog('order_processed', userId, {
          productIds,
          amount,
          transactionId: payment.transactionId
        })
      ]);

      const totalTime = performance.now() - startTime;
      console.log(`✅ Parallel processing completed in ${totalTime.toFixed(2)}ms`);

      return {
        success: true,
        results: {
          user,
          inventory,
          payment,
          notification: notificationResult.status === 'fulfilled' 
            ? notificationResult.value 
            : { error: notificationResult.reason.message },
          audit: auditResult.status === 'fulfilled' 
            ? auditResult.value 
            : { error: auditResult.reason.message }
        },
        executionTime: totalTime,
        pattern: 'parallel'
      };

    } catch (error) {
      const totalTime = performance.now() - startTime;
      console.log(`❌ Parallel processing failed after ${totalTime.toFixed(2)}ms:`, error.message);
      
      return {
        success: false,
        error: error.message,
        executionTime: totalTime,
        pattern: 'parallel'
      };
    }
  }

  // Pattern 3: Pipeline with graceful degradation
  async pipelineOrderProcessing(userId, productIds, amount) {
    console.log('🔗 Starting pipeline order processing with graceful degradation...');
    const startTime = performance.now();
    const results = {};
    const errors = [];

    try {
      // Stage 1: User validation (critical)
      try {
        results.user = await this.services.getUserData(userId);
        console.log('✅ Stage 1: User validation completed');
      } catch (error) {
        throw new Error(`Critical failure in user validation: ${error.message}`);
      }

      // Stage 2: Inventory check (critical)
      try {
        results.inventory = await this.services.checkInventory(productIds);
        const availableProducts = results.inventory.filter(item => item.available);
        if (availableProducts.length === 0) {
          throw new Error('No products available');
        }
        console.log('✅ Stage 2: Inventory check completed');
      } catch (error) {
        throw new Error(`Critical failure in inventory check: ${error.message}`);
      }

      // Stage 3: Payment processing (critical)
      try {
        results.payment = await this.services.processPayment(userId, amount);
        console.log('✅ Stage 3: Payment processing completed');
      } catch (error) {
        throw new Error(`Critical failure in payment processing: ${error.message}`);
      }

      // Stage 4: Notification (non-critical - graceful degradation)
      try {
        results.notification = await this.services.sendNotification(
          userId,
          'Your order has been processed successfully!'
        );
        console.log('✅ Stage 4: Notification sent');
      } catch (error) {
        console.log('⚠️  Stage 4: Notification failed (non-critical):', error.message);
        results.notification = { error: error.message, degraded: true };
        errors.push(`Notification: ${error.message}`);
      }

      // Stage 5: Audit logging (non-critical - graceful degradation)
      try {
        results.audit = await this.services.auditLog('order_processed', userId, {
          productIds,
          amount,
          transactionId: results.payment.transactionId
        });
        console.log('✅ Stage 5: Audit logging completed');
      } catch (error) {
        console.log('⚠️  Stage 5: Audit logging failed (non-critical):', error.message);
        results.audit = { error: error.message, degraded: true };
        errors.push(`Audit: ${error.message}`);
      }

      const totalTime = performance.now() - startTime;
      console.log(`✅ Pipeline processing completed in ${totalTime.toFixed(2)}ms`);

      return {
        success: true,
        results,
        executionTime: totalTime,
        pattern: 'pipeline',
        degradations: errors.length > 0 ? errors : null
      };

    } catch (error) {
      const totalTime = performance.now() - startTime;
      console.log(`❌ Pipeline processing failed after ${totalTime.toFixed(2)}ms:`, error.message);
      
      return {
        success: false,
        error: error.message,
        results,
        executionTime: totalTime,
        pattern: 'pipeline'
      };
    }
  }
}

// Performance comparison runner
async function runPerformanceComparison() {
  console.log('🏁 Starting Multi-Service Coordination Performance Comparison\n');
  
  const serviceCluster = new ServiceCluster();
  const coordinator = new CoordinationPatterns(serviceCluster);
  
  const testCases = [
    { userId: '100', productIds: ['prod-1', 'prod-2'], amount: 299.99 },
    { userId: '101', productIds: ['prod-3'], amount: 599.99 },
    { userId: '102', productIds: ['prod-1', 'prod-3', 'prod-5'], amount: 899.99 }
  ];

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🧪 Test Case ${i + 1}: User ${testCase.userId}, Products [${testCase.productIds.join(', ')}], Amount $${testCase.amount}`);
    console.log('='.repeat(80));

    // Run sequential pattern
    const sequentialResult = await coordinator.sequentialOrderProcessing(
      testCase.userId, 
      testCase.productIds, 
      testCase.amount
    );

    // Wait a bit to avoid overwhelming services
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run parallel pattern
    const parallelResult = await coordinator.parallelOrderProcessing(
      testCase.userId, 
      testCase.productIds, 
      testCase.amount
    );

    // Wait a bit to avoid overwhelming services
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run pipeline pattern
    const pipelineResult = await coordinator.pipelineOrderProcessing(
      testCase.userId, 
      testCase.productIds, 
      testCase.amount
    );

    results.push({
      testCase,
      sequential: sequentialResult,
      parallel: parallelResult,
      pipeline: pipelineResult
    });

    // Wait before next test case
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  console.log('\n📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach((result, index) => {
    console.log(`\nTest Case ${index + 1}:`);
    console.log(`  Sequential: ${result.sequential.success ? '✅' : '❌'} ${result.sequential.executionTime.toFixed(2)}ms`);
    console.log(`  Parallel:   ${result.parallel.success ? '✅' : '❌'} ${result.parallel.executionTime.toFixed(2)}ms`);
    console.log(`  Pipeline:   ${result.pipeline.success ? '✅' : '❌'} ${result.pipeline.executionTime.toFixed(2)}ms`);
  });

  // Calculate averages
  const avgTimes = {
    sequential: results.reduce((sum, r) => sum + r.sequential.executionTime, 0) / results.length,
    parallel: results.reduce((sum, r) => sum + r.parallel.executionTime, 0) / results.length,
    pipeline: results.reduce((sum, r) => sum + r.pipeline.executionTime, 0) / results.length
  };

  console.log('\n📈 AVERAGE EXECUTION TIMES:');
  console.log(`  Sequential: ${avgTimes.sequential.toFixed(2)}ms`);
  console.log(`  Parallel:   ${avgTimes.parallel.toFixed(2)}ms`);
  console.log(`  Pipeline:   ${avgTimes.pipeline.toFixed(2)}ms`);

  console.log('\n🔧 CIRCUIT BREAKER METRICS:');
  const metrics = serviceCluster.getAllMetrics();
  Object.entries(metrics).forEach(([serviceName, metric]) => {
    console.log(`  ${serviceName}: ${metric.state} (Success: ${metric.totalSuccesses}, Failures: ${metric.totalFailures})`);
  });

  return results;
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runPerformanceComparison()
    .then(() => {
      console.log('\n🎯 Multi-service coordination demo completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

module.exports = {
  AdvancedCircuitBreaker,
  ServiceCluster,
  CoordinationPatterns,
  runPerformanceComparison
};