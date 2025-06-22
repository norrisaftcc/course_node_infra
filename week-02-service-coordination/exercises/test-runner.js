/**
 * Week 2: Test Runner for Service Coordination Exercises
 * 
 * Automated test runner that validates student implementations
 * and provides detailed feedback on service coordination patterns.
 */

const { runExercises } = require('./coordination-exercise');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = [];
    this.startTime = null;
  }

  async runTests() {
    console.log('🧪 Starting Week 2 Service Coordination Test Suite');
    console.log('='.repeat(80));
    
    this.startTime = performance.now();

    try {
      // Run exercise tests
      console.log('📚 Running student exercises...');
      const exerciseResults = await runExercises();
      
      this.testResults.push({
        category: 'exercises',
        results: exerciseResults,
        passed: exerciseResults.every(r => r.passed),
        totalScore: exerciseResults.reduce((sum, r) => sum + r.score, 0) / exerciseResults.length
      });

      // Run integration tests
      console.log('\n🔗 Running integration tests...');
      const integrationResults = await this.runIntegrationTests();
      
      this.testResults.push({
        category: 'integration',
        results: integrationResults,
        passed: integrationResults.passed,
        totalScore: integrationResults.score
      });

      // Run performance tests
      console.log('\n⚡ Running performance tests...');
      const performanceResults = await this.runPerformanceTests();
      
      this.testResults.push({
        category: 'performance',
        results: performanceResults,
        passed: performanceResults.passed,
        totalScore: performanceResults.score
      });

      // Generate final report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  async runIntegrationTests() {
    console.log('🔧 Testing component integration...');
    
    const tests = [];
    
    try {
      // Test 1: Coordination Server Endpoints
      const coordinationTest = await this.testCoordinationServerEndpoints();
      tests.push({
        name: 'coordination-server-endpoints',
        passed: coordinationTest.passed,
        score: coordinationTest.score,
        feedback: coordinationTest.feedback
      });

      // Test 2: Multi-Service Demo Components
      const multiServiceTest = await this.testMultiServiceComponents();
      tests.push({
        name: 'multi-service-components',
        passed: multiServiceTest.passed,
        score: multiServiceTest.score,
        feedback: multiServiceTest.feedback
      });

      // Test 3: Error Handling Integration
      const errorHandlingTest = await this.testErrorHandlingIntegration();
      tests.push({
        name: 'error-handling-integration',
        passed: errorHandlingTest.passed,
        score: errorHandlingTest.score,
        feedback: errorHandlingTest.feedback
      });

      const totalScore = tests.reduce((sum, test) => sum + test.score, 0) / tests.length;
      const allPassed = tests.every(test => test.passed);

      return {
        passed: allPassed,
        score: totalScore,
        tests
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        error: error.message,
        tests
      };
    }
  }

  async testCoordinationServerEndpoints() {
    try {
      const { app, serviceRegistry, CircuitBreaker } = require('../sample-code/coordination-server');
      
      let score = 0;
      const feedback = [];

      // Test CircuitBreaker class
      if (CircuitBreaker) {
        const breaker = new CircuitBreaker();
        if (typeof breaker.execute === 'function') {
          score += 25;
          feedback.push('✅ CircuitBreaker class properly exported');
        }
      } else {
        feedback.push('❌ CircuitBreaker class not exported');
      }

      // Test ServiceRegistry
      if (serviceRegistry && typeof serviceRegistry.callService === 'function') {
        score += 25;
        feedback.push('✅ ServiceRegistry properly implemented');
      } else {
        feedback.push('❌ ServiceRegistry not properly implemented');
      }

      // Test Express app structure
      if (app && app._router) {
        score += 25;
        feedback.push('✅ Express app properly configured');
      } else {
        feedback.push('❌ Express app not properly configured');
      }

      // Test middleware setup
      const middlewareCount = app._router ? app._router.stack?.length || 0 : 0;
      if (middlewareCount > 3) {
        score += 25;
        feedback.push('✅ Proper middleware setup detected');
      } else {
        feedback.push('⚠️  Limited middleware setup detected');
      }

      return {
        passed: score >= 75,
        score,
        feedback
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        feedback: [`❌ Failed to load coordination server: ${error.message}`]
      };
    }
  }

  async testMultiServiceComponents() {
    try {
      const { 
        AdvancedCircuitBreaker, 
        ServiceCluster, 
        CoordinationPatterns 
      } = require('../sample-code/multi-service-demo');
      
      let score = 0;
      const feedback = [];

      // Test AdvancedCircuitBreaker
      if (AdvancedCircuitBreaker) {
        const breaker = new AdvancedCircuitBreaker('test');
        if (typeof breaker.execute === 'function' && typeof breaker.getMetrics === 'function') {
          score += 30;
          feedback.push('✅ AdvancedCircuitBreaker properly implemented');
        }
      } else {
        feedback.push('❌ AdvancedCircuitBreaker not exported');
      }

      // Test ServiceCluster
      if (ServiceCluster) {
        const cluster = new ServiceCluster();
        if (typeof cluster.getUserData === 'function' && typeof cluster.getAllMetrics === 'function') {
          score += 35;
          feedback.push('✅ ServiceCluster properly implemented');
        }
      } else {
        feedback.push('❌ ServiceCluster not exported');
      }

      // Test CoordinationPatterns
      if (CoordinationPatterns) {
        const patterns = new CoordinationPatterns(new ServiceCluster());
        if (typeof patterns.sequentialOrderProcessing === 'function') {
          score += 35;
          feedback.push('✅ CoordinationPatterns properly implemented');
        }
      } else {
        feedback.push('❌ CoordinationPatterns not exported');
      }

      return {
        passed: score >= 75,
        score,
        feedback
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        feedback: [`❌ Failed to load multi-service demo: ${error.message}`]
      };
    }
  }

  async testErrorHandlingIntegration() {
    try {
      const { 
        ServiceError, 
        RetryStrategy, 
        ServiceHealthMonitor 
      } = require('../sample-code/error-handling');
      
      let score = 0;
      const feedback = [];

      // Test ServiceError
      if (ServiceError && ServiceError.types) {
        const error = ServiceError.create('TIMEOUT', 'Test timeout', 'test-service');
        if (error.type === 'TIMEOUT' && error.service === 'test-service') {
          score += 30;
          feedback.push('✅ ServiceError class properly implemented');
        }
      } else {
        feedback.push('❌ ServiceError class not properly exported');
      }

      // Test RetryStrategy
      if (RetryStrategy) {
        const retry = new RetryStrategy({ maxAttempts: 2 });
        if (typeof retry.execute === 'function') {
          score += 35;
          feedback.push('✅ RetryStrategy properly implemented');
        }
      } else {
        feedback.push('❌ RetryStrategy not exported');
      }

      // Test ServiceHealthMonitor
      if (ServiceHealthMonitor) {
        const monitor = new ServiceHealthMonitor();
        if (typeof monitor.register === 'function' && typeof monitor.checkServiceHealth === 'function') {
          score += 35;
          feedback.push('✅ ServiceHealthMonitor properly implemented');
        }
      } else {
        feedback.push('❌ ServiceHealthMonitor not exported');
      }

      return {
        passed: score >= 75,
        score,
        feedback
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        feedback: [`❌ Failed to load error handling module: ${error.message}`]
      };
    }
  }

  async runPerformanceTests() {
    console.log('📊 Testing performance characteristics...');
    
    const { ServiceCluster, CoordinationPatterns } = require('../sample-code/multi-service-demo');
    
    try {
      const cluster = new ServiceCluster();
      const patterns = new CoordinationPatterns(cluster);
      
      const testCases = [
        { userId: 'perf-test-1', productIds: ['p1'], amount: 100 }
      ];
      
      let score = 0;
      const feedback = [];
      const results = {};

      // Test sequential performance
      const sequentialStart = performance.now();
      const sequentialResult = await patterns.sequentialOrderProcessing(
        testCases[0].userId, 
        testCases[0].productIds, 
        testCases[0].amount
      );
      const sequentialTime = performance.now() - sequentialStart;
      results.sequential = { time: sequentialTime, success: sequentialResult.success };

      // Test parallel performance
      const parallelStart = performance.now();
      const parallelResult = await patterns.parallelOrderProcessing(
        testCases[0].userId, 
        testCases[0].productIds, 
        testCases[0].amount
      );
      const parallelTime = performance.now() - parallelStart;
      results.parallel = { time: parallelTime, success: parallelResult.success };

      // Evaluate performance
      if (parallelTime < sequentialTime) {
        score += 40;
        feedback.push('✅ Parallel execution is faster than sequential');
      } else {
        feedback.push('⚠️  Parallel execution should be faster than sequential');
      }

      if (sequentialTime < 2000 && parallelTime < 1500) {
        score += 30;
        feedback.push('✅ Execution times are within acceptable limits');
      } else {
        feedback.push('⚠️  Execution times seem slow - consider optimization');
      }

      if (sequentialResult.success && parallelResult.success) {
        score += 30;
        feedback.push('✅ Both patterns execute successfully');
      } else {
        feedback.push('❌ Some coordination patterns failed during performance test');
      }

      return {
        passed: score >= 70,
        score,
        feedback,
        results
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        feedback: [`❌ Performance test failed: ${error.message}`]
      };
    }
  }

  async generateReport() {
    const totalTime = performance.now() - this.startTime;
    
    console.log('\n📋 FINAL TEST REPORT');
    console.log('='.repeat(80));
    
    let overallScore = 0;
    let totalTests = 0;
    let passedCategories = 0;

    this.testResults.forEach(category => {
      const status = category.passed ? '✅' : '❌';
      console.log(`${status} ${category.category.toUpperCase()}: ${category.totalScore.toFixed(1)}/100`);
      
      overallScore += category.totalScore;
      totalTests++;
      
      if (category.passed) {
        passedCategories++;
      }
    });

    const averageScore = totalTests > 0 ? (overallScore / totalTests) : 0;
    
    console.log(`\n🎯 OVERALL PERFORMANCE: ${passedCategories}/${totalTests} categories passed`);
    console.log(`📊 AVERAGE SCORE: ${averageScore.toFixed(1)}/100`);
    console.log(`⏱️  TOTAL EXECUTION TIME: ${totalTime.toFixed(2)}ms`);

    // Generate detailed report file
    const reportData = {
      timestamp: new Date().toISOString(),
      totalExecutionTime: totalTime,
      overallScore: averageScore,
      categoriesPassed: passedCategories,
      totalCategories: totalTests,
      results: this.testResults
    };

    try {
      const reportPath = path.join(__dirname, '..', 'test-results.json');
      await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`⚠️  Could not save detailed report: ${error.message}`);
    }

    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (averageScore >= 90) {
      console.log('🌟 Excellent! All components are working optimally.');
      console.log('📚 Ready to proceed to Week 3: Event-Driven Architecture.');
    } else if (averageScore >= 75) {
      console.log('👍 Good implementation! Consider these improvements:');
      console.log('  - Optimize service coordination performance');
      console.log('  - Enhance error handling coverage');
    } else if (averageScore >= 50) {
      console.log('📚 Implementation needs improvement:');
      console.log('  - Review circuit breaker patterns');
      console.log('  - Strengthen error handling strategies');
      console.log('  - Optimize parallel service execution');
    } else {
      console.log('🔧 Significant issues detected:');
      console.log('  - Review fundamental service coordination concepts');
      console.log('  - Ensure all components are properly implemented');
      console.log('  - Test individual components before integration');
    }

    return {
      overallScore: averageScore,
      passed: averageScore >= 70,
      executionTime: totalTime
    };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  
  runner.runTests()
    .then((result) => {
      console.log('\n🏁 Test suite completed!');
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = { TestRunner };