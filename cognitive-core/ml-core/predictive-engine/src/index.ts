import { ServiceConfig } from '@cosmos/cognitive-core-shared-libraries';
import { PredictiveEngine } from './predictive-engine';

// Create service configuration
const config: ServiceConfig = {
  port: 3025,
  serviceName: 'Predictive Engine',
  triadType: 'cerebral',
  serviceType: 'ml-predictive',
  environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development'
};

// Create and initialize the service
const service = new PredictiveEngine(config);

service.initialize()
  .then(() => console.log('🧠 Predictive Engine initialized successfully'))
  .catch(console.error);

export { PredictiveEngine };