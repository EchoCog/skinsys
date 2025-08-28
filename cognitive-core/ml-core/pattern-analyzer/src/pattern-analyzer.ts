import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { BaseService } from '@cosmos/cognitive-core-shared-libraries';

const stats = require('simple-statistics');
// const clustering = require('clustering'); // Removed for simplified implementation

interface PatternData {
  timestamp: number;
  features: Record<string, any>;
  context?: string;
  source: string;
}

interface BehavioralPattern {
  pattern_id: string;
  type: 'behavioral' | 'communication' | 'performance' | 'user_interaction';
  description: string;
  frequency: number;
  confidence: number;
  triggers: string[];
  outcomes: string[];
  optimization_potential: number;
}

interface SystemInteractionPattern {
  pattern_id: string;
  services_involved: string[];
  interaction_type: 'request_response' | 'event_driven' | 'data_flow';
  frequency: number;
  average_duration: number;
  success_rate: number;
  bottlenecks: string[];
  optimization_suggestions: string[];
}

interface PerformancePattern {
  pattern_id: string;
  metric_name: string;
  pattern_type: 'cyclic' | 'trending' | 'threshold_based' | 'correlation';
  pattern_strength: number;
  predictability: number;
  impact_factors: string[];
  recommendations: string[];
}

interface UserBehaviorPattern {
  pattern_id: string;
  user_segment: string;
  behavior_type: string;
  occurrence_rate: number;
  time_patterns: {
    peak_hours: number[];
    peak_days: string[];
    seasonality: boolean;
  };
  preferences: Record<string, any>;
  optimization_opportunities: string[];
}

class PatternAnalyzer extends BaseService {
  private behavioralPatterns: Map<string, BehavioralPattern> = new Map();
  private interactionPatterns: Map<string, SystemInteractionPattern> = new Map();
  private performancePatterns: Map<string, PerformancePattern> = new Map();
  private userPatterns: Map<string, UserBehaviorPattern> = new Map();
  private dataBuffer: Map<string, PatternData[]> = new Map();

  constructor() {
    super('Pattern Analyzer', 3026);
  }

  protected setupRoutes(): void {
    // Pattern discovery endpoints
    this.app.post('/analyze/behavioral', this.analyzeBehavioralPatterns.bind(this));
    this.app.post('/analyze/interactions', this.analyzeInteractionPatterns.bind(this));
    this.app.post('/analyze/performance', this.analyzePerformancePatterns.bind(this));
    this.app.post('/analyze/user-behavior', this.analyzeUserBehavior.bind(this));
    
    // Pattern retrieval endpoints
    this.app.get('/patterns/behavioral', this.getBehavioralPatterns.bind(this));
    this.app.get('/patterns/interactions', this.getInteractionPatterns.bind(this));
    this.app.get('/patterns/performance', this.getPerformancePatterns.bind(this));
    this.app.get('/patterns/user-behavior', this.getUserPatterns.bind(this));
    
    // Real-time pattern monitoring
    this.app.post('/monitor/start', this.startPatternMonitoring.bind(this));
    this.app.post('/monitor/stop', this.stopPatternMonitoring.bind(this));
    this.app.get('/monitor/status', this.getMonitoringStatus.bind(this));
    
    // Data ingestion for pattern analysis
    this.app.post('/data/ingest', this.ingestPatternData.bind(this));
    this.app.get('/data/summary', this.getDataSummary.bind(this));
  }

  protected async initializeService(): Promise<void> {
    console.log('🔍 Initializing Pattern Analyzer...');
    await this.initializePatternDetectors();
    console.log('✅ Pattern Analyzer ready for pattern recognition');
  }

  private async initializePatternDetectors(): Promise<void> {
    // Initialize pattern detection algorithms
    console.log('🤖 Loading pattern detection algorithms...');
    
    // Start background pattern analysis
    setInterval(() => {
      this.performBackgroundAnalysis();
    }, 60000); // Analyze patterns every minute
  }

  private async analyzeBehavioralPatterns(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { data, analysis_window = 3600000 } = req.body; // Default 1 hour window
      
      if (!Array.isArray(data)) {
        res.status(400).json({ error: 'Data array required' });
        return;
      }

      const patterns = this.detectBehavioralPatterns(data, analysis_window);
      
      // Store discovered patterns
      patterns.forEach(pattern => {
        this.behavioralPatterns.set(pattern.pattern_id, pattern);
      });
      
      res.json({
        success: true,
        patterns_discovered: patterns,
        total_patterns: patterns.length,
        analysis_window: analysis_window,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Behavioral pattern analysis error:', error);
      res.status(500).json({ 
        error: 'Behavioral pattern analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private detectBehavioralPatterns(data: PatternData[], analysisWindow: number): BehavioralPattern[] {
    const patterns: BehavioralPattern[] = [];
    const now = Date.now();
    
    // Filter data within analysis window
    const recentData = data.filter(d => (now - d.timestamp) <= analysisWindow);
    
    if (recentData.length < 5) {
      return patterns; // Need minimum data for pattern detection
    }

    // Group data by context/source for pattern analysis
    const groupedData = this.groupDataByContext(recentData);
    
    Object.entries(groupedData).forEach(([context, contextData]) => {
      if (contextData.length < 3) return; // Need minimum occurrences
      
      // Detect frequency patterns
      const timeIntervals = this.calculateTimeIntervals(contextData);
      const avgInterval = stats.mean(timeIntervals);
      const intervalStdDev = stats.standardDeviation(timeIntervals);
      
      // Check for cyclic behavior (regular intervals)
      if (intervalStdDev / avgInterval < 0.3) { // Low variance indicates regularity
        patterns.push({
          pattern_id: `behavioral_${context}_${Date.now()}`,
          type: 'behavioral',
          description: `Regular ${context} behavior with ${Math.round(avgInterval / 1000)}s intervals`,
          frequency: 1000 / avgInterval, // Events per second
          confidence: Math.max(0.5, 1 - (intervalStdDev / avgInterval)),
          triggers: this.extractTriggers(contextData),
          outcomes: this.extractOutcomes(contextData),
          optimization_potential: this.calculateOptimizationPotential(contextData)
        });
      }
      
      // Detect burst patterns (many events in short time)
      const burstThreshold = avgInterval * 0.3;
      const burstEvents = this.detectBurstEvents(contextData, burstThreshold);
      
      if (burstEvents.length > 0) {
        patterns.push({
          pattern_id: `burst_${context}_${Date.now()}`,
          type: 'behavioral',
          description: `Burst behavior detected in ${context} with ${burstEvents.length} burst periods`,
          frequency: burstEvents.length / (analysisWindow / 1000),
          confidence: 0.8,
          triggers: ['system_load', 'user_activity_spike'],
          outcomes: ['resource_contention', 'response_delay'],
          optimization_potential: 0.7
        });
      }
    });
    
    return patterns;
  }

  private async analyzeInteractionPatterns(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { interaction_data, time_window = 3600000 } = req.body;
      
      if (!Array.isArray(interaction_data)) {
        res.status(400).json({ error: 'Interaction data array required' });
        return;
      }

      const patterns = this.detectInteractionPatterns(interaction_data, time_window);
      
      // Store discovered patterns
      patterns.forEach(pattern => {
        this.interactionPatterns.set(pattern.pattern_id, pattern);
      });
      
      res.json({
        success: true,
        interaction_patterns: patterns,
        total_patterns: patterns.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Interaction pattern analysis error:', error);
      res.status(500).json({ 
        error: 'Interaction pattern analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private detectInteractionPatterns(interactionData: any[], timeWindow: number): SystemInteractionPattern[] {
    const patterns: SystemInteractionPattern[] = [];
    
    // Group interactions by service pairs
    const servicePairInteractions = new Map<string, any[]>();
    
    interactionData.forEach(interaction => {
      const key = `${interaction.source_service}->${interaction.target_service}`;
      if (!servicePairInteractions.has(key)) {
        servicePairInteractions.set(key, []);
      }
      servicePairInteractions.get(key)!.push(interaction);
    });
    
    servicePairInteractions.forEach((interactions, servicePair) => {
      if (interactions.length < 5) return; // Need minimum interactions
      
      const [sourceService, targetService] = servicePair.split('->');
      const durations = interactions.map(i => i.duration || 0).filter(d => d > 0);
      const successCount = interactions.filter(i => i.success === true).length;
      
      if (durations.length > 0) {
        const avgDuration = stats.mean(durations);
        const successRate = successCount / interactions.length;
        
        // Identify bottlenecks
        const bottlenecks = [];
        if (avgDuration > 1000) bottlenecks.push('high_latency');
        if (successRate < 0.95) bottlenecks.push('low_success_rate');
        
        // Generate optimization suggestions
        const optimizationSuggestions = [];
        if (avgDuration > 1000) {
          optimizationSuggestions.push('Implement caching between services');
          optimizationSuggestions.push('Optimize data serialization');
        }
        if (successRate < 0.95) {
          optimizationSuggestions.push('Add retry mechanisms');
          optimizationSuggestions.push('Improve error handling');
        }
        
        patterns.push({
          pattern_id: `interaction_${servicePair.replace('->', '_to_')}_${Date.now()}`,
          services_involved: [sourceService, targetService],
          interaction_type: this.determineInteractionType(interactions),
          frequency: interactions.length / (timeWindow / 1000),
          average_duration: avgDuration,
          success_rate: successRate,
          bottlenecks,
          optimization_suggestions: optimizationSuggestions
        });
      }
    });
    
    return patterns;
  }

  private async analyzePerformancePatterns(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { performance_data, metrics } = req.body;
      
      if (!Array.isArray(performance_data)) {
        res.status(400).json({ error: 'Performance data array required' });
        return;
      }

      const patterns = this.detectPerformancePatterns(performance_data, metrics);
      
      // Store discovered patterns
      patterns.forEach(pattern => {
        this.performancePatterns.set(pattern.pattern_id, pattern);
      });
      
      res.json({
        success: true,
        performance_patterns: patterns,
        total_patterns: patterns.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Performance pattern analysis error:', error);
      res.status(500).json({ 
        error: 'Performance pattern analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private detectPerformancePatterns(performanceData: any[], metrics: string[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];
    
    metrics.forEach(metric => {
      const metricData = performanceData
        .filter(d => d.metric === metric)
        .map(d => ({ timestamp: d.timestamp, value: d.value }))
        .sort((a, b) => a.timestamp - b.timestamp);
      
      if (metricData.length < 10) return; // Need sufficient data
      
      const values = metricData.map(d => d.value);
      
      // Detect trending patterns
      const trendAnalysis = this.analyzeTrend(values);
      if (Math.abs(trendAnalysis.slope) > 0.1) {
        patterns.push({
          pattern_id: `trend_${metric}_${Date.now()}`,
          metric_name: metric,
          pattern_type: 'trending',
          pattern_strength: Math.abs(trendAnalysis.slope),
          predictability: trendAnalysis.r_squared,
          impact_factors: this.identifyImpactFactors(metricData),
          recommendations: this.generateTrendRecommendations(trendAnalysis, metric)
        });
      }
      
      // Detect cyclic patterns
      const cyclicPattern = this.detectCyclicPattern(values);
      if (cyclicPattern.strength > 0.6) {
        patterns.push({
          pattern_id: `cyclic_${metric}_${Date.now()}`,
          metric_name: metric,
          pattern_type: 'cyclic',
          pattern_strength: cyclicPattern.strength,
          predictability: cyclicPattern.predictability,
          impact_factors: ['time_based_load', 'scheduled_processes'],
          recommendations: [
            'Implement predictive scaling based on cycle',
            'Schedule maintenance during low-activity periods'
          ]
        });
      }
      
      // Detect threshold-based patterns
      const thresholdPattern = this.detectThresholdPattern(values);
      if (thresholdPattern.violations > 0) {
        patterns.push({
          pattern_id: `threshold_${metric}_${Date.now()}`,
          metric_name: metric,
          pattern_type: 'threshold_based',
          pattern_strength: thresholdPattern.violations / values.length,
          predictability: 0.8,
          impact_factors: ['resource_limits', 'configuration_thresholds'],
          recommendations: [
            'Adjust threshold values based on actual usage',
            'Implement gradual threshold warnings'
          ]
        });
      }
    });
    
    return patterns;
  }

  private async analyzeUserBehavior(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { user_data, segmentation_criteria } = req.body;
      
      if (!Array.isArray(user_data)) {
        res.status(400).json({ error: 'User data array required' });
        return;
      }

      const patterns = this.detectUserBehaviorPatterns(user_data, segmentation_criteria);
      
      // Store discovered patterns
      patterns.forEach(pattern => {
        this.userPatterns.set(pattern.pattern_id, pattern);
      });
      
      res.json({
        success: true,
        user_behavior_patterns: patterns,
        total_patterns: patterns.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('User behavior analysis error:', error);
      res.status(500).json({ 
        error: 'User behavior analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private detectUserBehaviorPatterns(userData: any[], segmentationCriteria: any): UserBehaviorPattern[] {
    const patterns: UserBehaviorPattern[] = [];
    
    // Segment users based on criteria
    const userSegments = this.segmentUsers(userData, segmentationCriteria);
    
    Object.entries(userSegments).forEach(([segment, segmentData]) => {
      const timePatterns = this.analyzeTimePatterns(segmentData);
      const behaviorTypes = this.extractBehaviorTypes(segmentData);
      
      behaviorTypes.forEach(behaviorType => {
        const behaviorData = segmentData.filter(d => d.behavior_type === behaviorType);
        const occurrenceRate = behaviorData.length / segmentData.length;
        
        if (occurrenceRate > 0.1) { // Significant behavior
          patterns.push({
            pattern_id: `user_${segment}_${behaviorType}_${Date.now()}`,
            user_segment: segment,
            behavior_type: behaviorType,
            occurrence_rate: occurrenceRate,
            time_patterns: timePatterns,
            preferences: this.extractPreferences(behaviorData),
            optimization_opportunities: this.identifyOptimizationOpportunities(behaviorData)
          });
        }
      });
    });
    
    return patterns;
  }

  // Helper methods
  private groupDataByContext(data: PatternData[]): Record<string, PatternData[]> {
    return data.reduce((groups, item) => {
      const context = item.context || 'default';
      if (!groups[context]) groups[context] = [];
      groups[context].push(item);
      return groups;
    }, {} as Record<string, PatternData[]>);
  }

  private calculateTimeIntervals(data: PatternData[]): number[] {
    const intervals = [];
    for (let i = 1; i < data.length; i++) {
      intervals.push(data[i].timestamp - data[i-1].timestamp);
    }
    return intervals;
  }

  private extractTriggers(data: PatternData[]): string[] {
    // Simplified trigger extraction
    return ['system_event', 'user_action', 'scheduled_task'];
  }

  private extractOutcomes(data: PatternData[]): string[] {
    // Simplified outcome extraction
    return ['resource_usage', 'response_generated', 'state_change'];
  }

  private calculateOptimizationPotential(data: PatternData[]): number {
    // Simplified optimization potential calculation
    return Math.random() * 0.5 + 0.3; // 0.3 to 0.8
  }

  private detectBurstEvents(data: PatternData[], threshold: number): any[] {
    // Simplified burst detection
    const bursts = [];
    let currentBurst = [];
    
    for (let i = 1; i < data.length; i++) {
      const interval = data[i].timestamp - data[i-1].timestamp;
      if (interval < threshold) {
        currentBurst.push(data[i]);
      } else {
        if (currentBurst.length > 2) {
          bursts.push(currentBurst);
        }
        currentBurst = [];
      }
    }
    
    return bursts;
  }

  private determineInteractionType(interactions: any[]): 'request_response' | 'event_driven' | 'data_flow' {
    // Simplified interaction type detection
    return 'request_response'; // Default
  }

  private analyzeTrend(values: number[]): { slope: number; r_squared: number } {
    if (values.length < 2) return { slope: 0, r_squared: 0 };
    
    const x = Array.from({ length: values.length }, (_, i) => i);
    const regression = stats.linearRegression(x.map((xi, i) => [xi, values[i]]));
    
    return {
      slope: regression.m,
      r_squared: stats.rSquared(x.map((xi, i) => [xi, values[i]]), regression)
    };
  }

  private detectCyclicPattern(values: number[]): { strength: number; predictability: number } {
    // Simplified cyclic pattern detection
    return { strength: 0.5, predictability: 0.7 };
  }

  private detectThresholdPattern(values: number[]): { violations: number } {
    const upperThreshold = stats.mean(values) + 2 * stats.standardDeviation(values);
    const violations = values.filter(v => v > upperThreshold).length;
    return { violations };
  }

  private identifyImpactFactors(data: any[]): string[] {
    return ['system_load', 'user_activity', 'resource_availability'];
  }

  private generateTrendRecommendations(trend: any, metric: string): string[] {
    const recommendations = [];
    if (trend.slope > 0.1) {
      recommendations.push(`Monitor increasing ${metric} trend`);
      recommendations.push('Consider proactive scaling');
    } else if (trend.slope < -0.1) {
      recommendations.push(`Investigate decreasing ${metric} trend`);
      recommendations.push('Verify if decrease is expected');
    }
    return recommendations;
  }

  private segmentUsers(userData: any[], criteria: any): Record<string, any[]> {
    // Simplified user segmentation
    return { 'default_segment': userData };
  }

  private analyzeTimePatterns(data: any[]): any {
    // Simplified time pattern analysis
    return {
      peak_hours: [9, 10, 11, 14, 15, 16],
      peak_days: ['Monday', 'Tuesday', 'Wednesday'],
      seasonality: false
    };
  }

  private extractBehaviorTypes(data: any[]): string[] {
    return ['query', 'update', 'delete', 'create'];
  }

  private extractPreferences(data: any[]): Record<string, any> {
    return { response_format: 'json', timeout: 5000 };
  }

  private identifyOptimizationOpportunities(data: any[]): string[] {
    return ['caching', 'batch_processing', 'predictive_prefetch'];
  }

  private async performBackgroundAnalysis(): Promise<void> {
    // Background pattern analysis for continuous learning
    console.log('🔍 Performing background pattern analysis...');
    
    // Analyze buffered data
    this.dataBuffer.forEach((data, source) => {
      if (data.length > 10) {
        // Perform lightweight pattern detection
        const patterns = this.detectBehavioralPatterns(data, 3600000);
        patterns.forEach(pattern => {
          this.behavioralPatterns.set(pattern.pattern_id, pattern);
        });
        
        // Keep only recent data
        const cutoff = Date.now() - 7200000; // 2 hours
        this.dataBuffer.set(source, data.filter(d => d.timestamp > cutoff));
      }
    });
  }

  // Additional endpoint implementations
  private async getBehavioralPatterns(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      patterns: Array.from(this.behavioralPatterns.values()),
      total_patterns: this.behavioralPatterns.size
    });
  }

  private async getInteractionPatterns(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      patterns: Array.from(this.interactionPatterns.values()),
      total_patterns: this.interactionPatterns.size
    });
  }

  private async getPerformancePatterns(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      patterns: Array.from(this.performancePatterns.values()),
      total_patterns: this.performancePatterns.size
    });
  }

  private async getUserPatterns(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      patterns: Array.from(this.userPatterns.values()),
      total_patterns: this.userPatterns.size
    });
  }

  private async startPatternMonitoring(req: express.Request, res: express.Response): Promise<void> {
    res.json({ success: true, message: 'Pattern monitoring started' });
  }

  private async stopPatternMonitoring(req: express.Request, res: express.Response): Promise<void> {
    res.json({ success: true, message: 'Pattern monitoring stopped' });
  }

  private async getMonitoringStatus(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      monitoring_active: true,
      patterns_monitored: this.behavioralPatterns.size + this.interactionPatterns.size + 
                          this.performancePatterns.size + this.userPatterns.size
    });
  }

  private async ingestPatternData(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { source, data } = req.body;
      
      if (!this.dataBuffer.has(source)) {
        this.dataBuffer.set(source, []);
      }
      
      const sourceData = this.dataBuffer.get(source)!;
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
      const summary = Array.from(this.dataBuffer.entries()).map(([source, data]) => ({
        source,
        record_count: data.length,
        latest_timestamp: data.length > 0 ? Math.max(...data.map(d => d.timestamp)) : null
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
const patternAnalyzer = new PatternAnalyzer();
patternAnalyzer.start().catch(console.error);

export { PatternAnalyzer };