import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security and CORS middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Service discovery configuration
const services = {
  'cerebral': {
    'thought-service': { url: 'http://thought-service:3001', path: '/cerebral/thoughts' },
    'processing-director': { url: 'http://processing-director:3002', path: '/cerebral/processing' },
    'processing-service': { url: 'http://cerebral-processing:3003', path: '/cerebral/process' },
    'output-service': { url: 'http://cerebral-output:3004', path: '/cerebral/output' }
  },
  'somatic': {
    'motor-control-service': { url: 'http://motor-control:3011', path: '/somatic/motor' },
    'sensory-service': { url: 'http://sensory:3012', path: '/somatic/sensory' },
    'processing-service': { url: 'http://somatic-processing:3013', path: '/somatic/process' },
    'output-service': { url: 'http://somatic-output:3014', path: '/somatic/output' }
  },
  'autonomic': {
    'monitoring-service': { url: 'http://monitoring:3021', path: '/autonomic/monitoring' },
    'state-management': { url: 'http://state-management:3022', path: '/autonomic/state' },
    'process-director': { url: 'http://autonomic-director:3023', path: '/autonomic/director' },
    'processing-service': { url: 'http://autonomic-processing:3024', path: '/autonomic/process' },
    'trigger-service': { url: 'http://trigger:3025', path: '/autonomic/trigger' }
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: Object.keys(services).length,
    uptime: process.uptime()
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  const routes = [];
  
  for (const [triad, triadServices] of Object.entries(services)) {
    for (const [serviceName, config] of Object.entries(triadServices)) {
      routes.push({
        triad,
        service: serviceName,
        path: config.path,
        description: `${serviceName} in ${triad} triad`
      });
    }
  }
  
  res.json({
    title: 'Cognitive Cities API Gateway',
    version: '1.0.0',
    description: 'Neurological-inspired distributed system API',
    routes
  });
});

// Dynamic proxy setup for services
for (const [triad, triadServices] of Object.entries(services)) {
  for (const [serviceName, config] of Object.entries(triadServices)) {
    app.use(config.path, createProxyMiddleware({
      target: config.url,
      changeOrigin: true,
      pathRewrite: {
        [`^${config.path}`]: ''
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${serviceName}:`, err.message);
        res.status(503).json({
          error: 'Service unavailable',
          service: serviceName,
          triad: triad
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Routing ${req.method} ${req.path} to ${serviceName}`);
      }
    }));
  }
}

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'This endpoint does not exist in the Cognitive Cities API',
    availableRoutes: '/api/docs'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal gateway error',
    message: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🌐 Cognitive Cities API Gateway running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api/docs`);
  console.log(`🔍 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down API Gateway...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down API Gateway...');
  process.exit(0);
});