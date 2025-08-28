import { BaseService, ServiceConfig, ServiceMessage } from '@cosmos/cognitive-core-shared-libraries';

interface TriggerCondition {
  id: string;
  name: string;
  type: 'threshold' | 'pattern' | 'event' | 'schedule';
  condition: string;
  threshold?: number;
  response: string;
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

interface TriggeredResponse {
  id: string;
  triggerId: string;
  timestamp: Date;
  response: string;
  success: boolean;
  metadata: Record<string, any>;
}

export class TriggerService extends BaseService {
  private triggers: Map<string, TriggerCondition> = new Map();
  private responses: TriggeredResponse[] = [];
  private monitoringActive = true;

  constructor(config: ServiceConfig) {
    super(config);
    this.initializeDefaultTriggers();
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Trigger Service');
    this.startTriggerMonitoring();
    this.log('info', 'Trigger Service initialized successfully');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    
    try {
      switch (message.type) {
        case 'TRIGGER_RESPONSE':
          return await this.triggerResponse(message, startTime);
        case 'GET_TRIGGERS':
          return await this.getTriggers(message, startTime);
        case 'CONFIGURE_TRIGGER':
          return await this.configureTrigger(message, startTime);
        case 'EMERGENCY_RESPONSE':
          return await this.emergencyResponse(message, startTime);
        default:
          return null;
      }
    } catch (error) {
      this.log('error', 'Error processing message', { error });
      return null;
    }
  }

  private async triggerResponse(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { response, metadata } = message.payload;
    
    const triggeredResponse: TriggeredResponse = {
      id: `response_${Date.now()}`,
      triggerId: 'manual',
      timestamp: new Date(),
      response,
      success: true,
      metadata: metadata || {}
    };

    this.responses.push(triggeredResponse);
    this.log('info', `Manual response triggered: ${response}`);

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'RESPONSE_TRIGGERED',
      payload: {
        responseId: triggeredResponse.id,
        triggered: true,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async getTriggers(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'TRIGGERS_RESPONSE',
      payload: {
        triggers: Array.from(this.triggers.values()),
        recentResponses: this.responses.slice(-10),
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async configureTrigger(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const triggerConfig = message.payload;
    
    const trigger: TriggerCondition = {
      id: triggerConfig.id || `trigger_${Date.now()}`,
      name: triggerConfig.name,
      type: triggerConfig.type,
      condition: triggerConfig.condition,
      threshold: triggerConfig.threshold,
      response: triggerConfig.response,
      enabled: triggerConfig.enabled !== false,
      triggerCount: 0
    };

    this.triggers.set(trigger.id, trigger);

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'TRIGGER_CONFIGURED',
      payload: {
        triggerId: trigger.id,
        configured: true,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async emergencyResponse(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { emergencyType, severity } = message.payload;
    
    const response = this.determineEmergencyResponse(emergencyType, severity);
    const triggeredResponse: TriggeredResponse = {
      id: `emergency_${Date.now()}`,
      triggerId: 'emergency',
      timestamp: new Date(),
      response,
      success: true,
      metadata: { emergencyType, severity }
    };

    this.responses.push(triggeredResponse);
    this.log('warn', `Emergency response triggered: ${response}`, { emergencyType, severity });

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'EMERGENCY_TRIGGERED',
      payload: {
        responseId: triggeredResponse.id,
        response,
        triggered: true,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private initializeDefaultTriggers(): void {
    const defaultTriggers = [
      {
        name: 'high_cpu_alert',
        type: 'threshold',
        condition: 'cpu_usage > threshold',
        threshold: 90,
        response: 'scale_up_resources'
      },
      {
        name: 'service_failure',
        type: 'event',
        condition: 'service_status == failed',
        response: 'restart_service'
      },
      {
        name: 'memory_pressure',
        type: 'threshold',
        condition: 'memory_usage > threshold',
        threshold: 85,
        response: 'garbage_collect'
      }
    ];

    defaultTriggers.forEach(config => {
      const trigger: TriggerCondition = {
        id: `default_${config.name}`,
        name: config.name,
        type: config.type as any,
        condition: config.condition,
        threshold: config.threshold,
        response: config.response,
        enabled: true,
        triggerCount: 0
      };
      this.triggers.set(trigger.id, trigger);
    });
  }

  private startTriggerMonitoring(): void {
    setInterval(() => {
      if (this.monitoringActive) {
        this.evaluateTriggers();
      }
    }, 15000); // Check every 15 seconds
  }

  private evaluateTriggers(): void {
    this.triggers.forEach(trigger => {
      if (trigger.enabled && this.shouldTrigger(trigger)) {
        this.executeTrigger(trigger);
      }
    });
  }

  private shouldTrigger(trigger: TriggerCondition): boolean {
    // Simulate trigger evaluation
    switch (trigger.type) {
      case 'threshold':
        return Math.random() > 0.9; // 10% chance to trigger
      case 'event':
        return Math.random() > 0.95; // 5% chance to trigger
      case 'pattern':
        return Math.random() > 0.92; // 8% chance to trigger
      default:
        return false;
    }
  }

  private executeTrigger(trigger: TriggerCondition): void {
    const response: TriggeredResponse = {
      id: `auto_${Date.now()}`,
      triggerId: trigger.id,
      timestamp: new Date(),
      response: trigger.response,
      success: true,
      metadata: { triggerName: trigger.name, condition: trigger.condition }
    };

    this.responses.push(response);
    trigger.lastTriggered = new Date();
    trigger.triggerCount++;

    this.log('info', `Trigger activated: ${trigger.name} -> ${trigger.response}`, {
      triggerId: trigger.id,
      condition: trigger.condition
    });

    // Keep only last 50 responses
    if (this.responses.length > 50) {
      this.responses = this.responses.slice(-50);
    }
  }

  private determineEmergencyResponse(emergencyType: string, severity: number): string {
    if (severity >= 0.9) {
      return 'system_shutdown';
    } else if (severity >= 0.7) {
      return 'emergency_scaling';
    } else if (severity >= 0.5) {
      return 'alert_administrators';
    } else {
      return 'log_incident';
    }
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Trigger Service');
    this.monitoringActive = false;
    this.triggers.clear();
    this.responses = [];
    this.log('info', 'Trigger Service shutdown complete');
  }
}