import { BaseService, ServiceConfig, ServiceMessage } from '@cosmos/cognitive-core-shared-libraries';

interface SystemState {
  id: string;
  timestamp: Date;
  triads: {
    cerebral: TriadState;
    somatic: TriadState;
    autonomic: TriadState;
  };
  services: Record<string, ServiceState>;
  configuration: SystemConfiguration;
  performance: PerformanceMetrics;
  environment: string;
  version: string;
}

interface TriadState {
  status: 'active' | 'inactive' | 'degraded' | 'error';
  services: string[];
  lastUpdate: Date;
  health: number; // 0-1 scale
  load: number;   // 0-1 scale
}

interface ServiceState {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  port: number;
  lastHeartbeat: Date;
  version: string;
  metrics: Record<string, number>;
  dependencies: string[];
}

interface SystemConfiguration {
  monitoring: {
    interval: number;
    retentionDays: number;
    alertThresholds: Record<string, number>;
  };
  networking: {
    timeout: number;
    retries: number;
    loadBalancing: boolean;
  };
  scaling: {
    autoScale: boolean;
    minInstances: number;
    maxInstances: number;
  };
  security: {
    authEnabled: boolean;
    encryptionEnabled: boolean;
  };
}

interface PerformanceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
}

interface StateHistoryEntry {
  timestamp: Date;
  state: SystemState;
  changeDescription: string;
  changedBy: string;
}

interface BackupEntry {
  id: string;
  timestamp: Date;
  state: SystemState;
  description: string;
  size: number;
}

export class StateManagementService extends BaseService {
  private currentState!: SystemState;
  private stateHistory: StateHistoryEntry[] = [];
  private backups: BackupEntry[] = [];
  private configuration!: SystemConfiguration;
  private subscribers: Map<string, (state: SystemState) => void> = new Map();

  constructor(config: ServiceConfig) {
    super(config);
    this.initializeDefaultState();
    this.initializeDefaultConfiguration();
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing State Management Service');
    
    // Start periodic state updates
    this.startStateUpdates();
    
    // Start configuration persistence
    this.startConfigurationSync();
    
    this.log('info', 'State Management Service initialized successfully');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    
    try {
      switch (message.type) {
        case 'GET_STATE':
          return await this.getState(message, startTime);
        case 'UPDATE_STATE':
          return await this.updateState(message, startTime);
        case 'GET_CONFIG':
          return await this.getConfiguration(message, startTime);
        case 'UPDATE_CONFIG':
          return await this.updateConfiguration(message, startTime);
        case 'GET_HISTORY':
          return await this.getStateHistory(message, startTime);
        case 'CREATE_BACKUP':
          return await this.createBackup(message, startTime);
        case 'RESTORE_BACKUP':
          return await this.restoreBackup(message, startTime);
        case 'SUBSCRIBE_STATE':
          return await this.subscribeToState(message, startTime);
        case 'UPDATE_SERVICE_STATE':
          return await this.updateServiceState(message, startTime);
        default:
          this.log('warn', `Unknown message type: ${message.type}`);
          return null;
      }
    } catch (error) {
      this.log('error', 'Error processing message', { error, messageType: message.type });
      return null;
    }
  }

  private async getState(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const filters = message.payload || {};
    
    let responseState = this.currentState;
    
    // Apply filters if specified
    if (filters.triad) {
      responseState = {
        ...this.currentState,
        triads: {
          ...this.currentState.triads,
          [filters.triad]: this.currentState.triads[filters.triad as keyof typeof this.currentState.triads]
        }
      };
    }
    
    if (filters.services) {
      const filteredServices: Record<string, ServiceState> = {};
      filters.services.forEach((serviceName: string) => {
        if (this.currentState.services[serviceName]) {
          filteredServices[serviceName] = this.currentState.services[serviceName];
        }
      });
      responseState = {
        ...responseState,
        services: filteredServices
      };
    }

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'STATE_RESPONSE',
      payload: {
        state: responseState,
        timestamp: new Date(),
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async updateState(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { stateUpdate, source } = message.payload;
    
    const previousState = JSON.parse(JSON.stringify(this.currentState));
    
    // Apply state updates
    if (stateUpdate.triads) {
      Object.keys(stateUpdate.triads).forEach(triadName => {
        if (this.currentState.triads[triadName as keyof typeof this.currentState.triads]) {
          this.currentState.triads[triadName as keyof typeof this.currentState.triads] = {
            ...this.currentState.triads[triadName as keyof typeof this.currentState.triads],
            ...stateUpdate.triads[triadName],
            lastUpdate: new Date()
          };
        }
      });
    }
    
    if (stateUpdate.services) {
      Object.keys(stateUpdate.services).forEach(serviceName => {
        this.currentState.services[serviceName] = {
          ...this.currentState.services[serviceName],
          ...stateUpdate.services[serviceName]
        };
      });
    }
    
    if (stateUpdate.performance) {
      this.currentState.performance = {
        ...this.currentState.performance,
        ...stateUpdate.performance
      };
    }

    this.currentState.timestamp = new Date();
    
    // Record state change in history
    this.recordStateChange(previousState, 'State updated via API', source || 'unknown');
    
    // Notify subscribers
    this.notifySubscribers();

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'STATE_UPDATED',
      payload: {
        updated: true,
        timestamp: this.currentState.timestamp,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async getConfiguration(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'CONFIG_RESPONSE',
      payload: {
        configuration: this.configuration,
        timestamp: new Date(),
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async updateConfiguration(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { configUpdate } = message.payload;
    
    // Update configuration
    this.configuration = {
      ...this.configuration,
      ...configUpdate
    };
    
    this.log('info', 'Configuration updated', { configUpdate });

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'CONFIG_UPDATED',
      payload: {
        updated: true,
        configuration: this.configuration,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async getStateHistory(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { limit = 50, since } = message.payload || {};
    
    let history = this.stateHistory;
    
    if (since) {
      const sinceDate = new Date(since);
      history = history.filter(entry => entry.timestamp >= sinceDate);
    }
    
    // Return most recent entries first
    history = history.slice(-limit).reverse();

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'HISTORY_RESPONSE',
      payload: {
        history,
        totalEntries: this.stateHistory.length,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async createBackup(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { description = 'Manual backup' } = message.payload || {};
    
    const backup: BackupEntry = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(this.currentState)),
      description,
      size: JSON.stringify(this.currentState).length
    };
    
    this.backups.push(backup);
    
    // Keep only last 10 backups
    if (this.backups.length > 10) {
      this.backups = this.backups.slice(-10);
    }
    
    this.log('info', `Backup created: ${backup.id}`, { description });

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'BACKUP_CREATED',
      payload: {
        backupId: backup.id,
        timestamp: backup.timestamp,
        size: backup.size,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async restoreBackup(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { backupId } = message.payload;
    
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      const processingTime = Date.now() - startTime;
      return {
        id: message.id,
        type: 'BACKUP_NOT_FOUND',
        payload: {
          error: 'Backup not found',
          backupId,
          processingTime
        },
        timestamp: new Date(),
        source: this.config.serviceName,
        target: message.source
      };
    }
    
    const previousState = JSON.parse(JSON.stringify(this.currentState));
    this.currentState = JSON.parse(JSON.stringify(backup.state));
    this.currentState.timestamp = new Date();
    
    // Record restoration in history
    this.recordStateChange(previousState, `Restored from backup: ${backup.description}`, message.source || 'unknown');
    
    this.log('info', `State restored from backup: ${backupId}`);

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'BACKUP_RESTORED',
      payload: {
        restored: true,
        backupId,
        timestamp: new Date(),
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async subscribeToState(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { subscriberId, callback } = message.payload;
    
    // In a real implementation, this would set up a webhook or message queue subscription
    this.subscribers.set(subscriberId, callback);
    
    this.log('info', `State subscription created: ${subscriberId}`);

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'SUBSCRIPTION_CREATED',
      payload: {
        subscriberId,
        subscribed: true,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async updateServiceState(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { serviceName, serviceState } = message.payload;
    
    if (!this.currentState.services[serviceName]) {
      this.currentState.services[serviceName] = {
        name: serviceName,
        status: 'running',
        port: 0,
        lastHeartbeat: new Date(),
        version: '1.0.0',
        metrics: {},
        dependencies: []
      };
    }
    
    this.currentState.services[serviceName] = {
      ...this.currentState.services[serviceName],
      ...serviceState,
      lastHeartbeat: new Date()
    };
    
    this.currentState.timestamp = new Date();
    
    // Update triad status based on service states
    this.updateTriadStates();

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'SERVICE_STATE_UPDATED',
      payload: {
        serviceName,
        updated: true,
        timestamp: new Date(),
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private initializeDefaultState(): void {
    this.currentState = {
      id: `state_${Date.now()}`,
      timestamp: new Date(),
      triads: {
        cerebral: {
          status: 'active',
          services: ['thought-service', 'processing-director', 'processing-service', 'output-service'],
          lastUpdate: new Date(),
          health: 1.0,
          load: 0.0
        },
        somatic: {
          status: 'active',
          services: ['motor-control-service', 'sensory-service', 'processing-service', 'output-service'],
          lastUpdate: new Date(),
          health: 1.0,
          load: 0.0
        },
        autonomic: {
          status: 'active',
          services: ['monitoring-service', 'state-management-service', 'process-director', 'processing-service', 'trigger-service'],
          lastUpdate: new Date(),
          health: 1.0,
          load: 0.0
        }
      },
      services: {},
      configuration: this.getDefaultConfiguration(),
      performance: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        responseTime: 0,
        throughput: 0,
        errorRate: 0,
        uptime: 0
      },
      environment: this.config.environment,
      version: '1.0.0'
    };
  }

  private initializeDefaultConfiguration(): void {
    this.configuration = this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): SystemConfiguration {
    return {
      monitoring: {
        interval: 30000,
        retentionDays: 7,
        alertThresholds: {
          cpu: 80,
          memory: 85,
          disk: 90,
          responseTime: 5000
        }
      },
      networking: {
        timeout: 30000,
        retries: 3,
        loadBalancing: true
      },
      scaling: {
        autoScale: false,
        minInstances: 1,
        maxInstances: 5
      },
      security: {
        authEnabled: false,
        encryptionEnabled: false
      }
    };
  }

  private startStateUpdates(): void {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  private startConfigurationSync(): void {
    setInterval(() => {
      // In a real implementation, this would sync to persistent storage
      this.log('info', 'Configuration sync completed');
    }, 300000); // Every 5 minutes
  }

  private updateSystemMetrics(): void {
    this.currentState.performance = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100,
      responseTime: Math.random() * 200 + 50,
      throughput: Math.random() * 1000,
      errorRate: Math.random() * 5,
      uptime: Date.now() - process.uptime() * 1000
    };
    
    this.currentState.timestamp = new Date();
    this.updateTriadStates();
  }

  private updateTriadStates(): void {
    Object.keys(this.currentState.triads).forEach(triadName => {
      const triad = this.currentState.triads[triadName as keyof typeof this.currentState.triads];
      const triadServices = triad.services;
      
      let healthyServices = 0;
      let totalLoad = 0;
      
      triadServices.forEach(serviceName => {
        const service = this.currentState.services[serviceName];
        if (service && service.status === 'running') {
          healthyServices++;
          totalLoad += service.metrics.cpu || 0;
        }
      });
      
      triad.health = triadServices.length > 0 ? healthyServices / triadServices.length : 1.0;
      triad.load = triadServices.length > 0 ? totalLoad / triadServices.length / 100 : 0.0;
      triad.lastUpdate = new Date();
      
      if (triad.health >= 0.8) {
        triad.status = 'active';
      } else if (triad.health >= 0.5) {
        triad.status = 'degraded';
      } else {
        triad.status = 'error';
      }
    });
  }

  private recordStateChange(previousState: SystemState, description: string, changedBy: string): void {
    const historyEntry: StateHistoryEntry = {
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(previousState)),
      changeDescription: description,
      changedBy
    };
    
    this.stateHistory.push(historyEntry);
    
    // Keep only last 100 history entries
    if (this.stateHistory.length > 100) {
      this.stateHistory = this.stateHistory.slice(-100);
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback, subscriberId) => {
      try {
        callback(this.currentState);
      } catch (error) {
        this.log('error', `Error notifying subscriber ${subscriberId}`, { error });
      }
    });
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down State Management Service');
    
    // Create final backup
    const finalBackup: BackupEntry = {
      id: `shutdown_backup_${Date.now()}`,
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(this.currentState)),
      description: 'Final backup before shutdown',
      size: JSON.stringify(this.currentState).length
    };
    this.backups.push(finalBackup);
    
    // Clear subscribers
    this.subscribers.clear();
    
    this.log('info', 'State Management Service shutdown complete');
  }
}