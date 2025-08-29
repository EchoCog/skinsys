import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { BaseService } from '@cosmos/cognitive-core-shared-libraries';

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

  constructor() {
    super('Predictive Engine', 3025);
  }

  protected setupRoutes(): void {
    // Predictive analytics endpoints
    this.app.post('/predict/timeseries', this.predictTimeSeries.bind(this));
    this.app.post('/predict/health', this.predictSystemHealth.bind(this));
    this.app.post('/predict/performance', this.predictPerformance.bind(this));
    this.app.post('/predict/anomalies', this.detectAnomalies.bind(this));
    
    // Model management endpoints
    this.app.get('/models', this.listModels.bind(this));
    this.app.post('/models/train', this.trainModel.bind(this));
    this.app.delete('/models/:modelId', this.deleteModel.bind(this));
    
    // Data ingestion endpoints
    this.app.post('/data/ingest', this.ingestData.bind(this));
    this.app.get('/data/summary', this.getDataSummary.bind(this));
  }

  protected async initializeService(): Promise<void> {
    console.log('🧠 Initializing Predictive Engine ML models...');
    await this.initializeModels();
    console.log('✅ Predictive Engine ready for ML inference');
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

  private async predictTimeSeries(req: express.Request, res: express.Response): Promise<void> {
    try {
      const request: PredictionRequest = req.body;
      
      if (!request.data || request.data.length < 2) {
        res.status(400).json({ error: 'Insufficient data for prediction' });
        return;
      }

      const result = this.performTimeSeriesPrediction(request);
      
      res.json({
        success: true,
        prediction: result,
        model_info: {
          type: 'time_series_forecasting',
          data_points: request.data.length,
          horizon: request.predictionHorizon
        },
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({ 
        error: 'Prediction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
    
    for (let i = 1; i <= request.predictionHorizon; i++) {
      const futureIndex = data.length + i - 1;
      const predictedValue = regression.predict(futureIndex);
      
      // Calculate confidence intervals (simplified)
      const residuals = values.map((v, idx) => v - regression.predict(idx));
      const mse = stats.mean(residuals.map(r => r * r));
      const standardError = Math.sqrt(mse);
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

  private async predictSystemHealth(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { service_data, historical_metrics } = req.body;
      
      if (!service_data) {
        res.status(400).json({ error: 'Service data required' });
        return;
      }

      const healthPrediction = this.generateHealthPrediction(service_data, historical_metrics);
      
      res.json({
        success: true,
        health_prediction: healthPrediction,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Health prediction error:', error);
      res.status(500).json({ 
        error: 'Health prediction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generateHealthPrediction(serviceData: any, historicalMetrics?: any[]): SystemHealthPrediction {
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

  private async predictPerformance(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { metrics, prediction_period } = req.body;
      
      // Simplified performance prediction
      const performancePrediction = {
        predicted_metrics: {
          avg_response_time: this.predictMetric(metrics.response_times),
          throughput: this.predictMetric(metrics.throughput_data),
          error_rate: this.predictMetric(metrics.error_rates)
        },
        optimization_suggestions: [
          'Enable caching for frequently accessed data',
          'Implement connection pooling',
          'Add database indexing for slow queries'
        ],
        confidence: 0.75
      };
      
      res.json({
        success: true,
        performance_prediction: performancePrediction,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Performance prediction error:', error);
      res.status(500).json({ 
        error: 'Performance prediction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private predictMetric(data: number[]): number {
    if (!data || data.length === 0) return 0;
    
    // Simple trend-based prediction
    const recent = data.slice(-5); // Last 5 data points
    const avg = stats.mean(recent);
    const trend = recent.length > 1 ? (recent[recent.length - 1] - recent[0]) / recent.length : 0;
    
    return Math.max(0, avg + trend);
  }

  private async detectAnomalies(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { data, sensitivity = 0.05 } = req.body;
      
      if (!Array.isArray(data)) {
        res.status(400).json({ error: 'Data array required' });
        return;
      }

      const anomalies = this.detectStatisticalAnomalies(data, sensitivity);
      
      res.json({
        success: true,
        anomalies_detected: anomalies,
        total_anomalies: anomalies.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Anomaly detection error:', error);
      res.status(500).json({ 
        error: 'Anomaly detection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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

  private async listModels(req: express.Request, res: express.Response): Promise<void> {
    try {
      const modelList = Array.from(this.models.entries()).map(([id, model]) => ({
        id,
        type: model.type,
        trained: model.trained,
        accuracy: model.accuracy
      }));
      
      res.json({
        success: true,
        models: modelList,
        total_models: modelList.length
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to list models' });
    }
  }

  private async trainModel(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { model_type, training_data } = req.body;
      
      // Simplified model training simulation
      const modelId = `${model_type}_${Date.now()}`;
      this.models.set(modelId, {
        type: model_type,
        trained: true,
        accuracy: 0.8 + Math.random() * 0.15 // Simulated accuracy
      });
      
      res.json({
        success: true,
        model_id: modelId,
        training_completed: true,
        accuracy: this.models.get(modelId)?.accuracy
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Model training failed' });
    }
  }

  private async deleteModel(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { modelId } = req.params;
      
      if (this.models.has(modelId)) {
        this.models.delete(modelId);
        res.json({ success: true, message: 'Model deleted successfully' });
      } else {
        res.status(404).json({ error: 'Model not found' });
      }
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete model' });
    }
  }

  private async ingestData(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { source, data } = req.body;
      
      if (!this.historicalData.has(source)) {
        this.historicalData.set(source, []);
      }
      
      const sourceData = this.historicalData.get(source)!;
      sourceData.push(...data);
      
      // Keep only last 1000 data points per source
      if (sourceData.length > 1000) {
        sourceData.splice(0, sourceData.length - 1000);
      }
      
      res.json({
        success: true,
        ingested_records: data.length,
        total_records: sourceData.length
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Data ingestion failed' });
    }
  }

  private async getDataSummary(req: express.Request, res: express.Response): Promise<void> {
    try {
      const summary = Array.from(this.historicalData.entries()).map(([source, data]) => ({
        source,
        record_count: data.length,
        latest_timestamp: data.length > 0 ? Math.max(...data.map(d => d.timestamp)) : null,
        avg_value: data.length > 0 ? stats.mean(data.map(d => d.value)) : null
      }));
      
      res.json({
        success: true,
        data_sources: summary,
        total_sources: summary.length
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data summary' });
    }
  }
}

// Create and start the service
const predictiveEngine = new PredictiveEngine();
predictiveEngine.start().catch(console.error);

export { PredictiveEngine };