/**
 * Week 2: Service Coordination Exercises
 * 
 * Student exercises with automated testing to practice:
 * - Service coordination patterns
 * - Error handling strategies
 * - Circuit breaker implementation
 * - Performance optimization
 */

const { performance } = require('perf_hooks');

// Exercise framework
class ExerciseFramework {
  constructor() {
    this.exercises = new Map();
    this.results = [];
  }

  registerExercise(name, description, testFn, solutionFn = null) {
    this.exercises.set(name, {
      name,
      description,
      testFn,
      solutionFn,
      attempted: false,
      passed: false,
      score: 0,
      feedback: []
    });
  }

  async runExercise(name, studentImplementation) {
    const exercise = this.exercises.get(name);
    if (!exercise) {
      throw new Error(`Exercise '${name}' not found`);
    }

    console.log(`\n🎯 Exercise: ${exercise.name}`);
    console.log(`📝 ${exercise.description}`);
    console.log('='.repeat(60));

    exercise.attempted = true;
    const startTime = performance.now();

    try {
      const result = await exercise.testFn(studentImplementation);
      const executionTime = performance.now() - startTime;
      
      exercise.passed = result.passed;
      exercise.score = result.score || 0;
      exercise.feedback = result.feedback || [];
      exercise.executionTime = executionTime;

      if (result.passed) {
        console.log(`✅ PASSED (${result.score}/100) - ${executionTime.toFixed(2)}ms`);
      } else {
        console.log(`❌ FAILED (${result.score}/100) - ${executionTime.toFixed(2)}ms`);
      }

      if (result.feedback && result.feedback.length > 0) {
        console.log('\n📋 Feedback:');
        result.feedback.forEach(fb => console.log(`  ${fb}`));
      }

      return result;

    } catch (error) {
      const executionTime = performance.now() - startTime;
      exercise.passed = false;
      exercise.score = 0;
      exercise.feedback = [`Execution error: ${error.message}`];
      exercise.executionTime = executionTime;

      console.log(`💥 ERROR - ${executionTime.toFixed(2)}ms`);
      console.log(`   ${error.message}`);

      return {
        passed: false,
        score: 0,
        feedback: [`Execution error: ${error.message}`]
      };
    }
  }

  async runAllExercises(studentSolutions) {
    console.log('🚀 Starting Service Coordination Exercises');
    console.log('='.repeat(80));

    const results = [];
    
    for (const [exerciseName] of this.exercises) {
      const studentImpl = studentSolutions[exerciseName];
      if (!studentImpl) {
        console.log(`⚠️  Skipping ${exerciseName} - no student implementation provided`);
        continue;
      }

      const result = await this.runExercise(exerciseName, studentImpl);
      results.push({ exercise: exerciseName, ...result });
      
      // Small delay between exercises
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.printSummary();
    return results;
  }

  printSummary() {
    console.log('\n📊 EXERCISE SUMMARY');
    console.log('='.repeat(80));

    let totalScore = 0;
    let totalExercises = 0;
    let passedExercises = 0;

    for (const [name, exercise] of this.exercises) {
      if (exercise.attempted) {
        totalExercises++;
        totalScore += exercise.score;
        
        if (exercise.passed) {
          passedExercises++;
        }

        const status = exercise.passed ? '✅' : '❌';
        const time = exercise.executionTime ? `${exercise.executionTime.toFixed(2)}ms` : 'N/A';
        console.log(`${status} ${name}: ${exercise.score}/100 (${time})`);
      }
    }

    const averageScore = totalExercises > 0 ? (totalScore / totalExercises).toFixed(1) : 0;
    console.log(`\n🎯 Overall Performance: ${passedExercises}/${totalExercises} passed (${averageScore}/100 average)`);

    if (averageScore >= 80) {
      console.log('🌟 Excellent work! You have mastered service coordination patterns.');
    } else if (averageScore >= 60) {
      console.log('👍 Good progress! Review the feedback and try to optimize your solutions.');
    } else {
      console.log('📚 Keep practicing! Focus on the fundamental patterns and error handling.');
    }
  }
}

// Mock services for exercises
class MockServiceCluster {
  static async userService(userId, shouldFail = false) {
    await this.delay(Math.random() * 100);
    
    if (shouldFail || Math.random() < 0.1) {
      throw new Error('User service unavailable');
    }
    
    return {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`
    };
  }

  static async orderService(userId, shouldFail = false) {
    await this.delay(Math.random() * 150);
    
    if (shouldFail || Math.random() < 0.15) {
      throw new Error('Order service timeout');
    }
    
    return {
      userId,
      orders: Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => ({
        id: `order-${i}`,
        amount: (Math.random() * 100).toFixed(2)
      }))
    };
  }

  static async inventoryService(productIds, shouldFail = false) {
    await this.delay(Math.random() * 80);
    
    if (shouldFail || Math.random() < 0.12) {
      throw new Error('Inventory service database error');
    }
    
    return productIds.map(id => ({
      productId: id,
      available: Math.random() > 0.3,
      quantity: Math.floor(Math.random() * 50)
    }));
  }

  static async paymentService(amount, shouldFail = false) {
    await this.delay(Math.random() * 200);
    
    if (shouldFail || Math.random() < 0.2) {
      throw new Error('Payment processing failed');
    }
    
    return {
      transactionId: `txn_${Date.now()}`,
      amount,
      status: 'completed'
    };
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize exercise framework
const framework = new ExerciseFramework();

// Exercise 1: Parallel Service Calls
framework.registerExercise(
  'parallelServiceCalls',
  'Implement a function that calls multiple services in parallel and returns combined results',
  async (studentFn) => {
    const feedback = [];
    let score = 0;

    try {
      const userId = '12345';
      const productIds = ['prod-1', 'prod-2'];
      
      const startTime = performance.now();
      const result = await studentFn(userId, productIds);
      const executionTime = performance.now() - startTime;

      // Check if result has expected structure
      if (!result || typeof result !== 'object') {
        feedback.push('❌ Result should be an object');
        return { passed: false, score: 0, feedback };
      }

      if (result.user && result.orders && result.inventory) {
        score += 40;
        feedback.push('✅ All required services called');
      } else {
        feedback.push('❌ Missing required service results (user, orders, inventory)');
      }

      // Check execution time (should be parallel, not sequential)
      if (executionTime < 400) { // Should be much faster than sequential (~350ms)
        score += 30;
        feedback.push('✅ Efficient parallel execution');
      } else {
        feedback.push('⚠️  Execution time suggests sequential calls, not parallel');
      }

      // Check error handling
      try {
        await studentFn(userId, productIds, true); // Force errors
        feedback.push('⚠️  Should handle service errors gracefully');
      } catch (error) {
        score += 20;
        feedback.push('✅ Proper error handling implemented');
      }

      if (result.meta && result.meta.executionTime) {
        score += 10;
        feedback.push('✅ Performance metadata included');
      }

      return {
        passed: score >= 70,
        score,
        feedback
      };

    } catch (error) {
      feedback.push(`❌ Implementation error: ${error.message}`);
      return { passed: false, score: 0, feedback };
    }
  }
);

// Exercise 2: Circuit Breaker Implementation
framework.registerExercise(
  'circuitBreaker',
  'Implement a circuit breaker class that prevents cascading failures',
  async (CircuitBreakerClass) => {
    const feedback = [];
    let score = 0;

    try {
      const breaker = new CircuitBreakerClass({ threshold: 3, timeout: 1000 });
      
      // Test basic functionality
      if (typeof breaker.execute === 'function') {
        score += 20;
        feedback.push('✅ Circuit breaker has execute method');
      } else {
        feedback.push('❌ Circuit breaker missing execute method');
        return { passed: false, score, feedback };
      }

      // Test success case
      const successResult = await breaker.execute(() => Promise.resolve('success'));
      if (successResult === 'success') {
        score += 20;
        feedback.push('✅ Handles successful operations');
      }

      // Test failure accumulation
      let failures = 0;
      for (let i = 0; i < 4; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('test failure')));
        } catch (error) {
          failures++;
        }
      }

      if (failures === 4) {
        score += 20;
        feedback.push('✅ Accumulates failures correctly');
      }

      // Test circuit opening
      try {
        await breaker.execute(() => Promise.resolve('should fail'));
        feedback.push('❌ Circuit should be open after threshold failures');
      } catch (error) {
        if (error.message.includes('open') || error.message.includes('OPEN')) {
          score += 20;
          feedback.push('✅ Circuit opens after threshold failures');
        }
      }

      // Test state reporting
      if (typeof breaker.getState === 'function' || typeof breaker.getStatus === 'function') {
        score += 20;
        feedback.push('✅ Provides state/status information');
      } else {
        feedback.push('⚠️  Consider adding state reporting method');
      }

      return {
        passed: score >= 70,
        score,
        feedback
      };

    } catch (error) {
      feedback.push(`❌ Implementation error: ${error.message}`);
      return { passed: false, score: 0, feedback };
    }
  }
);

// Exercise 3: Graceful Degradation
framework.registerExercise(
  'gracefulDegradation',
  'Implement a service coordinator that gracefully degrades when services fail',
  async (coordinatorFn) => {
    const feedback = [];
    let score = 0;

    try {
      // Test with all services working
      const successResult = await coordinatorFn('user123', false, false, false);
      
      if (successResult && successResult.user && successResult.orders && successResult.inventory) {
        score += 25;
        feedback.push('✅ Returns complete data when all services work');
      }

      // Test with non-critical service failing
      const partialResult = await coordinatorFn('user123', false, true, false); // orders fail
      
      if (partialResult && partialResult.user && partialResult.inventory) {
        score += 25;
        feedback.push('✅ Continues operation when non-critical service fails');
        
        if (partialResult.orders && partialResult.orders.error) {
          score += 15;
          feedback.push('✅ Provides error information for failed services');
        }
      }

      // Test with critical service failing
      try {
        await coordinatorFn('user123', true, false, false); // user service fails
        feedback.push('⚠️  Should fail fast when critical service is unavailable');
      } catch (error) {
        score += 20;
        feedback.push('✅ Fails fast on critical service failure');
      }

      // Test fallback mechanisms
      const fallbackResult = await coordinatorFn('user123', false, true, true); // multiple failures
      if (fallbackResult && fallbackResult.user) {
        score += 15;
        feedback.push('✅ Implements fallback mechanisms');
      }

      return {
        passed: score >= 70,
        score,
        feedback
      };

    } catch (error) {
      feedback.push(`❌ Implementation error: ${error.message}`);
      return { passed: false, score: 0, feedback };
    }
  }
);

// Exercise 4: Retry with Exponential Backoff
framework.registerExercise(
  'retryWithBackoff',
  'Implement a retry function with exponential backoff for transient failures',
  async (retryFn) => {
    const feedback = [];
    let score = 0;

    try {
      let attempts = 0;
      const startTime = performance.now();
      
      // Test successful retry
      const result = await retryFn(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error(`Attempt ${attempts} failed`);
          }
          return `Success on attempt ${attempts}`;
        },
        { maxAttempts: 5, baseDelay: 100 }
      );

      const executionTime = performance.now() - startTime;

      if (result.includes('Success')) {
        score += 30;
        feedback.push('✅ Successfully retries failing operations');
      }

      if (attempts === 3) {
        score += 20;
        feedback.push('✅ Correct number of retry attempts');
      }

      // Check exponential backoff timing (should be > 100 + 200 = 300ms)
      if (executionTime > 300) {
        score += 25;
        feedback.push('✅ Implements proper exponential backoff delay');
      } else {
        feedback.push('⚠️  Retry delays seem too short for exponential backoff');
      }

      // Test max attempts limit
      attempts = 0;
      try {
        await retryFn(
          async () => {
            attempts++;
            throw new Error(`Always fails - attempt ${attempts}`);
          },
          { maxAttempts: 3, baseDelay: 50 }
        );
        feedback.push('❌ Should throw error when max attempts exceeded');
      } catch (error) {
        if (attempts === 3) {
          score += 25;
          feedback.push('✅ Respects maximum attempts limit');
        }
      }

      return {
        passed: score >= 70,
        score,
        feedback
      };

    } catch (error) {
      feedback.push(`❌ Implementation error: ${error.message}`);
      return { passed: false, score: 0, feedback };
    }
  }
);

// Sample student solutions (for testing purposes)
const sampleSolutions = {
  // Exercise 1: Parallel Service Calls
  parallelServiceCalls: async (userId, productIds, forceErrors = false) => {
    const startTime = performance.now();
    
    const servicePromises = [
      MockServiceCluster.userService(userId, forceErrors),
      MockServiceCluster.orderService(userId, forceErrors),
      MockServiceCluster.inventoryService(productIds, forceErrors)
    ];

    try {
      const [user, orders, inventory] = await Promise.all(servicePromises);
      const executionTime = performance.now() - startTime;
      
      return {
        user,
        orders,
        inventory,
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Service coordination failed: ${error.message}`);
    }
  },

  // Exercise 2: Circuit Breaker Implementation
  circuitBreaker: class SimpleCircuitBreaker {
    constructor(options = {}) {
      this.threshold = options.threshold || 5;
      this.timeout = options.timeout || 60000;
      this.failures = 0;
      this.state = 'CLOSED';
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

    getState() {
      return this.state;
    }
  },

  // Exercise 3: Graceful Degradation
  gracefulDegradation: async (userId, userFail, orderFail, inventoryFail) => {
    const results = {};
    const errors = [];

    // Critical service - must succeed
    try {
      results.user = await MockServiceCluster.userService(userId, userFail);
    } catch (error) {
      throw new Error(`Critical service failure: ${error.message}`);
    }

    // Non-critical services - graceful degradation
    try {
      results.orders = await MockServiceCluster.orderService(userId, orderFail);
    } catch (error) {
      results.orders = { error: error.message, fallback: true };
      errors.push(`Orders: ${error.message}`);
    }

    try {
      results.inventory = await MockServiceCluster.inventoryService(['prod-1'], inventoryFail);
    } catch (error) {
      results.inventory = { error: error.message, fallback: [] };
      errors.push(`Inventory: ${error.message}`);
    }

    if (errors.length > 0) {
      results.degradations = errors;
    }

    return results;
  },

  // Exercise 4: Retry with Exponential Backoff
  retryWithBackoff: async (operation, options = {}) => {
    const maxAttempts = options.maxAttempts || 3;
    const baseDelay = options.baseDelay || 1000;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
};

// Test runner
async function runExercises() {
  console.log('🎓 Week 2: Service Coordination Exercises');
  console.log('Students should implement the following functions:');
  console.log('- parallelServiceCalls(userId, productIds, forceErrors)');
  console.log('- circuitBreaker class with execute() method');
  console.log('- gracefulDegradation(userId, userFail, orderFail, inventoryFail)');
  console.log('- retryWithBackoff(operation, options)');
  
  // Run with sample solutions
  const results = await framework.runAllExercises(sampleSolutions);
  
  return results;
}

// Run exercises if this file is executed directly
if (require.main === module) {
  runExercises()
    .then(() => {
      console.log('\n🎯 Exercise session completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Exercise session failed:', error);
      process.exit(1);
    });
}

module.exports = {
  ExerciseFramework,
  MockServiceCluster,
  sampleSolutions,
  runExercises
};