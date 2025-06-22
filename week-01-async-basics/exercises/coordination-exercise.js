#!/usr/bin/env node

/**
 * WEEK 1 EXERCISE: Promise Coordination Patterns
 * 
 * Students will implement basic async coordination patterns
 * that prepare them for multi-service architectures.
 */

const fs = require('fs').promises;
const path = require('path');

// Test data setup
const testData = {
    user: { id: 1, name: 'Alice', email: 'alice@example.com' },
    profile: { user_id: 1, bio: 'Software developer', location: 'Portland' },
    posts: [
        { id: 1, user_id: 1, content: 'Learning Node.js!' },
        { id: 2, user_id: 1, content: 'Async patterns are powerful' }
    ]
};

// Simulate async data sources (like external APIs)
async function fetchUser(userId) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    if (userId === 1) {
        return testData.user;
    }
    throw new Error(`User ${userId} not found`);
}

async function fetchProfile(userId) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800));
    
    if (userId === 1) {
        return testData.profile;
    }
    throw new Error(`Profile for user ${userId} not found`);
}

async function fetchPosts(userId) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1200));
    
    if (userId === 1) {
        return testData.posts;
    }
    return [];
}

// EXERCISE 1: Sequential Coordination
// TODO: Implement getUserDataSequential
// REQUIREMENT: Fetch user, then profile, then posts (in order)
// CONSTRAINT: Each operation must wait for the previous to complete
async function getUserDataSequential(userId) {
    console.log('🔄 Starting sequential fetch...');
    const startTime = Date.now();
    
    // YOUR CODE HERE
    // Hint: Use await for each operation in sequence
    
    // const user = await ...
    // const profile = await ...
    // const posts = await ...
    
    const endTime = Date.now();
    console.log(`⏱️  Sequential fetch took: ${endTime - startTime}ms`);
    
    return {
        user: null, // Replace with actual user data
        profile: null, // Replace with actual profile data
        posts: null, // Replace with actual posts data
        timing: { sequential: endTime - startTime }
    };
}

// EXERCISE 2: Parallel Coordination
// TODO: Implement getUserDataParallel
// REQUIREMENT: Fetch user, profile, and posts simultaneously
// CONSTRAINT: All operations start at the same time
async function getUserDataParallel(userId) {
    console.log('🚀 Starting parallel fetch...');
    const startTime = Date.now();
    
    // YOUR CODE HERE
    // Hint: Use Promise.all() to run operations in parallel
    
    const endTime = Date.now();
    console.log(`⏱️  Parallel fetch took: ${endTime - startTime}ms`);
    
    return {
        user: null, // Replace with destructured results
        profile: null,
        posts: null,
        timing: { parallel: endTime - startTime }
    };
}

// EXERCISE 3: Resilient Coordination
// TODO: Implement getUserDataResilient
// REQUIREMENT: Handle cases where some operations might fail
// CONSTRAINT: Return partial data if some operations fail
async function getUserDataResilient(userId) {
    console.log('🛡️  Starting resilient fetch...');
    const startTime = Date.now();
    
    // YOUR CODE HERE
    // Hint: Use Promise.allSettled() to handle failures gracefully
    
    const endTime = Date.now();
    console.log(`⏱️  Resilient fetch took: ${endTime - startTime}ms`);
    
    return {
        user: null, // Extract from results, handle failures
        profile: null,
        posts: null,
        errors: [], // Track any errors that occurred
        timing: { resilient: endTime - startTime }
    };
}

// Test runner
async function runExercises() {
    console.log('🎯 WEEK 1 COORDINATION EXERCISES\n');
    
    try {
        console.log('=== EXERCISE 1: Sequential Coordination ===');
        const sequential = await getUserDataSequential(1);
        console.log('Result:', sequential);
        console.log('');
        
        console.log('=== EXERCISE 2: Parallel Coordination ===');
        const parallel = await getUserDataParallel(1);
        console.log('Result:', parallel);
        console.log('');
        
        console.log('=== EXERCISE 3: Resilient Coordination ===');
        const resilient = await getUserDataResilient(1);
        console.log('Result:', resilient);
        console.log('');
        
        // Performance comparison
        console.log('=== PERFORMANCE COMPARISON ===');
        if (sequential.timing && parallel.timing) {
            const improvement = sequential.timing.sequential - parallel.timing.parallel;
            console.log(`Parallel vs Sequential improvement: ${improvement}ms`);
            console.log(`Speed increase: ${(improvement / sequential.timing.sequential * 100).toFixed(1)}%`);
        }
        
    } catch (error) {
        console.error('Exercise failed:', error);
    }
}

// Export for testing
module.exports = {
    getUserDataSequential,
    getUserDataParallel,
    getUserDataResilient,
    fetchUser,
    fetchProfile,
    fetchPosts
};

// Run exercises if called directly
if (require.main === module) {
    runExercises();
}