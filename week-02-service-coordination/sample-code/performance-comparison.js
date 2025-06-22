/**
 * Week 2: Performance Comparison Script
 * 
 * Benchmarks different service coordination patterns to demonstrate
 * the performance benefits of parallel vs sequential execution
 */

const { performance } = require('perf_hooks');
const { ServiceCluster, CoordinationPatterns } = require('./multi-service-demo');

class PerformanceBenchmark {
  constructor() {
    this.serviceCluster = new ServiceCluster();
    this.coordinationPatterns = new CoordinationPatterns(this.serviceCluster);
    this.results = [];
  }

  async runBenchmark(iterations = 10) {
    console.log('🏃 Starting Performance Benchmark');
    console.log(`📊 Running ${iterations} iterations of each pattern`);
    console.log('='.repeat(80));

    const testCases = [
      { userId: 'bench-001', productIds: ['p1', 'p2'], amount: 150.00 },
      { userId: 'bench-002', productIds: ['p3'], amount: 75.50 },
      { userId: 'bench-003', productIds: ['p1', 'p2', 'p3'], amount: 299.99 }
    ];

    for (let i = 0; i < iterations; i++) {
      console.log(`\n🔄 Iteration ${i + 1}/${iterations}`);
      
      for (const testCase of testCases) {
        const iterationResults = await this.benchmarkTestCase(testCase, i);
        this.results.push(iterationResults);
      }

      // Small delay between iterations
      await this.delay(500);
    }

    this.generateReport();
  }

  async benchmarkTestCase(testCase, iteration) {
    const { userId, productIds, amount } = testCase;
    
    console.log(`  📦 Testing User: ${userId}, Products: [${productIds.join(', ')}], Amount: $${amount}`);
    
    const results = {
      iteration,
      testCase,
      sequential: null,
      parallel: null,
      pipeline: null,
      timestamp: new Date().toISOString()
    };

    try {
      // Sequential execution
      const sequentialStart = performance.now();
      const sequentialResult = await this.coordinationPatterns.sequentialOrderProcessing(userId, productIds, amount);
      const sequentialTime = performance.now() - sequentialStart;
      
      results.sequential = {
        executionTime: sequentialTime,
        success: sequentialResult.success,
        pattern: 'sequential'
      };

      // Wait between tests
      await this.delay(200);

      // Parallel execution
      const parallelStart = performance.now();
      const parallelResult = await this.coordinationPatterns.parallelOrderProcessing(userId, productIds, amount);
      const parallelTime = performance.now() - parallelStart;
      
      results.parallel = {
        executionTime: parallelTime,
        success: parallelResult.success,
        pattern: 'parallel'
      };

      // Wait between tests
      await this.delay(200);

      // Pipeline execution
      const pipelineStart = performance.now();
      const pipelineResult = await this.coordinationPatterns.pipelineOrderProcessing(userId, productIds, amount);
      const pipelineTime = performance.now() - pipelineStart;
      
      results.pipeline = {
        executionTime: pipelineTime,
        success: pipelineResult.success,
        pattern: 'pipeline',
        degradations: pipelineResult.degradations
      };

      // Calculate performance improvements
      const speedupParallel = sequentialTime / parallelTime;
      const speedupPipeline = sequentialTime / pipelineTime;

      console.log(`    📈 Sequential: ${sequentialTime.toFixed(2)}ms (${sequentialResult.success ? '✅' : '❌'})`);
      console.log(`    ⚡ Parallel: ${parallelTime.toFixed(2)}ms (${parallelResult.success ? '✅' : '❌'}) - ${speedupParallel.toFixed(2)}x faster`);
      console.log(`    🔗 Pipeline: ${pipelineTime.toFixed(2)}ms (${pipelineResult.success ? '✅' : '❌'}) - ${speedupPipeline.toFixed(2)}x faster`);

      results.performance = {
        parallelSpeedup: speedupParallel,
        pipelineSpeedup: speedupPipeline,
        parallelImprovement: ((sequentialTime - parallelTime) / sequentialTime * 100).toFixed(1),
        pipelineImprovement: ((sequentialTime - pipelineTime) / sequentialTime * 100).toFixed(1)
      };

    } catch (error) {
      console.error(`    ❌ Benchmark failed: ${error.message}`);
      results.error = error.message;
    }

    return results;
  }

  generateReport() {
    console.log('\n📊 PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(80));

    const validResults = this.results.filter(r => !r.error && r.sequential && r.parallel && r.pipeline);
    
    if (validResults.length === 0) {
      console.log('❌ No valid results to analyze');
      return;
    }

    // Calculate averages
    const avgSequential = this.calculateAverage(validResults, 'sequential');
    const avgParallel = this.calculateAverage(validResults, 'parallel');
    const avgPipeline = this.calculateAverage(validResults, 'pipeline');

    console.log('\n🎯 AVERAGE EXECUTION TIMES:');
    console.log(`  Sequential: ${avgSequential.toFixed(2)}ms`);
    console.log(`  Parallel:   ${avgParallel.toFixed(2)}ms`);
    console.log(`  Pipeline:   ${avgPipeline.toFixed(2)}ms`);

    // Calculate performance improvements
    const parallelSpeedup = avgSequential / avgParallel;
    const pipelineSpeedup = avgSequential / avgPipeline;
    const parallelImprovement = ((avgSequential - avgParallel) / avgSequential * 100);
    const pipelineImprovement = ((avgSequential - avgPipeline) / avgSequential * 100);

    console.log('\n⚡ PERFORMANCE IMPROVEMENTS:');
    console.log(`  Parallel vs Sequential: ${parallelSpeedup.toFixed(2)}x faster (${parallelImprovement.toFixed(1)}% improvement)`);
    console.log(`  Pipeline vs Sequential: ${pipelineSpeedup.toFixed(2)}x faster (${pipelineImprovement.toFixed(1)}% improvement)`);

    // Success rates
    const successRates = this.calculateSuccessRates(validResults);
    console.log('\n✅ SUCCESS RATES:');
    console.log(`  Sequential: ${successRates.sequential.toFixed(1)}%`);
    console.log(`  Parallel:   ${successRates.parallel.toFixed(1)}%`);
    console.log(`  Pipeline:   ${successRates.pipeline.toFixed(1)}%`);

    // Performance distribution
    console.log('\n📈 PERFORMANCE DISTRIBUTION:');
    this.printPerformanceDistribution(validResults);

    // Circuit breaker metrics
    console.log('\n🔧 CIRCUIT BREAKER METRICS:');
    const metrics = this.serviceCluster.getAllMetrics();
    Object.entries(metrics).forEach(([serviceName, metric]) => {
      const successRate = metric.totalRequests > 0 
        ? ((metric.totalSuccesses / metric.totalRequests) * 100).toFixed(1)
        : 0;
      console.log(`  ${serviceName}: ${metric.state} (${successRate}% success, ${metric.totalRequests} requests)`);
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (parallelSpeedup > 1.5) {
      console.log('  ✅ Parallel execution shows significant performance benefits');
    } else {
      console.log('  ⚠️  Parallel execution benefits are limited - check for bottlenecks');
    }

    if (pipelineSpeedup > 1.2) {
      console.log('  ✅ Pipeline execution provides good graceful degradation');
    } else {
      console.log('  ⚠️  Pipeline execution may need optimization');
    }

    if (successRates.parallel > 90 && successRates.pipeline > 90) {
      console.log('  ✅ High reliability across all patterns');
    } else {
      console.log('  ⚠️  Consider improving error handling and resilience');
    }

    return {
      averages: { sequential: avgSequential, parallel: avgParallel, pipeline: avgPipeline },
      improvements: { parallelSpeedup, pipelineSpeedup, parallelImprovement, pipelineImprovement },
      successRates,
      totalTests: validResults.length,
      circuitBreakerMetrics: metrics
    };
  }

  calculateAverage(results, pattern) {
    const times = results.map(r => r[pattern].executionTime);
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  calculateSuccessRates(results) {
    const patterns = ['sequential', 'parallel', 'pipeline'];
    const rates = {};

    patterns.forEach(pattern => {
      const successCount = results.filter(r => r[pattern].success).length;
      rates[pattern] = (successCount / results.length) * 100;
    });

    return rates;
  }

  printPerformanceDistribution(results) {
    const patterns = ['sequential', 'parallel', 'pipeline'];
    
    patterns.forEach(pattern => {
      const times = results.map(r => r[pattern].executionTime).sort((a, b) => a - b);
      const p50 = times[Math.floor(times.length * 0.5)];
      const p95 = times[Math.floor(times.length * 0.95)];
      const p99 = times[Math.floor(times.length * 0.99)];
      
      console.log(`  ${pattern}: P50=${p50.toFixed(2)}ms, P95=${p95.toFixed(2)}ms, P99=${p99.toFixed(2)}ms`);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Load testing function
async function runLoadTest(concurrency = 5, duration = 10000) {
  console.log('\n🚀 LOAD TEST');
  console.log(`📊 Concurrency: ${concurrency}, Duration: ${duration}ms`);
  console.log('='.repeat(80));

  const serviceCluster = new ServiceCluster();
  const patterns = new CoordinationPatterns(serviceCluster);
  
  const startTime = performance.now();
  const endTime = startTime + duration;
  const results = [];
  
  const workers = Array.from({ length: concurrency }, async (_, workerId) => {
    let requestCount = 0;
    
    while (performance.now() < endTime) {
      try {
        const testCase = {
          userId: `load-${workerId}-${requestCount}`,
          productIds: ['p1', 'p2'],
          amount: 100 + Math.random() * 100
        };
        
        const requestStart = performance.now();
        const result = await patterns.parallelOrderProcessing(
          testCase.userId, 
          testCase.productIds, 
          testCase.amount
        );
        const requestTime = performance.now() - requestStart;
        
        results.push({
          workerId,
          requestCount,
          success: result.success,
          executionTime: requestTime,
          timestamp: performance.now() - startTime
        });
        
        requestCount++;
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        results.push({
          workerId,
          requestCount,
          success: false,
          error: error.message,
          timestamp: performance.now() - startTime
        });
      }
    }
    
    return requestCount;
  });
  
  const workerResults = await Promise.all(workers);
  const totalRequests = results.length;
  const successfulRequests = results.filter(r => r.success).length;
  const avgResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.executionTime, 0) / successfulRequests;
  
  const actualDuration = performance.now() - startTime;
  const requestsPerSecond = (totalRequests / actualDuration) * 1000;
  
  console.log('\n📈 LOAD TEST RESULTS:');
  console.log(`  Total Requests: ${totalRequests}`);
  console.log(`  Successful: ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`  Failed: ${totalRequests - successfulRequests}`);
  console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  Requests/Second: ${requestsPerSecond.toFixed(2)}`);
  console.log(`  Actual Duration: ${actualDuration.toFixed(2)}ms`);
  
  return {
    totalRequests,
    successfulRequests,
    failedRequests: totalRequests - successfulRequests,
    avgResponseTime,
    requestsPerSecond,
    duration: actualDuration
  };
}

// Main execution
async function main() {
  try {
    console.log('🎯 Week 2: Service Coordination Performance Analysis');
    console.log('='.repeat(80));
    
    // Run benchmark
    const benchmark = new PerformanceBenchmark();
    await benchmark.runBenchmark(5);
    
    // Run load test
    await runLoadTest(3, 5000);
    
    console.log('\n🏁 Performance analysis completed!');
    
  } catch (error) {
    console.error('❌ Performance analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { PerformanceBenchmark, runLoadTest };