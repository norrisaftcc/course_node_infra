#!/usr/bin/env node

/**
 * WEEK 1 BOOTSTRAP: Course Development MCP Server
 * 
 * This MCP server uses the async patterns we just learned
 * to help generate content for upcoming weeks!
 * 
 * EDUCATIONAL VALUE:
 * - Demonstrates real-world async patterns
 * - Shows practical application of coordination concepts
 * - Becomes a tool for building the rest of the course
 * 
 * BOOTSTRAP CONCEPT:
 * Week 1 concepts → Week 1 MCP server → Helps build Week 2
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

class CourseMCPServer {
    constructor() {
        this.contentTemplates = new Map();
        this.generationTasks = new Map();
        this.setupTemplates();
    }
    
    setupTemplates() {
        // Template for generating week content
        this.contentTemplates.set('week-structure', {
            directories: ['sample-code', 'exercises', 'solutions'],
            files: ['README.md', 'package.json'],
            scripts: ['dev', 'test', 'demo']
        });
        
        // Template for exercise generation
        this.contentTemplates.set('exercise-template', {
            structure: 'test-driven',
            validation: 'automated',
            difficulty: 'progressive'
        });
    }
    
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:3001`);
        const path = url.pathname;
        
        console.log(`[${new Date().toISOString()}] MCP Request: ${path}`);
        
        try {
            switch (path) {
                case '/generate-week':
                    await this.generateWeekContent(req, res);
                    break;
                    
                case '/coordinate-content':
                    await this.coordinateContentGeneration(req, res);
                    break;
                    
                case '/validate-structure':
                    await this.validateCourseStructure(req, res);
                    break;
                    
                case '/health':
                    this.healthCheck(req, res);
                    break;
                    
                default:
                    this.notFound(req, res);
            }
        } catch (error) {
            this.errorResponse(req, res, error);
        }
    }
    
    async generateWeekContent(req, res) {
        // Demonstrate Promise.all coordination for content generation
        console.log('Coordinating week content generation...');
        
        const weekNumber = 2; // We'll generate Week 2 using Week 1 patterns
        
        // Parallel content generation tasks
        const [packageJson, readme, sampleCode] = await Promise.all([
            this.generatePackageJson(weekNumber),
            this.generateReadme(weekNumber),
            this.generateSampleCode(weekNumber)
        ]);
        
        // Sequential tasks that depend on previous results
        const exercises = await this.generateExercises(weekNumber, sampleCode);
        const solutions = await this.generateSolutions(weekNumber, exercises);
        
        const result = {
            week: weekNumber,
            topic: 'Service Coordination',
            files: {
                'package.json': packageJson,
                'README.md': readme,
                'sample-code': sampleCode,
                'exercises': exercises,
                'solutions': solutions
            },
            generated_at: new Date().toISOString(),
            coordination_pattern: 'parallel_then_sequential'
        };
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(result, null, 2));
    }
    
    async coordinateContentGeneration(req, res) {
        // Demonstrate coordination across multiple content types
        console.log('Coordinating multi-type content generation...');
        
        // Use Promise.allSettled to handle some tasks potentially failing
        const tasks = [
            this.generateCodeExamples(),
            this.generateTestCases(),
            this.generateDocumentation(),
            this.validateQuality()
        ];
        
        const results = await Promise.allSettled(tasks);
        
        const response = {
            coordination_status: 'completed',
            task_results: results.map((result, index) => ({
                task: ['code_examples', 'test_cases', 'documentation', 'quality_check'][index],
                status: result.status,
                result: result.status === 'fulfilled' ? result.value : result.reason.message
            })),
            coordination_pattern: 'allSettled_for_resilience'
        };
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response, null, 2));
    }
    
    async validateCourseStructure(req, res) {
        // Validate the course structure we're building
        const basePath = path.join(__dirname, '../..');
        
        const validationTasks = [
            this.checkWeekDirectories(basePath),
            this.validatePackageJsonFiles(basePath),
            this.checkSampleCodeExists(basePath)
        ];
        
        const results = await Promise.all(validationTasks);
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            validation_status: 'completed',
            results: results,
            timestamp: new Date().toISOString()
        }, null, 2));
    }
    
    // Helper methods that demonstrate async patterns
    async generatePackageJson(weekNumber) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
        return {
            name: `week-${weekNumber.toString().padStart(2, '0')}-service-coordination`,
            version: '1.0.0',
            description: `Week ${weekNumber}: Express.js and Service Coordination`,
            main: 'sample-code/coordination-server.js',
            scripts: {
                dev: 'node sample-code/coordination-server.js',
                test: 'node exercises/test-runner.js',
                demo: 'node sample-code/multi-service-demo.js'
            }
        };
    }
    
    async generateReadme(weekNumber) {
        await new Promise(resolve => setTimeout(resolve, 150));
        return `# Week ${weekNumber}: Service Coordination\n\nLearning objectives and content generated by MCP server.`;
    }
    
    async generateSampleCode(weekNumber) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            'coordination-server.js': '// Express.js coordination patterns',
            'multi-service-demo.js': '// Multi-service coordination example',
            'error-handling.js': '// Graceful degradation patterns'
        };
    }
    
    async generateExercises(weekNumber, sampleCode) {
        await new Promise(resolve => setTimeout(resolve, 180));
        return {
            'exercise-1.js': '// Build coordination service',
            'exercise-2.js': '// Handle service failures',
            'test-runner.js': '// Automated validation'
        };
    }
    
    async generateSolutions(weekNumber, exercises) {
        await new Promise(resolve => setTimeout(resolve, 120));
        return Object.keys(exercises).reduce((solutions, exerciseFile) => {
            solutions[exerciseFile.replace('.js', '-solution.js')] = '// Complete solution';
            return solutions;
        }, {});
    }
    
    async generateCodeExamples() {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { status: 'generated', count: 5 };
    }
    
    async generateTestCases() {
        await new Promise(resolve => setTimeout(resolve, 250));
        return { status: 'generated', tests: 12 };
    }
    
    async generateDocumentation() {
        await new Promise(resolve => setTimeout(resolve, 400));
        return { status: 'generated', pages: 3 };
    }
    
    async validateQuality() {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { status: 'validated', score: 95 };
    }
    
    async checkWeekDirectories(basePath) {
        // Implementation would check for week-XX directories
        return { status: 'valid', weeks_found: 1 };
    }
    
    async validatePackageJsonFiles(basePath) {
        return { status: 'valid', files_checked: 1 };
    }
    
    async checkSampleCodeExists(basePath) {
        return { status: 'valid', samples_found: 2 };
    }
    
    healthCheck(req, res) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            status: 'healthy',
            service: 'Course Development MCP Server',
            version: '1.0.0',
            capabilities: [
                'week_content_generation',
                'coordination_patterns',
                'structure_validation'
            ],
            uptime: process.uptime()
        }));
    }
    
    notFound(req, res) {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            error: 'Not Found',
            available_endpoints: [
                '/generate-week',
                '/coordinate-content',
                '/validate-structure',
                '/health'
            ]
        }));
    }
    
    errorResponse(req, res, error) {
        console.error('MCP Server Error:', error);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message,
            timestamp: new Date().toISOString()
        }));
    }
}

// Create and start the MCP server
const mcpServer = new CourseMCPServer();

const server = http.createServer((req, res) => {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    mcpServer.handleRequest(req, res);
});

const PORT = 3001;

server.listen(PORT, () => {
    console.log('🚀 Course Development MCP Server running on port', PORT);
    console.log('');
    console.log('🎯 BOOTSTRAP CONCEPT IN ACTION:');
    console.log('   Week 1 async patterns → MCP server → Helps build Week 2!');
    console.log('');
    console.log('📚 AVAILABLE ENDPOINTS:');
    console.log('   GET  /health              - Server status');
    console.log('   GET  /generate-week       - Generate Week 2 content');
    console.log('   GET  /coordinate-content  - Demonstrate coordination');
    console.log('   GET  /validate-structure  - Check course structure');
    console.log('');
    console.log('🧪 TEST THE COORDINATION:');
    console.log('   curl http://localhost:3001/generate-week');
    console.log('   curl http://localhost:3001/coordinate-content');
    console.log('');
    console.log('This server demonstrates the async patterns from Week 1');
    console.log('while being a practical tool for course development!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 MCP Server shutting down...');
    server.close(() => {
        console.log('MCP Server closed gracefully.');
        process.exit(0);
    });
});