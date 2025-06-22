#!/usr/bin/env node

/**
 * 🏢 ALGOCRATIC FUTURES: WEEK 1 DEMONSTRATION
 * "The Great Algorithmic Recalibration: Blocking Protocol Failures"
 * 
 * CORPORATE MEMO: Our enterprise-grade productivity optimization systems
 * are experiencing "synchronous degradation events" that require immediate
 * algorithmic recalibration. This demonstration reveals why our legacy
 * blocking protocols are causing system-wide productivity bottlenecks.
 * 
 * 🎯 PEDAGOGICAL PURPOSE: Students experience the frustration of blocking
 * operations before discovering async solutions - mirroring real corporate
 * "digital transformation challenges" they'll face in their careers.
 * 
 * ⚠️  WARNING: This server will exhibit "algorithmic dysfunction" by design.
 * Students will witness requests queuing behind slow operations, creating
 * authentic pain points that async patterns will eventually resolve.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 📊 ALGOCRATIC PRODUCTIVITY DATA: Simulating enterprise-scale document processing
// Our "Synergy Enhancement Matrices" (1MB each) represent typical corporate workloads
const PRODUCTIVITY_MATRIX = 'x'.repeat(1000000); // 1MB of "productivity data"

// 🗂️  CORPORATE FILING SYSTEM: Legacy document repositories
const legacyDocument1 = path.join(__dirname, 'productivity-matrix-alpha.txt');
const legacyDocument2 = path.join(__dirname, 'productivity-matrix-beta.txt');

// 🏗️  INITIALIZING CORPORATE INFRASTRUCTURE: Setting up productivity matrices
if (!fs.existsSync(legacyDocument1)) {
    console.log('📁 Deploying Productivity Matrix Alpha to corporate filing system...');
    fs.writeFileSync(legacyDocument1, PRODUCTIVITY_MATRIX);
}
if (!fs.existsSync(legacyDocument2)) {
    console.log('📁 Deploying Productivity Matrix Beta to corporate filing system...');
    fs.writeFileSync(legacyDocument2, PRODUCTIVITY_MATRIX);
}

// 🔥 CRITICAL SYSTEM FLAW: Legacy Synchronous Protocol Implementation
// WARNING: This server demonstrates "algorithmic dysfunction" by design!
const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] 📨 CORPORATE REQUEST RECEIVED: ${req.url}`);
    
    if (req.url === '/process-productivity-data') {
        // 🚨 ALGORITHMIC BOTTLENECK: Synchronous operations causing enterprise-wide delays
        console.log('⚙️  INITIATING PRODUCTIVITY MATRIX ANALYSIS (Legacy Blocking Protocol)...');
        console.log('💼 CORPORATE NOTICE: All other operations will be delayed during this process');
        
        const productivityData1 = fs.readFileSync(legacyDocument1, 'utf8');
        console.log('✅ Productivity Matrix Alpha processed (but at what cost to efficiency?)');
        
        const productivityData2 = fs.readFileSync(legacyDocument2, 'utf8');
        console.log('✅ Productivity Matrix Beta processed (efficiency metrics declining...)');
        
        // 🐌 CORPORATE ALGORITHMIC RECALIBRATION: CPU-intensive legacy protocol
        console.log('🔄 Executing enterprise synergy calculations (this will hurt performance)...');
        const start = Date.now();
        while (Date.now() - start < 2000) {
            // 💸 BURNING CPU CYCLES: Simulating legacy enterprise "optimization" algorithms
            // This blocking loop prevents ALL other requests from being processed!
        }
        
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(`🏆 ALGORITHMIC RECALIBRATION COMPLETE!\n📊 Processed ${productivityData1.length + productivityData2.length} productivity units\n💼 WARNING: Corporate efficiency severely compromised during this operation!\n`);
        
    } else if (req.url === '/corporate-health-check') {
        // 🏥 QUICK CORPORATE WELLNESS CHECK: This should respond fast... unless blocked!
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('🟢 CORPORATE SYSTEM STATUS: Operational (unless algorithmic recalibration is running)\n');
        
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not found\n');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🏢 ALGOCRATIC FUTURES LEGACY SYSTEM active on port ${PORT}`);
    console.log('');
    console.log('🧪 CORPORATE DYSFUNCTION EXPERIMENT:');
    console.log('   Demonstrate the "productivity paradox" of blocking operations!');
    console.log('');
    console.log('👥 MULTI-USER SIMULATION:');
    console.log('1. 📱 Terminal 1: curl http://localhost:3000/process-productivity-data');
    console.log('2. 📱 Terminal 2: curl http://localhost:3000/corporate-health-check');
    console.log('');
    console.log('🎯 LEARNING OBJECTIVE: Watch Terminal 2 wait forever while Terminal 1 processes!');
    console.log('💡 REVELATION: This is why async patterns are essential for enterprise systems!');
    console.log('3. IMMEDIATELY in terminal 2: curl http://localhost:3000/health');
    console.log('');
    console.log('OBSERVE: Terminal 2 will wait until terminal 1 completes!');
    console.log('This is the "blocking problem" that Node.js async patterns solve.');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Server shutting down...');
    server.close(() => {
        console.log('Server closed. Cleaning up test files...');
        
        // Clean up test files
        try {
            fs.unlinkSync(testFile1);
            fs.unlinkSync(testFile2);
            console.log('Test files cleaned up.');
        } catch (err) {
            // Files might not exist, that's okay
        }
        
        process.exit(0);
    });
});