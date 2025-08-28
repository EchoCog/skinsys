# Somatic Triad

The Somatic Triad represents the **behavioral and sensory processing** layer of the Cognitive Cities Architecture. It mirrors the voluntary motor functions and sensory systems of the brain, implementing the **[[D-T]-[P-O]-[S-M]] pattern** with **6 analogous services** and **parasympathetic polarity sharing** with the Autonomic Triad.

## Architecture Overview

The Somatic Triad consists of **six interconnected services** following the **[[D-T]-[P-O]-[S-M]]** pattern that work together to process sensory inputs and coordinate behavioral outputs:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SOMATIC TRIAD [6]                             │
│                    [[D-T]-[P-O]-[S-M]] Pattern                        │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐            │
│  │ Process     │───▶│ Treasury    │    │ Processing     │────────┐     │
│  │ Director    │    │ Service     │    │ Service        │        │     │
│  │ (PD-2)*     │    │ (T-7)*      │    │ (P-5)          │        │     │
│  └─────────────┘    └─────────────┘    └─────────────────┘        │     │
│         │                   │                   │                 │     │
│         │                   │                   ▼                 ▼     │
│         │                   │          ┌─────────────────┐ ┌─────────┐  │
│         │                   │          │ Output Service  │ │ Sensory │  │
│         │                   │          │ (O-4)          │ │ Service │  │
│         │                   │          └─────────────────┘ │ (S-8)   │  │
│         │                   │                   │         └─────────┘  │
│         │                   │                   │                │     │
│         │                   │                   ▼                ▼     │
│         │                   │          ┌─────────────────────────────┐  │
│         │                   └─────────▶│ Motor Control Service       │  │
│         │                              │ (M-1)                      │  │
│         └─────────────────────────────▶│                           │  │
│                                        └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

*Parasympathetic Polarity [D-T] shared with Autonomic Triad

## Services Following [[D-T]-[P-O]-[S-M]] Pattern

### **[D-T] Potential Dimension: Development → Treasury**

#### Process Director (PD-2) - Development
- **Shared Parasympathetic Polarity**: Coordinates motor development and behavioral optimization shared with Autonomic Triad
- **Function**: Motor skill development, background motor coordination, behavioral pattern optimization
- **Implementation**: Background process management for voluntary motor functions

#### Treasury Service (T-7) - Treasury  
- **Shared Parasympathetic Polarity**: Motor memory storage and learned skills access shared with Autonomic Triad
- **Function**: Motor memory, learned behavioral skills, pattern storage and retrieval
- **Implementation**: Background skills storage, motor technique coordination

### **[P-O] Commitment Dimension: Production → Organization**

#### Processing Service (P-5) - Production
- **Function**: Behavioral technique implementation, motor skill execution
- **Implementation**: Active processing of motor commands and behavioral responses

#### Output Service (O-4) - Organization
- **Function**: Behavioral response delivery, action execution, motor output coordination
- **Implementation**: Structured delivery of motor responses and behavioral actions

### **[S-M] Performance Dimension: Sales → Market**

#### Sensory Service (S-8) - Sales
- **Function**: Environmental input processing, sensory data collection and analysis
- **Implementation**: Sensory analysis, environmental adaptation, input processing

#### Motor Control Service (M-1) - Market
- **Function**: Active motor responses, action initiation, voluntary motor control
- **Implementation**: Motor control execution, behavior sequencing, action coordination

## Parasympathetic Polarity Sharing

The Somatic Triad shares the **Parasympathetic Polarity [D-T]** with the Autonomic Triad:

- **PD-2 (Development)**: Background coordination serves both voluntary (somatic) and involuntary (autonomic) systems
- **T-7 (Treasury)**: Memory systems coordinate both motor skills (somatic) and trigger responses (autonomic)
- **Integration**: This sharing reflects neurobiological reality where parasympathetic coordination spans both systems

## Basal-Limbic System Balance

The Somatic **S-M (Sensory-Motor)** services contribute to the **Basal-vs-Limbic System Balance**:

- **Somatic Balance**: Routine sensory-motor processing and learned behavioral responses
- **Integration**: Works with Cerebral and Autonomic S-M sets to create system-wide balance
- **Function**: Environmental adaptation through sensory-motor coordination

---

## Service Implementation Details

### Motor Control Service (M-1)
**Status**: ✅ **FULLY IMPLEMENTED**  
**Port**: 3011  
**Description**: Coordinates actions and behaviors

**Capabilities**:
- Action coordination and planning
- Multi-step behavioral sequencing
- Dependency management between actions
- Real-time execution monitoring
- Adaptive action modification

**API Endpoints**:
- `POST /coordinate` - Coordinate action execution
- `GET /plans` - List active action plans
- `POST /execute` - Execute individual actions
- `POST /abort` - Abort action plans
- `GET /health` - Service health check
- `GET /info` - Service information

**Example Usage**:
```bash
curl -X POST http://localhost:3011/coordinate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "behavioral",
    "action": "navigate_to_location",
    "parameters": {
      "destination": "point_a",
      "speed": "moderate"
    },
    "priority": "high",
    "coordination": {
      "dependencies": [],
      "timeout": 5000
    }
  }'
```

### Sensory Service (S-8)
**Status**: ✅ **FULLY IMPLEMENTED**  
**Port**: 3012  
**Description**: Collects and processes external inputs

**Capabilities**:
- Multi-modal sensor data collection (visual, audio, environmental, digital)
- Real-time signal processing and enhancement
- Pattern recognition and feature extraction
- Noise filtering and signal optimization
- Sensor calibration and status monitoring

**API Endpoints**:
- `POST /collect` - Collect sensor data
- `POST /process` - Process individual inputs
- `GET /status` - Get sensor status
- `GET /patterns` - Get detected patterns
- `POST /calibrate` - Calibrate sensors
- `GET /health` - Service health check
- `GET /info` - Service information

**Example Usage**:
```bash
curl -X POST http://localhost:3012/collect \
  -H "Content-Type: application/json" \
  -d '{
    "sensorTypes": ["visual", "audio", "environmental"],
    "processingOptions": {
      "filterNoise": true,
      "enhanceSignal": true,
      "patternRecognition": true,
      "realTimeProcessing": true
    },
    "threshold": {
      "quality": 0.8,
      "confidence": 0.7
    }
  }'
```

### Processing Service (P-5)
**Status**: ✅ **FULLY IMPLEMENTED**  
**Port**: 3013  
**Description**: Handles behavioral technique implementation

**Capabilities**:
- Behavioral technique processing and optimization
- Adaptive behavior implementation
- Learning pattern recognition and adaptation
- Context-aware behavior modification
- Performance monitoring and improvement

**API Endpoints**:
- `POST /process` - Process behavioral requests
- `GET /techniques` - List available techniques
- `POST /adapt` - Adapt existing behaviors
- `POST /learn` - Learn new patterns
- `GET /performance` - Get performance metrics
- `GET /health` - Service health check
- `GET /info` - Service information

**Example Usage**:
```bash
curl -X POST http://localhost:3013/process \
  -H "Content-Type: application/json" \
  -d '{
    "behaviorType": "adaptive",
    "context": {
      "environment": "urban",
      "stimuli": ["traffic", "pedestrians"],
      "constraints": {"time_limit": 300},
      "objectives": ["efficiency", "safety"]
    },
    "technique": {
      "method": "adaptive_navigation",
      "parameters": {"optimization": "speed"},
      "expectedOutcome": "successful_navigation",
      "adaptationLevel": "high"
    },
    "processing": {
      "realTime": true,
      "accuracy": "balanced",
      "learningMode": true
    }
  }'
```

### Output Service (O-4)
**Status**: ✅ **FULLY IMPLEMENTED**  
**Port**: 3014  
**Description**: Delivers behavioral responses

**Capabilities**:
- Multi-target behavioral output delivery
- Real-time command execution and coordination
- Feedback signal processing and routing
- Adaptive response formatting
- Output coordination and synchronization

**API Endpoints**:
- `POST /deliver` - Deliver behavioral outputs
- `GET /status` - Get output status
- `GET /templates` - List output templates
- `POST /coordinate` - Coordinate multiple outputs
- `POST /cancel` - Cancel pending outputs
- `GET /health` - Service health check
- `GET /info` - Service information

**Example Usage**:
```bash
curl -X POST http://localhost:3014/deliver \
  -H "Content-Type: application/json" \
  -d '{
    "behaviorData": {
      "command": "move_forward",
      "speed": 0.5,
      "duration": 2000
    },
    "outputType": "action",
    "deliveryMethod": "immediate",
    "target": {
      "type": "actuator",
      "identifier": "motor_controller_1",
      "protocol": "serial",
      "parameters": {"port": "/dev/ttyUSB0"}
    },
    "format": {
      "type": "command",
      "encoding": "json",
      "validation": true
    },
    "timing": {
      "immediate": true
    },
    "coordination": {
      "sequence": 1,
      "dependencies": [],
      "synchronization": "async"
    }
  }'
```

## Communication Flow

1. **Sensory Input**: Sensory Service (S-8) collects and processes environmental data
2. **Behavioral Planning**: Motor Control Service (M-1) coordinates action sequences
3. **Technique Implementation**: Processing Service (P-5) implements behavioral techniques
4. **Response Delivery**: Output Service (O-4) delivers formatted behavioral responses
5. **Feedback Loop**: Sensory input informs future behavioral adaptations

The complete flow creates a behavioral processing pipeline that mirrors somatic nervous system functions.

## Running the Somatic Triad

### Development Mode
```bash
# Install dependencies for all services
npm install

# Start all services individually
cd somatic-triad/motor-control-service && npm run start:dev &
cd somatic-triad/sensory-service && npm run start:dev &
cd somatic-triad/processing-service && npm run start:dev &
cd somatic-triad/output-service && npm run start:dev &
```

### Docker Mode
```bash
# Build and run with Docker Compose
docker-compose up somatic-triad-services
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f deployment-configs/kubernetes/somatic-triad.yaml
```

## Monitoring and Health

All services expose:
- Health check endpoints (`/health`)
- Prometheus metrics (`/metrics`)
- Service information (`/info`)

### Health Check Example
```bash
# Check all services
curl http://localhost:3011/health  # Motor Control
curl http://localhost:3012/health  # Sensory
curl http://localhost:3013/health  # Processing
curl http://localhost:3014/health  # Output
```

## Configuration

Services are configured via environment variables:
- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Service port number
- `LOG_LEVEL`: Logging level
- `SERVICE_DISCOVERY_URL`: Service registry URL

## Integration with Other Triads

### With Cerebral Triad
- Receives high-level behavioral directives from Processing Director (PD-2)
- Sends sensory analysis results to Thought Service (T-7)
- Coordinates with Cerebral Output Service (O-4) for complex responses

### With Autonomic Triad (Future)
- Reports system status to Monitoring Service
- Receives automated behavioral adjustments
- Coordinates emergency responses

## Behavioral Patterns

The Somatic Triad supports various behavioral patterns:

### Adaptive Behaviors
- Environmental navigation
- Context-aware responses
- Learning-based adjustments

### Reactive Behaviors
- Emergency responses
- Obstacle avoidance
- Safety protocols

### Learned Behaviors
- Pattern-based actions
- Optimization routines
- Performance improvements

### Instinctive Behaviors
- Default responses
- Failsafe mechanisms
- Basic coordination

## Performance Metrics

Key performance indicators for the Somatic Triad:
- **Sensor Data Quality**: Signal-to-noise ratio, pattern detection accuracy
- **Action Coordination**: Execution success rate, timing precision
- **Behavioral Processing**: Technique effectiveness, adaptation speed
- **Output Delivery**: Delivery success rate, response timing

## Future Enhancements

- [ ] Machine Learning integration for improved pattern recognition
- [ ] Advanced sensor fusion capabilities
- [ ] Real-time behavioral optimization
- [ ] Enhanced coordination with Autonomic Triad
- [ ] Distributed processing for complex behaviors
- [ ] Advanced feedback mechanisms for continuous learning