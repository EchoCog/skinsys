import { ServiceMessage } from './base-service';

export interface EventBusInterface {
  publish(topic: string, message: ServiceMessage): Promise<void>;
  subscribe(topic: string, handler: (message: ServiceMessage) => Promise<void>): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
}

export interface ApiGatewayInterface {
  registerService(serviceName: string, endpoint: string): Promise<void>;
  routeMessage(message: ServiceMessage): Promise<ServiceMessage | null>;
  getServiceEndpoint(serviceName: string): string | null;
}

export class MessageBroker {
  private topics: Map<string, Array<(message: ServiceMessage) => Promise<void>>> = new Map();

  async publish(topic: string, message: ServiceMessage): Promise<void> {
    const handlers = this.topics.get(topic) || [];
    await Promise.all(handlers.map(handler => handler(message)));
  }

  async subscribe(topic: string, handler: (message: ServiceMessage) => Promise<void>): Promise<void> {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }
    this.topics.get(topic)!.push(handler);
  }

  async unsubscribe(topic: string): Promise<void> {
    this.topics.delete(topic);
  }

  getTopics(): string[] {
    return Array.from(this.topics.keys());
  }
}

export const createServiceId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createMessage = (
  type: string,
  payload: any,
  source: string,
  target?: string
): ServiceMessage => {
  return {
    id: createServiceId(),
    type,
    payload,
    timestamp: new Date(),
    source,
    target
  };
};