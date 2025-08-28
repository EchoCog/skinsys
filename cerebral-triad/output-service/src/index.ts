import express from 'express';
import dotenv from 'dotenv';
import { OutputService } from './output-service';
import { ServiceConfig } from '@cosmos/cognitive-core-shared-libraries';

// Load environment variables
dotenv.config();

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3004'),
  serviceName: 'output-service',
  triadType: 'cerebral',
  serviceType: 'O-4',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const app = express();
app.use(express.json());

// Initialize the Output Service
const outputService = new OutputService(config);

// Health check endpoint
app.get('/health', (req, res) => {
  const health = outputService.getHealth();
  res.json(health);
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    serviceType: config.serviceType,
    triadType: config.triadType,
    version: '1.0.0',
    description: 'Formats and delivers processed information',
    port: config.port,
    endpoints: [
      'POST /format - Format output data',
      'POST /deliver - Deliver formatted output',
      'POST /report - Generate comprehensive report',
      'GET /templates - List available templates',
      'GET /formats - List supported formats',
      'GET /health - Service health check',
      'GET /info - Service information'
    ]
  });
});

// Format output endpoint
app.post('/format', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'FORMAT_OUTPUT',
      payload: req.body,
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await outputService.process(message);
    res.json(response?.payload || { status: 'formatting initiated' });
  } catch (error) {
    console.error('Output formatting error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Deliver output endpoint
app.post('/deliver', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'DELIVER_OUTPUT',
      payload: req.body,
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await outputService.process(message);
    res.json(response?.payload || { status: 'delivery initiated' });
  } catch (error) {
    console.error('Output delivery error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate report endpoint
app.post('/report', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'GENERATE_REPORT',
      payload: req.body,
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await outputService.process(message);
    res.json(response?.payload || { status: 'report generation initiated' });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available templates
app.get('/templates', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'GET_TEMPLATES',
      payload: {},
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await outputService.process(message);
    res.json(response?.payload || { templates: [] });
  } catch (error) {
    console.error('Templates query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supported formats
app.get('/formats', async (req, res) => {
  try {
    const message = {
      id: `req-${Date.now()}`,
      type: 'GET_FORMATS',
      payload: {},
      timestamp: new Date(),
      source: 'api-gateway'
    };

    const response = await outputService.process(message);
    res.json(response?.payload || { formats: [] });
  } catch (error) {
    console.error('Formats query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await outputService.initialize();
    
    app.listen(config.port, () => {
      console.log(`Output Service running on port ${config.port}`);
      console.log(`Environment: ${config.environment}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`Service info: http://localhost:${config.port}/info`);
      console.log(`Templates: http://localhost:${config.port}/templates`);
      console.log(`Formats: http://localhost:${config.port}/formats`);
    });
  } catch (error) {
    console.error('Failed to start Output Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await outputService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await outputService.shutdown();
  process.exit(0);
});

startServer();