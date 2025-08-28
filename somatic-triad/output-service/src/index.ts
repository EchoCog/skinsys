import express from 'express';
import dotenv from 'dotenv';
import { SomaticOutputService } from './somatic-output-service';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3014'),
  serviceName: 'somatic-output-service',
  triadType: 'somatic',
  serviceType: 'O-4',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const somaticOutputService = new SomaticOutputService(config);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(somaticOutputService.getHealth());
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    serviceType: config.serviceType,
    triadType: config.triadType,
    version: '1.0.0',
    description: 'Delivers behavioral responses',
    capabilities: [
      'Behavioral output delivery',
      'Multi-target coordination',
      'Real-time command execution',
      'Feedback signal processing',
      'Adaptive response formatting'
    ],
    outputTypes: ['action', 'response', 'signal', 'feedback', 'adaptation'],
    targetTypes: ['actuator', 'interface', 'system', 'external'],
    endpoints: {
      health: 'GET /health',
      info: 'GET /info',
      deliver: 'POST /deliver',
      status: 'GET /status',
      templates: 'GET /templates',
      coordinate: 'POST /coordinate',
      cancel: 'POST /cancel'
    }
  });
});

// Deliver behavioral output endpoint
app.post('/deliver', async (req, res) => {
  try {
    const message = createMessage(
      'DELIVER_BEHAVIORAL_OUTPUT',
      req.body,
      'api-gateway'
    );

    const response = await somaticOutputService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Delivery error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get output status endpoint
app.get('/status', async (req, res) => {
  try {
    const message = createMessage(
      'GET_OUTPUT_STATUS',
      { outputIds: req.query.ids ? (req.query.ids as string).split(',') : [] },
      'api-gateway'
    );

    const response = await somaticOutputService.process(message);
    res.json(response?.payload || { outputs: [] });
  } catch (error) {
    console.error('Status query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get output templates endpoint
app.get('/templates', async (req, res) => {
  try {
    const message = createMessage(
      'GET_TEMPLATES',
      {},
      'api-gateway'
    );

    const response = await somaticOutputService.process(message);
    res.json(response?.payload || { templates: [] });
  } catch (error) {
    console.error('Templates query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Coordinate outputs endpoint
app.post('/coordinate', async (req, res) => {
  try {
    const message = createMessage(
      'COORDINATE_OUTPUTS',
      req.body,
      'api-gateway'
    );

    const response = await somaticOutputService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Coordination error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel output endpoint
app.post('/cancel', async (req, res) => {
  try {
    const message = createMessage(
      'CANCEL_OUTPUT',
      req.body,
      'api-gateway'
    );

    const response = await somaticOutputService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await somaticOutputService.initialize();
    
    app.listen(config.port, () => {
      console.log(`Somatic Output Service running on port ${config.port}`);
      console.log(`Environment: ${config.environment}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`Service info: http://localhost:${config.port}/info`);
      console.log(`Deliver output: http://localhost:${config.port}/deliver`);
      console.log(`Output status: http://localhost:${config.port}/status`);
    });
  } catch (error) {
    console.error('Failed to start Somatic Output Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await somaticOutputService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await somaticOutputService.shutdown();
  process.exit(0);
});

startServer();