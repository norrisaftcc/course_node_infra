# 📚 Week 3 Student Notes: Event-Driven Architecture
*"Things you'll probably run into and how to handle them"*

## 🎯 What You're Learning This Week

Moving from Week 2's service coordination to **event-driven patterns** - where systems react to events rather than making direct calls. This is how modern systems like Slack, Discord, and enterprise apps handle real-time updates.

---

## 🚨 Common Student Challenges & Solutions

### 1. **EventEmitter Memory Leaks**
**What you'll see:**
```
(node:1234) MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
```

**Why it happens:**
- Adding listeners in loops without removing them
- Creating new EventEmitter instances repeatedly
- Forgetting to clean up event listeners

**How to fix:**
```javascript
// ❌ BAD: Creates memory leak
for (let i = 0; i < 1000; i++) {
  emitter.on('data', (data) => console.log(data));
}

// ✅ GOOD: Reuse listeners or remove them
const dataHandler = (data) => console.log(data);
emitter.on('data', dataHandler);
// Later: emitter.removeListener('data', dataHandler);
```

### 2. **Event Handler Execution Order Confusion**
**What you'll see:**
Events firing in unexpected order, handlers not executing when expected.

**Key concepts:**
- Event listeners execute in **registration order**
- `emitter.once()` removes itself after first execution
- `emitter.prependListener()` adds to beginning of handler list

**Pro tip:** Use descriptive event names and log execution order during development.

### 3. **Stream Backpressure Issues**
**What you'll see:**
```
Error: write after end
EPIPE (broken pipe)
High memory usage
```

**Why it happens:**
- Writing to streams faster than they can process
- Not handling `drain` events properly
- Forgetting to end streams

**How to handle:**
```javascript
// ✅ GOOD: Handle backpressure
const writeToStream = (data, stream) => {
  if (!stream.write(data)) {
    // Stream is full, wait for drain
    stream.once('drain', () => {
      console.log('Stream ready for more data');
    });
  }
};
```

### 4. **Async Event Handler Problems**
**What you'll see:**
Unhandled promise rejections, events firing before async handlers complete.

**Common mistake:**
```javascript
// ❌ BAD: Async handler without error handling
emitter.on('process', async (data) => {
  await someAsyncOperation(data); // Could throw!
});
```

**Better approach:**
```javascript
// ✅ GOOD: Proper async event handling
emitter.on('process', async (data) => {
  try {
    await someAsyncOperation(data);
    emitter.emit('success', data);
  } catch (error) {
    emitter.emit('error', error);
  }
});
```

### 5. **Event Name Typos & Debugging**
**What you'll see:**
Events that "don't work" - actually just misspelled event names.

**Debugging tricks:**
```javascript
// 🔍 Debug all events
const originalEmit = emitter.emit;
emitter.emit = function(event, ...args) {
  console.log(`🎭 Event: ${event}`, args);
  return originalEmit.apply(this, [event, ...args]);
};
```

---

## 🏢 AlgoCratic Futures Context

This week, you're upgrading from "service coordination" to "corporate event orchestration." Think:
- **Events** = Corporate announcements ("New hire!", "Project completed!")
- **Streams** = Data pipelines (processing employee productivity metrics)
- **Pub/Sub** = Department communication systems

The satirical corporate theme helps remember concepts:
- **Event loops** = "Corporate meeting cycles"
- **Backpressure** = "Overwhelmed middle management"
- **Memory leaks** = "Endless email chains"

---

## 🛠️ Development Workflow This Week

### Before You Start:
1. Run `npm install` in the week-03-event-driven directory
2. Understand the EventEmitter vs. regular function calls difference
3. Get comfortable with async/await from Weeks 1-2

### When Things Break:
1. **Check event names** - case-sensitive!
2. **Add debug logging** to see event flow
3. **Watch memory usage** with `process.memoryUsage()`
4. **Use proper error handling** for async event handlers

### Performance Tips:
- Use `emitter.listenerCount(event)` to monitor listener buildup
- Consider `emitter.setMaxListeners(n)` for legitimate high listener counts
- Profile stream processing with `console.time()`

---

## 🎓 Assessment Expectations

**Week 4 Goal (from CLAUDE.md):** "Event-driven architecture with multiple services"

You'll need to demonstrate:
1. **EventEmitter patterns** that coordinate multiple services
2. **Stream processing** that handles data efficiently
3. **Pub/Sub messaging** between different components
4. **Error resilience** when events fail or services disconnect

---

## 🚀 Success Strategies

### Master These Patterns:
1. **Observer Pattern** - One event, multiple handlers
2. **Publisher/Subscriber** - Decoupled event distribution
3. **Stream Processing** - Handling data flows efficiently
4. **Event Sourcing** - Using events as the source of truth

### Think Like a System Architect:
- Events should be **meaningful business events** ("UserRegistered", not "data")
- Design for **eventual consistency** - events may arrive out of order
- Plan for **event replay** and **error recovery**
- Consider **event versioning** for evolving systems

### Debug Like a Pro:
- Log events with timestamps and correlation IDs
- Use tools like `events.once()` for testing
- Monitor listener counts and memory usage
- Create event flow diagrams for complex systems

---

## 💡 Real-World Applications

After this week, you'll understand how:
- **Slack** handles real-time messaging
- **Netflix** processes viewing events
- **E-commerce sites** coordinate inventory/orders/shipping
- **Banking systems** handle transaction events
- **IoT platforms** process sensor data streams

The patterns you learn here scale from simple scripts to enterprise systems handling millions of events per second!