import express from 'express';
import dotenv from 'dotenv';
import { ThoughtService } from './thought-service';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3001'),
  serviceName: 'thought-service',
  triadType: 'cerebral',
  serviceType: 'T-7',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const thoughtService = new ThoughtService(config);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(thoughtService.getHealth());
});

// Main processing endpoint
app.post('/generate', async (req, res) => {
  try {
    const message = createMessage(
      'GENERATE_THOUGHTS',
      req.body,
      'api-gateway',
      config.serviceName
    );

    const response = await thoughtService.process(message);
    res.json(response?.payload || { error: 'No response generated' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    triad: config.triadType,
    serviceType: config.serviceType,
    description: 'Generates intuitive ideas and potential solutions',
    version: '1.0.0',
    endpoints: [
      'GET /health - Service health check',
      'POST /generate - Generate thoughts and ideas',
      'GET /info - Service information'
    ]
  });
});

// Initialize and start the service
async function startService() {
  try {
    await thoughtService.initialize();
    
    app.listen(config.port, () => {
      console.log(`Thought Service running on port ${config.port}`);
      console.log(`Environment: ${config.environment}`);
    });
  } catch (error) {
    console.error('Failed to start Thought Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await thoughtService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await thoughtService.shutdown();
  process.exit(0);
});

startService();