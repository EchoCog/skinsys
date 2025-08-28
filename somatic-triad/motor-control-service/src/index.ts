import express from 'express';
import dotenv from 'dotenv';
import { MotorControlService } from './motor-control-service';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3011'),
  serviceName: 'motor-control-service',
  triadType: 'somatic',
  serviceType: 'M-1',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const motorControlService = new MotorControlService(config);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(motorControlService.getHealth());
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    serviceType: config.serviceType,
    triadType: config.triadType,
    version: '1.0.0',
    description: 'Coordinates actions and behaviors',
    capabilities: [
      'Action coordination',
      'Behavioral planning',
      'Movement sequencing',
      'Dependency management'
    ],
    endpoints: {
      health: 'GET /health',
      info: 'GET /info',
      coordinate: 'POST /coordinate',
      plans: 'GET /plans',
      execute: 'POST /execute',
      abort: 'POST /abort'
    }
  });
});

// Action coordination endpoint
app.post('/coordinate', async (req, res) => {
  try {
    const message = createMessage(
      'COORDINATE_ACTIONS',
      req.body,
      'api-gateway'
    );

    const response = await motorControlService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Coordination error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get active plans endpoint
app.get('/plans', async (req, res) => {
  try {
    const message = createMessage(
      'GET_ACTIVE_PLANS',
      {},
      'api-gateway'
    );

    const response = await motorControlService.process(message);
    res.json(response?.payload || { plans: [] });
  } catch (error) {
    console.error('Plans query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute action endpoint
app.post('/execute', async (req, res) => {
  try {
    const message = createMessage(
      'EXECUTE_ACTION',
      req.body,
      'api-gateway'
    );

    const response = await motorControlService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Abort plan endpoint
app.post('/abort', async (req, res) => {
  try {
    const message = createMessage(
      'ABORT_PLAN',
      req.body,
      'api-gateway'
    );

    const response = await motorControlService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Abort error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await motorControlService.initialize();
    
    app.listen(config.port, () => {
      console.log(`Motor Control Service running on port ${config.port}`);
      console.log(`Environment: ${config.environment}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`Service info: http://localhost:${config.port}/info`);
      console.log(`Coordinate actions: http://localhost:${config.port}/coordinate`);
      console.log(`Active plans: http://localhost:${config.port}/plans`);
    });
  } catch (error) {
    console.error('Failed to start Motor Control Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await motorControlService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await motorControlService.shutdown();
  process.exit(0);
});

startServer();