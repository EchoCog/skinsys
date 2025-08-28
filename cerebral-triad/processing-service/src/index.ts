import express from 'express';
import dotenv from 'dotenv';
import { ProcessingService } from './processing-service';
import { ServiceConfig } from '@cosmos/cognitive-core-shared-libraries';

// Load environment variables
dotenv.config();

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3003'),
  serviceName: 'processing-service',
  triadType: 'cerebral',
  serviceType: 'P-5',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const app = express();
app.use(express.json());

// Initialize the Processing Service
const processingService = new ProcessingService(config);

// Health check endpoint
app.get('/health', (req, res) => {
  const health = processingService.getHealth();
  res.json(health);
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    serviceType: config.serviceType,
    triadType: config.triadType,
    version: '1.0.0',
    description: 'Executes analytical processing operations',
    port: config.port,
    endpoints: [
      'POST /process - Execute processing operation',
      'POST /analyze - Perform data analysis',
      'POST /optimize - Optimize results',
      'GET /capabilities - List processing capabilities',
      'GET /health - Service health check',
      'GET /info - Service information'
    ]
  });
});

// Execute processing operation
app.post('/process', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'EXECUTE_PROCESSING',
      payload: req.body,
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await processingService.process(message);
    res.json(response?.payload || { status: 'processing initiated' });
  } catch (error) {
    console.error('Processing operation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analyze data endpoint
app.post('/analyze', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'ANALYZE_DATA',
      payload: req.body,
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await processingService.process(message);
    res.json(response?.payload || { status: 'analysis initiated' });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Optimize results endpoint
app.post('/optimize', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'OPTIMIZE_RESULTS',
      payload: req.body,
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await processingService.process(message);
    res.json(response?.payload || { status: 'optimization initiated' });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get processing capabilities
app.get('/capabilities', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'GET_CAPABILITIES',
      payload: {},
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await processingService.process(message);
    res.json(response?.payload || { capabilities: [] });
  } catch (error) {
    console.error('Capabilities query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await processingService.initialize();
    
    app.listen(config.port, () => {
      console.log(`Processing Service running on port ${config.port}`);
      console.log(`Environment: ${config.environment}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`Service info: http://localhost:${config.port}/info`);
      console.log(`Capabilities: http://localhost:${config.port}/capabilities`);
    });
  } catch (error) {
    console.error('Failed to start Processing Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await processingService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await processingService.shutdown();
  process.exit(0);
});

startServer();