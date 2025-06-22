#!/usr/bin/env node

/**
 * 🏢 ALGOCRATIC FUTURES: WEEK 3 STUDENT EXERCISES
 * "Corporate Event-Driven Architecture Challenges"
 * 
 * 🎯 ASSESSMENT OBJECTIVE: Students must demonstrate mastery of:
 * - EventEmitter patterns for loose coupling
 * - Stream processing for large datasets
 * - Message queue patterns for distributed systems
 * - Error handling in event-driven architectures
 * 
 * 📚 PEDAGOGICAL NOTE: These exercises build on Week 1 async and Week 2
 * service coordination, adding event-driven patterns essential for
 * enterprise distributed systems.
 * 
 * ⚠️  COMMON STUDENT MISTAKES TO WATCH FOR:
 * - Memory leaks from unremoved event listeners
 * - Missing error handlers on EventEmitters
 * - Stream backpressure not handled properly
 * - Event handler execution order assumptions
 * - Forgetting to end streams or commit offsets
 */

const EventEmitter = require('events');
const { Transform, Readable, Writable } = require('stream');
const { performance } = require('perf_hooks');

/**
 * 🧪 EXERCISE TESTING FRAMEWORK
 * 
 * Provides automated validation of student event-driven implementations
 * with detailed feedback and performance metrics.
 */
class EventDrivenExerciseFramework {
  constructor() {
    this.exercises = new Map();
    this.results = [];
    this.totalScore = 0;
    this.maxScore = 0;
  }

  registerExercise(name, description, testFn, points = 20) {
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

    console.log(`\n🎯 EXERCISE: ${exercise.name}`);
    console.log(`📝 ${exercise.description}`);
    console.log('='.repeat(60));

    exercise.attempted = true;
    const startTime = performance.now();

    try {
      const result = await exercise.testFn(studentImplementation);
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
    console.log('🏢 ALGOCRATIC FUTURES: WEEK 3 EVENT-DRIVEN ARCHITECTURE ASSESSMENT');
    console.log('==================================================================');
    console.log('📚 Testing student mastery of EventEmitter, Streams, and Message Queues');
    console.log('');

    for (const [exerciseName] of this.exercises) {
      const solution = studentSolutions[exerciseName];
      if (solution) {
        await this.runExercise(exerciseName, solution);
      } else {
        console.log(`\n⚠️  EXERCISE: ${exerciseName}`);
        console.log('❌ No solution provided');
        console.log('📊 Score: 0/20 points');
      }
    }

    this.generateFinalReport();
    return this.results;
  }

  generateFinalReport() {
    const percentage = (this.totalScore / this.maxScore * 100).toFixed(1);
    
    console.log('\n📊 FINAL ASSESSMENT REPORT');
    console.log('==========================');
    console.log(`🏆 Total Score: ${this.totalScore}/${this.maxScore} (${percentage}%)`);
    
    let grade;
    if (percentage >= 90) grade = 'A (Outstanding)';
    else if (percentage >= 80) grade = 'B (Good)';
    else if (percentage >= 70) grade = 'C (Satisfactory)';
    else if (percentage >= 60) grade = 'D (Needs Improvement)';
    else grade = 'F (Not Passing)';
    
    console.log(`📝 Grade: ${grade}`);
    
    console.log('\n📋 Exercise Breakdown:');
    for (const [name, exercise] of this.exercises) {
      const status = exercise.passed ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${exercise.score}/${exercise.points} (${exercise.executionTime.toFixed(0)}ms)`);
    }
    
    console.log('\n🎓 READINESS FOR WEEK 4:');
    if (percentage >= 75) {
      console.log('✅ Student demonstrates strong event-driven architecture understanding');
      console.log('✅ Ready to proceed to Week 4: Real-time Systems & WebSockets');
    } else {
      console.log('⚠️  Student should review event-driven patterns before proceeding');
      console.log('📚 Recommended review: EventEmitter docs, Stream backpressure handling');
    }
  }
}

// 🧪 EXERCISE DEFINITIONS

/**
 * EXERCISE 1: Corporate Event Coordination System
 * Students must build an EventEmitter-based system that coordinates
 * multiple corporate departments without tight coupling.
 */
async function testEventCoordinationSystem(StudentEventSystem) {
  const feedback = [];
  let partialCredit = 0;
  
  try {
    // Test 1: Basic EventEmitter functionality
    const system = new StudentEventSystem();
    
    if (!(system instanceof EventEmitter)) {
      return {
        passed: false,
        feedback: ['System must extend EventEmitter']
      };
    }
    partialCredit += 5;
    
    // Test 2: Event emission and handling
    let eventReceived = false;
    let eventData = null;
    
    system.on('department:notification', (data) => {
      eventReceived = true;
      eventData = data;
    });
    
    system.emit('department:notification', { message: 'Test notification', department: 'HR' });
    
    if (!eventReceived) {
      return {
        passed: false,
        partialCredit,
        feedback: ['Events not properly emitted or handled']
      };
    }
    partialCredit += 5;
    
    // Test 3: Multiple event listeners
    let secondListenerCalled = false;
    system.on('department:notification', () => {
      secondListenerCalled = true;
    });
    
    system.emit('department:notification', { message: 'Second test' });
    
    if (!secondListenerCalled) {
      feedback.push('Multiple listeners should be supported');
    } else {
      partialCredit += 5;
    }
    
    // Test 4: Error handling
    let errorHandled = false;
    system.on('error', (error) => {
      errorHandled = true;
    });
    
    // Trigger an error condition
    if (typeof system.triggerError === 'function') {
      system.triggerError();
      if (errorHandled) {
        partialCredit += 3;
      } else {
        feedback.push('Error events should be emitted for error conditions');
      }
    }
    
    // Test 5: Memory leak prevention
    const initialListenerCount = system.listenerCount('test:event');
    for (let i = 0; i < 100; i++) {
      const handler = () => {};
      system.on('test:event', handler);
      system.removeListener('test:event', handler);
    }
    const finalListenerCount = system.listenerCount('test:event');
    
    if (finalListenerCount === initialListenerCount) {
      partialCredit += 2;
    } else {
      feedback.push('Ensure proper cleanup of event listeners to prevent memory leaks');
    }
    
    return {
      passed: partialCredit >= 18,
      partialCredit,
      feedback
    };
    
  } catch (error) {
    return {
      passed: false,
      partialCredit,
      feedback: [`Implementation error: ${error.message}`]
    };
  }
}

/**
 * EXERCISE 2: Corporate Data Processing Pipeline
 * Students must create a Transform stream that processes corporate
 * productivity data efficiently with proper backpressure handling.
 */
async function testDataProcessingPipeline(StudentDataProcessor) {
  const feedback = [];
  let partialCredit = 0;
  
  try {
    // Test 1: Basic Transform stream functionality
    const processor = new StudentDataProcessor();
    
    if (!(processor instanceof Transform)) {
      return {
        passed: false,
        feedback: ['Processor must extend Transform stream']
      };
    }
    partialCredit += 5;
    
    // Test 2: Data transformation
    return new Promise((resolve) => {
      const testData = [
        { id: 1, department: 'Engineering', productivity: 85 },
        { id: 2, department: 'Sales', productivity: 92 },
        { id: 3, department: 'Marketing', productivity: 78 }
      ];
      
      const results = [];
      
      processor.on('data', (chunk) => {
        results.push(chunk);
      });
      
      processor.on('end', () => {
        // Validate transformation
        if (results.length === 0) {
          resolve({
            passed: false,
            partialCredit,
            feedback: ['No data was transformed']
          });
          return;
        }
        partialCredit += 5;
        
        // Check if data was enriched/validated
        const firstResult = results[0];
        if (Array.isArray(firstResult)) {
          // Handle batch processing
          const firstItem = firstResult[0];
          if (firstItem && typeof firstItem === 'object' && firstItem.id) {
            partialCredit += 5;
            
            // Check for data enrichment
            if (firstItem.hasOwnProperty('processed') || firstItem.hasOwnProperty('enriched')) {
              partialCredit += 3;
            } else {
              feedback.push('Consider enriching data with additional computed fields');
            }
          }
        } else if (typeof firstResult === 'object' && firstResult.id) {
          partialCredit += 5;
        }
        
        // Test error handling within transform
        if (typeof processor.handleError === 'function') {
          partialCredit += 2;
        } else {
          feedback.push('Implement error handling for malformed data');
        }
        
        resolve({
          passed: partialCredit >= 15,
          partialCredit,
          feedback
        });
      });
      
      processor.on('error', (error) => {
        resolve({
          passed: false,
          partialCredit,
          feedback: [`Stream error: ${error.message}`]
        });
      });
      
      // Send test data
      for (const item of testData) {
        processor.write(item);
      }
      processor.end();
    });
    
  } catch (error) {
    return {
      passed: false,
      partialCredit,
      feedback: [`Implementation error: ${error.message}`]
    };
  }
}

/**
 * EXERCISE 3: Corporate Message Queue Implementation
 * Students must implement a message queue system that demonstrates
 * producer/consumer patterns with proper message handling.
 */
async function testMessageQueueSystem(StudentMessageQueue) {
  const feedback = [];
  let partialCredit = 0;
  
  try {
    // Test 1: Basic queue functionality
    const queue = new StudentMessageQueue();
    partialCredit += 3;
    
    // Test 2: Message publishing
    if (typeof queue.publish !== 'function') {
      return {
        passed: false,
        partialCredit,
        feedback: ['Queue must have publish() method']
      };
    }
    
    await queue.publish('test-topic', { message: 'Hello Corporate World' });
    partialCredit += 4;
    
    // Test 3: Message consumption
    if (typeof queue.subscribe !== 'function') {
      return {
        passed: false,
        partialCredit,
        feedback: ['Queue must have subscribe() method']
      };
    }
    
    let messageReceived = false;
    let receivedMessage = null;
    
    await queue.subscribe('test-topic', (message) => {
      messageReceived = true;
      receivedMessage = message;
    });
    
    await queue.publish('test-topic', { message: 'Test message' });
    
    // Allow some time for message processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (messageReceived) {
      partialCredit += 5;
    } else {
      feedback.push('Messages not properly delivered to subscribers');
    }
    
    // Test 4: Multiple subscribers
    let secondSubscriberCalled = false;
    await queue.subscribe('test-topic', () => {
      secondSubscriberCalled = true;
    });
    
    await queue.publish('test-topic', { message: 'Broadcast test' });
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (secondSubscriberCalled) {
      partialCredit += 3;
    } else {
      feedback.push('Multiple subscribers should receive the same message');
    }
    
    // Test 5: Error handling
    if (typeof queue.handleError === 'function') {
      partialCredit += 2;
    } else {
      feedback.push('Implement error handling for failed message processing');
    }
    
    // Test 6: Message persistence (optional)
    if (typeof queue.getQueueStats === 'function') {
      const stats = queue.getQueueStats();
      if (stats && typeof stats.messageCount === 'number') {
        partialCredit += 3;
        feedback.push('Excellent: Queue statistics implemented');
      }
    }
    
    return {
      passed: partialCredit >= 15,
      partialCredit,
      feedback
    };
    
  } catch (error) {
    return {
      passed: false,
      partialCredit,
      feedback: [`Implementation error: ${error.message}`]
    };
  }
}

/**
 * EXERCISE 4: Integrated Event-Driven System
 * Students must combine EventEmitter, Streams, and Message Queues
 * to create a cohesive corporate communication system.
 */
async function testIntegratedEventSystem(StudentIntegratedSystem) {
  const feedback = [];
  let partialCredit = 0;
  
  try {
    const system = new StudentIntegratedSystem();
    partialCredit += 5;
    
    // Test 1: System integration
    if (typeof system.processWorkflow !== 'function') {
      return {
        passed: false,
        partialCredit,
        feedback: ['System must have processWorkflow() method']
      };
    }
    
    // Test 2: Event-driven workflow
    let workflowCompleted = false;
    const workflowSteps = [];
    
    if (system instanceof EventEmitter) {
      system.on('workflow:step', (step) => {
        workflowSteps.push(step);
      });
      
      system.on('workflow:completed', () => {
        workflowCompleted = true;
      });
      
      partialCredit += 3;
    }
    
    // Test 3: Execute workflow
    const workflowData = {
      type: 'employee-onboarding',
      employeeId: 'emp-001',
      department: 'Engineering'
    };
    
    await system.processWorkflow(workflowData);
    
    // Allow time for async processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (workflowSteps.length > 0) {
      partialCredit += 4;
      feedback.push(`Workflow emitted ${workflowSteps.length} step events`);
    }
    
    if (workflowCompleted) {
      partialCredit += 4;
      feedback.push('Workflow completion event properly emitted');
    }
    
    // Test 4: Error resilience
    try {
      await system.processWorkflow({ invalid: 'data' });
      partialCredit += 2;
    } catch (error) {
      // Error handling is acceptable too
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        partialCredit += 2;
        feedback.push('Good: Input validation implemented');
      }
    }
    
    // Test 5: Performance under load
    const startTime = performance.now();
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(system.processWorkflow({
        type: 'bulk-test',
        id: i
      }));
    }
    
    await Promise.all(promises);
    const endTime = performance.now();
    
    const processingTime = endTime - startTime;
    if (processingTime < 1000) { // Less than 1 second for 10 workflows
      partialCredit += 2;
      feedback.push(`Good performance: ${processingTime.toFixed(0)}ms for 10 workflows`);
    } else {
      feedback.push('Consider optimizing workflow processing performance');
    }
    
    return {
      passed: partialCredit >= 16,
      partialCredit,
      feedback
    };
    
  } catch (error) {
    return {
      passed: false,
      partialCredit,
      feedback: [`Implementation error: ${error.message}`]
    };
  }
}

// 🏗️ SETUP EXERCISE FRAMEWORK
function setupExercises() {
  const framework = new EventDrivenExerciseFramework();
  
  framework.registerExercise(
    'event-coordination-system',
    'Build an EventEmitter-based corporate coordination system',
    testEventCoordinationSystem,
    20
  );
  
  framework.registerExercise(
    'data-processing-pipeline',
    'Create a Transform stream for processing corporate productivity data',
    testDataProcessingPipeline,
    20
  );
  
  framework.registerExercise(
    'message-queue-system',
    'Implement a message queue with producer/consumer patterns',
    testMessageQueueSystem,
    20
  );
  
  framework.registerExercise(
    'integrated-event-system',
    'Combine EventEmitter, Streams, and Queues into unified workflow system',
    testIntegratedEventSystem,
    20
  );
  
  return framework;
}

// 📚 EXAMPLE STUDENT SOLUTIONS (for testing framework)
class ExampleEventCoordinationSystem extends EventEmitter {
  constructor() {
    super();
    this.departments = new Map();
  }
  
  triggerError() {
    this.emit('error', new Error('Simulated corporate communication breakdown'));
  }
}

class ExampleDataProcessor extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  
  _transform(chunk, encoding, callback) {
    try {
      const enriched = {
        ...chunk,
        processed: true,
        processedAt: new Date().toISOString(),
        efficiency: chunk.productivity > 90 ? 'High' : chunk.productivity > 75 ? 'Medium' : 'Low'
      };
      callback(null, enriched);
    } catch (error) {
      this.handleError(error);
      callback();
    }
  }
  
  handleError(error) {
    console.error('Data processing error:', error.message);
  }
}

class ExampleMessageQueue {
  constructor() {
    this.topics = new Map();
    this.subscribers = new Map();
    this.messageCount = 0;
  }
  
  async publish(topic, message) {
    this.messageCount++;
    
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }
    
    this.topics.get(topic).push(message);
    
    // Notify subscribers
    const subscribers = this.subscribers.get(topic) || [];
    for (const subscriber of subscribers) {
      try {
        await subscriber(message);
      } catch (error) {
        this.handleError(error);
      }
    }
  }
  
  async subscribe(topic, handler) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic).push(handler);
  }
  
  handleError(error) {
    console.error('Message processing error:', error.message);
  }
  
  getQueueStats() {
    return {
      messageCount: this.messageCount,
      topicCount: this.topics.size,
      subscriberCount: Array.from(this.subscribers.values()).reduce((sum, subs) => sum + subs.length, 0)
    };
  }
}

class ExampleIntegratedSystem extends EventEmitter {
  constructor() {
    super();
    this.messageQueue = new ExampleMessageQueue();
    this.processor = new ExampleDataProcessor();
  }
  
  async processWorkflow(workflowData) {
    if (!workflowData || !workflowData.type) {
      throw new Error('Invalid workflow data: type is required');
    }
    
    this.emit('workflow:step', { step: 'validation', data: workflowData });
    
    // Simulate processing steps
    const steps = ['initialize', 'process', 'validate', 'complete'];
    
    for (const step of steps) {
      this.emit('workflow:step', { step, workflowId: workflowData.id || 'unknown' });
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
    }
    
    this.emit('workflow:completed', { workflowData });
  }
}

// 🚀 RUN DEMONSTRATION WITH EXAMPLE SOLUTIONS
async function demonstrateExerciseFramework() {
  console.log('🧪 WEEK 3 EXERCISE FRAMEWORK DEMONSTRATION');
  console.log('==========================================');
  console.log('📚 Testing with example solutions to validate framework...');
  console.log('');
  
  const framework = setupExercises();
  
  const exampleSolutions = {
    'event-coordination-system': ExampleEventCoordinationSystem,
    'data-processing-pipeline': ExampleDataProcessor,
    'message-queue-system': ExampleMessageQueue,
    'integrated-event-system': ExampleIntegratedSystem
  };
  
  await framework.runAllExercises(exampleSolutions);
  
  console.log('\n📋 EXERCISE FRAMEWORK READY FOR STUDENT SUBMISSIONS!');
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
  EventDrivenExerciseFramework,
  setupExercises,
  // Export test functions for individual use
  testEventCoordinationSystem,
  testDataProcessingPipeline,
  testMessageQueueSystem,
  testIntegratedEventSystem
};