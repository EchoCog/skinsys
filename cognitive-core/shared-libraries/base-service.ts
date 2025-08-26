export interface ServiceConfig {
  port: number;
  serviceName: string;
  triadType: 'cerebral' | 'somatic' | 'autonomic';
  serviceType: string;
  environment: 'development' | 'staging' | 'production';
}

export interface ServiceMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
  target?: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  version: string;
  uptime: number;
  dependencies: Record<string, boolean>;
}

export abstract class BaseService {
  protected config: ServiceConfig;
  private startTime: Date;

  constructor(config: ServiceConfig) {
    this.config = config;
    this.startTime = new Date();
  }

  abstract initialize(): Promise<void>;
  abstract process(message: ServiceMessage): Promise<ServiceMessage | null>;
  abstract shutdown(): Promise<void>;

  getHealth(): ServiceHealth {
    return {
      status: 'healthy',
      timestamp: new Date(),
      version: '1.0.0',
      uptime: Date.now() - this.startTime.getTime(),
      dependencies: {}
    };
  }

  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.config.serviceName,
      triad: this.config.triadType,
      message,
      data
    };
    console.log(JSON.stringify(logEntry));
  }
}