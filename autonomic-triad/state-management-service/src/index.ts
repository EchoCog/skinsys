import express from 'express';
import dotenv from 'dotenv';
import { StateManagementService } from './state-management-service';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3022'),
  serviceName: 'state-management-service',
  triadType: 'autonomic',
  serviceType: 'S-8',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const stateService = new StateManagementService(config);

// Initialize service
stateService.initialize().catch(console.error);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(stateService.getHealth());
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    triad: config.triadType,
    serviceType: config.serviceType,
    description: 'Maintains global system state and configuration',
    version: '1.0.0',
    port: config.port,
    capabilities: [
      'Centralized state management',
      'Configuration persistence and retrieval',
      'State synchronization across services',
      'Backup and recovery operations',
      'State history and versioning'
    ],
    endpoints: {
      health: 'GET /health',
      info: 'GET /info',
      state: 'GET /state',
      updateState: 'POST /state',
      config: 'GET /config',
      updateConfig: 'POST /config',
      history: 'GET /history',
      backup: 'POST /backup',
      restore: 'POST /restore'
    }
  });
});

// Get current system state
app.get('/state', async (req, res) => {
  try {
    const message = createMessage(
      'GET_STATE',
      req.query,
      'api-gateway',
      config.serviceName
    );

    const response = await stateService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('State retrieval error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update system state
app.post('/state', async (req, res) => {
  try {
    const message = createMessage(
      'UPDATE_STATE',
      req.body,
      'api-gateway',
      config.serviceName
    );

    const response = await stateService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('State update error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get configuration
app.get('/config', async (req, res) => {
  try {
    const message = createMessage(
      'GET_CONFIG',
      {},
      'api-gateway',
      config.serviceName
    );

    const response = await stateService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Config retrieval error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update configuration
app.post('/config', async (req, res) => {
  try {
    const message = createMessage(
      'UPDATE_CONFIG',
      req.body,
      'api-gateway',
      config.serviceName
    );

    const response = await stateService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get state history
app.get('/history', async (req, res) => {
  try {
    const message = createMessage(
      'GET_HISTORY',
      req.query,
      'api-gateway',
      config.serviceName
    );

    const response = await stateService.process(message);
    res.json(response?.payload || { history: [] });
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create backup
app.post('/backup', async (req, res) => {
  try {
    const message = createMessage(
      'CREATE_BACKUP',
      req.body,
      'api-gateway',
      config.serviceName
    );

    const response = await stateService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Restore from backup
app.post('/restore', async (req, res) => {
  try {
    const message = createMessage(
      'RESTORE_BACKUP',
      req.body,
      'api-gateway',
      config.serviceName
    );

    const response = await stateService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    console.error('Backup restoration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`🗄️  State Management Service (S-8) running on port ${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/health`);
  console.log(`   Info: http://localhost:${config.port}/info`);
  console.log(`   State: GET/POST http://localhost:${config.port}/state`);
  console.log(`   Config: GET/POST http://localhost:${config.port}/config`);
  console.log(`   History: GET http://localhost:${config.port}/history`);
  console.log(`   Backup: POST http://localhost:${config.port}/backup`);
  console.log(`   Restore: POST http://localhost:${config.port}/restore`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🗄️  State Management Service shutting down...');
  await stateService.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🗄️  State Management Service shutting down...');
  await stateService.shutdown();
  process.exit(0);
});