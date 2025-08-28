# Autonomic Triad

The Autonomic Triad represents the **automatic background processing and monitoring** layer of the Cognitive Cities Architecture. It mirrors the autonomic nervous system functions, handling automatic system monitoring, state management, and triggered responses without manual intervention.

## Architecture Overview

The Autonomic Triad consists of five interconnected services that work together to monitor system health, maintain state, and coordinate automatic responses:

```
┌─────────────────────────────────────────────────────────┐
│                 AUTONOMIC TRIAD                         │
│                                                         │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────┐ │
│  │ Monitoring  │    │ Process         │    │ Trigger │ │
│  │ Service     │───▶│ Director        │───▶│ Service │ │
│  │ (M-1)       │    │ (PD-2)          │    │ (T-7)   │ │
│  └─────────────┘    └─────────────────┘    └─────────┘ │
│         │                     │                  │     │
│         │            ┌─────────────────┐         │     │
│         └───────────▶│ State           │◀────────┘     │
│                      │ Management      │               │
│                      │ Service (S-8)   │               │
│                      └─────────────────┘               │
│                               │                        │
│                      ┌─────────────────┐               │
│                      │ Processing      │               │
│                      │ Service         │               │
│                      │ (P-5)           │               │
│                      └─────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

## Services

### Monitoring Service (M-1)
**Status**: 🚧 **IN DEVELOPMENT**  
**Port**: 3021  
**Description**: Automatic system monitoring and health assessment

**Capabilities**:
- Continuous system health monitoring
- Performance metrics collection and analysis
- Anomaly detection and alerting
- Resource usage tracking
- Service availability monitoring

**API Endpoints**:
- `POST /monitor` - Start monitoring a component
- `GET /metrics` - Get system metrics
- `GET /alerts` - List active alerts
- `POST /configure` - Configure monitoring parameters
- `GET /health` - Service health check
- `GET /info` - Service information

### State Management Service (S-8)
**Status**: 🚧 **IN DEVELOPMENT**  
**Port**: 3022  
**Description**: Maintains global system state and configuration

**Capabilities**:
- Centralized state management
- Configuration persistence and retrieval
- State synchronization across services
- Backup and recovery operations
- State history and versioning

**API Endpoints**:
- `GET /state` - Get current system state
- `POST /state` - Update system state
- `GET /config` - Get configuration
- `POST /config` - Update configuration
- `GET /history` - Get state history
- `POST /backup` - Create state backup
- `POST /restore` - Restore from backup
- `GET /health` - Service health check
- `GET /info` - Service information

### Process Director (PD-2)
**Status**: 🚧 **IN DEVELOPMENT**  
**Port**: 3023  
**Description**: Manages background processes and automation workflows

**Capabilities**:
- Background process orchestration
- Automated workflow execution
- Process scheduling and queuing
- Resource allocation and management
- Process dependency resolution

**API Endpoints**:
- `POST /schedule` - Schedule background process
- `GET /processes` - List active processes
- `POST /terminate` - Terminate process
- `GET /workflows` - List automation workflows
- `POST /execute` - Execute workflow
- `GET /queue` - Get process queue status
- `GET /health` - Service health check
- `GET /info` - Service information

### Processing Service (P-5)
**Status**: 🚧 **IN DEVELOPMENT**  
**Port**: 3024  
**Description**: Handles emotive and intuitive background processing

**Capabilities**:
- Emotive response processing
- Intuitive pattern recognition
- Adaptive behavior learning
- Emotional context analysis
- Subconscious processing simulation

**API Endpoints**:
- `POST /process` - Process emotive data
- `GET /patterns` - Get recognized patterns
- `POST /learn` - Learn new patterns
- `GET /emotions` - Get emotional state
- `POST /adapt` - Adapt behavior
- `GET /health` - Service health check
- `GET /info` - Service information

### Trigger Service (T-7)
**Status**: 🚧 **IN DEVELOPMENT**  
**Port**: 3025  
**Description**: Initiates automatic responses and reactions

**Capabilities**:
- Event-driven response triggering
- Automated reaction systems
- Threshold-based alerting
- Emergency response coordination
- Reflex action simulation

**API Endpoints**:
- `POST /trigger` - Manually trigger response
- `GET /triggers` - List configured triggers
- `POST /configure` - Configure trigger conditions
- `GET /responses` - List available responses
- `POST /emergency` - Emergency response activation
- `GET /health` - Service health check
- `GET /info` - Service information

## Communication Flow

1. **Continuous Monitoring**: Monitoring Service (M-1) continuously watches system health and performance
2. **State Coordination**: State Management Service (S-8) maintains current system state and configuration
3. **Process Management**: Process Director (PD-2) orchestrates background processes and workflows
4. **Emotional Processing**: Processing Service (P-5) handles emotive and intuitive processing
5. **Automatic Responses**: Trigger Service (T-7) initiates appropriate responses based on conditions
6. **Feedback Loop**: All services contribute to system adaptation and learning

The complete flow creates an autonomous processing pipeline that mirrors autonomic nervous system functions.

## Running the Autonomic Triad

### Prerequisites
- Node.js 18+
- Autonomic Triad services built and configured
- Other triads running (for integration testing)

### Start Individual Services

```bash
# Start Monitoring Service
cd autonomic-triad/monitoring-service
npm install && npm run build
npm start  # Runs on port 3021

# Start State Management Service
cd autonomic-triad/state-management-service
npm install && npm run build
npm start  # Runs on port 3022

# Start Process Director
cd autonomic-triad/process-director
npm install && npm run build
npm start  # Runs on port 3023

# Start Processing Service
cd autonomic-triad/processing-service
npm install && npm run build
npm start  # Runs on port 3024

# Start Trigger Service
cd autonomic-triad/trigger-service
npm install && npm run build
npm start  # Runs on port 3025
```

### Test the Services

```bash
# Test Monitoring Service
curl -X POST http://localhost:3021/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "component": "cerebral-triad",
    "metrics": ["cpu", "memory", "response_time"],
    "interval": 30
  }'

# Test State Management Service
curl -X GET http://localhost:3022/state

# Test Process Director
curl -X POST http://localhost:3023/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "process": "health_check_routine",
    "schedule": "*/5 * * * *",
    "priority": "medium"
  }'

# Test Processing Service
curl -X POST http://localhost:3024/process \
  -H "Content-Type: application/json" \
  -d '{
    "emotiveData": {
      "context": "system_stress",
      "level": 0.7,
      "type": "concern"
    }
  }'

# Test Trigger Service
curl -X GET http://localhost:3025/triggers
```

## Integration with Other Triads

### With Cerebral Triad
- Monitors cerebral processing performance and health
- Triggers cognitive assistance during high-load scenarios
- Maintains state of cognitive processing workflows

### With Somatic Triad
- Monitors behavioral execution and coordination
- Manages state of sensory data and motor control
- Triggers corrective actions for behavioral anomalies

### Inter-Triad Communication
- Provides system-wide monitoring and alerting
- Maintains global state consistency
- Coordinates emergency responses across all triads

## Monitoring and Health

All services expose:
- Health check endpoints (`/health`)
- Prometheus metrics (`/metrics`)
- Service information (`/info`)

### Health Check Example
```bash
# Check all services
curl http://localhost:3021/health  # Monitoring
curl http://localhost:3022/health  # State Management
curl http://localhost:3023/health  # Process Director
curl http://localhost:3024/health  # Processing
curl http://localhost:3025/health  # Trigger
```

## Configuration

Services are configured via environment variables:
- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Service port number
- `LOG_LEVEL`: Logging level
- `SERVICE_DISCOVERY_URL`: Service registry URL
- `MONITORING_INTERVAL`: Default monitoring interval (seconds)
- `STATE_PERSISTENCE_URL`: State storage backend URL
- `ALERT_WEBHOOK_URL`: Webhook for alert notifications

## Behavioral Patterns

The Autonomic Triad supports various automatic behaviors:

### Homeostatic Behaviors
- System load balancing
- Resource optimization
- Performance maintenance
- Error recovery

### Adaptive Behaviors
- Learning from system patterns
- Adjusting thresholds based on history
- Optimizing background processes
- Improving response times

### Protective Behaviors
- Emergency shutdowns
- Resource protection
- Security threat responses
- Data integrity preservation

### Maintenance Behaviors
- Automated cleanup routines
- Performance optimization
- Health check automation
- Preventive maintenance

## Future Enhancements

- [ ] Machine Learning integration for predictive monitoring
- [ ] Advanced anomaly detection algorithms
- [ ] Self-healing system capabilities
- [ ] Intelligent resource allocation
- [ ] Adaptive threshold management
- [ ] Cross-triad optimization strategies