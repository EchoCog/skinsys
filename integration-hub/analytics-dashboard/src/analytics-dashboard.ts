import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import WebSocket from 'ws';
import http from 'http';
import { BaseService } from '@cosmos/cognitive-core-shared-libraries';

const stats = require('simple-statistics');

interface RealTimeMetric {
  metric_id: string;
  service_name: string;
  triad: 'cerebral' | 'somatic' | 'autonomic' | 'ml-core';
  metric_type: 'performance' | 'health' | 'usage' | 'optimization';
  value: number;
  timestamp: number;
  unit?: string;
  threshold?: {
    warning: number;
    critical: number;
  };
}

interface SystemHealth {
  overall_health: number; // 0-100
  triad_health: {
    cerebral: number;
    somatic: number;
    autonomic: number;
    ml_core: number;
  };
  service_status: Record<string, 'healthy' | 'warning' | 'critical' | 'offline'>;
  active_alerts: Alert[];
  performance_summary: {
    avg_response_time: number;
    total_requests: number;
    error_rate: number;
    throughput: number;
  };
}

interface Alert {
  alert_id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  service_name: string;
  timestamp: number;
  resolved: boolean;
  resolution_time?: number;
}

interface PerformanceAnalytics {
  time_range: string;
  service_performance: Record<string, {
    avg_response_time: number;
    success_rate: number;
    throughput: number;
    resource_usage: {
      cpu: number;
      memory: number;
      network: number;
    };
  }>;
  triad_coordination: {
    cross_triad_calls: number;
    coordination_efficiency: number;
    optimization_opportunities: number;
  };
  ml_insights: {
    predictions_made: number;
    patterns_detected: number;
    optimizations_applied: number;
    accuracy_rate: number;
  };
}

interface OptimizationDashboard {
  active_optimizations: number;
  completed_optimizations: number;
  optimization_efficiency: number;
  resource_savings: {
    cpu_saved: number;
    memory_saved: number;
    response_time_improvement: number;
  };
  ml_model_performance: {
    model_name: string;
    accuracy: number;
    last_trained: number;
    predictions_today: number;
  }[];
}

class AnalyticsDashboard extends BaseService {
  private wss: WebSocket.Server;
  private server: http.Server;
  private connectedClients: Set<WebSocket> = new Set();
  private metricsBuffer: Map<string, RealTimeMetric[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private systemHealth: SystemHealth;
  private performanceAnalytics: PerformanceAnalytics;

  constructor() {
    super('Analytics Dashboard', 3030);
    
    // Initialize system health
    this.systemHealth = {
      overall_health: 95,
      triad_health: {
        cerebral: 96,
        somatic: 94,
        autonomic: 97,
        ml_core: 93
      },
      service_status: {},
      active_alerts: [],
      performance_summary: {
        avg_response_time: 245,
        total_requests: 15420,
        error_rate: 0.02,
        throughput: 125.5
      }
    };

    // Initialize performance analytics
    this.performanceAnalytics = {
      time_range: '24h',
      service_performance: {},
      triad_coordination: {
        cross_triad_calls: 8520,
        coordination_efficiency: 0.92,
        optimization_opportunities: 12
      },
      ml_insights: {
        predictions_made: 2456,
        patterns_detected: 18,
        optimizations_applied: 7,
        accuracy_rate: 0.94
      }
    };
  }

  protected setupRoutes(): void {
    // Serve static dashboard files
    this.app.use('/dashboard', express.static('public'));
    
    // Real-time metrics endpoints
    this.app.get('/api/health', this.getSystemHealth.bind(this));
    this.app.get('/api/metrics/real-time', this.getRealTimeMetrics.bind(this));
    this.app.get('/api/analytics/performance', this.getPerformanceAnalytics.bind(this));
    this.app.get('/api/analytics/optimization', this.getOptimizationDashboard.bind(this));
    
    // Alert management
    this.app.get('/api/alerts', this.getAlerts.bind(this));
    this.app.post('/api/alerts/:alertId/resolve', this.resolveAlert.bind(this));
    this.app.post('/api/alerts/create', this.createAlert.bind(this));
    
    // Metrics ingestion
    this.app.post('/api/metrics/ingest', this.ingestMetrics.bind(this));
    this.app.post('/api/health/update', this.updateHealthStatus.bind(this));
    
    // Dashboard configuration
    this.app.get('/api/config/dashboard', this.getDashboardConfig.bind(this));
    this.app.post('/api/config/dashboard', this.updateDashboardConfig.bind(this));
    
    // Historical data
    this.app.get('/api/history/metrics', this.getHistoricalMetrics.bind(this));
    this.app.get('/api/history/performance', this.getHistoricalPerformance.bind(this));
    
    // Export capabilities
    this.app.get('/api/export/metrics', this.exportMetrics.bind(this));
    this.app.get('/api/export/reports', this.generateReports.bind(this));
  }

  protected async initializeService(): Promise<void> {
    console.log('📊 Initializing Analytics Dashboard...');
    
    // Create HTTP server for WebSocket integration
    this.server = http.createServer(this.app);
    
    // Setup WebSocket server for real-time updates
    this.wss = new WebSocket.Server({ server: this.server });
    this.setupWebSocketHandlers();
    
    // Start real-time data simulation and collection
    this.startRealTimeDataCollection();
    
    console.log('✅ Analytics Dashboard ready for real-time monitoring');
  }

  protected override async start(): Promise<void> {
    await this.initializeService();
    
    this.server.listen(this.port, () => {
      console.log(`🚀 ${this.serviceName} listening on port ${this.port}`);
      console.log(`📊 Dashboard available at http://localhost:${this.port}/dashboard`);
      console.log(`🔌 WebSocket server ready for real-time connections`);
    });
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('📱 New dashboard client connected');
      this.connectedClients.add(ws);
      
      // Send initial data to new client
      this.sendToClient(ws, 'initial_data', {
        health: this.systemHealth,
        analytics: this.performanceAnalytics,
        alerts: Array.from(this.alerts.values()).filter(a => !a.resolved)
      });
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('📱 Dashboard client disconnected');
        this.connectedClients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connectedClients.delete(ws);
      });
    });
  }

  private handleClientMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'subscribe_metrics':
        // Client wants to subscribe to specific metrics
        this.sendToClient(ws, 'subscription_confirmed', {
          metrics: data.metrics,
          update_interval: 5000
        });
        break;
        
      case 'request_historical':
        // Client requests historical data
        this.sendHistoricalData(ws, data.timeRange, data.metrics);
        break;
        
      case 'dashboard_action':
        // Client performs dashboard action (zoom, filter, etc.)
        this.handleDashboardAction(ws, data.action, data.parameters);
        break;
    }
  }

  private sendToClient(ws: WebSocket, type: string, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    }
  }

  private broadcastToClients(type: string, data: any): void {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    
    this.connectedClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else {
        this.connectedClients.delete(ws);
      }
    });
  }

  private startRealTimeDataCollection(): void {
    // Simulate real-time metrics collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5000); // Every 5 seconds
    
    // Update analytics every minute
    setInterval(() => {
      this.updatePerformanceAnalytics();
    }, 60000);
    
    // Health check every 30 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }

  private collectSystemMetrics(): void {
    // Simulate collecting metrics from all services
    const currentTime = Date.now();
    
    const triads = ['cerebral', 'somatic', 'autonomic', 'ml-core'];
    const services = ['thought-service', 'processing-director', 'motor-control', 'sensory-service', 
                     'monitoring-service', 'state-management', 'predictive-engine', 'pattern-analyzer'];
    
    services.forEach(service => {
      const triad = triads[Math.floor(Math.random() * triads.length)] as any;
      
      // Generate realistic metrics
      const metrics: RealTimeMetric[] = [
        {
          metric_id: `${service}_response_time`,
          service_name: service,
          triad,
          metric_type: 'performance',
          value: 200 + Math.random() * 300,
          timestamp: currentTime,
          unit: 'ms',
          threshold: { warning: 500, critical: 1000 }
        },
        {
          metric_id: `${service}_cpu_usage`,
          service_name: service,
          triad,
          metric_type: 'usage',
          value: 30 + Math.random() * 40,
          timestamp: currentTime,
          unit: '%',
          threshold: { warning: 70, critical: 90 }
        },
        {
          metric_id: `${service}_memory_usage`,
          service_name: service,
          triad,
          metric_type: 'usage',
          value: 40 + Math.random() * 30,
          timestamp: currentTime,
          unit: '%',
          threshold: { warning: 80, critical: 95 }
        }
      ];
      
      metrics.forEach(metric => {
        this.storeMetric(metric);
        this.checkThresholds(metric);
      });
    });
    
    // Broadcast real-time updates to connected clients
    this.broadcastToClients('metrics_update', {
      timestamp: currentTime,
      services_updated: services.length,
      health_status: this.systemHealth.overall_health
    });
  }

  private storeMetric(metric: RealTimeMetric): void {
    const key = `${metric.service_name}_${metric.metric_type}`;
    
    if (!this.metricsBuffer.has(key)) {
      this.metricsBuffer.set(key, []);
    }
    
    const buffer = this.metricsBuffer.get(key)!;
    buffer.push(metric);
    
    // Keep only last 1000 metrics per key
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 1000);
    }
  }

  private checkThresholds(metric: RealTimeMetric): void {
    if (!metric.threshold) return;
    
    let alertSeverity: 'warning' | 'critical' | null = null;
    
    if (metric.value >= metric.threshold.critical) {
      alertSeverity = 'critical';
    } else if (metric.value >= metric.threshold.warning) {
      alertSeverity = 'warning';
    }
    
    if (alertSeverity) {
      const alertId = `${metric.service_name}_${metric.metric_id}_${Date.now()}`;
      const alert: Alert = {
        alert_id: alertId,
        severity: alertSeverity,
        message: `${metric.service_name}: ${metric.metric_id} is ${metric.value}${metric.unit || ''} (threshold: ${metric.threshold[alertSeverity]}${metric.unit || ''})`,
        service_name: metric.service_name,
        timestamp: Date.now(),
        resolved: false
      };
      
      this.alerts.set(alertId, alert);
      this.systemHealth.active_alerts.push(alert);
      
      // Broadcast alert to clients
      this.broadcastToClients('new_alert', alert);
    }
  }

  private updatePerformanceAnalytics(): void {
    // Update performance analytics based on collected metrics
    const services = Array.from(new Set(
      Array.from(this.metricsBuffer.keys()).map(key => key.split('_')[0])
    ));
    
    services.forEach(service => {
      const responseTimeKey = `${service}_performance`;
      const usageKey = `${service}_usage`;
      
      const responseMetrics = this.metricsBuffer.get(responseTimeKey) || [];
      const usageMetrics = this.metricsBuffer.get(usageKey) || [];
      
      if (responseMetrics.length > 0) {
        const recentMetrics = responseMetrics.slice(-20); // Last 20 metrics
        const avgResponseTime = stats.mean(recentMetrics.map(m => m.value));
        const successRate = 1 - (Math.random() * 0.05); // Simulate 95%+ success rate
        
        this.performanceAnalytics.service_performance[service] = {
          avg_response_time: avgResponseTime,
          success_rate: successRate,
          throughput: 50 + Math.random() * 100,
          resource_usage: {
            cpu: 30 + Math.random() * 40,
            memory: 40 + Math.random() * 30,
            network: 20 + Math.random() * 20
          }
        };
      }
    });
    
    // Update ML insights
    this.performanceAnalytics.ml_insights = {
      predictions_made: this.performanceAnalytics.ml_insights.predictions_made + Math.floor(Math.random() * 10),
      patterns_detected: this.performanceAnalytics.ml_insights.patterns_detected + (Math.random() > 0.9 ? 1 : 0),
      optimizations_applied: this.performanceAnalytics.ml_insights.optimizations_applied + (Math.random() > 0.95 ? 1 : 0),
      accuracy_rate: 0.92 + Math.random() * 0.06 // 92-98% accuracy
    };
    
    // Broadcast analytics update
    this.broadcastToClients('analytics_update', this.performanceAnalytics);
  }

  private performHealthCheck(): void {
    // Update overall system health
    const triadHealthValues = Object.values(this.systemHealth.triad_health);
    this.systemHealth.overall_health = Math.round(stats.mean(triadHealthValues));
    
    // Update performance summary
    this.systemHealth.performance_summary = {
      avg_response_time: 200 + Math.random() * 100,
      total_requests: this.systemHealth.performance_summary.total_requests + Math.floor(Math.random() * 50),
      error_rate: 0.01 + Math.random() * 0.02,
      throughput: 100 + Math.random() * 50
    };
    
    // Broadcast health update
    this.broadcastToClients('health_update', this.systemHealth);
  }

  private sendHistoricalData(ws: WebSocket, timeRange: string, metrics: string[]): void {
    // Generate historical data for requested metrics
    const historicalData = {
      time_range: timeRange,
      data_points: 100,
      metrics: metrics.map(metric => ({
        metric_name: metric,
        values: Array.from({ length: 100 }, (_, i) => ({
          timestamp: Date.now() - (100 - i) * 60000,
          value: 50 + Math.random() * 50
        }))
      }))
    };
    
    this.sendToClient(ws, 'historical_data', historicalData);
  }

  private handleDashboardAction(ws: WebSocket, action: string, parameters: any): void {
    switch (action) {
      case 'zoom':
        this.sendToClient(ws, 'zoom_updated', { timeRange: parameters.timeRange });
        break;
      case 'filter':
        this.sendToClient(ws, 'filter_applied', { filters: parameters.filters });
        break;
      case 'export':
        this.sendToClient(ws, 'export_ready', { downloadUrl: '/api/export/current' });
        break;
    }
  }

  // API endpoint implementations
  private async getSystemHealth(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      health: this.systemHealth,
      timestamp: Date.now()
    });
  }

  private async getRealTimeMetrics(req: express.Request, res: express.Response): Promise<void> {
    const { services, metric_types, limit = 50 } = req.query;
    
    let filteredMetrics: RealTimeMetric[] = [];
    
    this.metricsBuffer.forEach(metrics => {
      filteredMetrics.push(...metrics.slice(-limit as number));
    });
    
    if (services) {
      const serviceList = (services as string).split(',');
      filteredMetrics = filteredMetrics.filter(m => serviceList.includes(m.service_name));
    }
    
    if (metric_types) {
      const typeList = (metric_types as string).split(',');
      filteredMetrics = filteredMetrics.filter(m => typeList.includes(m.metric_type));
    }
    
    res.json({
      success: true,
      metrics: filteredMetrics.sort((a, b) => b.timestamp - a.timestamp),
      total_metrics: filteredMetrics.length
    });
  }

  private async getPerformanceAnalytics(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      analytics: this.performanceAnalytics,
      timestamp: Date.now()
    });
  }

  private async getOptimizationDashboard(req: express.Request, res: express.Response): Promise<void> {
    const optimizationDashboard: OptimizationDashboard = {
      active_optimizations: 5,
      completed_optimizations: 23,
      optimization_efficiency: 0.87,
      resource_savings: {
        cpu_saved: 15.5,
        memory_saved: 22.3,
        response_time_improvement: 18.7
      },
      ml_model_performance: [
        {
          model_name: 'Predictive Health Monitor',
          accuracy: 0.94,
          last_trained: Date.now() - 3600000,
          predictions_today: 1247
        },
        {
          model_name: 'Pattern Recognition Engine',
          accuracy: 0.91,
          last_trained: Date.now() - 7200000,
          predictions_today: 856
        }
      ]
    };
    
    res.json({
      success: true,
      optimization_dashboard: optimizationDashboard,
      timestamp: Date.now()
    });
  }

  private async getAlerts(req: express.Request, res: express.Response): Promise<void> {
    const { resolved = 'false', severity, limit = 100 } = req.query;
    
    let alerts = Array.from(this.alerts.values());
    
    if (resolved === 'false') {
      alerts = alerts.filter(a => !a.resolved);
    }
    
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    
    alerts = alerts.slice(0, limit as number);
    
    res.json({
      success: true,
      alerts: alerts.sort((a, b) => b.timestamp - a.timestamp),
      total_alerts: alerts.length
    });
  }

  private async resolveAlert(req: express.Request, res: express.Response): Promise<void> {
    const { alertId } = req.params;
    
    const alert = this.alerts.get(alertId);
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }
    
    alert.resolved = true;
    alert.resolution_time = Date.now();
    
    // Remove from active alerts
    this.systemHealth.active_alerts = this.systemHealth.active_alerts.filter(a => a.alert_id !== alertId);
    
    // Broadcast alert resolution
    this.broadcastToClients('alert_resolved', alert);
    
    res.json({
      success: true,
      message: 'Alert resolved successfully',
      alert
    });
  }

  private async createAlert(req: express.Request, res: express.Response): Promise<void> {
    const alert: Alert = {
      alert_id: `manual_${Date.now()}`,
      ...req.body,
      timestamp: Date.now(),
      resolved: false
    };
    
    this.alerts.set(alert.alert_id, alert);
    this.systemHealth.active_alerts.push(alert);
    
    // Broadcast new alert
    this.broadcastToClients('new_alert', alert);
    
    res.json({
      success: true,
      alert_created: alert.alert_id,
      alert
    });
  }

  private async ingestMetrics(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { metrics } = req.body;
      
      if (!Array.isArray(metrics)) {
        res.status(400).json({ error: 'Metrics array required' });
        return;
      }
      
      metrics.forEach((metric: RealTimeMetric) => {
        this.storeMetric(metric);
        this.checkThresholds(metric);
      });
      
      res.json({
        success: true,
        metrics_ingested: metrics.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to ingest metrics' });
    }
  }

  private async updateHealthStatus(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { service_name, health_score, status } = req.body;
      
      this.systemHealth.service_status[service_name] = status;
      
      // Update triad health if provided
      if (health_score) {
        // Simple logic to update triad health based on service health
        // In reality, this would be more sophisticated
        const avgHealth = Object.values(this.systemHealth.triad_health).reduce((a, b) => a + b, 0) / 4;
        this.systemHealth.overall_health = Math.round((avgHealth + health_score) / 2);
      }
      
      res.json({
        success: true,
        health_updated: service_name,
        new_status: status
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to update health status' });
    }
  }

  private async getDashboardConfig(req: express.Request, res: express.Response): Promise<void> {
    const config = {
      refresh_interval: 5000,
      default_time_range: '1h',
      alert_threshold_defaults: {
        response_time: { warning: 500, critical: 1000 },
        cpu_usage: { warning: 70, critical: 90 },
        memory_usage: { warning: 80, critical: 95 },
        error_rate: { warning: 0.05, critical: 0.1 }
      },
      dashboard_layout: {
        widgets: ['system_health', 'performance_metrics', 'alerts', 'ml_insights'],
        theme: 'dark',
        auto_refresh: true
      }
    };
    
    res.json({ success: true, config });
  }

  private async updateDashboardConfig(req: express.Request, res: express.Response): Promise<void> {
    // In a real implementation, this would persist the configuration
    res.json({ success: true, message: 'Dashboard configuration updated' });
  }

  private async getHistoricalMetrics(req: express.Request, res: express.Response): Promise<void> {
    const { time_range = '24h', services, metrics } = req.query;
    
    // Generate historical data (in a real implementation, this would query a database)
    const historicalData = {
      time_range,
      data_points: 144, // 24 hours * 6 points per hour
      services: (services as string)?.split(',') || ['all'],
      metrics: (metrics as string)?.split(',') || ['response_time', 'cpu_usage', 'memory_usage']
    };
    
    res.json({
      success: true,
      historical_data: historicalData,
      timestamp: Date.now()
    });
  }

  private async getHistoricalPerformance(req: express.Request, res: express.Response): Promise<void> {
    const { time_range = '7d' } = req.query;
    
    const performanceHistory = {
      time_range,
      performance_trends: {
        response_time_trend: 'improving',
        throughput_trend: 'stable',
        error_rate_trend: 'improving'
      },
      optimization_impact: {
        total_optimizations: 23,
        performance_improvement: 18.5,
        resource_savings: 22.3
      }
    };
    
    res.json({
      success: true,
      performance_history: performanceHistory,
      timestamp: Date.now()
    });
  }

  private async exportMetrics(req: express.Request, res: express.Response): Promise<void> {
    const { format = 'json', time_range = '24h' } = req.query;
    
    const exportData = {
      export_timestamp: Date.now(),
      format,
      time_range,
      total_records: 5420,
      download_url: '/api/download/metrics_export.json'
    };
    
    res.json({
      success: true,
      export_prepared: true,
      export_data: exportData
    });
  }

  private async generateReports(req: express.Request, res: express.Response): Promise<void> {
    const { report_type = 'performance', time_range = '7d' } = req.query;
    
    const report = {
      report_id: `report_${Date.now()}`,
      report_type,
      time_range,
      generated_at: Date.now(),
      status: 'ready',
      download_url: `/api/download/report_${report_type}_${Date.now()}.pdf`
    };
    
    res.json({
      success: true,
      report_generated: true,
      report
    });
  }
}

// Create and start the service
const analyticsDashboard = new AnalyticsDashboard();
analyticsDashboard.start().catch(console.error);

export { AnalyticsDashboard };