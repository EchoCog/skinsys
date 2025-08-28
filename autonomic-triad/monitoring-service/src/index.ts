import express from 'express';
import dotenv from 'dotenv';
import { MonitoringService } from './monitoring-service';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3021'),
  serviceName: 'monitoring-service',
  triadType: 'autonomic',
  serviceType: 'M-1',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const monitoringService = new MonitoringService(config);

// Initialize service
monitoringService.initialize().catch(console.error);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(monitoringService.getHealth());
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    triad: config.triadType,
    serviceType: config.serviceType,
    description: 'Automatic system monitoring and health assessment',
    version: '1.0.0',
    port: config.port,
    capabilities: [
      'Continuous system health monitoring',
      'Performance metrics collection',
      'Anomaly detection and alerting',
      'Resource usage tracking',
      'Service availability monitoring'
    ],
    endpoints: {
      health: 'GET /health',
      info: 'GET /info',
      monitor: 'POST /monitor',
      metrics: 'GET /metrics',
      alerts: 'GET /alerts',
      configure: 'POST /configure',
      acknowledge: 'POST /acknowledge'
    }
  });
});

// Start monitoring a component
app.post('/monitor', async (req, res) => {
  try {
    const message = createMessage(
      'MONITOR_COMPONENT',
      req.body,
      'api-gateway',
      config.serviceName
    );

    const response = await monitoringService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Monitor error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get system metrics
app.get('/metrics', async (req, res) => {
  try {
    const message = createMessage(
      'GET_METRICS',
      req.query,
      'api-gateway',
      config.serviceName
    );

    const response = await monitoringService.process(message);
    res.json(response?.payload || { metrics: [] });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get alerts
app.get('/alerts', async (req, res) => {
  try {
    const message = createMessage(
      'GET_ALERTS',
      req.query,
      'api-gateway',
      config.serviceName
    );

    const response = await monitoringService.process(message);
    res.json(response?.payload || { alerts: [] });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Configure monitoring
app.post('/configure', async (req, res) => {
  try {
    const message = createMessage(
      'CONFIGURE_MONITORING',
      req.body,
      'api-gateway',
      config.serviceName
    );

    const response = await monitoringService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Configure error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Acknowledge alert
app.post('/acknowledge', async (req, res) => {
  try {
    const message = createMessage(
      'ACKNOWLEDGE_ALERT',
      req.body,
      'api-gateway',
      config.serviceName
    );

    const response = await monitoringService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Acknowledge error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`🔍 Monitoring Service (M-1) running on port ${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/health`);
  console.log(`   Info: http://localhost:${config.port}/info`);
  console.log(`   Monitor: POST http://localhost:${config.port}/monitor`);
  console.log(`   Metrics: GET http://localhost:${config.port}/metrics`);
  console.log(`   Alerts: GET http://localhost:${config.port}/alerts`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔍 Monitoring Service shutting down...');
  await monitoringService.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔍 Monitoring Service shutting down...');
  await monitoringService.shutdown();
  process.exit(0);
});