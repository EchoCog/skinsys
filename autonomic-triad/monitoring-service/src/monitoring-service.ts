import { BaseService, ServiceConfig, ServiceMessage } from '@cosmos/cognitive-core-shared-libraries';

interface MonitoringTarget {
  id: string;
  name: string;
  type: 'service' | 'triad' | 'system';
  endpoint: string;
  metrics: string[];
  interval: number;
  thresholds: Record<string, number>;
  lastCheck: Date;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

interface MetricData {
  timestamp: Date;
  target: string;
  metric: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

interface Alert {
  id: string;
  target: string;
  metric: string;
  level: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface MonitoringRequest {
  component: string;
  metrics: string[];
  interval?: number;
  thresholds?: Record<string, number>;
}

export class MonitoringService extends BaseService {
  private monitoringTargets: Map<string, MonitoringTarget> = new Map();
  private metrics: MetricData[] = [];
  private alerts: Alert[] = [];
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: ServiceConfig) {
    super(config);
    this.initializeDefaultTargets();
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Monitoring Service');
    
    // Start system self-monitoring
    this.startSelfMonitoring();
    
    this.log('info', 'Monitoring Service initialized successfully');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    
    try {
      switch (message.type) {
        case 'MONITOR_COMPONENT':
          return await this.monitorComponent(message, startTime);
        case 'GET_METRICS':
          return await this.getMetrics(message, startTime);
        case 'GET_ALERTS':
          return await this.getAlerts(message, startTime);
        case 'CONFIGURE_MONITORING':
          return await this.configureMonitoring(message, startTime);
        case 'ACKNOWLEDGE_ALERT':
          return await this.acknowledgeAlert(message, startTime);
        default:
          this.log('warn', `Unknown message type: ${message.type}`);
          return null;
      }
    } catch (error) {
      this.log('error', 'Error processing message', { error, messageType: message.type });
      return null;
    }
  }

  private async monitorComponent(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const request = message.payload as MonitoringRequest;
    
    const targetId = this.generateTargetId(request.component);
    const target: MonitoringTarget = {
      id: targetId,
      name: request.component,
      type: this.determineComponentType(request.component),
      endpoint: this.getComponentEndpoint(request.component),
      metrics: request.metrics,
      interval: request.interval || 30000, // 30 seconds default
      thresholds: request.thresholds || this.getDefaultThresholds(request.metrics),
      lastCheck: new Date(),
      status: 'unknown'
    };

    this.monitoringTargets.set(targetId, target);
    this.startMonitoring(target);

    this.log('info', `Started monitoring component: ${request.component}`, {
      targetId,
      metrics: request.metrics,
      interval: target.interval
    });

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'MONITORING_STARTED',
      payload: {
        targetId,
        component: request.component,
        status: 'monitoring_started',
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async getMetrics(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const filters = message.payload || {};
    
    let filteredMetrics = this.metrics;
    
    if (filters.target) {
      filteredMetrics = filteredMetrics.filter(m => m.target === filters.target);
    }
    
    if (filters.metric) {
      filteredMetrics = filteredMetrics.filter(m => m.metric === filters.metric);
    }
    
    if (filters.since) {
      const since = new Date(filters.since);
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= since);
    }

    // Get current system metrics
    const currentMetrics = this.collectSystemMetrics();
    
    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'METRICS_RESPONSE',
      payload: {
        metrics: filteredMetrics.slice(-100), // Return last 100 metrics
        currentMetrics,
        totalMetrics: this.metrics.length,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async getAlerts(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const filters = message.payload || {};
    
    let filteredAlerts = this.alerts;
    
    if (filters.level) {
      filteredAlerts = filteredAlerts.filter(a => a.level === filters.level);
    }
    
    if (filters.acknowledged !== undefined) {
      filteredAlerts = filteredAlerts.filter(a => a.acknowledged === filters.acknowledged);
    }
    
    if (filters.target) {
      filteredAlerts = filteredAlerts.filter(a => a.target === filters.target);
    }

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'ALERTS_RESPONSE',
      payload: {
        alerts: filteredAlerts,
        activeAlerts: filteredAlerts.filter(a => !a.acknowledged),
        totalAlerts: this.alerts.length,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async configureMonitoring(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const config = message.payload;
    
    if (config.targetId && this.monitoringTargets.has(config.targetId)) {
      const target = this.monitoringTargets.get(config.targetId)!;
      
      if (config.interval) {
        target.interval = config.interval;
        this.restartMonitoring(target);
      }
      
      if (config.thresholds) {
        target.thresholds = { ...target.thresholds, ...config.thresholds };
      }
      
      if (config.metrics) {
        target.metrics = config.metrics;
      }
      
      this.monitoringTargets.set(config.targetId, target);
      
      this.log('info', `Updated monitoring configuration for target: ${config.targetId}`);
    }

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'MONITORING_CONFIGURED',
      payload: {
        targetId: config.targetId,
        updated: true,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private async acknowledgeAlert(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { alertId } = message.payload;
    
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.log('info', `Alert acknowledged: ${alertId}`);
    }

    const processingTime = Date.now() - startTime;
    return {
      id: message.id,
      type: 'ALERT_ACKNOWLEDGED',
      payload: {
        alertId,
        acknowledged: !!alert,
        processingTime
      },
      timestamp: new Date(),
      source: this.config.serviceName,
      target: message.source
    };
  }

  private initializeDefaultTargets(): void {
    // Add default monitoring targets for known services
    const defaultTargets = [
      { name: 'cerebral-triad', port: 3000, metrics: ['health', 'response_time', 'cpu', 'memory'] },
      { name: 'somatic-triad', port: 3010, metrics: ['health', 'response_time', 'cpu', 'memory'] },
      { name: 'api-gateway', port: 3000, metrics: ['health', 'response_time', 'requests_per_second'] }
    ];

    defaultTargets.forEach(target => {
      const targetId = this.generateTargetId(target.name);
      this.monitoringTargets.set(targetId, {
        id: targetId,
        name: target.name,
        type: 'triad',
        endpoint: `http://localhost:${target.port}/health`,
        metrics: target.metrics,
        interval: 60000, // 1 minute
        thresholds: this.getDefaultThresholds(target.metrics),
        lastCheck: new Date(),
        status: 'unknown'
      });
    });
  }

  private startSelfMonitoring(): void {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  private startMonitoring(target: MonitoringTarget): void {
    // Stop existing monitoring if any
    if (this.monitoringIntervals.has(target.id)) {
      clearInterval(this.monitoringIntervals.get(target.id)!);
    }

    const interval = setInterval(async () => {
      await this.checkTarget(target);
    }, target.interval);

    this.monitoringIntervals.set(target.id, interval);
  }

  private restartMonitoring(target: MonitoringTarget): void {
    this.stopMonitoring(target.id);
    this.startMonitoring(target);
  }

  private stopMonitoring(targetId: string): void {
    if (this.monitoringIntervals.has(targetId)) {
      clearInterval(this.monitoringIntervals.get(targetId)!);
      this.monitoringIntervals.delete(targetId);
    }
  }

  private async checkTarget(target: MonitoringTarget): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Simulate health check (in real implementation, would make HTTP request)
      const responseTime = Math.random() * 100 + 50; // 50-150ms
      const isHealthy = Math.random() > 0.1; // 90% success rate
      
      target.lastCheck = new Date();
      target.status = isHealthy ? 'healthy' : 'critical';

      // Record metrics
      target.metrics.forEach(metricName => {
        const metricValue = this.generateMetricValue(metricName);
        const metric: MetricData = {
          timestamp: new Date(),
          target: target.name,
          metric: metricName,
          value: metricValue,
          unit: this.getMetricUnit(metricName),
          status: this.evaluateMetricStatus(metricName, metricValue, target.thresholds)
        };

        this.metrics.push(metric);

        // Check for alerts
        if (metric.status === 'warning' || metric.status === 'critical') {
          this.createAlert(target, metric);
        }
      });

      // Cleanup old metrics (keep last 1000)
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

    } catch (error) {
      this.log('error', `Error checking target ${target.name}`, { error });
      target.status = 'critical';
    }
  }

  private collectSystemMetrics(): Record<string, number> {
    const metrics = {
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      response_time: Math.random() * 200 + 50,
      active_monitors: this.monitoringTargets.size,
      total_metrics: this.metrics.length,
      active_alerts: this.alerts.filter(a => !a.acknowledged).length
    };

    // Record system metrics
    Object.entries(metrics).forEach(([metric, value]) => {
      this.metrics.push({
        timestamp: new Date(),
        target: 'monitoring-service',
        metric,
        value,
        unit: this.getMetricUnit(metric),
        status: 'normal'
      });
    });

    return metrics;
  }

  private generateMetricValue(metricName: string): number {
    switch (metricName) {
      case 'cpu':
      case 'cpu_usage':
        return Math.random() * 100;
      case 'memory':
      case 'memory_usage':
        return Math.random() * 100;
      case 'response_time':
        return Math.random() * 200 + 50;
      case 'requests_per_second':
        return Math.random() * 1000;
      case 'health':
        return Math.random() > 0.1 ? 1 : 0;
      default:
        return Math.random() * 100;
    }
  }

  private getMetricUnit(metricName: string): string {
    switch (metricName) {
      case 'cpu':
      case 'cpu_usage':
      case 'memory':
      case 'memory_usage':
        return '%';
      case 'response_time':
        return 'ms';
      case 'requests_per_second':
        return 'req/s';
      case 'health':
        return 'boolean';
      default:
        return 'units';
    }
  }

  private evaluateMetricStatus(metricName: string, value: number, thresholds: Record<string, number>): 'normal' | 'warning' | 'critical' {
    const warningThreshold = thresholds[`${metricName}_warning`];
    const criticalThreshold = thresholds[`${metricName}_critical`];

    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      return 'critical';
    }
    
    if (warningThreshold !== undefined && value >= warningThreshold) {
      return 'warning';
    }

    return 'normal';
  }

  private createAlert(target: MonitoringTarget, metric: MetricData): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      target: target.name,
      metric: metric.metric,
      level: metric.status as 'warning' | 'critical',
      message: `${metric.metric} is ${metric.status}: ${metric.value}${metric.unit}`,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);
    
    this.log('warn', `Alert created: ${alert.message}`, {
      alertId: alert.id,
      target: target.name
    });

    // Cleanup old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  private generateTargetId(componentName: string): string {
    return `monitor_${componentName}_${Date.now()}`;
  }

  private determineComponentType(componentName: string): 'service' | 'triad' | 'system' {
    if (componentName.includes('triad')) return 'triad';
    if (componentName.includes('service')) return 'service';
    return 'system';
  }

  private getComponentEndpoint(componentName: string): string {
    // Map component names to endpoints
    const endpointMap: Record<string, string> = {
      'cerebral-triad': 'http://localhost:3001/health',
      'somatic-triad': 'http://localhost:3011/health',
      'api-gateway': 'http://localhost:3000/health'
    };

    return endpointMap[componentName] || `http://localhost:3000/health`;
  }

  private getDefaultThresholds(metrics: string[]): Record<string, number> {
    const thresholds: Record<string, number> = {};
    
    metrics.forEach(metric => {
      switch (metric) {
        case 'cpu':
        case 'cpu_usage':
          thresholds[`${metric}_warning`] = 70;
          thresholds[`${metric}_critical`] = 90;
          break;
        case 'memory':
        case 'memory_usage':
          thresholds[`${metric}_warning`] = 80;
          thresholds[`${metric}_critical`] = 95;
          break;
        case 'response_time':
          thresholds[`${metric}_warning`] = 1000;
          thresholds[`${metric}_critical`] = 5000;
          break;
        case 'requests_per_second':
          thresholds[`${metric}_warning`] = 500;
          thresholds[`${metric}_critical`] = 1000;
          break;
      }
    });

    return thresholds;
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Monitoring Service');
    
    // Stop all monitoring intervals
    this.monitoringIntervals.forEach((interval, targetId) => {
      clearInterval(interval);
    });
    this.monitoringIntervals.clear();
    
    // Clear data
    this.monitoringTargets.clear();
    this.metrics.length = 0;
    this.alerts.length = 0;
    
    this.log('info', 'Monitoring Service shutdown complete');
  }
}