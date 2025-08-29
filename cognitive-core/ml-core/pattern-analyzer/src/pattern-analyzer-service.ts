import { BaseService, ServiceConfig, ServiceMessage, createMessage } from '@cosmos/cognitive-core-shared-libraries';

const stats = require('simple-statistics');

interface PatternAnalysisRequest {
  data: Array<{
    timestamp: number;
    features: Record<string, any>;
    context?: string;
    source: string;
  }>;
  analysisType: 'behavioral' | 'interaction' | 'performance' | 'user_behavior';
  timeWindow?: number;
}

interface PatternResult {
  patterns: Array<{
    pattern_id: string;
    type: string;
    description: string;
    frequency: number;
    confidence: number;
    optimization_potential: number;
  }>;
  insights: string[];
  recommendations: string[];
}

export class PatternAnalyzer extends BaseService {
  private patternCache: Map<string, any> = new Map();
  private dataBuffer: Map<string, any[]> = new Map();

  constructor(config: ServiceConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    this.log('info', '🔍 Initializing Pattern Analyzer...');
    await this.initializePatternDetectors();
    this.log('info', '✅ Pattern Analyzer ready for pattern recognition');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    this.log('info', 'Processing pattern analysis request', { messageId: message.id });

    try {
      let result = null;

      switch (message.type) {
        case 'ANALYZE_PATTERNS':
          result = await this.analyzePatterns(message.payload as PatternAnalysisRequest);
          break;
        case 'DETECT_BEHAVIORAL_PATTERNS':
          result = await this.detectBehavioralPatterns(message.payload.data || [], message.payload.timeWindow || 3600000);
          break;
        case 'ANALYZE_INTERACTIONS':
          result = await this.detectInteractionPatterns(message.payload.data || [], message.payload.timeWindow || 3600000);
          break;
        case 'ANALYZE_PERFORMANCE':
          result = await this.detectPerformancePatterns(message.payload.data || []);
          break;
        case 'INGEST_PATTERN_DATA':
          result = await this.ingestPatternData(message.payload);
          break;
        default:
          this.log('warn', 'Unknown message type', { type: message.type });
          return null;
      }

      const processingTime = Date.now() - startTime;
      this.log('info', 'Pattern analysis completed', { processingTime });

      return createMessage('PATTERN_ANALYSIS_RESULT', result, message.source);

    } catch (error) {
      this.log('error', 'Pattern analysis failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return createMessage('PATTERN_ANALYSIS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' }, message.source);
    }
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Pattern Analyzer...');
    this.patternCache.clear();
    this.dataBuffer.clear();
    this.log('info', 'Pattern Analyzer shutdown complete');
  }

  private async initializePatternDetectors(): Promise<void> {
    this.log('info', '🤖 Loading pattern detection algorithms...');
    
    // Start background pattern analysis
    setInterval(() => {
      this.performBackgroundAnalysis();
    }, 60000); // Analyze patterns every minute
  }

  private async analyzePatterns(request: PatternAnalysisRequest): Promise<PatternResult> {
    const { data, analysisType, timeWindow = 3600000 } = request;
    
    if (!Array.isArray(data) || data.length < 5) {
      throw new Error('Insufficient data for pattern analysis');
    }

    let patterns = [];
    
    switch (analysisType) {
      case 'behavioral':
        patterns = this.detectBehavioralPatterns(data, timeWindow);
        break;
      case 'interaction':
        patterns = this.detectInteractionPatterns(data, timeWindow);
        break;
      case 'performance':
        patterns = this.detectPerformancePatterns(data);
        break;
      case 'user_behavior':
        patterns = this.detectUserBehaviorPatterns(data);
        break;
      default:
        throw new Error(`Unknown analysis type: ${analysisType}`);
    }

    // Store discovered patterns
    patterns.forEach(pattern => {
      this.patternCache.set(pattern.pattern_id, pattern);
    });

    return {
      patterns,
      insights: this.generateInsights(patterns),
      recommendations: this.generateRecommendations(patterns)
    };
  }

  private detectBehavioralPatterns(data: any[], analysisWindow: number): any[] {
    const patterns = [];
    const now = Date.now();
    
    // Filter data within analysis window
    const recentData = data.filter(d => (now - d.timestamp) <= analysisWindow);
    
    if (recentData.length < 3) {
      return patterns;
    }

    // Group data by context/source for pattern analysis
    const groupedData = this.groupDataByContext(recentData);
    
    Object.entries(groupedData).forEach(([context, contextData]) => {
      if (contextData.length < 3) return;
      
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
          frequency: 1000 / avgInterval,
          confidence: Math.max(0.5, 1 - (intervalStdDev / avgInterval)),
          optimization_potential: this.calculateOptimizationPotential(contextData)
        });
      }
      
      // Detect burst patterns
      const burstThreshold = avgInterval * 0.3;
      const burstEvents = this.detectBurstEvents(contextData, burstThreshold);
      
      if (burstEvents.length > 0) {
        patterns.push({
          pattern_id: `burst_${context}_${Date.now()}`,
          type: 'burst',
          description: `Burst behavior detected in ${context} with ${burstEvents.length} burst periods`,
          frequency: burstEvents.length / (analysisWindow / 1000),
          confidence: 0.8,
          optimization_potential: 0.7
        });
      }
    });
    
    return patterns;
  }

  private detectInteractionPatterns(data: any[], timeWindow: number): any[] {
    const patterns = [];
    
    // Group interactions by service pairs
    const servicePairInteractions = new Map<string, any[]>();
    
    data.forEach(interaction => {
      const key = `${interaction.source}->${interaction.target || 'unknown'}`;
      if (!servicePairInteractions.has(key)) {
        servicePairInteractions.set(key, []);
      }
      servicePairInteractions.get(key)!.push(interaction);
    });
    
    servicePairInteractions.forEach((interactions, servicePair) => {
      if (interactions.length < 5) return;
      
      const durations = interactions.map(i => i.duration || 100).filter(d => d > 0);
      const successCount = interactions.filter(i => i.success !== false).length;
      
      if (durations.length > 0) {
        const avgDuration = stats.mean(durations);
        const successRate = successCount / interactions.length;
        
        patterns.push({
          pattern_id: `interaction_${servicePair.replace('->', '_to_')}_${Date.now()}`,
          type: 'interaction',
          description: `${servicePair} interaction pattern: ${avgDuration.toFixed(0)}ms avg, ${(successRate * 100).toFixed(1)}% success`,
          frequency: interactions.length / (timeWindow / 1000),
          confidence: Math.min(0.9, successRate),
          optimization_potential: avgDuration > 500 ? 0.6 : 0.3
        });
      }
    });
    
    return patterns;
  }

  private detectPerformancePatterns(data: any[]): any[] {
    const patterns = [];
    
    // Group by metric type
    const metricGroups = new Map<string, any[]>();
    
    data.forEach(item => {
      const metricType = item.features?.metric_type || 'unknown';
      if (!metricGroups.has(metricType)) {
        metricGroups.set(metricType, []);
      }
      metricGroups.get(metricType)!.push(item);
    });
    
    metricGroups.forEach((items, metricType) => {
      if (items.length < 10) return;
      
      const values = items.map(item => item.features?.value || 0);
      const timestamps = items.map(item => item.timestamp);
      
      // Detect trending patterns
      const trendAnalysis = this.analyzeTrend(values);
      if (Math.abs(trendAnalysis.slope) > 0.1) {
        patterns.push({
          pattern_id: `trend_${metricType}_${Date.now()}`,
          type: 'trending',
          description: `${metricType} showing ${trendAnalysis.slope > 0 ? 'increasing' : 'decreasing'} trend`,
          frequency: items.length / ((Math.max(...timestamps) - Math.min(...timestamps)) / 1000),
          confidence: trendAnalysis.r_squared,
          optimization_potential: Math.abs(trendAnalysis.slope) * 0.5
        });
      }
      
      // Detect threshold violations
      const mean = stats.mean(values);
      const stdDev = stats.standardDeviation(values);
      const violations = values.filter(v => Math.abs(v - mean) > 2 * stdDev).length;
      
      if (violations > values.length * 0.1) {
        patterns.push({
          pattern_id: `threshold_${metricType}_${Date.now()}`,
          type: 'threshold_violation',
          description: `${metricType} has ${violations} threshold violations (${((violations / values.length) * 100).toFixed(1)}%)`,
          frequency: violations / (items.length || 1),
          confidence: 0.8,
          optimization_potential: 0.9
        });
      }
    });
    
    return patterns;
  }

  private detectUserBehaviorPatterns(data: any[]): any[] {
    const patterns = [];
    
    // Group by user/source
    const userGroups = new Map<string, any[]>();
    
    data.forEach(item => {
      const user = item.source || 'anonymous';
      if (!userGroups.has(user)) {
        userGroups.set(user, []);
      }
      userGroups.get(user)!.push(item);
    });
    
    userGroups.forEach((items, user) => {
      if (items.length < 5) return;
      
      const timePatterns = this.analyzeTimePatterns(items);
      const behaviorTypes = this.extractBehaviorTypes(items);
      
      patterns.push({
        pattern_id: `user_${user}_${Date.now()}`,
        type: 'user_behavior',
        description: `${user} behavior pattern: ${behaviorTypes.join(', ')}`,
        frequency: items.length / 3600, // per hour
        confidence: 0.7,
        optimization_potential: 0.4
      });
    });
    
    return patterns;
  }

  private async ingestPatternData(data: any): Promise<any> {
    const { source, items } = data;
    
    if (!this.dataBuffer.has(source)) {
      this.dataBuffer.set(source, []);
    }
    
    const sourceData = this.dataBuffer.get(source)!;
    sourceData.push(...items);
    
    // Keep only recent data (last 1000 items)
    if (sourceData.length > 1000) {
      sourceData.splice(0, sourceData.length - 1000);
    }
    
    return {
      ingested_records: items.length,
      total_records: sourceData.length
    };
  }

  private groupDataByContext(data: any[]): Record<string, any[]> {
    return data.reduce((groups, item) => {
      const context = item.context || 'default';
      if (!groups[context]) groups[context] = [];
      groups[context].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private calculateTimeIntervals(data: any[]): number[] {
    const intervals = [];
    for (let i = 1; i < data.length; i++) {
      intervals.push(data[i].timestamp - data[i-1].timestamp);
    }
    return intervals;
  }

  private calculateOptimizationPotential(data: any[]): number {
    // Simple heuristic: more data = more potential for optimization
    return Math.min(0.8, data.length / 100);
  }

  private detectBurstEvents(data: any[], threshold: number): any[] {
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

  private analyzeTrend(values: number[]): { slope: number; r_squared: number } {
    if (values.length < 2) return { slope: 0, r_squared: 0 };
    
    const x = Array.from({ length: values.length }, (_, i) => i);
    const regression = stats.linearRegression(x.map((xi, i) => [xi, values[i]]));
    
    return {
      slope: regression.m,
      r_squared: stats.rSquared(x.map((xi, i) => [xi, values[i]]), regression)
    };
  }

  private analyzeTimePatterns(data: any[]): any {
    // Simple time pattern analysis
    const hours = data.map(d => new Date(d.timestamp).getHours());
    const hourCounts = new Map<number, number>();
    
    hours.forEach(hour => {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);
    
    return { peak_hours: peakHours };
  }

  private extractBehaviorTypes(data: any[]): string[] {
    const types = new Set<string>();
    data.forEach(item => {
      if (item.features?.action_type) {
        types.add(item.features.action_type);
      }
    });
    return Array.from(types).slice(0, 5); // Limit to 5 types
  }

  private generateInsights(patterns: any[]): string[] {
    const insights = [];
    
    if (patterns.length === 0) {
      insights.push('No significant patterns detected in the analyzed data');
      return insights;
    }
    
    const behavioralPatterns = patterns.filter(p => p.type === 'behavioral');
    const performancePatterns = patterns.filter(p => p.type === 'trending' || p.type === 'threshold_violation');
    
    if (behavioralPatterns.length > 0) {
      insights.push(`Detected ${behavioralPatterns.length} behavioral patterns with optimization potential`);
    }
    
    if (performancePatterns.length > 0) {
      insights.push(`Found ${performancePatterns.length} performance-related patterns requiring attention`);
    }
    
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
    if (highConfidencePatterns.length > 0) {
      insights.push(`${highConfidencePatterns.length} patterns detected with high confidence (>80%)`);
    }
    
    return insights;
  }

  private generateRecommendations(patterns: any[]): string[] {
    const recommendations = [];
    
    if (patterns.length === 0) {
      recommendations.push('Continue monitoring for emerging patterns');
      return recommendations;
    }
    
    const highOptimizationPatterns = patterns.filter(p => p.optimization_potential > 0.6);
    if (highOptimizationPatterns.length > 0) {
      recommendations.push('Prioritize optimization of high-potential patterns');
    }
    
    const burstPatterns = patterns.filter(p => p.type === 'burst');
    if (burstPatterns.length > 0) {
      recommendations.push('Implement rate limiting or load balancing for burst patterns');
    }
    
    const thresholdPatterns = patterns.filter(p => p.type === 'threshold_violation');
    if (thresholdPatterns.length > 0) {
      recommendations.push('Review and adjust threshold settings for monitored metrics');
    }
    
    recommendations.push('Enable continuous pattern monitoring for real-time optimization');
    
    return recommendations;
  }

  private async performBackgroundAnalysis(): Promise<void> {
    // Background pattern analysis for continuous learning
    this.log('info', '🔍 Performing background pattern analysis...');
    
    this.dataBuffer.forEach((data, source) => {
      if (data.length > 10) {
        // Perform lightweight pattern detection
        const patterns = this.detectBehavioralPatterns(data, 3600000);
        patterns.forEach(pattern => {
          this.patternCache.set(pattern.pattern_id, pattern);
        });
        
        // Keep only recent data
        const cutoff = Date.now() - 7200000; // 2 hours
        this.dataBuffer.set(source, data.filter(d => d.timestamp > cutoff));
      }
    });
  }
}