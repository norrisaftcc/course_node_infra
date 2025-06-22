/**
 * Week 2: Comprehensive Error Handling Examples
 * 
 * Demonstrates advanced error handling patterns for service coordination:
 * - Promise.allSettled for partial failures
 * - Timeout handling and retry logic
 * - Service health monitoring
 * - Error categorization and recovery strategies
 * - Bulkhead pattern implementation
 */

const { performance } = require('perf_hooks');

// Error categorization system
class ServiceError extends Error {
  constructor(message, type = 'UNKNOWN', service = null, retryable = false, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.type = type;
    this.service = service;
    this.retryable = retryable;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  static types = {
    TIMEOUT: 'TIMEOUT',
    NETWORK: 'NETWORK', 
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    VALIDATION: 'VALIDATION',
    BUSINESS_LOGIC: 'BUSINESS_LOGIC',
    RESOURCE_EXHAUSTION: 'RESOURCE_EXHAUSTION',
    DEPENDENCY_FAILURE: 'DEPENDENCY_FAILURE',
    DATA_CORRUPTION: 'DATA_CORRUPTION',
    RATE_LIMIT: 'RATE_LIMIT'
  };

  static create(type, message, service, retryable = false, statusCode = 500) {
    return new ServiceError(message, type, service, retryable, statusCode);
  }
}

// Retry strategy with exponential backoff
class RetryStrategy {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.exponentialBase = options.exponentialBase || 2;
    this.jitter = options.jitter || true;
  }

  async execute(operation, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxAttempts} for ${context.operation || 'operation'}`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ Operation succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry on non-retryable errors
        if (error instanceof ServiceError && !error.retryable) {
          console.log(`❌ Non-retryable error: ${error.message}`);
          throw error;
        }
        
        // Don't wait after the last attempt
        if (attempt === this.maxAttempts) {
          break;
        }
        
        const delay = this.calculateDelay(attempt);
        console.log(`⏳ Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    console.log(`❌ All ${this.maxAttempts} attempts failed`);
    throw lastError;
  }
  
  calculateDelay(attempt) {
    let delay = this.baseDelay * Math.pow(this.exponentialBase, attempt - 1);
    delay = Math.min(delay, this.maxDelay);
    
    if (this.jitter) {
      // Add random jitter (±25%)
      const jitterAmount = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return Math.max(100, Math.floor(delay)); // Minimum 100ms
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Service health monitor
class ServiceHealthMonitor {
  constructor() {
    this.services = new Map();
    this.monitoringInterval = 30000; // 30 seconds
    this.healthCheckTimeout = 5000; // 5 seconds
    this.startMonitoring();
  }

  register(serviceName, healthCheckFn, options = {}) {
    this.services.set(serviceName, {
      name: serviceName,
      healthCheck: healthCheckFn,
      status: 'UNKNOWN',
      lastCheck: null,
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      totalChecks: 0,
      successfulChecks: 0,
      options: {
        maxConsecutiveFailures: options.maxConsecutiveFailures || 3,
        criticalService: options.criticalService || false,
        ...options
      }
    });
  }

  async checkServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return null;

    const startTime = performance.now();
    service.totalChecks++;

    try {
      const healthCheck = Promise.race([
        service.healthCheck(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.healthCheckTimeout)
        )
      ]);

      await healthCheck;
      
      const responseTime = performance.now() - startTime;
      service.status = 'HEALTHY';
      service.lastCheck = Date.now();
      service.lastSuccess = Date.now();
      service.consecutiveFailures = 0;
      service.successfulChecks++;
      service.lastResponseTime = responseTime;

      return {
        status: 'HEALTHY',
        responseTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const responseTime = performance.now() - startTime;
      service.status = 'UNHEALTHY';
      service.lastCheck = Date.now();
      service.lastFailure = Date.now();
      service.consecutiveFailures++;
      service.lastError = error.message;
      service.lastResponseTime = responseTime;

      return {
        status: 'UNHEALTHY',
        error: error.message,
        responseTime,
        consecutiveFailures: service.consecutiveFailures,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkAllServices() {
    const results = {};
    const promises = Array.from(this.services.keys()).map(async serviceName => {
      const result = await this.checkServiceHealth(serviceName);
      results[serviceName] = result;
    });

    await Promise.allSettled(promises);
    return results;
  }

  getServiceStatus(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return null;

    return {
      name: service.name,
      status: service.status,
      lastCheck: service.lastCheck ? new Date(service.lastCheck).toISOString() : null,
      lastSuccess: service.lastSuccess ? new Date(service.lastSuccess).toISOString() : null,
      lastFailure: service.lastFailure ? new Date(service.lastFailure).toISOString() : null,
      consecutiveFailures: service.consecutiveFailures,
      totalChecks: service.totalChecks,
      successfulChecks: service.successfulChecks,
      successRate: service.totalChecks > 0 ? (service.successfulChecks / service.totalChecks * 100).toFixed(2) : 0,
      lastResponseTime: service.lastResponseTime,
      options: service.options
    };
  }

  getAllServicesStatus() {
    const status = {};
    for (const serviceName of this.services.keys()) {
      status[serviceName] = this.getServiceStatus(serviceName);
    }
    return status;
  }

  startMonitoring() {
    setInterval(async () => {
      console.log('🏥 Running service health checks...');
      const results = await this.checkAllServices();
      
      // Log critical service failures
      Object.entries(results).forEach(([serviceName, result]) => {
        const service = this.services.get(serviceName);
        if (service.options.criticalService && result.status === 'UNHEALTHY') {
          console.error(`🚨 CRITICAL SERVICE DOWN: ${serviceName} - ${result.error}`);
        }
      });
    }, this.monitoringInterval);
  }
}

// Mock services with various failure patterns
class UnreliableServices {
  static async databaseService() {
    await this.randomDelay(50, 300);
    
    const errorRate = 0.2;
    if (Math.random() < errorRate) {
      const errors = [
        ServiceError.create(ServiceError.types.TIMEOUT, 'Database query timeout', 'database', true, 504),
        ServiceError.create(ServiceError.types.NETWORK, 'Connection pool exhausted', 'database', true, 503),
        ServiceError.create(ServiceError.types.RESOURCE_EXHAUSTION, 'Database disk full', 'database', false, 507),
        ServiceError.create(ServiceError.types.DATA_CORRUPTION, 'Index corruption detected', 'database', false, 500)
      ];
      throw errors[Math.floor(Math.random() * errors.length)];
    }
    
    return { data: 'Database query successful', timestamp: new Date().toISOString() };
  }

  static async authService() {
    await this.randomDelay(20, 100);
    
    const errorRate = 0.15;
    if (Math.random() < errorRate) {
      const errors = [
        ServiceError.create(ServiceError.types.AUTHENTICATION, 'Token expired', 'auth', false, 401),
        ServiceError.create(ServiceError.types.AUTHORIZATION, 'Insufficient permissions', 'auth', false, 403),
        ServiceError.create(ServiceError.types.RATE_LIMIT, 'Too many auth requests', 'auth', true, 429),
        ServiceError.create(ServiceError.types.NETWORK, 'Auth service unavailable', 'auth', true, 503)
      ];
      throw errors[Math.floor(Math.random() * errors.length)];
    }
    
    return { token: 'valid-jwt-token', expiresIn: 3600 };
  }

  static async paymentService() {
    await this.randomDelay(100, 500);
    
    const errorRate = 0.25;
    if (Math.random() < errorRate) {
      const errors = [
        ServiceError.create(ServiceError.types.BUSINESS_LOGIC, 'Insufficient funds', 'payment', false, 402),
        ServiceError.create(ServiceError.types.VALIDATION, 'Invalid card number', 'payment', false, 400),
        ServiceError.create(ServiceError.types.DEPENDENCY_FAILURE, 'Bank API unavailable', 'payment', true, 503),
        ServiceError.create(ServiceError.types.TIMEOUT, 'Payment processing timeout', 'payment', true, 504)
      ];
      throw errors[Math.floor(Math.random() * errors.length)];
    }
    
    return { 
      transactionId: `txn_${Date.now()}`,
      status: 'completed',
      processedAt: new Date().toISOString()
    };
  }

  static async externalApiService() {
    await this.randomDelay(200, 1000);
    
    const errorRate = 0.3;
    if (Math.random() < errorRate) {
      const errors = [
        ServiceError.create(ServiceError.types.RATE_LIMIT, 'API rate limit exceeded', 'external-api', true, 429),
        ServiceError.create(ServiceError.types.TIMEOUT, 'External API timeout', 'external-api', true, 504),
        ServiceError.create(ServiceError.types.NETWORK, 'DNS resolution failed', 'external-api', true, 502),
        ServiceError.create(ServiceError.types.AUTHENTICATION, 'API key invalid', 'external-api', false, 401)
      ];
      throw errors[Math.floor(Math.random() * errors.length)];
    }
    
    return { data: 'External API response', source: 'third-party' };
  }

  static async randomDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Error handling pattern demonstrations
class ErrorHandlingPatterns {
  constructor() {
    this.retryStrategy = new RetryStrategy({ maxAttempts: 3, baseDelay: 1000 });
    this.healthMonitor = new ServiceHealthMonitor();
    this.setupHealthMonitoring();
  }

  setupHealthMonitoring() {
    this.healthMonitor.register('database', 
      () => UnreliableServices.databaseService(), 
      { criticalService: true, maxConsecutiveFailures: 2 }
    );
    
    this.healthMonitor.register('auth', 
      () => UnreliableServices.authService(),
      { criticalService: true }
    );
    
    this.healthMonitor.register('payment', 
      () => UnreliableServices.paymentService(),
      { criticalService: false }
    );
    
    this.healthMonitor.register('external-api', 
      () => UnreliableServices.externalApiService(),
      { criticalService: false }
    );
  }

  // Pattern 1: Promise.allSettled for partial failures
  async partialFailureHandling() {
    console.log('\n🔄 Pattern 1: Promise.allSettled for Partial Failures');
    console.log('='.repeat(60));
    
    const operations = [
      { name: 'database', operation: () => UnreliableServices.databaseService() },
      { name: 'auth', operation: () => UnreliableServices.authService() },
      { name: 'payment', operation: () => UnreliableServices.paymentService() },
      { name: 'external-api', operation: () => UnreliableServices.externalApiService() }
    ];

    const startTime = performance.now();
    const results = await Promise.allSettled(
      operations.map(op => op.operation())
    );

    const executionTime = performance.now() - startTime;
    
    const processedResults = results.map((result, index) => ({
      service: operations[index].name,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? {
        message: result.reason.message,
        type: result.reason.type || 'UNKNOWN',
        retryable: result.reason.retryable || false
      } : null
    }));

    const successful = processedResults.filter(r => r.status === 'fulfilled').length;
    const failed = processedResults.filter(r => r.status === 'rejected').length;

    console.log(`✅ Successful operations: ${successful}/${operations.length}`);
    console.log(`❌ Failed operations: ${failed}/${operations.length}`);
    console.log(`⏱️  Total execution time: ${executionTime.toFixed(2)}ms`);

    processedResults.forEach(result => {
      const icon = result.status === 'fulfilled' ? '✅' : '❌';
      const message = result.status === 'fulfilled' 
        ? 'Success' 
        : `${result.error.type}: ${result.error.message}`;
      console.log(`${icon} ${result.service}: ${message}`);
    });

    return {
      successful,
      failed,
      executionTime,
      results: processedResults
    };
  }

  // Pattern 2: Timeout handling with graceful fallback
  async timeoutHandlingWithFallback() {
    console.log('\n⏰ Pattern 2: Timeout Handling with Graceful Fallback');
    console.log('='.repeat(60));

    const timeout = 300; // 300ms timeout
    
    async function withTimeout(operation, timeoutMs, fallback) {
      try {
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
          )
        ]);
        return { source: 'primary', data: result };
      } catch (error) {
        if (error.message === 'Operation timeout') {
          console.log(`⚠️  Operation timed out after ${timeoutMs}ms, using fallback`);
          return { source: 'fallback', data: await fallback() };
        }
        throw error;
      }
    }

    const operations = [
      {
        name: 'database',
        primary: () => UnreliableServices.databaseService(),
        fallback: () => ({ data: 'Cached database result', cached: true })
      },
      {
        name: 'external-api',
        primary: () => UnreliableServices.externalApiService(),
        fallback: () => ({ data: 'Default API response', default: true })
      }
    ];

    const results = [];
    
    for (const op of operations) {
      try {
        const startTime = performance.now();
        const result = await withTimeout(op.primary, timeout, op.fallback);
        const executionTime = performance.now() - startTime;
        
        results.push({
          service: op.name,
          success: true,
          source: result.source,
          data: result.data,
          executionTime
        });
        
        console.log(`✅ ${op.name}: ${result.source} (${executionTime.toFixed(2)}ms)`);
      } catch (error) {
        results.push({
          service: op.name,
          success: false,
          error: error.message
        });
        console.log(`❌ ${op.name}: ${error.message}`);
      }
    }

    return results;
  }

  // Pattern 3: Retry with exponential backoff
  async retryWithExponentialBackoff() {
    console.log('\n🔄 Pattern 3: Retry with Exponential Backoff');
    console.log('='.repeat(60));

    const operations = [
      { name: 'database', fn: UnreliableServices.databaseService },
      { name: 'payment', fn: UnreliableServices.paymentService }
    ];

    const results = [];

    for (const op of operations) {
      try {
        const startTime = performance.now();
        const result = await this.retryStrategy.execute(
          op.fn, 
          { operation: op.name }
        );
        const executionTime = performance.now() - startTime;
        
        results.push({
          service: op.name,
          success: true,
          data: result,
          executionTime
        });
        
      } catch (error) {
        results.push({
          service: op.name,
          success: false,
          error: {
            message: error.message,
            type: error.type || 'UNKNOWN',
            retryable: error.retryable || false
          }
        });
      }
    }

    return results;
  }

  // Pattern 4: Bulkhead pattern - isolate critical resources
  async bulkheadPattern() {
    console.log('\n🚧 Pattern 4: Bulkhead Pattern - Resource Isolation');
    console.log('='.repeat(60));

    // Simulate different resource pools
    const criticalPool = { maxConcurrent: 2, current: 0 };
    const nonCriticalPool = { maxConcurrent: 5, current: 0 };

    async function executeWithPool(operation, pool, resourceName) {
      if (pool.current >= pool.maxConcurrent) {
        throw ServiceError.create(
          ServiceError.types.RESOURCE_EXHAUSTION,
          `${resourceName} pool exhausted`,
          resourceName,
          true,
          503
        );
      }

      pool.current++;
      try {
        const result = await operation();
        return result;
      } finally {
        pool.current--;
      }
    }

    const criticalOperations = Array.from({ length: 4 }, (_, i) => ({
      name: `critical-op-${i}`,
      operation: () => executeWithPool(
        () => UnreliableServices.databaseService(),
        criticalPool,
        'critical'
      )
    }));

    const nonCriticalOperations = Array.from({ length: 8 }, (_, i) => ({
      name: `non-critical-op-${i}`,
      operation: () => executeWithPool(
        () => UnreliableServices.externalApiService(),
        nonCriticalPool,
        'non-critical'
      )
    }));

    console.log('🔥 Executing critical operations (limited pool)...');
    const criticalResults = await Promise.allSettled(
      criticalOperations.map(op => op.operation())
    );

    console.log('📊 Executing non-critical operations (larger pool)...');
    const nonCriticalResults = await Promise.allSettled(
      nonCriticalOperations.map(op => op.operation())
    );

    const criticalSuccessCount = criticalResults.filter(r => r.status === 'fulfilled').length;
    const nonCriticalSuccessCount = nonCriticalResults.filter(r => r.status === 'fulfilled').length;

    console.log(`✅ Critical operations: ${criticalSuccessCount}/${criticalOperations.length} succeeded`);
    console.log(`📈 Non-critical operations: ${nonCriticalSuccessCount}/${nonCriticalOperations.length} succeeded`);

    return {
      critical: {
        total: criticalOperations.length,
        successful: criticalSuccessCount,
        poolSize: criticalPool.maxConcurrent
      },
      nonCritical: {
        total: nonCriticalOperations.length,
        successful: nonCriticalSuccessCount,
        poolSize: nonCriticalPool.maxConcurrent
      }
    };
  }

  // Comprehensive error handling demo
  async runComprehensiveDemo() {
    console.log('🚀 Starting Comprehensive Error Handling Demo');
    console.log('='.repeat(80));

    const results = {};

    try {
      results.partialFailures = await this.partialFailureHandling();
      await new Promise(resolve => setTimeout(resolve, 1000));

      results.timeoutHandling = await this.timeoutHandlingWithFallback();
      await new Promise(resolve => setTimeout(resolve, 1000));

      results.retryPattern = await this.retryWithExponentialBackoff();
      await new Promise(resolve => setTimeout(resolve, 1000));

      results.bulkheadPattern = await this.bulkheadPattern();

      // Get service health status
      results.serviceHealth = this.healthMonitor.getAllServicesStatus();

      console.log('\n📊 COMPREHENSIVE DEMO SUMMARY');
      console.log('='.repeat(80));
      console.log('Pattern Performance:');
      console.log(`  Partial Failures: ${results.partialFailures.successful}/${results.partialFailures.successful + results.partialFailures.failed} services succeeded`);
      console.log(`  Timeout Handling: ${results.timeoutHandling.filter(r => r.success).length}/${results.timeoutHandling.length} operations succeeded`);
      console.log(`  Retry Pattern: ${results.retryPattern.filter(r => r.success).length}/${results.retryPattern.length} operations succeeded`);
      console.log(`  Bulkhead Pattern: Critical ${results.bulkheadPattern.critical.successful}/${results.bulkheadPattern.critical.total}, Non-Critical ${results.bulkheadPattern.nonCritical.successful}/${results.bulkheadPattern.nonCritical.total}`);

      return results;

    } catch (error) {
      console.error('Demo failed:', error);
      throw error;
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new ErrorHandlingPatterns();
  
  demo.runComprehensiveDemo()
    .then(results => {
      console.log('\n🎯 Error handling patterns demo completed successfully!');
      console.log('\nKey Takeaways:');
      console.log('- Use Promise.allSettled for operations that can partially fail');
      console.log('- Implement timeout handling with graceful fallbacks');
      console.log('- Use exponential backoff for retryable operations');
      console.log('- Apply bulkhead pattern to isolate critical resources');
      console.log('- Monitor service health continuously');
      
      // Keep the health monitor running for a bit to show monitoring
      setTimeout(() => {
        console.log('\n🏥 Final Service Health Check:');
        const healthStatus = demo.healthMonitor.getAllServicesStatus();
        Object.entries(healthStatus).forEach(([service, status]) => {
          console.log(`  ${service}: ${status.status} (${status.successRate}% success rate)`);
        });
        process.exit(0);
      }, 5000);
    })
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

module.exports = {
  ServiceError,
  RetryStrategy,
  ServiceHealthMonitor,
  UnreliableServices,
  ErrorHandlingPatterns
};