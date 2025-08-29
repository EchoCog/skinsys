import { BaseService, ServiceConfig, ServiceMessage, createMessage } from '@cosmos/cognitive-core-shared-libraries';

const SLR = require('ml-regression').SLR;
const stats = require('simple-statistics');

interface PredictionRequest {
  data: Array<{ timestamp: number; value: number; metadata?: Record<string, any> }>;
  predictionHorizon: number;
  confidence?: number;
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

export class PredictiveEngine extends BaseService {
  private models: Map<string, any> = new Map();
  private historicalData: Map<string, any[]> = new Map();

  constructor(config: ServiceConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    this.log('info', '🧠 Initializing Predictive Engine ML models...');
    await this.initializeModels();
    this.log('info', '✅ Predictive Engine ready for ML inference');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    this.log('info', 'Processing prediction request', { messageId: message.id });

    try {
      let result = null;

      switch (message.type) {
        case 'PREDICT_TIMESERIES':
          result = await this.predictTimeSeries(message.payload as PredictionRequest);
          break;
        case 'PREDICT_HEALTH':
          result = await this.predictSystemHealth(message.payload);
          break;
        case 'DETECT_ANOMALIES':
          result = await this.detectAnomalies(message.payload);
          break;
        case 'TRAIN_MODEL':
          result = await this.trainModel(message.payload);
          break;
        default:
          this.log('warn', 'Unknown message type', { type: message.type });
          return null;
      }

      const processingTime = Date.now() - startTime;
      this.log('info', 'Prediction completed', { processingTime });

      return createMessage('PREDICTION_RESULT', result, message.source);

    } catch (error) {
      this.log('error', 'Prediction processing failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return createMessage('PREDICTION_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' }, message.source);
    }
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Predictive Engine...');
    // Cleanup models and resources
    this.models.clear();
    this.historicalData.clear();
    this.log('info', 'Predictive Engine shutdown complete');
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

  private async predictTimeSeries(request: PredictionRequest): Promise<PredictionResult> {
    if (!request.data || request.data.length < 2) {
      throw new Error('Insufficient data for prediction');
    }

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
    
    // Calculate confidence intervals (simplified)
    const residuals = values.map((v, idx) => v - regression.predict(idx));
    const mse = stats.mean(residuals.map(r => r * r));
    const standardError = Math.sqrt(mse);
    
    for (let i = 1; i <= request.predictionHorizon; i++) {
      const futureIndex = data.length + i - 1;
      const predictedValue = regression.predict(futureIndex);
      
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

  private async predictSystemHealth(serviceData: any): Promise<any> {
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
        severity: cpuUsage > 90 ? 'critical' : 'high'
      });
    }
    
    if (memoryUsage > 80) {
      predictedIssues.push({
        type: 'memory_leak',
        probability: Math.min(0.8, memoryUsage / 100),
        estimated_time: Date.now() + (120000 * (100 - memoryUsage)),
        severity: memoryUsage > 95 ? 'critical' : 'high'
      });
    }
    
    return {
      service_name: serviceData.service_name || 'unknown',
      health_score: Math.round(healthScore),
      predicted_issues: predictedIssues,
      recommendations: this.generateHealthRecommendations(cpuUsage, memoryUsage, responseTime, errorRate)
    };
  }

  private async detectAnomalies(data: any): Promise<any> {
    const { values, sensitivity = 0.05 } = data;
    
    if (!Array.isArray(values)) {
      throw new Error('Values array required for anomaly detection');
    }

    const mean = stats.mean(values.map(v => v.value));
    const stdDev = stats.standardDeviation(values.map(v => v.value));
    const threshold = stdDev / sensitivity;
    
    const anomalies = values.filter(d => Math.abs(d.value - mean) > threshold)
      .map(d => ({
        timestamp: d.timestamp,
        value: d.value,
        expected_value: mean,
        deviation: Math.abs(d.value - mean),
        severity: Math.abs(d.value - mean) > 3 * stdDev ? 'high' : 'medium'
      }));

    return {
      anomalies_detected: anomalies,
      total_anomalies: anomalies.length,
      detection_sensitivity: sensitivity,
      baseline_mean: mean,
      baseline_stddev: stdDev
    };
  }

  private async trainModel(data: any): Promise<any> {
    const { model_type, training_data } = data;
    
    // Simplified model training simulation
    const modelId = `${model_type}_${Date.now()}`;
    this.models.set(modelId, {
      type: model_type,
      trained: true,
      accuracy: 0.8 + Math.random() * 0.15 // Simulated accuracy
    });
    
    return {
      model_id: modelId,
      training_completed: true,
      accuracy: this.models.get(modelId)?.accuracy,
      training_data_size: training_data ? training_data.length : 0
    };
  }

  private generateHealthRecommendations(cpu: number, memory: number, responseTime: number, errorRate: number): string[] {
    const recommendations = [];
    
    if (cpu > 70) recommendations.push('Consider scaling up CPU resources');
    if (memory > 80) recommendations.push('Investigate memory usage patterns');
    if (responseTime > 1000) recommendations.push('Optimize database queries and caching');
    if (errorRate > 0.05) recommendations.push('Review error logs and fix underlying issues');
    if (recommendations.length === 0) recommendations.push('System performance is optimal');
    
    return recommendations;
  }
}