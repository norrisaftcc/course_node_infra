#!/usr/bin/env node

/**
 * WEEK 1 DEMONSTRATION: The Async Solution
 * 
 * This script demonstrates how async patterns solve
 * the blocking problem shown in blocking-demo.js
 * 
 * Students will see multiple requests being handled concurrently.
 */

const http = require('http');
const fs = require('fs').promises; // Use promise-based fs
const path = require('path');

// Create some dummy data to simulate slow operations
const DUMMY_DATA = 'x'.repeat(1000000); // 1MB of data

// Setup test files
const testFile1 = path.join(__dirname, 'test-file-1.txt');
const testFile2 = path.join(__dirname, 'test-file-2.txt');

async function setupTestFiles() {
    try {
        await fs.access(testFile1);
    } catch {
        await fs.writeFile(testFile1, DUMMY_DATA);
    }
    
    try {
        await fs.access(testFile2);
    } catch {
        await fs.writeFile(testFile2, DUMMY_DATA);
    }
}

// SOLUTION: Async server that doesn't block
const server = http.createServer(async (req, res) => {
    console.log(`[${new Date().toISOString()}] Request received: ${req.url}`);
    
    if (req.url === '/fast-operation') {
        try {
            // NON-BLOCKING: Multiple operations run concurrently
            console.log('Starting async file operations...');
            
            // Promise.all runs operations in parallel
            const [data1, data2] = await Promise.all([
                fs.readFile(testFile1, 'utf8'),
                fs.readFile(testFile2, 'utf8')
            ]);
            
            console.log('Both files read concurrently!');
            
            // Non-blocking delay simulation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(`Processed ${data1.length + data2.length} characters\n`);
            
        } catch (error) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(`Error: ${error.message}\n`);
        }
        
    } else if (req.url === '/health') {
        // This responds immediately even during other operations
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Server is responding immediately!\n');
        
    } else if (req.url === '/coordination-demo') {
        // Demonstrate advanced coordination patterns
        try {
            console.log('Demonstrating coordination patterns...');
            
            // Sequential operations (when order matters)
            const step1 = await fs.readFile(testFile1, 'utf8');
            console.log('Step 1 complete');
            
            const step2 = await fs.readFile(testFile2, 'utf8');
            console.log('Step 2 complete');
            
            // Parallel operations (when order doesn't matter)
            const [result1, result2, result3] = await Promise.all([
                processData(step1.slice(0, 1000)),
                processData(step2.slice(0, 1000)),
                fetchExternalData() // Simulated API call
            ]);
            
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                message: 'Coordination complete',
                results: [result1, result2, result3],
                timestamp: new Date().toISOString()
            }, null, 2));
            
        } catch (error) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(`Coordination error: ${error.message}\n`);
        }
        
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not found\n');
    }
});

// Helper functions to demonstrate async patterns
async function processData(data) {
    // Simulate data processing
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Processed ${data.length} characters`;
}

async function fetchExternalData() {
    // Simulate external API call
    await new Promise(resolve => setTimeout(resolve, 800));
    return { source: 'external-api', data: 'simulated response' };
}

const PORT = 3000;

// Setup and start server
setupTestFiles().then(() => {
    server.listen(PORT, () => {
        console.log(`✅ ASYNC SERVER running on port ${PORT}`);
        console.log('');
        console.log('TRY THIS EXPERIMENT:');
        console.log('1. Open multiple terminals');
        console.log('2. In terminal 1: curl http://localhost:3000/fast-operation');
        console.log('3. IMMEDIATELY in terminal 2: curl http://localhost:3000/health');
        console.log('4. Try: curl http://localhost:3000/coordination-demo');
        console.log('');
        console.log('OBSERVE: All requests respond immediately!');
        console.log('Terminal 2 does NOT wait for terminal 1 to complete.');
        console.log('');
        console.log('ADVANCED: Watch the console logs to see coordination patterns');
        console.log('Press Ctrl+C to stop the server');
    });
});

// Graceful shutdown with async cleanup
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Server shutting down...');
    
    server.close(async () => {
        console.log('Server closed. Cleaning up test files...');
        
        try {
            await Promise.all([
                fs.unlink(testFile1).catch(() => {}), // Ignore errors if files don't exist
                fs.unlink(testFile2).catch(() => {})
            ]);
            console.log('Test files cleaned up.');
        } catch (err) {
            console.log('Cleanup completed (some files may not have existed)');
        }
        
        process.exit(0);
    });
});