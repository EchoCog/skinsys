import { BaseService, ServiceConfig, ServiceMessage, createMessage } from '@cosmos/cognitive-core-shared-libraries';

interface BehavioralOutputRequest {
  behaviorData: any;
  outputType: 'action' | 'response' | 'signal' | 'feedback' | 'adaptation';
  deliveryMethod: 'immediate' | 'queued' | 'scheduled' | 'conditional';
  target: {
    type: 'actuator' | 'interface' | 'system' | 'external';
    identifier: string;
    protocol: string;
    parameters: Record<string, any>;
  };
  format: {
    type: 'command' | 'data' | 'signal' | 'message';
    encoding: string;
    compression?: boolean;
    validation?: boolean;
  };
  timing: {
    immediate: boolean;
    delay?: number;
    duration?: number;
    repeat?: {
      count: number;
      interval: number;
    };
  };
  coordination: {
    sequence: number;
    dependencies: string[];
    synchronization: 'async' | 'sync' | 'batch';
  };
}

interface FormattedBehavioralOutput {
  id: string;
  originalRequest: BehavioralOutputRequest;
  formattedData: any;
  deliveryInfo: {
    method: string;
    target: string;
    protocol: string;
    timestamp: Date;
    status: 'pending' | 'delivered' | 'failed' | 'acknowledged';
    retryCount: number;
  };
  execution: {
    commands: Array<{
      type: string;
      data: any;
      timing: number;
      validation: string;
    }>;
    monitoring: {
      checkpoints: string[];
      feedback: any[];
      errors: string[];
    };
    coordination: {
      sequence: number;
      dependencies: string[];
      synchronization: string;
    };
  };
  metadata: {
    processingTime: number;
    size: number;
    checksum?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface BehavioralResponse {
  outputId: string;
  outputs: FormattedBehavioralOutput[];
  delivery: {
    totalOutputs: number;
    successful: number;
    pending: number;
    failed: number;
  };
  coordination: {
    sequenceComplete: boolean;
    dependenciesResolved: boolean;
    synchronizationStatus: string;
  };
  processingTime: number;
  source: string;
}

interface OutputTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  structure: any;
  parameters: Record<string, any>;
  validation: string[];
}

export class SomaticOutputService extends BaseService {
  private outputQueue: Map<string, FormattedBehavioralOutput>;
  private deliveryHandlers: Map<string, (output: FormattedBehavioralOutput) => Promise<boolean>>;
  private outputTemplates: Map<string, OutputTemplate>;
  private executionMonitor: Map<string, any>;
  private coordinationManager: Map<string, any>;

  constructor(config: ServiceConfig) {
    super(config);
    this.outputQueue = new Map();
    this.deliveryHandlers = new Map();
    this.outputTemplates = new Map();
    this.executionMonitor = new Map();
    this.coordinationManager = new Map();
    this.initializeDeliveryHandlers();
    this.initializeOutputTemplates();
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Somatic Output Service');
    
    // Start delivery processor
    setInterval(() => this.processDeliveryQueue(), 100);
    
    // Start coordination monitor
    setInterval(() => this.monitorCoordination(), 500);
    
    this.log('info', 'Somatic Output Service initialized successfully');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    this.log('info', 'Processing behavioral output request', { messageId: message.id });

    try {
      switch (message.type) {
        case 'DELIVER_BEHAVIORAL_OUTPUT':
          return await this.deliverBehavioralOutput(message, startTime);
        case 'GET_OUTPUT_STATUS':
          return await this.getOutputStatus(message, startTime);
        case 'GET_TEMPLATES':
          return await this.getOutputTemplates(message, startTime);
        case 'COORDINATE_OUTPUTS':
          return await this.coordinateOutputs(message, startTime);
        case 'CANCEL_OUTPUT':
          return await this.cancelOutput(message, startTime);
        default:
          this.log('warn', 'Unknown message type', { type: message.type });
          return null;
      }
    } catch (error) {
      this.log('error', 'Error processing behavioral output request', { error: error instanceof Error ? error.message : 'Unknown error' });
      return createMessage(
        'ERROR',
        { error: 'Behavioral output processing failed' },
        this.config.serviceName,
        message.source
      );
    }
  }

  private async deliverBehavioralOutput(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const request = message.payload as BehavioralOutputRequest;
    const outputId = `output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.log('info', 'Delivering behavioral output', { outputId, outputType: request.outputType });

    // Format the output
    const formattedOutput = await this.formatBehavioralOutput(request, outputId);
    
    // Queue for delivery or deliver immediately
    if (request.deliveryMethod === 'immediate') {
      const success = await this.executeDelivery(formattedOutput);
      formattedOutput.deliveryInfo.status = success ? 'delivered' : 'failed';
    } else {
      this.outputQueue.set(outputId, formattedOutput);
      formattedOutput.deliveryInfo.status = 'pending';
    }

    const response: BehavioralResponse = {
      outputId,
      outputs: [formattedOutput],
      delivery: {
        totalOutputs: 1,
        successful: formattedOutput.deliveryInfo.status === 'delivered' ? 1 : 0,
        pending: formattedOutput.deliveryInfo.status === 'pending' ? 1 : 0,
        failed: formattedOutput.deliveryInfo.status === 'failed' ? 1 : 0
      },
      coordination: {
        sequenceComplete: request.coordination.dependencies.length === 0,
        dependenciesResolved: await this.checkDependencies(request.coordination.dependencies),
        synchronizationStatus: request.coordination.synchronization
      },
      processingTime: Date.now() - startTime,
      source: this.config.serviceName
    };

    return createMessage(
      'BEHAVIORAL_OUTPUT_DELIVERED',
      response,
      this.config.serviceName,
      message.source
    );
  }

  private async getOutputStatus(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { outputIds } = message.payload || { outputIds: [] };
    
    const statusList = outputIds.length > 0 
      ? outputIds.map((id: string) => this.getOutputById(id)).filter(Boolean)
      : Array.from(this.outputQueue.values());
    
    return createMessage(
      'OUTPUT_STATUS_RESPONSE',
      { 
        outputs: statusList,
        queueSize: this.outputQueue.size,
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async getOutputTemplates(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const templates = Array.from(this.outputTemplates.values());
    
    return createMessage(
      'TEMPLATES_RESPONSE',
      { 
        templates,
        totalAvailable: templates.length,
        categories: [...new Set(templates.map(t => t.type))],
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async coordinateOutputs(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { coordinationGroup } = message.payload;
    
    this.log('info', 'Coordinating output group', { group: coordinationGroup.id });

    // Set up coordination
    this.coordinationManager.set(coordinationGroup.id, {
      outputs: coordinationGroup.outputs,
      dependencies: coordinationGroup.dependencies,
      synchronization: coordinationGroup.synchronization,
      status: 'coordinating'
    });

    // Process coordination
    const result = await this.executeCoordination(coordinationGroup);
    
    return createMessage(
      'COORDINATION_COMPLETE',
      { 
        coordinationGroup: coordinationGroup.id,
        result,
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async cancelOutput(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { outputId } = message.payload;
    
    const output = this.outputQueue.get(outputId);
    if (output) {
      output.deliveryInfo.status = 'failed';
      this.outputQueue.delete(outputId);
      this.log('info', 'Output cancelled', { outputId });
    }
    
    return createMessage(
      'OUTPUT_CANCELLED',
      { 
        outputId,
        cancelled: !!output,
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async formatBehavioralOutput(request: BehavioralOutputRequest, outputId: string): Promise<FormattedBehavioralOutput> {
    // Select appropriate template
    const template = this.selectOutputTemplate(request);
    
    // Format the data
    const formattedData = await this.applyOutputFormatting(request.behaviorData, template, request.format);
    
    // Generate execution commands
    const commands = await this.generateExecutionCommands(request, formattedData);
    
    // Set up monitoring
    const monitoring = {
      checkpoints: ['start', 'execution', 'completion'],
      feedback: [],
      errors: []
    };

    const output: FormattedBehavioralOutput = {
      id: outputId,
      originalRequest: request,
      formattedData,
      deliveryInfo: {
        method: request.deliveryMethod,
        target: request.target.identifier,
        protocol: request.target.protocol,
        timestamp: new Date(),
        status: 'pending',
        retryCount: 0
      },
      execution: {
        commands,
        monitoring,
        coordination: request.coordination
      },
      metadata: {
        processingTime: 0,
        size: JSON.stringify(formattedData).length,
        priority: this.calculatePriority(request)
      }
    };

    return output;
  }

  private selectOutputTemplate(request: BehavioralOutputRequest): OutputTemplate {
    // Find matching template
    const candidates = Array.from(this.outputTemplates.values())
      .filter(template => template.type === request.outputType);
    
    if (candidates.length === 0) {
      return this.createDefaultTemplate(request);
    }
    
    return candidates[0]; // Simple selection, could be more sophisticated
  }

  private async applyOutputFormatting(data: any, template: OutputTemplate, format: any): Promise<any> {
    let formatted = { ...data };
    
    // Apply template structure
    if (template.structure) {
      formatted = this.applyTemplateStructure(formatted, template.structure);
    }
    
    // Apply encoding
    if (format.encoding === 'json') {
      formatted = JSON.stringify(formatted);
    } else if (format.encoding === 'binary') {
      formatted = Buffer.from(JSON.stringify(formatted));
    }
    
    // Apply compression if requested
    if (format.compression) {
      // Simulate compression
      formatted = { compressed: true, data: formatted, ratio: 0.7 };
    }
    
    return formatted;
  }

  private async generateExecutionCommands(request: BehavioralOutputRequest, data: any): Promise<any[]> {
    const commands = [];
    
    switch (request.outputType) {
      case 'action':
        commands.push({
          type: 'execute_action',
          data: data,
          timing: request.timing.delay || 0,
          validation: 'action_completed'
        });
        break;
        
      case 'response':
        commands.push({
          type: 'send_response',
          data: data,
          timing: 0,
          validation: 'response_acknowledged'
        });
        break;
        
      case 'signal':
        commands.push({
          type: 'emit_signal',
          data: data,
          timing: request.timing.delay || 0,
          validation: 'signal_received'
        });
        break;
        
      case 'feedback':
        commands.push({
          type: 'provide_feedback',
          data: data,
          timing: 0,
          validation: 'feedback_processed'
        });
        break;
        
      case 'adaptation':
        commands.push({
          type: 'apply_adaptation',
          data: data,
          timing: request.timing.delay || 0,
          validation: 'adaptation_applied'
        });
        break;
    }
    
    return commands;
  }

  private async executeDelivery(output: FormattedBehavioralOutput): Promise<boolean> {
    try {
      // Get appropriate delivery handler
      const handler = this.deliveryHandlers.get(output.originalRequest.target.type);
      if (!handler) {
        this.log('error', 'No delivery handler found', { targetType: output.originalRequest.target.type });
        return false;
      }
      
      // Execute delivery
      const success = await handler(output);
      
      if (success) {
        output.deliveryInfo.status = 'delivered';
        this.log('info', 'Output delivered successfully', { outputId: output.id });
      } else {
        output.deliveryInfo.retryCount++;
        this.log('warn', 'Output delivery failed', { outputId: output.id, retryCount: output.deliveryInfo.retryCount });
      }
      
      return success;
      
    } catch (error) {
      this.log('error', 'Delivery execution error', { outputId: output.id, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  private async processDeliveryQueue(): Promise<void> {
    for (const [outputId, output] of this.outputQueue) {
      if (output.deliveryInfo.status === 'pending') {
        // Check if dependencies are resolved
        if (await this.checkDependencies(output.execution.coordination.dependencies)) {
          // Check timing constraints
          if (this.isTimeToDeliver(output)) {
            const success = await this.executeDelivery(output);
            if (success || output.deliveryInfo.retryCount > 3) {
              this.outputQueue.delete(outputId);
            }
          }
        }
      }
    }
  }

  private async monitorCoordination(): Promise<void> {
    for (const [groupId, coordination] of this.coordinationManager) {
      if (coordination.status === 'coordinating') {
        const allComplete = coordination.outputs.every((outputId: string) => {
          const output = this.outputQueue.get(outputId);
          return !output || output.deliveryInfo.status === 'delivered';
        });
        
        if (allComplete) {
          coordination.status = 'complete';
          this.log('info', 'Coordination group completed', { groupId });
        }
      }
    }
  }

  private async checkDependencies(dependencies: string[]): Promise<boolean> {
    return dependencies.every(dep => {
      const depOutput = this.outputQueue.get(dep);
      return !depOutput || depOutput.deliveryInfo.status === 'delivered';
    });
  }

  private isTimeToDeliver(output: FormattedBehavioralOutput): boolean {
    const now = Date.now();
    const delay = output.originalRequest.timing.delay || 0;
    const scheduledTime = output.deliveryInfo.timestamp.getTime() + delay;
    
    return now >= scheduledTime;
  }

  private async executeCoordination(coordinationGroup: any): Promise<any> {
    // Simulate coordination execution
    const results = {
      groupId: coordinationGroup.id,
      outputsProcessed: coordinationGroup.outputs.length,
      synchronization: coordinationGroup.synchronization,
      success: true
    };
    
    return results;
  }

  private getOutputById(outputId: string): FormattedBehavioralOutput | null {
    return this.outputQueue.get(outputId) || null;
  }

  private calculatePriority(request: BehavioralOutputRequest): 'low' | 'medium' | 'high' | 'critical' {
    if (request.timing.immediate) return 'critical';
    if (request.outputType === 'action') return 'high';
    if (request.outputType === 'response') return 'medium';
    return 'low';
  }

  private applyTemplateStructure(data: any, structure: any): any {
    // Apply template structure to data
    const structured = { ...structure };
    
    // Simple template application
    if (structure.wrapper) {
      return { [structure.wrapper]: data };
    }
    
    return { ...structured, ...data };
  }

  private createDefaultTemplate(request: BehavioralOutputRequest): OutputTemplate {
    return {
      id: 'default-' + request.outputType,
      name: `Default ${request.outputType} Template`,
      type: request.outputType,
      description: `Default template for ${request.outputType} outputs`,
      structure: {
        type: request.outputType,
        timestamp: new Date().toISOString(),
        data: null
      },
      parameters: {},
      validation: ['type_check', 'timestamp_valid']
    };
  }

  private initializeDeliveryHandlers(): void {
    // Actuator delivery handler
    this.deliveryHandlers.set('actuator', async (output) => {
      this.log('info', 'Delivering to actuator', { target: output.originalRequest.target.identifier });
      // Simulate actuator delivery
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
      return Math.random() > 0.05; // 95% success rate
    });
    
    // Interface delivery handler
    this.deliveryHandlers.set('interface', async (output) => {
      this.log('info', 'Delivering to interface', { target: output.originalRequest.target.identifier });
      // Simulate interface delivery
      await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 5));
      return Math.random() > 0.02; // 98% success rate
    });
    
    // System delivery handler
    this.deliveryHandlers.set('system', async (output) => {
      this.log('info', 'Delivering to system', { target: output.originalRequest.target.identifier });
      // Simulate system delivery
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));
      return Math.random() > 0.01; // 99% success rate
    });
    
    // External delivery handler
    this.deliveryHandlers.set('external', async (output) => {
      this.log('info', 'Delivering to external system', { target: output.originalRequest.target.identifier });
      // Simulate external delivery
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      return Math.random() > 0.1; // 90% success rate
    });
  }

  private initializeOutputTemplates(): void {
    const templates: OutputTemplate[] = [
      {
        id: 'action-command',
        name: 'Action Command Template',
        type: 'action',
        description: 'Template for action commands',
        structure: {
          command: null,
          parameters: {},
          timestamp: null,
          priority: 'medium'
        },
        parameters: { validation: true },
        validation: ['command_valid', 'parameters_check']
      },
      {
        id: 'response-message',
        name: 'Response Message Template',
        type: 'response',
        description: 'Template for response messages',
        structure: {
          status: null,
          data: null,
          timestamp: null,
          requestId: null
        },
        parameters: { includeMetadata: true },
        validation: ['status_valid', 'data_format']
      },
      {
        id: 'feedback-signal',
        name: 'Feedback Signal Template',
        type: 'feedback',
        description: 'Template for feedback signals',
        structure: {
          feedbackType: null,
          value: null,
          confidence: null,
          timestamp: null
        },
        parameters: { realTime: true },
        validation: ['type_check', 'value_range']
      }
    ];
    
    templates.forEach(template => {
      this.outputTemplates.set(template.id, template);
    });
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Somatic Output Service');
    
    // Complete pending deliveries
    const pendingOutputs = Array.from(this.outputQueue.values()).filter(
      output => output.deliveryInfo.status === 'pending'
    );
    
    this.log('info', `Completing ${pendingOutputs.length} pending deliveries`);
    
    for (const output of pendingOutputs) {
      await this.executeDelivery(output);
    }
    
    // Clear queues
    this.outputQueue.clear();
    this.coordinationManager.clear();
    
    this.log('info', 'Somatic Output Service shutdown complete');
  }
}