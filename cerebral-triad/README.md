# Cerebral Triad

The Cerebral Triad represents the **high-level decision making and coordination** layer of the Cognitive Cities Architecture. It mirrors the executive functions of the brain, handling strategic thinking, analysis, and intelligent output generation.

## Architecture Overview

The Cerebral Triad consists of four interconnected services:

```
┌─────────────────────────────────────────────────────────┐
│                 CEREBRAL TRIAD                          │
│                                                         │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────┐ │
│  │ Thought     │    │ Processing      │    │ Output  │ │
│  │ Service     │───▶│ Director        │───▶│ Service │ │
│  │ (T-7)       │    │ (PD-2)          │    │ (O-4)   │ │
│  └─────────────┘    └─────────────────┘    └─────────┘ │
│         │                     │                        │
│         │            ┌─────────────────┐               │
│         └───────────▶│ Processing      │               │
│                      │ Service         │               │
│                      │ (P-5)           │               │
│                      └─────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

## Services

### Thought Service (T-7)
**Status**: ✅ Implemented  
**Port**: 3001  
**Description**: Generates intuitive ideas and potential solutions

**Capabilities**:
- Idea generation based on context and domain
- Association mapping
- Confidence scoring
- Multi-complexity reasoning

**API Endpoints**:
- `POST /generate` - Generate thoughts and ideas
- `GET /health` - Service health check
- `GET /info` - Service information

**Example Request**:
```json
{
  "context": "urban traffic optimization",
  "domain": "technology",
  "complexity": "high",
  "timeframe": 30
}
```

**Example Response**:
```json
{
  "ideas": [
    {
      "id": "idea-1234567890-0",
      "description": "AI-powered solution for urban traffic optimization",
      "confidence": 0.85,
      "reasoning": "Based on contextual analysis of \"urban traffic optimization\" and domain knowledge in technology",
      "associations": ["intelligent", "automated", "connected"]
    }
  ],
  "processingTime": 145,
  "source": "thought-service"
}
```

### Processing Director (PD-2)
**Status**: ✅ **FULLY IMPLEMENTED**  
**Port**: 3002  
**Description**: Coordinates processing of information between services

**Capabilities**:
- Processing plan creation and management
- Service discovery and orchestration
- Resource allocation and scheduling
- Multi-step processing pipeline coordination

**API Endpoints**:
- `POST /coordinate` - Coordinate processing pipeline
- `GET /health` - Service health check
- `GET /info` - Service information
- `GET /plans` - List active processing plans
- `GET /plans/:id` - Get specific plan details

### Processing Service (P-5)
**Status**: ✅ **FULLY IMPLEMENTED**  
**Port**: 3003  
**Description**: Executes analytical processing operations

**Capabilities**:
- Data preprocessing and normalization
- Deep analytical processing
- Data synthesis and optimization
- Quality assessment and validation
- Result ranking and confidence scoring

**API Endpoints**:
- `POST /process` - Execute processing operation
- `POST /analyze` - Perform data analysis
- `POST /optimize` - Optimize results
- `GET /capabilities` - List processing capabilities
- `GET /health` - Service health check
- `GET /info` - Service information

### Output Service (O-4)
**Status**: ✅ **FULLY IMPLEMENTED**  
**Port**: 3004  
**Description**: Formats and delivers processed information

**Capabilities**:
- Multiple output formats (JSON, XML, CSV, HTML, Markdown, Report)
- Template-based formatting system
- Delivery to various destinations (API, file, email, webhook)
- Report generation with comprehensive analytics

**API Endpoints**:
- `POST /format` - Format output data
- `POST /deliver` - Deliver formatted output
- `POST /report` - Generate comprehensive report
- `GET /templates` - List available templates
- `GET /formats` - List supported formats
- `GET /health` - Service health check
- `GET /info` - Service information

## Communication Flow

1. **Input Reception**: External requests come through the API Gateway
2. **Thought Generation**: Thought Service (T-7) generates initial ideas
3. **Processing Coordination**: Processing Director (PD-2) orchestrates analysis
4. **Deep Analysis**: Processing Service (P-5) performs detailed analysis
5. **Output Formatting**: Output Service (O-4) formats results for delivery

The complete flow creates a cognitive processing pipeline that mirrors executive brain functions.

## Running the Cerebral Triad

### Development Mode
```bash
# Install dependencies for all services
npm install

# Start all services individually
cd cerebral-triad/thought-service && npm run start:dev &
cd cerebral-triad/processing-director && npm run start:dev &
cd cerebral-triad/processing-service && npm run start:dev &
cd cerebral-triad/output-service && npm run start:dev &
```

### Docker Mode
```bash
# Build and run with Docker Compose
docker-compose up cerebral-triad-services
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f deployment-configs/kubernetes/cerebral-triad.yaml
```

## Monitoring and Health

All services expose:
- Health check endpoints (`/health`)
- Prometheus metrics (`/metrics`)
- Service information (`/info`)

## Configuration

Services are configured via environment variables:
- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Service port number
- `LOG_LEVEL`: Logging level
- `SERVICE_DISCOVERY_URL`: Service registry URL

## Future Enhancements

- [ ] Machine Learning integration for improved idea generation
- [ ] Distributed processing capabilities
- [ ] Advanced analytics and reasoning engines
- [ ] Real-time collaboration between services
- [ ] Adaptive learning from user feedback