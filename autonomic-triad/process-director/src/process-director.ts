import { BaseService, ServiceConfig, ServiceMessage } from '@cosmos/cognitive-core-shared-libraries';

interface BackgroundProcess {
  id: string;
  name: string;
  type: 'scheduled' | 'triggered' | 'continuous';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  schedule?: string; // cron format
  dependencies: string[];
  startTime?: Date;
  endTime?: Date;
  lastRun?: Date;
  nextRun?: Date;
  metadata: Record<string, any>;
}

interface ProcessQueue {
  high: BackgroundProcess[];
  medium: BackgroundProcess[];
  low: BackgroundProcess[];
  critical: BackgroundProcess[];
}

export class AutonomicProcessDirector extends BaseService {
  private processes: Map<string, BackgroundProcess> = new Map();
  private processQueue: ProcessQueue = { high: [], medium: [], low: [], critical: [] };
  private runningProcesses: Set<string> = new Set();
  private maxConcurrentProcesses = 5;

  constructor(config: ServiceConfig) {
    super(config);
    this.initializeDefaultProcesses();
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Autonomic Process Director');
    this.startProcessManager();
    this.log('info', 'Process Director initialized successfully');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    
    try {
      switch (message.type) {
        case 'SCHEDULE_PROCESS':
          return await this.scheduleProcess(message, startTime);
        case 'GET_PROCESSES':
          return await this.getProcesses(message, startTime);
        case 'TERMINATE_PROCESS':
          return await this.terminateProcess(message, startTime);
        case 'GET_QUEUE':
          return await this.getProcessQueue(message, startTime);
        default:
          this.log('warn', `Unknown message type: ${message.type}`);
          return null;
      }
    } catch (error) {
      this.log('error', 'Error processing message', { error, messageType: message.type });
      return null;
    }
  }

  private async scheduleProcess(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const processConfig = message.payload;
    
    const process: BackgroundProcess = {
      id: `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: processConfig.process || 'unnamed_process',
      type: processConfig.type || 'triggered',
      status: 'pending',
      priority: processConfig.priority || 'medium',
      schedule: processConfig.schedule,
      dependencies: processConfig.dependencies || [],
      metadata: processConfig.metadata || {}
    };

    this.processes.set(process.id, process);
    this.addToQueue(process);

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'PROCESS_SCHEDULED',
      payload: {
        processId: process.id,
        scheduled: true,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async getProcesses(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'PROCESSES_RESPONSE',
      payload: {
        processes: Array.from(this.processes.values()),
        running: Array.from(this.runningProcesses),
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async terminateProcess(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { processId } = message.payload;
    const process = this.processes.get(processId);
    
    if (process) {
      process.status = 'failed';
      this.runningProcesses.delete(processId);
    }

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'PROCESS_TERMINATED',
      payload: {
        processId,
        terminated: !!process,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async getProcessQueue(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'QUEUE_RESPONSE',
      payload: {
        queue: this.processQueue,
        running: Array.from(this.runningProcesses),
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private initializeDefaultProcesses(): void {
    const defaultProcesses = [
      {
        name: 'health_check_routine',
        type: 'scheduled',
        schedule: '*/5 * * * *', // Every 5 minutes
        priority: 'medium'
      },
      {
        name: 'system_cleanup',
        type: 'scheduled', 
        schedule: '0 2 * * *', // Daily at 2 AM
        priority: 'low'
      }
    ];

    defaultProcesses.forEach(config => {
      const process: BackgroundProcess = {
        id: `default_${config.name}_${Date.now()}`,
        name: config.name,
        type: config.type as any,
        status: 'pending',
        priority: config.priority as any,
        schedule: config.schedule,
        dependencies: [],
        metadata: { isDefault: true }
      };
      this.processes.set(process.id, process);
      this.addToQueue(process);
    });
  }

  private startProcessManager(): void {
    setInterval(() => {
      this.executeQueuedProcesses();
    }, 10000); // Check every 10 seconds
  }

  private addToQueue(process: BackgroundProcess): void {
    this.processQueue[process.priority].push(process);
  }

  private executeQueuedProcesses(): void {
    if (this.runningProcesses.size >= this.maxConcurrentProcesses) {
      return;
    }

    // Process critical priority first, then high, medium, low
    const priorities: (keyof ProcessQueue)[] = ['critical', 'high', 'medium', 'low'];
    
    for (const priority of priorities) {
      const queue = this.processQueue[priority];
      if (queue.length > 0 && this.runningProcesses.size < this.maxConcurrentProcesses) {
        const process = queue.shift()!;
        this.executeProcess(process);
      }
    }
  }

  private async executeProcess(process: BackgroundProcess): Promise<void> {
    process.status = 'running';
    process.startTime = new Date();
    this.runningProcesses.add(process.id);

    this.log('info', `Executing process: ${process.name}`, { processId: process.id });

    try {
      // Simulate process execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 1000));
      
      process.status = 'completed';
      process.endTime = new Date();
      process.lastRun = new Date();
      
      this.log('info', `Process completed: ${process.name}`, { processId: process.id });
    } catch (error) {
      process.status = 'failed';
      process.endTime = new Date();
      this.log('error', `Process failed: ${process.name}`, { processId: process.id, error });
    } finally {
      this.runningProcesses.delete(process.id);
    }
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Process Director');
    this.runningProcesses.clear();
    this.processes.clear();
    this.log('info', 'Process Director shutdown complete');
  }
}