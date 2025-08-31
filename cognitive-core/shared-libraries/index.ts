export { BaseService, ServiceConfig, ServiceMessage, ServiceHealth } from './base-service';
export { 
  EventBusInterface, 
  ApiGatewayInterface, 
  MessageBroker, 
  createServiceId, 
  createMessage 
} from './communication';
export * from './skin-data-structures';
export * from './src/polarity-config';

// Phase 1: Cognitive Primitives & Foundational Hypergraph Encoding
export * from './src/cognitive-primitives';
export * from './src/tensor-fragment-architecture';
export * from './src/scheme-cognitive-grammar';
export * from './src/hypergraph-translator';
export * from './src/verification-visualization';