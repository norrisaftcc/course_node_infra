#!/usr/bin/env node

/**
 * WEEK 1 DEMONSTRATION: The Blocking Problem
 * 
 * This script demonstrates why synchronous operations
 * are problematic in Node.js and web servers.
 * 
 * Students will see the server "freeze" during file operations.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Create some dummy data to simulate slow operations
const DUMMY_DATA = 'x'.repeat(1000000); // 1MB of data

// Write test files if they don't exist
const testFile1 = path.join(__dirname, 'test-file-1.txt');
const testFile2 = path.join(__dirname, 'test-file-2.txt');

if (!fs.existsSync(testFile1)) {
    fs.writeFileSync(testFile1, DUMMY_DATA);
}
if (!fs.existsSync(testFile2)) {
    fs.writeFileSync(testFile2, DUMMY_DATA);
}

// PROBLEMATIC: Synchronous server that blocks
const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] Request received: ${req.url}`);
    
    if (req.url === '/slow-operation') {
        // THIS BLOCKS THE ENTIRE SERVER
        console.log('Starting synchronous file operations...');
        
        const data1 = fs.readFileSync(testFile1, 'utf8');
        console.log('File 1 read complete');
        
        const data2 = fs.readFileSync(testFile2, 'utf8');
        console.log('File 2 read complete');
        
        // Simulate additional processing time
        const start = Date.now();
        while (Date.now() - start < 2000) {
            // Busy wait for 2 seconds - TERRIBLE for servers!
        }
        
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(`Processed ${data1.length + data2.length} characters\n`);
        
    } else if (req.url === '/health') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Server is responding\n');
        
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not found\n');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚨 BLOCKING SERVER running on port ${PORT}`);
    console.log('');
    console.log('TRY THIS EXPERIMENT:');
    console.log('1. Open multiple terminals');
    console.log('2. In terminal 1: curl http://localhost:3000/slow-operation');
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