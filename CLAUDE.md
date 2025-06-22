# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a Node.js educational framework for teaching distributed systems concepts through an 8-week progression. The course uses a theatrical "AlgoCratic Futures" framework to make complex asynchronous programming concepts engaging and memorable for students.

## Repository Structure

The project follows a week-by-week organization for building sample code and solutions:

```
course_node_infra/
├── docs/                         # Course planning and instructor materials
│   ├── NEXT-SESSION-PLAN.md      # 🎯 Detailed plan for next development session
│   └── week-04-completion-status.md # ✅ Current completion status and achievements
├── week-01-async-basics/         # ✅ Async fundamentals and Promise patterns
├── week-02-service-coordination/ # ✅ Express.js and service coordination  
├── week-03-event-driven/         # ✅ Node.js EventEmitter and message queues
├── week-04-realtime-systems/     # ✅ WebSockets, SSE, and real-time dashboards
├── week-05-saga-patterns/        # 🎯 NEXT: Distributed transactions and coordination
├── week-06-observability/        # Monitoring, tracing, circuit breakers
├── week-07-deployment/           # Docker Compose and container orchestration
├── week-08-production/           # Production-ready microservices scaffold
├── capstone-scaffold/            # Complete infrastructure for student projects
└── instructor-resources/         # Teaching materials and troubleshooting guides
```

Each weekly folder contains:
- `sample-code/` - Working examples for demonstrations
- `exercises/` - Student assignments and starter templates
- `solutions/` - Complete solutions with detailed explanations
- `README.md` - Week-specific learning objectives and setup instructions

## Technology Stack

- **Node.js**: Primary coordination layer and API gateway
- **Express.js**: Web framework for API development
- **Kafka**: Message bus for event-driven architecture
- **Docker/Docker Compose**: Container orchestration
- **WebSocket**: Real-time communication features
- **Python/Java**: Business logic services (integrated via Node.js coordination)

## Course Architecture

### 8-Week Learning Progression:

**Weeks 1-2: Async Foundation**
- Promise.all() coordination patterns
- Non-blocking I/O demonstration
- Multi-service API gateway development
- Error handling in async contexts

**Weeks 3-4: Event-Driven & Real-time Architecture** ✅
- Node.js EventEmitter patterns
- "Kafka-enough" message bus implementation  
- WebSocket and Server-Sent Events for real-time communication
- Real-time dashboards with corporate monitoring

**Weeks 5-6: Advanced Coordination** 🎯
- Saga pattern for distributed transactions
- Compensation mechanisms for workflow failures
- Real-time saga monitoring integration
- Circuit breaker resilience patterns

**Weeks 7-8: Production Deployment**
- Container orchestration with Docker Compose
- Service discovery and health monitoring
- Production-ready deployment scripts
- Microservices scaffold for capstone projects

## Development Commands

Each weekly module includes its own package.json with consistent commands:

```bash
npm install          # Install dependencies for current week
npm run dev         # Start development server with hot reload
npm run test        # Run all tests for the week's code
npm run lint        # ESLint validation
npm run build       # Build production-ready assets
npm run demo        # Run the week's demonstration scenario
npm run docker:up   # Start containerized services
npm run docker:down # Stop and clean up containers
```

For the complete system:
```bash
npm run setup:all    # Initialize all weekly modules
npm run test:all     # Run tests across all weeks
npm run deploy:scaffold # Deploy complete capstone scaffold
```

## Educational Framework

### AlgoCratic Futures Theatrical Approach
- Uses satirical corporate dystopian theme to make concepts memorable
- Instructors learn alongside students (authentic discovery process)
- Technical struggles become "algorithmic recalibration" moments
- Students experience genuine async problems before discovering solutions

### Assessment Strategy
- **Week 2**: Promise coordination under load testing ✅
- **Week 4**: Event-driven architecture with multiple services ✅  
- **Week 6**: Distributed system failure simulation and recovery 🎯
- **Week 8**: Complete microservices deployment demonstration

## Code Quality Standards

- All async functions must include comprehensive error handling
- Services must gracefully degrade when dependencies fail
- APIs require OpenAPI documentation
- Minimum 80% test coverage for coordination logic
- Docker health checks for all containerized services
- Distributed tracing headers for all cross-service calls

## Multi-Language Integration & Kafka Migration Path

Node.js serves as the coordination layer with seamless enterprise migration:
- **Node.js**: API gateway, message routing, real-time WebSocket features
- **"Kafka-enough" Message Bus**: Educational simplicity → Enterprise Kafka migration
- **Real-time Integration**: WebSocket + SSE patterns → Kafka Streams
- **Enterprise Ready**: All patterns designed for production Kafka deployment

### Current Implementation (Weeks 1-4 Complete):
- ✅ Async foundations with Promise coordination
- ✅ Express.js service architecture with load testing
- ✅ EventEmitter and streams with "Kafka-enough" message bus
- ✅ WebSocket/SSE real-time systems with dashboard integration

### Next Development (Week 5 Focus):
- 🎯 Saga patterns for distributed transaction coordination
- 🎯 Integration of Weeks 1-4 foundations into enterprise workflows
- 🎯 Real-time saga monitoring using Week 4 infrastructure
- 🎯 Compensation mechanisms for complex workflow failures

## Common Development Workflows

### Adding New Week Content:
1. Create `week-XX-topic/` directory structure
2. Initialize package.json with standard scripts
3. Build sample-code/ with working demonstrations
4. Create exercises/ with starter templates and tests
5. Provide complete solutions/ with explanations
6. Update main README.md with week overview

### Testing Multi-Service Systems:
1. Use Docker Compose for consistent environments
2. Implement load testing for concurrent request handling
3. Simulate service failures for resilience testing
4. Validate cross-language communication patterns

### Debugging Distributed Systems:
1. Use correlation IDs for request tracing
2. Implement comprehensive logging at service boundaries
3. Monitor Kafka consumer lag and message flow
4. Set up health check endpoints for all services

## Instructor Support

The repository includes comprehensive instructor resources:
- Pre-class preparation guides for new Node.js concepts
- Common student error patterns and debugging approaches
- Kafka troubleshooting and Docker Compose fixes
- Performance testing tools and load generation scripts

## Capstone Integration

The final scaffold provides production-ready infrastructure including:
- Express.js API gateway with authentication middleware
- WebSocket server for real-time features
- Kafka producer/consumer services with error handling
- Docker Compose orchestration for multi-service deployment
- Monitoring and logging infrastructure
- Environment variable management and configuration

This scaffold allows capstone teams to focus on innovative application features rather than infrastructure complexity while ensuring they deploy with professional-grade distributed systems architecture.

## 🎯 NEXT SESSION DEVELOPMENT PRIORITIES

**Current Status**: Week 4 Complete - Real-time Systems & WebSocket Communication ✅

**Primary Focus**: Week 5 - Saga Patterns & Distributed Transaction Coordination

### Key Implementation Goals:
1. **Corporate Workflow Orchestrator** - Multi-step transaction coordination with compensation
2. **Saga Integration** - Bridge Weeks 1-4 foundations into enterprise workflow patterns  
3. **Real-time Monitoring** - Integrate saga execution with Week 4 dashboard infrastructure
4. **AlgoCratic Scenarios** - Employee onboarding, budget approval, system deployment sagas
5. **Assessment Framework** - "Distributed system failure simulation and recovery" testing

### Architecture Progression:
- Week 1 (Async) → Transaction step execution
- Week 2 (Services) → Cross-service coordination  
- Week 3 (Events) → Saga event choreography
- Week 4 (Real-time) → Live transaction monitoring
- **Week 5 (Sagas) → Enterprise workflow orchestration** 🎯

### Detailed Planning:
- See `docs/NEXT-SESSION-PLAN.md` for comprehensive development strategy
- See `docs/week-04-completion-status.md` for current achievements summary
- Todo list updated with Week 5 saga pattern implementation tasks

**Ready for enterprise-grade distributed transaction coordination development!** 🚀