import express from 'express';
import dotenv from 'dotenv';
import { TriggerService } from './trigger-service';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3025'),
  serviceName: 'trigger-service',
  triadType: 'autonomic',
  serviceType: 'T-7',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const triggerService = new TriggerService(config);

triggerService.initialize().catch(console.error);

app.get('/health', (req, res) => {
  res.json(triggerService.getHealth());
});

app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    triad: config.triadType,
    serviceType: config.serviceType,
    description: 'Initiates automatic responses and reactions',
    version: '1.0.0',
    port: config.port,
    capabilities: [
      'Event-driven response triggering',
      'Automated reaction systems',
      'Threshold-based alerting',
      'Emergency response coordination',
      'Reflex action simulation'
    ]
  });
});

app.post('/trigger', async (req, res) => {
  try {
    const message = createMessage('TRIGGER_RESPONSE', req.body, 'api-gateway', config.serviceName);
    const response = await triggerService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/triggers', async (req, res) => {
  try {
    const message = createMessage('GET_TRIGGERS', {}, 'api-gateway', config.serviceName);
    const response = await triggerService.process(message);
    res.json(response?.payload || { triggers: [] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/configure', async (req, res) => {
  try {
    const message = createMessage('CONFIGURE_TRIGGER', req.body, 'api-gateway', config.serviceName);
    const response = await triggerService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/emergency', async (req, res) => {
  try {
    const message = createMessage('EMERGENCY_RESPONSE', req.body, 'api-gateway', config.serviceName);
    const response = await triggerService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(config.port, () => {
  console.log(`⚡ Trigger Service (T-7) running on port ${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/health`);
  console.log(`   Triggers: GET http://localhost:${config.port}/triggers`);
});

process.on('SIGINT', async () => {
  console.log('\n⚡ Trigger Service shutting down...');
  await triggerService.shutdown();
  process.exit(0);
});