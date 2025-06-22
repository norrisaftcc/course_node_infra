#!/usr/bin/env node

/**
 * 🏢 ALGOCRATIC FUTURES: WEEK 3 CORPORATE DATA PIPELINE ORCHESTRATION
 * "Enterprise Stream Processing: Handling Corporate Data at Scale"
 * 
 * 📊 CORPORATE DATA CHALLENGE: Moving beyond simple events to processing
 * continuous streams of corporate data - employee productivity metrics,
 * customer interactions, financial transactions, and system telemetry.
 * 
 * 🎯 PEDAGOGICAL PURPOSE: Students learn to handle data that's too large
 * for memory, process it efficiently using Node.js streams, and understand
 * backpressure management - critical skills for enterprise systems.
 * 
 * ⚠️  STUDENT GOTCHAS TO WATCH FOR:
 * - Stream backpressure (writing faster than processing)
 * - Forgetting to end streams properly
 * - Not handling stream errors
 * - Memory leaks from unclosed streams
 * - Pipeline order dependencies
 */

const { Transform, Readable, Writable, pipeline } = require('stream');
const { promisify } = require('util');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');

/**
 * 📊 CORPORATE PRODUCTIVITY DATA GENERATOR
 * 
 * Simulates continuous corporate data streams - employee activities,
 * system metrics, customer interactions. Demonstrates how to create
 * Readable streams for large datasets that don't fit in memory.
 */
class CorporateDataGenerator extends Readable {
  constructor(options = {}) {
    super({ objectMode: true });
    
    this.maxRecords = options.maxRecords || 10000;
    this.batchSize = options.batchSize || 50;
    this.currentRecord = 0;
    this.dataType = options.dataType || 'productivity';
    
    // 🏢 Corporate data simulation parameters
    this.departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
    this.activities = ['meeting', 'coding', 'review', 'planning', 'documentation', 'communication'];
    this.startTime = Date.now();
    
    console.log(`📊 CORPORATE DATA GENERATOR: Preparing to stream ${this.maxRecords} ${this.dataType} records`);
  }

  _read() {
    // 🎓 STUDENT LEARNING: Demonstrates how Readable streams work
    // _read() is called when the stream is ready for more data
    
    if (this.currentRecord >= this.maxRecords) {
      console.log('📋 Data generation complete - ending stream');
      this.push(null); // Signal end of stream
      return;
    }

    // 📦 Generate batch of corporate records
    const batch = [];
    const batchEnd = Math.min(this.currentRecord + this.batchSize, this.maxRecords);
    
    for (let i = this.currentRecord; i < batchEnd; i++) {
      batch.push(this.generateCorporateRecord(i));
    }
    
    this.currentRecord = batchEnd;
    
    // 🔄 CRITICAL: Students must understand when to push vs when stream is full
    const pushed = this.push(batch);
    
    if (!pushed) {
      // Stream's internal buffer is full - backpressure handling
      console.log(`⚠️  Backpressure detected at record ${this.currentRecord}`);
    }
    
    // 📈 Progress reporting for large datasets
    if (this.currentRecord % 1000 === 0) {
      const progress = (this.currentRecord / this.maxRecords * 100).toFixed(1);
      console.log(`📊 Generation progress: ${progress}% (${this.currentRecord}/${this.maxRecords})`);
    }
  }

  generateCorporateRecord(id) {
    const department = this.departments[Math.floor(Math.random() * this.departments.length)];
    const activity = this.activities[Math.floor(Math.random() * this.activities.length)];
    
    return {
      id,
      timestamp: new Date(this.startTime + id * 1000).toISOString(),
      employeeId: `emp-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      department,
      activity,
      productivityScore: Math.random() * 100,
      duration: Math.floor(Math.random() * 240) + 15, // 15-255 minutes
      metadata: {
        quarter: 'Q1-2024',
        location: Math.random() > 0.7 ? 'remote' : 'office',
        projectId: `proj-${Math.floor(Math.random() * 20) + 1}`,
        efficiency: Math.random() * 0.4 + 0.6 // 60-100%
      }
    };
  }
}

/**
 * 🔍 CORPORATE DATA VALIDATOR & ENRICHER
 * 
 * Transform stream that validates, filters, and enriches corporate data.
 * Demonstrates Transform streams and error handling in data pipelines.
 */
class CorporateDataProcessor extends Transform {
  constructor() {
    super({ objectMode: true });
    
    this.processingStats = {
      totalProcessed: 0,
      validRecords: 0,
      invalidRecords: 0,
      enrichedRecords: 0,
      processingErrors: 0
    };
    
    // 📊 Corporate validation rules
    this.validationRules = {
      requiredFields: ['id', 'timestamp', 'employeeId', 'department', 'activity'],
      productivityRange: [0, 100],
      durationRange: [1, 480], // 1 minute to 8 hours
      validDepartments: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations']
    };
    
    console.log('🔍 CORPORATE DATA PROCESSOR: Validation and enrichment pipeline ready');
  }

  _transform(batch, encoding, callback) {
    try {
      const processedBatch = [];
      
      for (const record of batch) {
        this.processingStats.totalProcessed++;
        
        // 🔍 Validate corporate record
        const validationResult = this.validateCorporateRecord(record);
        
        if (validationResult.isValid) {
          // ✅ Valid record - enrich with additional corporate data
          const enrichedRecord = this.enrichCorporateRecord(record);
          processedBatch.push(enrichedRecord);
          this.processingStats.validRecords++;
          this.processingStats.enrichedRecords++;
        } else {
          // ❌ Invalid record - log but don't block pipeline
          console.log(`⚠️  Invalid record ${record.id}: ${validationResult.errors.join(', ')}`);
          this.processingStats.invalidRecords++;
          
          // 🎓 STUDENT LEARNING: Decide whether to:
          // 1. Skip invalid records (current approach)
          // 2. Fix them if possible
          // 3. Send to error stream
          // 4. Halt processing
        }
      }
      
      // 📊 Progress reporting
      if (this.processingStats.totalProcessed % 500 === 0) {
        this.reportProcessingProgress();
      }
      
      callback(null, processedBatch);
      
    } catch (error) {
      // 🚨 CRITICAL: Proper error handling in streams
      this.processingStats.processingErrors++;
      console.error(`🚨 Processing error: ${error.message}`);
      
      // Don't break the pipeline - log error and continue
      callback(null, []); // Send empty batch to continue processing
    }
  }

  validateCorporateRecord(record) {
    const errors = [];
    
    // Check required fields
    for (const field of this.validationRules.requiredFields) {
      if (!record.hasOwnProperty(field) || record[field] === null || record[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate productivity score range
    if (typeof record.productivityScore === 'number') {
      const [min, max] = this.validationRules.productivityRange;
      if (record.productivityScore < min || record.productivityScore > max) {
        errors.push(`Productivity score out of range: ${record.productivityScore}`);
      }
    }
    
    // Validate duration
    if (typeof record.duration === 'number') {
      const [min, max] = this.validationRules.durationRange;
      if (record.duration < min || record.duration > max) {
        errors.push(`Duration out of range: ${record.duration}`);
      }
    }
    
    // Validate department
    if (record.department && !this.validationRules.validDepartments.includes(record.department)) {
      errors.push(`Invalid department: ${record.department}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  enrichCorporateRecord(record) {
    // 📈 Add computed corporate metrics
    const enriched = {
      ...record,
      processedAt: new Date().toISOString(),
      
      // 🧮 Corporate efficiency calculations
      efficiencyRating: this.calculateEfficiencyRating(record),
      costCenter: this.determineCostCenter(record.department),
      performanceTier: this.calculatePerformanceTier(record.productivityScore),
      
      // 🏢 Corporate categorization
      workType: this.categorizeWorkType(record.activity),
      billableHours: this.calculateBillableHours(record),
      
      // 📊 Analytics metadata
      analytics: {
        processed: true,
        enrichmentVersion: '1.0',
        dataQualityScore: this.calculateDataQualityScore(record)
      }
    };
    
    return enriched;
  }

  calculateEfficiencyRating(record) {
    // 🎯 Corporate efficiency algorithm
    const baseEfficiency = record.metadata?.efficiency || 0.7;
    const productivityMultiplier = record.productivityScore / 100;
    const durationFactor = Math.min(record.duration / 120, 1); // Optimal at 2 hours
    
    return Math.round((baseEfficiency * productivityMultiplier * durationFactor) * 100) / 100;
  }

  determineCostCenter(department) {
    const costCenterMap = {
      'Engineering': 'TECH-001',
      'Sales': 'REV-001', 
      'Marketing': 'REV-002',
      'HR': 'CORP-001',
      'Finance': 'CORP-002',
      'Operations': 'OPS-001'
    };
    return costCenterMap[department] || 'MISC-001';
  }

  calculatePerformanceTier(productivityScore) {
    if (productivityScore >= 90) return 'Exceptional';
    if (productivityScore >= 75) return 'High';
    if (productivityScore >= 60) return 'Standard';
    return 'Needs Improvement';
  }

  categorizeWorkType(activity) {
    const workTypeMap = {
      'meeting': 'Collaborative',
      'coding': 'Development',
      'review': 'Quality Assurance',
      'planning': 'Strategic',
      'documentation': 'Knowledge Management',
      'communication': 'Coordination'
    };
    return workTypeMap[activity] || 'General';
  }

  calculateBillableHours(record) {
    // 💰 Billable hours calculation
    const billableActivities = ['coding', 'review', 'documentation'];
    const isBillable = billableActivities.includes(record.activity);
    return isBillable ? record.duration / 60 : 0; // Convert minutes to hours
  }

  calculateDataQualityScore(record) {
    let score = 100;
    
    // Deduct points for missing optional fields
    if (!record.metadata) score -= 10;
    if (!record.productivityScore) score -= 15;
    if (!record.duration) score -= 10;
    
    return Math.max(score, 0);
  }

  reportProcessingProgress() {
    const stats = this.processingStats;
    const validationRate = (stats.validRecords / stats.totalProcessed * 100).toFixed(1);
    
    console.log(`📊 Processing Progress: ${stats.totalProcessed} records processed, ${validationRate}% valid`);
  }

  getProcessingStats() {
    return { ...this.processingStats };
  }
}

/**
 * 📈 CORPORATE ANALYTICS AGGREGATOR
 * 
 * Transform stream that aggregates data into corporate insights.
 * Demonstrates stateful stream processing and complex analytics.
 */
class CorporateAnalyticsAggregator extends Transform {
  constructor() {
    super({ objectMode: true });
    
    this.analytics = {
      departmentMetrics: new Map(),
      activityBreakdown: new Map(), 
      performanceTiers: new Map(),
      hourlyDistribution: new Map(),
      costCenterAnalysis: new Map(),
      overallKPIs: {
        totalRecords: 0,
        avgProductivityScore: 0,
        totalBillableHours: 0,
        avgEfficiencyRating: 0
      }
    };
    
    console.log('📈 CORPORATE ANALYTICS: Aggregation engine initialized');
  }

  _transform(batch, encoding, callback) {
    for (const record of batch) {
      this.aggregateRecord(record);
    }
    
    // 📊 Pass through aggregated insights periodically
    if (this.analytics.overallKPIs.totalRecords % 1000 === 0) {
      const insights = this.generateIntermediateInsights();
      callback(null, [insights]);
    } else {
      callback(null, []); // No output for this batch
    }
  }

  aggregateRecord(record) {
    this.analytics.overallKPIs.totalRecords++;
    
    // 🏢 Department metrics aggregation
    this.aggregateDepartmentMetrics(record);
    
    // 📊 Activity breakdown
    this.aggregateActivityMetrics(record);
    
    // 🎯 Performance tier analysis
    this.aggregatePerformanceMetrics(record);
    
    // ⏰ Hourly distribution
    this.aggregateHourlyMetrics(record);
    
    // 💰 Cost center analysis
    this.aggregateCostCenterMetrics(record);
    
    // 🧮 Update running averages
    this.updateRunningAverages(record);
  }

  aggregateDepartmentMetrics(record) {
    const dept = record.department;
    const current = this.analytics.departmentMetrics.get(dept) || {
      recordCount: 0,
      totalProductivity: 0,
      totalBillableHours: 0,
      totalDuration: 0,
      efficiencySum: 0
    };
    
    current.recordCount++;
    current.totalProductivity += record.productivityScore || 0;
    current.totalBillableHours += record.billableHours || 0;
    current.totalDuration += record.duration || 0;
    current.efficiencySum += record.efficiencyRating || 0;
    
    this.analytics.departmentMetrics.set(dept, current);
  }

  aggregateActivityMetrics(record) {
    const activity = record.activity;
    const current = this.analytics.activityBreakdown.get(activity) || {
      count: 0,
      totalDuration: 0,
      avgProductivity: 0,
      productivitySum: 0
    };
    
    current.count++;
    current.totalDuration += record.duration || 0;
    current.productivitySum += record.productivityScore || 0;
    current.avgProductivity = current.productivitySum / current.count;
    
    this.analytics.activityBreakdown.set(activity, current);
  }

  aggregatePerformanceMetrics(record) {
    const tier = record.performanceTier;
    const current = this.analytics.performanceTiers.get(tier) || { count: 0 };
    current.count++;
    this.analytics.performanceTiers.set(tier, current);
  }

  aggregateHourlyMetrics(record) {
    const hour = new Date(record.timestamp).getHours();
    const current = this.analytics.hourlyDistribution.get(hour) || {
      activityCount: 0,
      totalProductivity: 0,
      productivitySum: 0
    };
    
    current.activityCount++;
    current.productivitySum += record.productivityScore || 0;
    current.totalProductivity = current.productivitySum / current.activityCount;
    
    this.analytics.hourlyDistribution.set(hour, current);
  }

  aggregateCostCenterMetrics(record) {
    const costCenter = record.costCenter;
    const current = this.analytics.costCenterAnalysis.get(costCenter) || {
      totalBillableHours: 0,
      totalRecords: 0,
      avgEfficiency: 0,
      efficiencySum: 0
    };
    
    current.totalRecords++;
    current.totalBillableHours += record.billableHours || 0;
    current.efficiencySum += record.efficiencyRating || 0;
    current.avgEfficiency = current.efficiencySum / current.totalRecords;
    
    this.analytics.costCenterAnalysis.set(costCenter, current);
  }

  updateRunningAverages(record) {
    const kpis = this.analytics.overallKPIs;
    const count = kpis.totalRecords;
    
    // Running average calculations
    kpis.avgProductivityScore = ((kpis.avgProductivityScore * (count - 1)) + (record.productivityScore || 0)) / count;
    kpis.totalBillableHours += record.billableHours || 0;
    kpis.avgEfficiencyRating = ((kpis.avgEfficiencyRating * (count - 1)) + (record.efficiencyRating || 0)) / count;
  }

  generateIntermediateInsights() {
    return {
      type: 'analytics_snapshot',
      timestamp: new Date().toISOString(),
      recordsProcessed: this.analytics.overallKPIs.totalRecords,
      insights: {
        topPerformingDepartment: this.getTopPerformingDepartment(),
        mostCommonActivity: this.getMostCommonActivity(),
        peakProductivityHour: this.getPeakProductivityHour(),
        overallKPIs: { ...this.analytics.overallKPIs }
      }
    };
  }

  getTopPerformingDepartment() {
    let topDept = null;
    let highestAvgProductivity = 0;
    
    for (const [dept, metrics] of this.analytics.departmentMetrics) {
      const avgProductivity = metrics.totalProductivity / metrics.recordCount;
      if (avgProductivity > highestAvgProductivity) {
        highestAvgProductivity = avgProductivity;
        topDept = dept;
      }
    }
    
    return { department: topDept, avgProductivity: highestAvgProductivity };
  }

  getMostCommonActivity() {
    let topActivity = null;
    let highestCount = 0;
    
    for (const [activity, metrics] of this.analytics.activityBreakdown) {
      if (metrics.count > highestCount) {
        highestCount = metrics.count;
        topActivity = activity;
      }
    }
    
    return { activity: topActivity, count: highestCount };
  }

  getPeakProductivityHour() {
    let peakHour = null;
    let highestProductivity = 0;
    
    for (const [hour, metrics] of this.analytics.hourlyDistribution) {
      if (metrics.totalProductivity > highestProductivity) {
        highestProductivity = metrics.totalProductivity;
        peakHour = hour;
      }
    }
    
    return { hour: peakHour, avgProductivity: highestProductivity };
  }

  getFinalAnalytics() {
    return {
      departments: Object.fromEntries(this.analytics.departmentMetrics),
      activities: Object.fromEntries(this.analytics.activityBreakdown),
      performanceTiers: Object.fromEntries(this.analytics.performanceTiers),
      hourlyDistribution: Object.fromEntries(this.analytics.hourlyDistribution),
      costCenters: Object.fromEntries(this.analytics.costCenterAnalysis),
      overallKPIs: this.analytics.overallKPIs
    };
  }
}

/**
 * 💾 CORPORATE DATA WAREHOUSE SINK
 * 
 * Writable stream that simulates storing processed data.
 * Demonstrates Writable streams and proper cleanup.
 */
class CorporateDataWarehouse extends Writable {
  constructor() {
    super({ objectMode: true });
    
    this.storedRecords = 0;
    this.storageStats = {
      totalBytes: 0,
      avgRecordSize: 0,
      writeOperations: 0,
      errors: 0
    };
    
    console.log('💾 CORPORATE DATA WAREHOUSE: Storage system ready');
  }

  _write(data, encoding, callback) {
    try {
      // 💾 Simulate database write operation
      const writeLatency = Math.random() * 10 + 5; // 5-15ms
      
      setTimeout(() => {
        if (Array.isArray(data)) {
          this.storedRecords += data.length;
          this.updateStorageStats(data);
          
          if (this.storedRecords % 500 === 0) {
            console.log(`💾 Warehouse: ${this.storedRecords} records stored`);
          }
        }
        
        callback(); // Signal successful write
        
      }, writeLatency);
      
    } catch (error) {
      this.storageStats.errors++;
      console.error(`💾 Storage error: ${error.message}`);
      callback(error);
    }
  }

  updateStorageStats(data) {
    this.storageStats.writeOperations++;
    
    // Estimate data size
    const dataSize = JSON.stringify(data).length;
    this.storageStats.totalBytes += dataSize;
    this.storageStats.avgRecordSize = this.storageStats.totalBytes / this.storedRecords;
  }

  getStorageStats() {
    return {
      ...this.storageStats,
      storedRecords: this.storedRecords,
      totalMB: (this.storageStats.totalBytes / 1024 / 1024).toFixed(2)
    };
  }
}

/**
 * 🚀 CORPORATE STREAM PROCESSING ORCHESTRATOR
 * 
 * Demonstrates how to properly compose streams into processing pipelines
 * with error handling, monitoring, and graceful shutdown.
 */
async function demonstrateCorporateStreamProcessing() {
  console.log('🏢 ALGOCRATIC FUTURES STREAM PROCESSING DEMONSTRATION');
  console.log('===================================================');
  console.log('📊 Processing enterprise-scale corporate productivity data streams...');
  console.log('');

  const startTime = performance.now();
  
  // 🏗️ Create stream pipeline components
  const dataGenerator = new CorporateDataGenerator({
    maxRecords: 5000,
    batchSize: 25,
    dataType: 'productivity'
  });
  
  const dataProcessor = new CorporateDataProcessor();
  const analyticsAggregator = new CorporateAnalyticsAggregator();
  const dataWarehouse = new CorporateDataWarehouse();
  
  // 📊 Pipeline monitoring
  const pipelineMonitor = new EventEmitter();
  
  pipelineMonitor.on('pipeline:progress', (stats) => {
    console.log(`📈 Pipeline Progress: ${JSON.stringify(stats, null, 2)}`);
  });
  
  pipelineMonitor.on('pipeline:error', (error) => {
    console.error(`🚨 Pipeline Error: ${error.message}`);
  });

  try {
    console.log('🔄 Starting corporate data processing pipeline...');
    
    // 🚰 CRITICAL: Use pipeline() for automatic error handling and cleanup
    const pipelineAsync = promisify(pipeline);
    
    await pipelineAsync(
      dataGenerator,
      dataProcessor,
      analyticsAggregator,
      dataWarehouse
    );
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    console.log('\n✅ CORPORATE STREAM PROCESSING COMPLETE!');
    console.log('========================================');
    
    // 📊 Generate comprehensive performance report
    const processingStats = dataProcessor.getProcessingStats();
    const storageStats = dataWarehouse.getStorageStats();
    const finalAnalytics = analyticsAggregator.getFinalAnalytics();
    
    console.log('\n📈 PROCESSING PERFORMANCE METRICS:');
    console.log(`⏱️  Total Processing Time: ${processingTime.toFixed(2)}ms`);
    console.log(`📊 Records Processed: ${processingStats.totalProcessed}`);
    console.log(`✅ Valid Records: ${processingStats.validRecords} (${(processingStats.validRecords/processingStats.totalProcessed*100).toFixed(1)}%)`);
    console.log(`❌ Invalid Records: ${processingStats.invalidRecords}`);
    console.log(`💾 Records Stored: ${storageStats.storedRecords}`);
    console.log(`📦 Data Volume: ${storageStats.totalMB} MB`);
    console.log(`⚡ Throughput: ${(processingStats.totalProcessed / (processingTime / 1000)).toFixed(0)} records/second`);
    
    console.log('\n🏢 CORPORATE ANALYTICS INSIGHTS:');
    console.log(`🏭 Top Department: ${finalAnalytics.overallKPIs.totalRecords > 0 ? Object.keys(finalAnalytics.departments)[0] : 'N/A'}`);
    console.log(`📊 Avg Productivity: ${finalAnalytics.overallKPIs.avgProductivityScore.toFixed(1)}`);
    console.log(`💰 Total Billable Hours: ${finalAnalytics.overallKPIs.totalBillableHours.toFixed(1)}`);
    console.log(`⚡ Avg Efficiency: ${finalAnalytics.overallKPIs.avgEfficiencyRating.toFixed(3)}`);
    
    console.log('\n🎓 PEDAGOGICAL TAKEAWAYS:');
    console.log('========================');
    console.log('✅ Streams enable processing datasets larger than memory');
    console.log('✅ Transform streams can validate, filter, and enrich data');
    console.log('✅ Backpressure handling prevents memory overflow');
    console.log('✅ Pipeline composition enables complex data processing');
    console.log('✅ Proper error handling prevents pipeline failures');
    console.log('✅ Stream monitoring provides operational visibility');
    
  } catch (error) {
    console.error('🚨 PIPELINE FAILURE:', error.message);
    console.log('\n💡 DEBUGGING TIPS:');
    console.log('- Check if all streams are properly connected');
    console.log('- Verify error handling in Transform streams');
    console.log('- Ensure streams are ended properly');
    console.log('- Monitor memory usage for backpressure issues');
    
    throw error;
  }
}

// 🚀 EXECUTE DEMONSTRATION
if (require.main === module) {
  demonstrateCorporateStreamProcessing().catch(error => {
    console.error('🚨 Stream processing demonstration failed:', error);
    process.exit(1);
  });
}

module.exports = {
  CorporateDataGenerator,
  CorporateDataProcessor,
  CorporateAnalyticsAggregator,
  CorporateDataWarehouse
};