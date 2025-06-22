# 📚 Week 2 Student Notes: Service Coordination
*"Things you'll probably run into and how to handle them"*

## 🎯 What You're Learning This Week

Building on Week 1's async foundations, you're now **coordinating multiple services** - like being a conductor of an orchestra where each musician (service) plays independently but must work together. This is where you learn to build **real distributed systems**.

---

## 🚨 Common Student Challenges & Solutions

### 1. **Service Dependencies and Failure Cascades**
**What you'll see:**
```javascript
// ❌ When userService fails, everything breaks
async function getUserDashboard(userId) {
  const user = await userService.getUser(userId);      // Fails here
  const orders = await orderService.getOrders(userId); // Never runs
  const recommendations = await mlService.getRecommendations(userId); // Never runs
  return { user, orders, recommendations };
}
```

**Why it happens:**
- Services fail independently in the real world
- Network timeouts, database issues, service restarts
- One failure shouldn't kill entire user experience

**How to fix:**
```javascript
// ✅ Graceful degradation with Promise.allSettled
async function getUserDashboard(userId) {
  const [userResult, ordersResult, recsResult] = await Promise.allSettled([
    userService.getUser(userId),
    orderService.getOrders(userId), 
    mlService.getRecommendations(userId)
  ]);
  
  return {
    user: userResult.status === 'fulfilled' ? userResult.value : null,
    orders: ordersResult.status === 'fulfilled' ? ordersResult.value : [],
    recommendations: recsResult.status === 'fulfilled' ? recsResult.value : []
  };
}
```

### 2. **Circuit Breaker Pattern Confusion**
**What you'll run into:**
Services that keep trying failed operations forever, making things worse.

**The problem:**
```javascript
// ❌ Keeps hammering a failing service
async function callFlakeyService() {
  try {
    return await flakeyService.getData();
  } catch (error) {
    // Just keeps trying... and trying... and trying...
    return await callFlakeyService(); // Infinite retry!
  }
}
```

**Circuit breaker solution:**
```javascript
// ✅ Stop calling failing services temporarily
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
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
}
```

### 3. **Load Testing Reveals Coordination Issues**
**What you'll discover:**
Your code works fine with 1 user, breaks with 100 users.

**Common issues:**
- Database connection pools exhausted
- Memory leaks from hanging requests
- Race conditions in shared state
- Improper error handling under load

**Debugging approach:**
```javascript
// 🔍 Add performance monitoring
async function coordinateServices(req, res) {
  const startTime = performance.now();
  const correlationId = `req_${Date.now()}_${Math.random().toString(36)}`;
  
  console.log(`[${correlationId}] Starting request coordination`);
  
  try {
    const results = await Promise.allSettled([
      serviceA.getData(correlationId),
      serviceB.getData(correlationId),
      serviceC.getData(correlationId)
    ]);
    
    const endTime = performance.now();
    console.log(`[${correlationId}] Completed in ${endTime - startTime}ms`);
    
    res.json(processResults(results));
  } catch (error) {
    console.error(`[${correlationId}] Failed:`, error.message);
    res.status(500).json({ error: 'Service coordination failed' });
  }
}
```

### 4. **Express.js Middleware Gotchas**
**What breaks:**
```javascript
// ❌ Common middleware mistakes
app.use((req, res, next) => {
  // Forgot to call next()!
  console.log('Request received');
  // Request hangs forever
});

app.use(async (req, res, next) => {
  try {
    await someAsyncOperation();
    next(); // ✅ Remember this!
  } catch (error) {
    // ❌ Didn't handle the error properly
    console.log(error);
    // Should call next(error) or send response
  }
});
```

**Proper patterns:**
```javascript
// ✅ Good middleware patterns
app.use((req, res, next) => {
  req.correlationId = `req_${Date.now()}`;
  console.log(`[${req.correlationId}] ${req.method} ${req.path}`);
  next(); // Always call next!
});

app.use(async (req, res, next) => {
  try {
    await addUserContext(req);
    next();
  } catch (error) {
    next(error); // Pass errors to error handler
  }
});
```

### 5. **Service Timeout and Retry Strategies**
**What you'll face:**
Services that sometimes respond in 50ms, sometimes 30 seconds.

**Strategy:**
```javascript
// ✅ Timeout and retry with exponential backoff
async function reliableServiceCall(operation, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Set reasonable timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);
      
      return result;
      
    } catch (error) {
      if (attempt === retries) throw error;
      
      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 🏢 AlgoCratic Futures Context

Week 2 escalates the corporate theme to **multi-department coordination**:
- **Services** = Corporate departments (HR, Finance, Engineering)
- **API Gateway** = Executive coordination center
- **Circuit breakers** = "Algorithmic dysfunction protocols"
- **Load testing** = "Corporate stress testing under enterprise pressure"
- **Graceful degradation** = "Maintaining productivity during departmental outages"

This helps you remember: distributed systems are like managing a large corporation - departments must work independently but coordinate effectively!

---

## 🛠️ Development Workflow This Week

### Before You Start:
1. Review Week 1 async patterns - you'll use them heavily
2. Set up your Express.js server with proper error handling
3. Plan your service coordination strategy before coding

### When Services Start Failing:
1. **Check service health** endpoints first
2. **Look for patterns** - is it always the same service?
3. **Monitor response times** - slow services affect everything
4. **Test circuit breaker logic** - does it open/close properly?
5. **Verify error handling** - are errors propagating correctly?

### Performance Testing:
- Start with 1 concurrent user, then 10, then 100
- Monitor memory usage during load tests
- Check database connection pool usage
- Validate circuit breaker triggers under load
- Ensure proper cleanup of resources

---

## 🎓 Assessment Readiness

**Week 2 Assessment Goal:** "Promise coordination under load testing"

You'll be tested on:
1. **Multi-service coordination** without blocking
2. **Error handling** when services fail
3. **Performance** under concurrent load
4. **Circuit breaker implementation** for resilience
5. **Proper Express.js patterns** for production systems

**Success indicators:**
- Your system handles 25+ concurrent users gracefully
- Services can fail without breaking user experience
- Response times stay reasonable under load
- Proper error messages for debugging
- Clean resource management (no memory leaks)

---

## 🚀 Real-World Applications

After this week, you'll understand how:
- **E-commerce sites** coordinate inventory, payments, and shipping
- **Social media platforms** handle user feeds, messaging, and notifications
- **Banking systems** coordinate accounts, transactions, and fraud detection
- **Streaming services** manage user profiles, content, and recommendations
- **Enterprise systems** integrate HR, finance, and operational data

You're building the **coordination patterns** that power every major web application!

---

## 🛠️ Common Production Issues You'll Prevent

### "The Cascade Failure"
One service failure brings down the entire system.
**Prevention:** Circuit breakers and graceful degradation.

### "The Timeout Domino Effect"  
Slow services cause timeouts everywhere.
**Prevention:** Proper timeout settings and monitoring.

### "The Memory Leak Monster"
Services that don't clean up connections under load.
**Prevention:** Proper resource management and load testing.

### "The Race Condition Surprise"
Things work fine in development, break under production load.
**Prevention:** Concurrent load testing and proper state management.

The coordination patterns you learn this week will save you from **countless** production fires!