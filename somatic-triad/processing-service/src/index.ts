import express from 'express';
import dotenv from 'dotenv';
import { SomaticProcessingService } from './somatic-processing-service';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3013'),
  serviceName: 'somatic-processing-service',
  triadType: 'somatic',
  serviceType: 'P-5',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const somaticProcessingService = new SomaticProcessingService(config);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(somaticProcessingService.getHealth());
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    serviceType: config.serviceType,
    triadType: config.triadType,
    version: '1.0.0',
    description: 'Handles behavioral technique implementation',
    capabilities: [
      'Behavioral technique processing',
      'Adaptive behavior implementation',
      'Learning pattern recognition',
      'Performance optimization',
      'Context-aware adaptation'
    ],
    behaviorTypes: ['adaptive', 'reactive', 'learned', 'instinctive'],
    endpoints: {
      health: 'GET /health',
      info: 'GET /info',
      process: 'POST /process',
      techniques: 'GET /techniques',
      adapt: 'POST /adapt',
      learn: 'POST /learn',
      performance: 'GET /performance'
    }
  });
});

// Process behavior endpoint
app.post('/process', async (req, res) => {
  try {
    const message = createMessage(
      'PROCESS_BEHAVIOR',
      req.body,
      'api-gateway'
    );

    const response = await somaticProcessingService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get techniques endpoint
app.get('/techniques', async (req, res) => {
  try {
    const message = createMessage(
      'GET_TECHNIQUES',
      { filter: req.query.filter },
      'api-gateway'
    );

    const response = await somaticProcessingService.process(message);
    res.json(response?.payload || { techniques: [] });
  } catch (error) {
    console.error('Techniques query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Adapt behavior endpoint
app.post('/adapt', async (req, res) => {
  try {
    const message = createMessage(
      'ADAPT_BEHAVIOR',
      req.body,
      'api-gateway'
    );

    const response = await somaticProcessingService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Adaptation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Learn pattern endpoint
app.post('/learn', async (req, res) => {
  try {
    const message = createMessage(
      'LEARN_PATTERN',
      req.body,
      'api-gateway'
    );

    const response = await somaticProcessingService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Learning error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get performance metrics endpoint
app.get('/performance', async (req, res) => {
  try {
    const message = createMessage(
      'GET_PERFORMANCE',
      {},
      'api-gateway'
    );

    const response = await somaticProcessingService.process(message);
    res.json(response?.payload || { techniques: [], overall: {} });
  } catch (error) {
    console.error('Performance query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await somaticProcessingService.initialize();
    
    app.listen(config.port, () => {
      console.log(`Somatic Processing Service running on port ${config.port}`);
      console.log(`Environment: ${config.environment}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`Service info: http://localhost:${config.port}/info`);
      console.log(`Process behavior: http://localhost:${config.port}/process`);
      console.log(`Get techniques: http://localhost:${config.port}/techniques`);
    });
  } catch (error) {
    console.error('Failed to start Somatic Processing Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await somaticProcessingService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await somaticProcessingService.shutdown();
  process.exit(0);
});

startServer();