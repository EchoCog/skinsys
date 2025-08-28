import express from 'express';
import dotenv from 'dotenv';
import { ProcessingDirectorService } from './processing-director';
import { ServiceConfig } from '@cosmos/cognitive-core-shared-libraries';

// Load environment variables
dotenv.config();

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3002'),
  serviceName: 'processing-director',
  triadType: 'cerebral',
  serviceType: 'PD-2',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const app = express();
app.use(express.json());

// Initialize the Processing Director Service
const processingDirector = new ProcessingDirectorService(config);

// Health check endpoint
app.get('/health', (req, res) => {
  const health = processingDirector.getHealth();
  res.json(health);
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    serviceType: config.serviceType,
    triadType: config.triadType,
    version: '1.0.0',
    description: 'Coordinates processing of information between services',
    port: config.port,
    endpoints: [
      'POST /coordinate - Coordinate processing pipeline',
      'GET /health - Service health check',
      'GET /info - Service information',
      'GET /plans - List active processing plans',
      'GET /plans/:id - Get specific plan details'
    ]
  });
});

// Coordinate processing endpoint
app.post('/coordinate', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'COORDINATE_PROCESSING',
      payload: req.body,
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await processingDirector.process(message);
    res.json(response?.payload || { status: 'processing initiated' });
  } catch (error) {
    console.error('Processing coordination error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get active plans
app.get('/plans', (req, res) => {
  // This would return active plans in a real implementation
  res.json({
    activePlans: [],
    totalPlans: 0,
    status: 'No active plans'
  });
});

// Get specific plan details
app.get('/plans/:id', (req, res) => {
  const planId = req.params.id;
  // This would return specific plan details in a real implementation
  res.json({
    planId,
    status: 'Plan not found',
    message: 'Plan tracking not yet implemented'
  });
});

// Initialize and start server
async function startServer() {
  try {
    await processingDirector.initialize();
    
    app.listen(config.port, () => {
      console.log(`Processing Director Service running on port ${config.port}`);
      console.log(`Environment: ${config.environment}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`Service info: http://localhost:${config.port}/info`);
    });
  } catch (error) {
    console.error('Failed to start Processing Director Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await processingDirector.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await processingDirector.shutdown();
  process.exit(0);
});

startServer();