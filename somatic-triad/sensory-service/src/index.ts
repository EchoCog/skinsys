import express from 'express';
import dotenv from 'dotenv';
import { SensoryService } from './sensory-service';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3012'),
  serviceName: 'sensory-service',
  triadType: 'somatic',
  serviceType: 'S-8',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const sensoryService = new SensoryService(config);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(sensoryService.getHealth());
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    serviceType: config.serviceType,
    triadType: config.triadType,
    version: '1.0.0',
    description: 'Collects and processes external inputs',
    capabilities: [
      'Multi-modal sensor data collection',
      'Real-time signal processing',
      'Pattern recognition',
      'Noise filtering and enhancement',
      'Sensor calibration'
    ],
    sensorTypes: ['visual', 'audio', 'tactile', 'environmental', 'digital'],
    endpoints: {
      health: 'GET /health',
      info: 'GET /info',
      collect: 'POST /collect',
      process: 'POST /process',
      status: 'GET /status',
      patterns: 'GET /patterns',
      calibrate: 'POST /calibrate'
    }
  });
});

// Collect sensor data endpoint
app.post('/collect', async (req, res) => {
  try {
    const message = createMessage(
      'COLLECT_SENSOR_DATA',
      req.body,
      'api-gateway'
    );

    const response = await sensoryService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Collection error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process input endpoint
app.post('/process', async (req, res) => {
  try {
    const message = createMessage(
      'PROCESS_INPUT',
      req.body,
      'api-gateway'
    );

    const response = await sensoryService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get sensor status endpoint
app.get('/status', async (req, res) => {
  try {
    const message = createMessage(
      'GET_SENSOR_STATUS',
      {},
      'api-gateway'
    );

    const response = await sensoryService.process(message);
    res.json(response?.payload || { sensors: [] });
  } catch (error) {
    console.error('Status query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get detected patterns endpoint
app.get('/patterns', async (req, res) => {
  try {
    const message = createMessage(
      'GET_PATTERNS',
      {},
      'api-gateway'
    );

    const response = await sensoryService.process(message);
    res.json(response?.payload || { patterns: [] });
  } catch (error) {
    console.error('Patterns query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Calibrate sensors endpoint
app.post('/calibrate', async (req, res) => {
  try {
    const message = createMessage(
      'CALIBRATE_SENSORS',
      req.body,
      'api-gateway'
    );

    const response = await sensoryService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Calibration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await sensoryService.initialize();
    
    app.listen(config.port, () => {
      console.log(`Sensory Service running on port ${config.port}`);
      console.log(`Environment: ${config.environment}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`Service info: http://localhost:${config.port}/info`);
      console.log(`Collect data: http://localhost:${config.port}/collect`);
      console.log(`Sensor status: http://localhost:${config.port}/status`);
    });
  } catch (error) {
    console.error('Failed to start Sensory Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await sensoryService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await sensoryService.shutdown();
  process.exit(0);
});

startServer();