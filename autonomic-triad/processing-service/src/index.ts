import express from 'express';
import dotenv from 'dotenv';
import { AutonomicProcessingService } from './processing-service';
import { ServiceConfig, createMessage } from '@cosmos/cognitive-core-shared-libraries';

dotenv.config();

const app = express();
app.use(express.json());

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3024'),
  serviceName: 'autonomic-processing-service',
  triadType: 'autonomic',
  serviceType: 'P-5',
  environment: (process.env.NODE_ENV as any) || 'development'
};

const processingService = new AutonomicProcessingService(config);

processingService.initialize().catch(console.error);

app.get('/health', (req, res) => {
  res.json(processingService.getHealth());
});

app.get('/info', (req, res) => {
  res.json({
    serviceName: config.serviceName,
    triad: config.triadType,
    serviceType: config.serviceType,
    description: 'Handles emotive and intuitive background processing',
    version: '1.0.0',
    port: config.port,
    capabilities: [
      'Emotive response processing',
      'Intuitive pattern recognition',
      'Adaptive behavior learning',
      'Emotional context analysis',
      'Subconscious processing simulation'
    ]
  });
});

app.post('/process', async (req, res) => {
  try {
    const message = createMessage('PROCESS_EMOTIVE', req.body, 'api-gateway', config.serviceName);
    const response = await processingService.process(message);
    res.json(response?.payload || { error: 'No response' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/patterns', async (req, res) => {
  try {
    const message = createMessage('GET_PATTERNS', {}, 'api-gateway', config.serviceName);
    const response = await processingService.process(message);
    res.json(response?.payload || { patterns: [] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/emotions', async (req, res) => {
  try {
    const message = createMessage('GET_EMOTIONS', {}, 'api-gateway', config.serviceName);
    const response = await processingService.process(message);
    res.json(response?.payload || { emotions: {} });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(config.port, () => {
  console.log(`🧠 Processing Service (P-5) running on port ${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/health`);
});

process.on('SIGINT', async () => {
  console.log('\n🧠 Processing Service shutting down...');
  await processingService.shutdown();
  process.exit(0);
});