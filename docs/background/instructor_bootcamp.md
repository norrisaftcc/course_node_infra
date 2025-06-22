# NODE.JS INFRASTRUCTURE INSTRUCTOR BOOTCAMP
## *5-Week Intensive for Experienced Programmers*

**TARGET**: Instructor preparation for 8-week student curriculum  
**BACKGROUND**: C++/Python experience, agile methodology familiarity  
**OBJECTIVE**: Build working microservices scaffold + teaching competency  
**TIME COMMITMENT**: ~8 hours/week hands-on implementation

---

## BOOTCAMP PHILOSOPHY

You're learning Node.js to teach it, not to become a Node.js specialist. Focus on understanding patterns well enough to guide students through discovery, anticipate their confusion points, and debug their implementations.

**Core Insight**: Node.js async patterns are the same coordination patterns you use in agile project management, just applied to code.

---

## WEEK 1: ASYNC FOUNDATIONS + MENTAL MODEL SHIFT

### Hour 1-2: Environment + Syntax Speed Run
```bash
# Setup (30 min)
node --version  # Install LTS if needed
npm init -y
npm install express axios kafkajs

# Syntax mapping from your languages (30 min)
```

**Python → Node.js Mental Mapping:**
```javascript
// Python: def function(param):
function functionName(param) { }
const functionName = (param) => { }

// Python: try/except
try { } catch (error) { }

// Python: with open() as f:
const fs = require('fs').promises;
const data = await fs.readFile('file.txt', 'utf8');

// Python: requests.get()
const response = await fetch('http://api.example.com');
const data = await response.json();
```

**Skip**: Detailed syntax tutorials. You'll pick this up as you build.

### Hour 3-4: Event Loop Understanding (Critical for Teaching)
**Core Concept**: Single-threaded but non-blocking vs Python's GIL complexity.

```javascript
// This is the pattern students will struggle with most:
console.log('Start');

setTimeout(() => {
    console.log('Async operation');
}, 0);

console.log('End');
// Output: Start, End, Async operation

// Students expect: Start, Async operation, End
```

**Teaching Insight**: Students from C++ background expect threads. Students from Python background expect sequential execution. The event loop is fundamentally different from both.

### Hour 5-6: Promise Patterns (Your Core Teaching Tool)
```javascript
// Pattern 1: Sequential (like normal function calls)
async function sequential() {
    const result1 = await operation1();
    const result2 = await operation2(result1);  // Depends on result1
    return result2;
}

// Pattern 2: Parallel (like coordinating team members)
async function parallel() {
    const [result1, result2] = await Promise.all([
        operation1(),  // Independent operations
        operation2()
    ]);
    return combine(result1, result2);
}

// Pattern 3: Resilient (like project risk management)
async function resilient() {
    const results = await Promise.allSettled([
        operation1(),
        operation2(),
        operation3()
    ]);
    
    // System works even if some operations fail
    return results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
}
```

### Hour 7-8: Build Your First Coordination Service
**Objective**: API gateway that coordinates 2 Python services

```javascript
// app.js - Your teaching demonstration
const express = require('express');
const app = express();

app.get('/api/user/:id', async (req, res) => {
    try {
        const [profile, orders] = await Promise.all([
            fetch(`http://localhost:5000/profile/${req.params.id}`),
            fetch(`http://localhost:5001/orders/${req.params.id}`)
        ]);
        
        res.json({
            profile: await profile.json(),
            orders: await orders.json(),
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Gateway running on 3000'));
```

**Build supporting Python services** (minimal Flask apps for testing):
```python
# profile_service.py
from flask import Flask, jsonify
import time

app = Flask(__name__)

@app.route('/profile/<user_id>')
def get_profile(user_id):
    time.sleep(0.5)  # Simulate DB lookup
    return jsonify({"user_id": user_id, "name": f"User {user_id}"})

if __name__ == '__main__':
    app.run(port=5000)
```

**Week 1 Deliverable**: Working 3-service system you can demo to students.

---

## WEEK 2: EXPRESS + SERVICE PATTERNS

### Hour 1-2: Express Essentials (Skip Tutorials, Build Directly)
```javascript
// middleware-demo.js - Build this to understand the pattern
const express = require('express');
const app = express();

// Middleware = functions that process requests in order
app.use(express.json());

// Request tracing (you'll teach this in Week 6 to students)
app.use((req, res, next) => {
    req.startTime = Date.now();
    req.traceId = Math.random().toString(36).substring(7);
    next();
});

// Authentication simulation
app.use('/api/protected', (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    next();
});

// Your actual routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/protected/data', async (req, res) => {
    // Simulate complex operation
    await new Promise(resolve => setTimeout(resolve, 100));
    res.json({ 
        data: 'sensitive information',
        processingTime: Date.now() - req.startTime 
    });
});

app.listen(3000);
```

### Hour 3-4: Error Handling Patterns (Critical for Student Success)
```javascript
// error-patterns.js - Students will struggle with this
class ServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

// Pattern: Async error handling
async function callExternalService(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new ServiceError(`Service returned ${response.status}`, response.status);
        }
        return await response.json();
    } catch (error) {
        if (error instanceof ServiceError) throw error;
        throw new ServiceError(`Network error: ${error.message}`, 503);
    }
}

// Pattern: Centralized error handling
app.use((error, req, res, next) => {
    console.error(`[${req.traceId}] Error:`, error.message);
    
    if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
});
```

### Hour 5-6: Service Coordination Patterns
```javascript
// coordination-patterns.js - Your main teaching examples
class ServiceCoordinator {
    constructor() {
        this.services = {
            user: 'http://user-service:8000',
            order: 'http://order-service:8001',
            inventory: 'http://inventory-service:8002'
        };
    }
    
    // Pattern 1: Fan-out aggregation
    async getUserDashboard(userId) {
        const [user, orders, recommendations] = await Promise.allSettled([
            this.callService('user', `/users/${userId}`),
            this.callService('order', `/orders?userId=${userId}`),
            this.callService('inventory', `/recommendations/${userId}`)
        ]);
        
        return {
            user: user.status === 'fulfilled' ? user.value : null,
            orders: orders.status === 'fulfilled' ? orders.value : [],
            recommendations: recommendations.status === 'fulfilled' ? recommendations.value : []
        };
    }
    
    // Pattern 2: Sequential dependency chain
    async processOrder(orderData) {
        // Step 1: Validate inventory
        const inventory = await this.callService('inventory', '/check', {
            method: 'POST',
            body: JSON.stringify({ items: orderData.items })
        });
        
        if (!inventory.available) {
            throw new ServiceError('Insufficient inventory', 400);
        }
        
        // Step 2: Create order (depends on step 1)
        const order = await this.callService('order', '/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        // Step 3: Reserve inventory (depends on step 2)
        await this.callService('inventory', '/reserve', {
            method: 'POST',
            body: JSON.stringify({ orderId: order.id, items: orderData.items })
        });
        
        return order;
    }
}
```

### Hour 7-8: Build Multi-Service Coordination System
**Objective**: Create the coordination patterns students will learn in weeks 2-3.

Build a 4-service system:
1. Node.js API gateway (your implementation)
2. Python user service (simple CRUD)
3. Python order service (business logic)
4. Python inventory service (data processing)

**Week 2 Deliverable**: Multi-service system with error handling you can break/fix for demonstrations.

---

## WEEK 3: KAFKA + EVENT-DRIVEN ARCHITECTURE

### Hour 1-2: Kafka Setup + Conceptual Understanding
```yaml
# docker-compose.yml - Use this to avoid Kafka installation complexity
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      
  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

**Mental Model for Teaching**: Kafka is persistent event storage. Node.js EventEmitter forgets events immediately. Kafka remembers them forever.

### Hour 3-4: Producer/Consumer Patterns
```javascript
// kafka-patterns.js - Core patterns for student teaching
const { Kafka } = require('kafkajs');

const kafka = Kafka({
    clientId: 'api-gateway',
    brokers: ['localhost:9092']
});

// Pattern 1: Event publishing (Node.js → Kafka)
class EventPublisher {
    constructor() {
        this.producer = kafka.producer();
    }
    
    async publish(topic, event) {
        await this.producer.send({
            topic,
            messages: [{
                key: event.id,
                value: JSON.stringify(event),
                timestamp: Date.now().toString()
            }]
        });
    }
}

// Pattern 2: Event consumption (Kafka → Python services)
class EventConsumer {
    constructor(groupId, topics) {
        this.consumer = kafka.consumer({ groupId });
        this.topics = topics;
    }
    
    async start(messageHandler) {
        await this.consumer.subscribe({ topics: this.topics });
        
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const event = JSON.parse(message.value.toString());
                await messageHandler(topic, event);
            }
        });
    }
}

// Usage in Express routes
const publisher = new EventPublisher();

app.post('/api/orders', async (req, res) => {
    const order = { 
        id: generateId(), 
        ...req.body, 
        status: 'pending',
        timestamp: new Date()
    };
    
    // Store immediately
    await saveOrderToDatabase(order);
    
    // Publish for async processing
    await publisher.publish('order-events', {
        type: 'order.created',
        orderId: order.id,
        userId: order.userId,
        items: order.items
    });
    
    res.status(201).json({ orderId: order.id, status: 'processing' });
});
```

### Hour 5-6: Cross-Language Event Integration
```python
# Python consumer example (students will implement this)
from kafka import KafkaConsumer
import json
import time

def process_order_event(event):
    """This runs in Python while coordination happens in Node.js"""
    print(f"Processing order {event['orderId']}")
    
    # Simulate complex business logic
    time.sleep(2)
    
    # Update inventory
    update_inventory(event['items'])
    
    # Send confirmation email
    send_email(event['userId'], event['orderId'])
    
    print(f"Order {event['orderId']} completed")

consumer = KafkaConsumer(
    'order-events',
    bootstrap_servers=['localhost:9092'],
    group_id='order-processor',
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

for message in consumer:
    event = message.value
    if event['type'] == 'order.created':
        process_order_event(event)
```

### Hour 7-8: Build Event-Driven Order System
**Objective**: Complete order processing pipeline with async coordination.

**Architecture**:
- Node.js API accepts orders, publishes events
- Python order processor consumes events, handles business logic
- Python inventory service updates stock levels
- Node.js WebSocket service sends real-time updates to users

**Week 3 Deliverable**: Event-driven system that processes orders asynchronously.

---

## WEEK 4: ADVANCED PATTERNS + MONITORING

### Hour 1-2: Saga Pattern Implementation
```javascript
// saga-pattern.js - Complex pattern students learn in Week 5
class OrderSaga {
    constructor() {
        this.steps = [];
        this.compensations = [];
    }
    
    async execute(orderData) {
        try {
            // Step 1: Reserve inventory
            const reservation = await this.reserveInventory(orderData);
            this.addCompensation(() => this.cancelReservation(reservation.id));
            
            // Step 2: Process payment
            const payment = await this.processPayment(orderData);
            this.addCompensation(() => this.refundPayment(payment.id));
            
            // Step 3: Create shipment
            const shipment = await this.createShipment(orderData);
            this.addCompensation(() => this.cancelShipment(shipment.id));
            
            return { success: true, orderId: orderData.id };
            
        } catch (error) {
            // Execute compensations in reverse order
            await this.compensate();
            throw error;
        }
    }
    
    addCompensation(compensationFn) {
        this.compensations.unshift(compensationFn);  // Add to front
    }
    
    async compensate() {
        for (const compensation of this.compensations) {
            try {
                await compensation();
            } catch (error) {
                console.error('Compensation failed:', error);
            }
        }
    }
}
```

### Hour 3-4: Monitoring and Observability
```javascript
// monitoring.js - Essential for production systems
class RequestTracer {
    static middleware() {
        return (req, res, next) => {
            req.traceId = req.headers['x-trace-id'] || this.generateTraceId();
            req.startTime = Date.now();
            
            // Propagate trace ID to downstream calls
            const originalFetch = global.fetch;
            global.fetch = (url, options = {}) => {
                options.headers = {
                    ...options.headers,
                    'x-trace-id': req.traceId
                };
                return originalFetch(url, options);
            };
            
            res.on('finish', () => {
                console.log({
                    traceId: req.traceId,
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration: Date.now() - req.startTime,
                    timestamp: new Date().toISOString()
                });
            });
            
            next();
        };
    }
    
    static generateTraceId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

// Health check endpoints
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

app.get('/health/ready', async (req, res) => {
    try {
        // Check dependencies
        await Promise.all([
            checkDatabase(),
            checkKafka(),
            checkExternalServices()
        ]);
        res.json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'not ready', error: error.message });
    }
});
```

### Hour 5-6: Performance Optimization Patterns
```javascript
// performance-patterns.js - Patterns students learn in advanced weeks
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

// Pattern 1: Caching
async function getCachedUserProfile(userId) {
    const cacheKey = `user:${userId}`;
    let profile = cache.get(cacheKey);
    
    if (!profile) {
        profile = await fetchUserProfile(userId);
        cache.set(cacheKey, profile);
    }
    
    return profile;
}

// Pattern 2: Connection pooling
const pool = require('generic-pool');

const dbPool = pool.createPool({
    create: () => createDatabaseConnection(),
    destroy: (connection) => connection.close()
}, {
    max: 10,        // Maximum connections
    min: 2,         // Minimum connections
    acquireTimeoutMillis: 3000,
    idleTimeoutMillis: 30000
});

// Pattern 3: Circuit breaker
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureCount = 0;
        this.threshold = threshold;
        this.timeout = timeout;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
    }
    
    async call(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }
        
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
    
    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
        }
    }
}
```

### Hour 7-8: Integration Testing Setup
```javascript
// test-setup.js - Students need this for Week 8
const request = require('supertest');
const app = require('./app');

describe('Microservices Integration', () => {
    test('order processing pipeline', async () => {
        // Create order via API
        const orderResponse = await request(app)
            .post('/api/orders')
            .send({
                userId: 'user123',
                items: [{ id: 'item1', quantity: 2 }]
            })
            .expect(201);
            
        const orderId = orderResponse.body.orderId;
        
        // Wait for async processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify order was processed
        const statusResponse = await request(app)
            .get(`/api/orders/${orderId}`)
            .expect(200);
            
        expect(statusResponse.body.status).toBe('completed');
    });
});
```

**Week 4 Deliverable**: Production-ready patterns implemented and tested.

---

## WEEK 5: DEPLOYMENT + TEACHING PREPARATION

### Hour 1-2: Container Orchestration
```yaml
# docker-compose-full.yml - Complete teaching environment
version: '3.8'
services:
  api-gateway:
    build: 
      context: ./node-gateway
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - KAFKA_BROKER=kafka:9092
      - USER_SERVICE_URL=http://user-service:8000
      - ORDER_SERVICE_URL=http://order-service:8001
    depends_on:
      - kafka
      - user-service
      - order-service
    restart: unless-stopped
    
  user-service:
    build: ./python-user-service
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/users
      - KAFKA_BROKER=kafka:9092
    depends_on:
      - postgres
      - kafka
      
  order-service:
    build: ./python-order-service
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/orders
      - KAFKA_BROKER=kafka:9092
    depends_on:
      - postgres
      - kafka
      
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=microservices
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    depends_on:
      - zookeeper
      
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

volumes:
  postgres_data:
```

### Hour 3-4: Student Stumbling Block Preparation
**Common Issues Students Will Face**:

1. **Async/Await Confusion**:
```javascript
// Students will write this (wrong):
async function badExample() {
    const data = fs.readFile('file.txt'); // Missing await!
    console.log(data); // Logs Promise object
}

// Teach them this (right):
async function goodExample() {
    const data = await fs.readFile('file.txt', 'utf8');
    console.log(data); // Logs file contents
}
```

2. **Error Handling Gaps**:
```javascript
// Students will forget try/catch:
async function forgetfulExample() {
    const data = await fs.readFile('nonexistent.txt'); // Will crash
}

// Always teach with error handling:
async function carefulExample() {
    try {
        const data = await fs.readFile('file.txt', 'utf8');
        return data;
    } catch (error) {
        console.error('File read failed:', error.message);
        return null;
    }
}
```

3. **Kafka Connection Issues**:
```javascript
// Common student mistake - not waiting for connection:
const producer = kafka.producer();
producer.send({ topic: 'test', messages: [{ value: 'hello' }] }); // Fails!

// Correct pattern:
const producer = kafka.producer();
await producer.connect();
await producer.send({ topic: 'test', messages: [{ value: 'hello' }] });
await producer.disconnect();
```

### Hour 5-6: Teaching Material Preparation
**Create Student Handouts**:

1. **Quick Reference Cards**:
```javascript
// Async Patterns Cheat Sheet
// Sequential: one after another
const result1 = await operation1();
const result2 = await operation2(result1);

// Parallel: at the same time
const [result1, result2] = await Promise.all([
    operation1(),
    operation2()
]);

// Resilient: some can fail
const results = await Promise.allSettled([operations]);
```

2. **Debugging Checklist**:
   - Is await keyword present?
   - Is function marked as async?
   - Is error handling implemented?
   - Are Kafka connections properly opened/closed?
   - Are service URLs correct in environment variables?

### Hour 7-8: Final System Integration + Documentation
**Build Complete Teaching Scaffold**:
- All services containerized and documented
- Troubleshooting guide for common issues
- Load testing scripts for demonstrations
- Git repository structure for student assignments

**Create Teaching Assets**:
- PowerPoint slides with code examples
- Live demo scripts you can run
- Assignment templates with starter code
- Assessment rubrics for each week

**Week 5 Deliverable**: Complete teaching environment ready for student delivery.

---

## INSTRUCTOR READINESS CHECKLIST

### Technical Competencies Achieved:
- [ ] Can explain event loop behavior and common misconceptions
- [ ] Can demonstrate Promise.all() vs Promise.allSettled() patterns
- [ ] Can set up and troubleshoot Kafka Docker environment
- [ ] Can implement saga pattern for distributed transactions
- [ ] Can debug async code and help students with common errors
- [ ] Can deploy multi-service system using Docker Compose

### Teaching Materials Prepared:
- [ ] Working demonstration system with intentional break points
- [ ] Student assignment templates with starter code
- [ ] Common error examples and solutions
- [ ] Week-by-week progression with realistic time estimates
- [ ] Assessment rubrics for technical skills and system thinking

### Student Anticipation:
- [ ] Understand which concepts transfer from Python/C++ background
- [ ] Know where students typically struggle (async syntax, error handling)
- [ ] Have backup explanations for event loop and coordination patterns
- [ ] Can demonstrate why async patterns matter for distributed systems

---

## POST-BOOTCAMP: CONTINUOUS LEARNING

### Ongoing Development Areas:
- **Performance Optimization**: Monitor how your teaching system performs under student load
- **New Patterns**: Stay current with Node.js ecosystem changes
- **Student Feedback**: Adapt based on what actually confuses students vs predictions

### Advanced Topics (For Future Semesters):
- GraphQL federation for complex API coordination
- WebSocket clustering for real-time features at scale
- Kubernetes deployment for production environments
- Advanced Kafka patterns (exactly-once processing, schema registry)

### Community Resources:
- Node.js official documentation and best practices
- Express.js documentation for middleware patterns
- Kafka documentation for event-driven architecture
- Docker documentation for containerization

---

**BOOTCAMP SUCCESS CRITERIA**: You can confidently guide students through async pattern discovery, anticipate their confusion points, debug their implementations, and explain why these patterns matter for distributed systems architecture.

**THE INSTRUCTOR'S ALGORITHM PROVIDES CLEAR LEARNING PATHS.**