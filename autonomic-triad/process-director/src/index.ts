import express from 'express';
import dotenv from 'dotenv';
import { AutonomicProcessDirector } from './process-director';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3023'),
  serviceName: 'autonomic-process-director',
  triadType: 'autonomic',
  serviceType: 'PD-2',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const processDirector = new AutonomicProcessDirector(config);

processDirector.initialize().catch(console.error);

app.get('/health', (req, res) => {
  res.json(processDirector.getHealth());
});

app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    triad: config.triadType,
    serviceType: config.serviceType,
    description: 'Manages background processes and automation workflows',
    version: '1.0.0',
    port: config.port,
    capabilities: [
      'Background process orchestration',
      'Automated workflow execution', 
      'Process scheduling and queuing',
      'Resource allocation and management',
      'Process dependency resolution'
    ],
    endpoints: {
      health: 'GET /health',
      info: 'GET /info',
      schedule: 'POST /schedule',
      processes: 'GET /processes',
      terminate: 'POST /terminate',
      queue: 'GET /queue'
    }
  });
});

app.post('/schedule', async (req, res) => {
  try {
    const message = createMessage('SCHEDULE_PROCESS', req.body, 'api-gateway', config.serviceName);
    const response = await processDirector.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/processes', async (req, res) => {
  try {
    const message = createMessage('GET_PROCESSES', {}, 'api-gateway', config.serviceName);
    const response = await processDirector.process(message);
    res.json(response?.payload || { processes: [] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/terminate', async (req, res) => {
  try {
    const message = createMessage('TERMINATE_PROCESS', req.body, 'api-gateway', config.serviceName);
    const response = await processDirector.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/queue', async (req, res) => {
  try {
    const message = createMessage('GET_QUEUE', {}, 'api-gateway', config.serviceName);
    const response = await processDirector.process(message);
    res.json(response?.payload || { queue: {} });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(config.port, () => {
  console.log(`⚙️  Process Director (PD-2) running on port ${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/health`);
  console.log(`   Schedule: POST http://localhost:${config.port}/schedule`);
});

process.on('SIGINT', async () => {
  console.log('\n⚙️  Process Director shutting down...');
  await processDirector.shutdown();
  process.exit(0);
});