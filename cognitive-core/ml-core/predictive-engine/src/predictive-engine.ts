import { BaseService, ServiceConfig, ServiceMessage, createMessage } from '@cosmos/cognitive-core-shared-libraries';

// ML libraries for predictive analytics
const SLR = require('ml-regression').SLR; // Simple Linear Regression
const stats = require('simple-statistics');

interface PredictionData {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

interface PredictionRequest {
  data: PredictionData[];
  predictionHorizon: number; // How many periods ahead to predict
  confidence?: number; // Confidence level (0-1)
  features?: string[]; // Features to use for prediction
}

interface PredictionResult {
  predictions: Array<{
    timestamp: number;
    predicted_value: number;
    confidence: number;
    lower_bound: number;
    upper_bound: number;
  }>;
  model_accuracy: number;
  trend_analysis: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
    seasonality_detected: boolean;
  };
  anomalies_detected: Array<{
    timestamp: number;
    value: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface SystemHealthPrediction {
  service_name: string;
  health_score: number;
  predicted_issues: Array<{
    type: string;
    probability: number;
    estimated_time: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: string[];
}

class PredictiveEngine extends BaseService {
  private models: Map<string, any> = new Map();
  private historicalData: Map<string, PredictionData[]> = new Map();

  constructor(config: ServiceConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Predictive Engine ML models...');
    await this.initializeModels();
    this.log('info', 'Predictive Engine ready for ML inference');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    this.log('info', 'Processing prediction request', { messageId: message.id });

    try {
      switch (message.type) {
        case 'PREDICT_TIMESERIES':
          const timeseriesResult = this.performTimeSeriesPrediction(message.payload);
          return createMessage('PREDICTION_RESULT', timeseriesResult, this.config.serviceName, message.source);
          
        case 'PREDICT_HEALTH':
          const healthResult = this.performSystemHealthPrediction(message.payload);
          return createMessage('HEALTH_PREDICTION_RESULT', healthResult, this.config.serviceName, message.source);
          
        case 'DETECT_ANOMALIES':
          const anomalyResult = this.performAnomalyDetection(message.payload);
          return createMessage('ANOMALY_DETECTION_RESULT', anomalyResult, this.config.serviceName, message.source);
          
        case 'INGEST_DATA':
          this.ingestPredictionData(message.payload);
          return createMessage('DATA_INGESTED', { success: true }, this.config.serviceName, message.source);
          
        default:
          this.log('warn', 'Unknown message type', { type: message.type });
          return null;
      }
    } catch (error) {
      this.log('error', 'Error processing prediction request', { error: error instanceof Error ? error.message : error });
      return createMessage('ERROR', { error: 'Prediction processing failed' }, this.config.serviceName, message.source);
    }
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Predictive Engine');
    // Clean up resources if needed
  }

  private async initializeModels(): Promise<void> {
    // Initialize default prediction models
    this.models.set('linear_trend', {
      type: 'linear_regression',
      trained: false,
      accuracy: 0
    });
    
    this.models.set('anomaly_detector', {
      type: 'statistical_threshold',
      trained: false,
      accuracy: 0
    });
    
    this.models.set('health_predictor', {
      type: 'multi_variable_regression',
      trained: false,
      accuracy: 0
    });
  }



  private performTimeSeriesPrediction(request: PredictionRequest): PredictionResult {
    const data = request.data.sort((a, b) => a.timestamp - b.timestamp);
    const values = data.map(d => d.value);
    const timestamps = data.map((d, i) => i); // Convert to sequential indices
    
    // Simple linear regression for trend prediction
    const regression = new SLR(timestamps, values);
    
    // Calculate trend analysis
    const slope = regression.slope;
    const trendDirection = Math.abs(slope) < 0.001 ? 'stable' : 
                          slope > 0 ? 'increasing' : 'decreasing';
    const trendStrength = Math.min(Math.abs(slope), 1.0);
    
    // Generate predictions
    const predictions = [];
    const lastTimestamp = data[data.length - 1].timestamp;
    const timeInterval = data.length > 1 ? 
      (data[data.length - 1].timestamp - data[data.length - 2].timestamp) : 60000;
    
    // Calculate MSE once outside the loop
    const residuals = values.map((v, idx) => v - regression.predict(idx));
    const mse = stats.mean(residuals.map(r => r * r));
    const standardError = Math.sqrt(mse);
    
    for (let i = 1; i <= request.predictionHorizon; i++) {
      const futureIndex = data.length + i - 1;
      const predictedValue = regression.predict(futureIndex);
      
      // Calculate confidence intervals (simplified)
      const confidenceInterval = 1.96 * standardError; // 95% confidence
      
      predictions.push({
        timestamp: lastTimestamp + (i * timeInterval),
        predicted_value: predictedValue,
        confidence: Math.max(0.5, 1 - (i * 0.1)), // Decrease confidence with distance
        lower_bound: predictedValue - confidenceInterval,
        upper_bound: predictedValue + confidenceInterval
      });
    }
    
    // Detect anomalies in historical data
    const mean = stats.mean(values);
    const stdDev = stats.standardDeviation(values);
    const threshold = 2 * stdDev;
    
    const anomalies = data
      .filter(d => Math.abs(d.value - mean) > threshold)
      .map(d => ({
        timestamp: d.timestamp,
        value: d.value,
        severity: Math.abs(d.value - mean) > 3 * stdDev ? 'high' as const : 'medium' as const
      }));
    
    return {
      predictions,
      model_accuracy: Math.max(0.5, 1 - (mse / stats.variance(values))),
      trend_analysis: {
        direction: trendDirection,
        strength: trendStrength,
        seasonality_detected: false // Simplified - would need more sophisticated analysis
      },
      anomalies_detected: anomalies
    };
  }

  private performSystemHealthPrediction(serviceData: any): SystemHealthPrediction {
    return this.generateHealthPrediction(serviceData);
  }

  private generateHealthPrediction(serviceData: any): SystemHealthPrediction {
    // Simplified health scoring based on key metrics
    const cpuUsage = serviceData.cpu_usage || 0;
    const memoryUsage = serviceData.memory_usage || 0;
    const responseTime = serviceData.avg_response_time || 0;
    const errorRate = serviceData.error_rate || 0;
    
    // Calculate composite health score (0-100)
    const healthScore = Math.max(0, 100 - (
      (cpuUsage * 0.3) + 
      (memoryUsage * 0.3) + 
      (Math.min(responseTime / 1000, 10) * 10) + 
      (errorRate * 100 * 0.4)
    ));
    
    // Predict potential issues
    const predictedIssues = [];
    
    if (cpuUsage > 70) {
      predictedIssues.push({
        type: 'cpu_overload',
        probability: Math.min(0.9, cpuUsage / 100),
        estimated_time: Date.now() + (60000 * (100 - cpuUsage)), // Minutes until critical
        severity: cpuUsage > 90 ? 'critical' as const : 'high' as const
      });
    }
    
    if (memoryUsage > 80) {
      predictedIssues.push({
        type: 'memory_leak',
        probability: Math.min(0.8, memoryUsage / 100),
        estimated_time: Date.now() + (120000 * (100 - memoryUsage)),
        severity: memoryUsage > 95 ? 'critical' as const : 'high' as const
      });
    }
    
    if (errorRate > 0.05) {
      predictedIssues.push({
        type: 'service_instability',
        probability: Math.min(0.7, errorRate * 10),
        estimated_time: Date.now() + 300000, // 5 minutes
        severity: errorRate > 0.1 ? 'high' as const : 'medium' as const
      });
    }
    
    // Generate recommendations
    const recommendations = [];
    if (cpuUsage > 70) recommendations.push('Consider scaling up CPU resources');
    if (memoryUsage > 80) recommendations.push('Investigate memory usage patterns');
    if (responseTime > 1000) recommendations.push('Optimize database queries and caching');
    if (errorRate > 0.05) recommendations.push('Review error logs and fix underlying issues');
    
    return {
      service_name: serviceData.service_name || 'unknown',
      health_score: Math.round(healthScore),
      predicted_issues: predictedIssues,
      recommendations
    };
  }

  private predictMetric(data: number[]): number {
    if (!data || data.length === 0) return 0;
    
    // Simple trend-based prediction
    const recent = data.slice(-5); // Last 5 data points
    const avg = stats.mean(recent);
    const trend = recent.length > 1 ? (recent[recent.length - 1] - recent[0]) / recent.length : 0;
    
    return Math.max(0, avg + trend);
  }

  private performAnomalyDetection(data: PredictionData[]): any[] {
    const sensitivity = 0.05;
    return this.detectStatisticalAnomalies(data, sensitivity);
  }

  private detectStatisticalAnomalies(data: PredictionData[], sensitivity: number): any[] {
    const values = data.map(d => d.value);
    const mean = stats.mean(values);
    const stdDev = stats.standardDeviation(values);
    const threshold = stdDev / sensitivity;
    
    return data.filter(d => Math.abs(d.value - mean) > threshold)
      .map(d => ({
        timestamp: d.timestamp,
        value: d.value,
        expected_value: mean,
        deviation: Math.abs(d.value - mean),
        severity: Math.abs(d.value - mean) > 3 * stdDev ? 'high' : 'medium'
      }));
  }

  private ingestPredictionData(payload: { source: string; data: PredictionData[] }): void {
    const { source, data } = payload;
    
    if (!this.historicalData.has(source)) {
      this.historicalData.set(source, []);
    }
    
    const sourceData = this.historicalData.get(source)!;
    sourceData.push(...data);
    
    // Keep only last 1000 data points per source
    if (sourceData.length > 1000) {
      sourceData.splice(0, sourceData.length - 1000);
    }
  }
}

// Export for use by other services
export { PredictiveEngine };