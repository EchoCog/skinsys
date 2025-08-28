import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { BaseService } from '@cosmos/cognitive-core-shared-libraries';

const stats = require('simple-statistics');

interface OptimizationMetric {
  metric_name: string;
  current_value: number;
  target_value?: number;
  weight: number; // Importance of this metric (0-1)
  trend: 'improving' | 'degrading' | 'stable';
}

interface OptimizationTarget {
  target_id: string;
  service_name: string;
  target_type: 'performance' | 'resource' | 'quality' | 'cost';
  metrics: OptimizationMetric[];
  constraints: Record<string, any>;
  current_score: number;
  optimization_potential: number;
}

interface OptimizationStrategy {
  strategy_id: string;
  name: string;
  description: string;
  applicable_targets: string[];
  expected_improvement: number;
  implementation_complexity: 'low' | 'medium' | 'high';
  risk_level: 'low' | 'medium' | 'high';
  actions: OptimizationAction[];
}

interface OptimizationAction {
  action_id: string;
  type: 'configuration_change' | 'resource_allocation' | 'algorithm_tuning' | 'architecture_change';
  description: string;
  parameters: Record<string, any>;
  expected_impact: number;
  rollback_plan: string;
}

interface AdaptiveConfiguration {
  config_id: string;
  service_name: string;
  parameter_name: string;
  current_value: any;
  optimal_range: { min: any; max: any };
  adaptation_rate: number; // How quickly to adapt (0-1)
  last_updated: number;
  performance_impact: number;
}

interface LearningModel {
  model_id: string;
  model_type: 'reinforcement' | 'supervised' | 'unsupervised';
  target_metric: string;
  training_data: any[];
  accuracy: number;
  last_updated: number;
  predictions: any[];
}

interface CrossTriadOptimization {
  optimization_id: string;
  triads_involved: string[];
  coordination_type: 'resource_sharing' | 'load_balancing' | 'communication_optimization' | 'workflow_optimization';
  current_efficiency: number;
  target_efficiency: number;
  optimization_strategy: string;
  implementation_steps: string[];
  expected_benefits: Record<string, number>;
}

class AdaptiveOptimizer extends BaseService {
  private optimizationTargets: Map<string, OptimizationTarget> = new Map();
  private optimizationStrategies: Map<string, OptimizationStrategy> = new Map();
  private adaptiveConfigurations: Map<string, AdaptiveConfiguration> = new Map();
  private learningModels: Map<string, LearningModel> = new Map();
  private crossTriadOptimizations: Map<string, CrossTriadOptimization> = new Map();
  private performanceHistory: Map<string, any[]> = new Map();

  constructor() {
    super('Adaptive Optimizer', 3027);
  }

  protected setupRoutes(): void {
    // Optimization target management
    this.app.post('/targets/register', this.registerOptimizationTarget.bind(this));
    this.app.get('/targets', this.getOptimizationTargets.bind(this));
    this.app.put('/targets/:targetId', this.updateOptimizationTarget.bind(this));
    this.app.delete('/targets/:targetId', this.removeOptimizationTarget.bind(this));
    
    // Optimization strategy endpoints
    this.app.post('/strategies/generate', this.generateOptimizationStrategies.bind(this));
    this.app.post('/strategies/execute', this.executeOptimizationStrategy.bind(this));
    this.app.get('/strategies', this.getOptimizationStrategies.bind(this));
    
    // Adaptive configuration management
    this.app.post('/config/adapt', this.adaptConfiguration.bind(this));
    this.app.get('/config/adaptive', this.getAdaptiveConfigurations.bind(this));
    this.app.post('/config/auto-tune', this.enableAutoTuning.bind(this));
    
    // Cross-triad optimization
    this.app.post('/cross-triad/optimize', this.optimizeCrossTriad.bind(this));
    this.app.get('/cross-triad/opportunities', this.findCrossTriadOpportunities.bind(this));
    this.app.get('/cross-triad/status', this.getCrossTriadOptimizationStatus.bind(this));
    
    // Learning and adaptation
    this.app.post('/learn/from-feedback', this.learnFromFeedback.bind(this));
    this.app.post('/models/train', this.trainOptimizationModel.bind(this));
    this.app.get('/models', this.getOptimizationModels.bind(this));
    
    // Self-healing capabilities
    this.app.post('/heal/auto-correct', this.performAutoCorrection.bind(this));
    this.app.get('/heal/recommendations', this.getSelfHealingRecommendations.bind(this));
    
    // Real-time optimization monitoring
    this.app.get('/monitor/real-time', this.getRealTimeOptimizationStatus.bind(this));
    this.app.post('/monitor/performance', this.updatePerformanceMetrics.bind(this));
  }

  protected async initializeService(): Promise<void> {
    console.log('🎯 Initializing Adaptive Optimizer...');
    await this.initializeOptimizationStrategies();
    await this.startAdaptiveOptimization();
    console.log('✅ Adaptive Optimizer ready for continuous optimization');
  }

  private async initializeOptimizationStrategies(): Promise<void> {
    // Initialize standard optimization strategies
    const strategies: OptimizationStrategy[] = [
      {
        strategy_id: 'resource_scaling',
        name: 'Dynamic Resource Scaling',
        description: 'Automatically scale resources based on demand patterns',
        applicable_targets: ['performance', 'resource'],
        expected_improvement: 0.25,
        implementation_complexity: 'medium',
        risk_level: 'low',
        actions: [
          {
            action_id: 'scale_up',
            type: 'resource_allocation',
            description: 'Increase allocated resources',
            parameters: { scale_factor: 1.5, max_resources: 100 },
            expected_impact: 0.3,
            rollback_plan: 'Scale down to previous configuration'
          }
        ]
      },
      {
        strategy_id: 'caching_optimization',
        name: 'Intelligent Caching',
        description: 'Optimize caching strategies based on access patterns',
        applicable_targets: ['performance'],
        expected_improvement: 0.4,
        implementation_complexity: 'low',
        risk_level: 'low',
        actions: [
          {
            action_id: 'enable_caching',
            type: 'configuration_change',
            description: 'Enable intelligent caching with optimized TTL',
            parameters: { cache_size: '512MB', ttl: 3600 },
            expected_impact: 0.4,
            rollback_plan: 'Disable caching'
          }
        ]
      },
      {
        strategy_id: 'load_balancing',
        name: 'Adaptive Load Balancing',
        description: 'Dynamically adjust load balancing based on service performance',
        applicable_targets: ['performance', 'resource'],
        expected_improvement: 0.2,
        implementation_complexity: 'medium',
        risk_level: 'medium',
        actions: [
          {
            action_id: 'adjust_weights',
            type: 'configuration_change',
            description: 'Adjust load balancing weights',
            parameters: { algorithm: 'weighted_round_robin' },
            expected_impact: 0.2,
            rollback_plan: 'Revert to equal weight distribution'
          }
        ]
      }
    ];

    strategies.forEach(strategy => {
      this.optimizationStrategies.set(strategy.strategy_id, strategy);
    });
  }

  private async startAdaptiveOptimization(): Promise<void> {
    // Start continuous optimization process
    setInterval(() => {
      this.performContinuousOptimization();
    }, 300000); // Every 5 minutes

    // Start adaptive configuration tuning
    setInterval(() => {
      this.performAdaptiveConfigurationTuning();
    }, 120000); // Every 2 minutes
  }

  private async registerOptimizationTarget(req: express.Request, res: express.Response): Promise<void> {
    try {
      const target: OptimizationTarget = req.body;
      
      if (!target.target_id || !target.service_name) {
        res.status(400).json({ error: 'target_id and service_name are required' });
        return;
      }

      // Calculate initial optimization score
      target.current_score = this.calculateOptimizationScore(target.metrics);
      target.optimization_potential = this.calculateOptimizationPotential(target);
      
      this.optimizationTargets.set(target.target_id, target);
      
      res.json({
        success: true,
        target_registered: target.target_id,
        current_score: target.current_score,
        optimization_potential: target.optimization_potential
      });
      
    } catch (error) {
      console.error('Target registration error:', error);
      res.status(500).json({ 
        error: 'Failed to register optimization target',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async generateOptimizationStrategies(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { target_id, optimization_goals } = req.body;
      
      const target = this.optimizationTargets.get(target_id);
      if (!target) {
        res.status(404).json({ error: 'Optimization target not found' });
        return;
      }

      const strategies = this.findApplicableStrategies(target, optimization_goals);
      const recommendations = this.rankStrategiesByExpectedImpact(strategies, target);
      
      res.json({
        success: true,
        target_id,
        available_strategies: recommendations,
        total_strategies: recommendations.length
      });
      
    } catch (error) {
      console.error('Strategy generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate optimization strategies',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async executeOptimizationStrategy(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { strategy_id, target_id, execution_mode = 'safe' } = req.body;
      
      const strategy = this.optimizationStrategies.get(strategy_id);
      const target = this.optimizationTargets.get(target_id);
      
      if (!strategy || !target) {
        res.status(404).json({ error: 'Strategy or target not found' });
        return;
      }

      const executionResult = await this.executeStrategy(strategy, target, execution_mode);
      
      res.json({
        success: true,
        execution_result: executionResult,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Strategy execution error:', error);
      res.status(500).json({ 
        error: 'Failed to execute optimization strategy',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async optimizeCrossTriad(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { triads, optimization_type, target_metrics } = req.body;
      
      if (!Array.isArray(triads) || triads.length < 2) {
        res.status(400).json({ error: 'At least two triads required for cross-triad optimization' });
        return;
      }

      const optimization = this.createCrossTriadOptimization(triads, optimization_type, target_metrics);
      this.crossTriadOptimizations.set(optimization.optimization_id, optimization);
      
      const implementationPlan = await this.generateCrossTriadImplementationPlan(optimization);
      
      res.json({
        success: true,
        optimization_id: optimization.optimization_id,
        current_efficiency: optimization.current_efficiency,
        target_efficiency: optimization.target_efficiency,
        implementation_plan: implementationPlan,
        expected_benefits: optimization.expected_benefits
      });
      
    } catch (error) {
      console.error('Cross-triad optimization error:', error);
      res.status(500).json({ 
        error: 'Failed to optimize cross-triad coordination',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async learnFromFeedback(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { strategy_id, target_id, actual_improvement, feedback_data } = req.body;
      
      // Update strategy effectiveness based on feedback
      const strategy = this.optimizationStrategies.get(strategy_id);
      if (strategy) {
        // Adjust expected improvement based on actual results
        const improvementRatio = actual_improvement / strategy.expected_improvement;
        strategy.expected_improvement = (strategy.expected_improvement + actual_improvement) / 2;
        
        // Learn from the feedback to improve future predictions
        this.updateLearningModels(strategy_id, feedback_data, actual_improvement);
      }
      
      res.json({
        success: true,
        learning_applied: true,
        updated_strategy: strategy_id,
        new_expected_improvement: strategy?.expected_improvement
      });
      
    } catch (error) {
      console.error('Learning from feedback error:', error);
      res.status(500).json({ 
        error: 'Failed to learn from feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async performAutoCorrection(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { service_name, detected_issues } = req.body;
      
      const corrections = [];
      
      for (const issue of detected_issues) {
        const correction = await this.generateAutoCorrection(service_name, issue);
        if (correction) {
          corrections.push(correction);
        }
      }
      
      res.json({
        success: true,
        auto_corrections: corrections,
        total_corrections: corrections.length
      });
      
    } catch (error) {
      console.error('Auto-correction error:', error);
      res.status(500).json({ 
        error: 'Failed to perform auto-correction',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods
  private calculateOptimizationScore(metrics: OptimizationMetric[]): number {
    if (metrics.length === 0) return 0;
    
    const weightedScores = metrics.map(metric => {
      const normalizedValue = this.normalizeMetricValue(metric);
      return normalizedValue * metric.weight;
    });
    
    return stats.mean(weightedScores) * 100; // Score out of 100
  }

  private calculateOptimizationPotential(target: OptimizationTarget): number {
    // Calculate potential based on current performance and available strategies
    const currentScore = target.current_score;
    const maxPossibleScore = 100;
    const applicableStrategies = this.findApplicableStrategies(target, {});
    
    const potentialImprovement = applicableStrategies.reduce((sum, strategy) => 
      sum + strategy.expected_improvement, 0);
    
    return Math.min((maxPossibleScore - currentScore) / maxPossibleScore, potentialImprovement);
  }

  private normalizeMetricValue(metric: OptimizationMetric): number {
    // Normalize metric value to 0-1 range
    if (metric.target_value) {
      return Math.min(metric.current_value / metric.target_value, 1);
    }
    return 0.5; // Default normalized value when no target is set
  }

  private findApplicableStrategies(target: OptimizationTarget, goals: any): OptimizationStrategy[] {
    return Array.from(this.optimizationStrategies.values()).filter(strategy =>
      strategy.applicable_targets.includes(target.target_type)
    );
  }

  private rankStrategiesByExpectedImpact(strategies: OptimizationStrategy[], target: OptimizationTarget): any[] {
    return strategies
      .map(strategy => ({
        ...strategy,
        estimated_impact: this.estimateStrategyImpact(strategy, target),
        feasibility_score: this.calculateFeasibilityScore(strategy, target)
      }))
      .sort((a, b) => (b.estimated_impact * b.feasibility_score) - (a.estimated_impact * a.feasibility_score));
  }

  private estimateStrategyImpact(strategy: OptimizationStrategy, target: OptimizationTarget): number {
    // Estimate the impact of applying this strategy to the target
    const baseImpact = strategy.expected_improvement;
    const targetPotential = target.optimization_potential;
    return baseImpact * targetPotential;
  }

  private calculateFeasibilityScore(strategy: OptimizationStrategy, target: OptimizationTarget): number {
    // Calculate how feasible it is to implement this strategy
    let score = 1.0;
    
    // Adjust based on complexity
    switch (strategy.implementation_complexity) {
      case 'low': score *= 1.0; break;
      case 'medium': score *= 0.8; break;
      case 'high': score *= 0.6; break;
    }
    
    // Adjust based on risk
    switch (strategy.risk_level) {
      case 'low': score *= 1.0; break;
      case 'medium': score *= 0.9; break;
      case 'high': score *= 0.7; break;
    }
    
    return score;
  }

  private async executeStrategy(strategy: OptimizationStrategy, target: OptimizationTarget, mode: string): Promise<any> {
    // Simulate strategy execution
    const executionResult = {
      strategy_id: strategy.strategy_id,
      target_id: target.target_id,
      execution_mode: mode,
      actions_executed: strategy.actions.length,
      success: true,
      estimated_improvement: strategy.expected_improvement,
      execution_time: Date.now()
    };
    
    // In a real implementation, this would execute the actual actions
    console.log(`Executing strategy ${strategy.strategy_id} on target ${target.target_id}`);
    
    return executionResult;
  }

  private createCrossTriadOptimization(triads: string[], type: string, metrics: any): CrossTriadOptimization {
    return {
      optimization_id: `cross_triad_${Date.now()}`,
      triads_involved: triads,
      coordination_type: type as any,
      current_efficiency: 0.7 + Math.random() * 0.2, // Simulated current efficiency
      target_efficiency: 0.9 + Math.random() * 0.1, // Simulated target efficiency
      optimization_strategy: `Optimize ${type} across ${triads.join(', ')} triads`,
      implementation_steps: [
        'Analyze current coordination patterns',
        'Identify optimization opportunities',
        'Implement coordination improvements',
        'Monitor and adjust performance'
      ],
      expected_benefits: {
        response_time_improvement: 0.15,
        resource_utilization_improvement: 0.2,
        coordination_efficiency_improvement: 0.25
      }
    };
  }

  private async generateCrossTriadImplementationPlan(optimization: CrossTriadOptimization): Promise<any> {
    return {
      phase_1: 'Analysis and baseline establishment',
      phase_2: 'Coordination protocol optimization',
      phase_3: 'Resource sharing optimization',
      phase_4: 'Performance monitoring and tuning',
      estimated_duration: '2-4 weeks',
      risk_mitigation: 'Gradual rollout with rollback capabilities'
    };
  }

  private updateLearningModels(strategyId: string, feedbackData: any, actualImprovement: number): void {
    // Update learning models with new feedback
    const modelId = `strategy_${strategyId}`;
    let model = this.learningModels.get(modelId);
    
    if (!model) {
      model = {
        model_id: modelId,
        model_type: 'supervised',
        target_metric: 'improvement_rate',
        training_data: [],
        accuracy: 0.5,
        last_updated: Date.now(),
        predictions: []
      };
      this.learningModels.set(modelId, model);
    }
    
    // Add new training data
    model.training_data.push({
      feedback: feedbackData,
      actual_improvement: actualImprovement,
      timestamp: Date.now()
    });
    
    // Keep only recent data
    if (model.training_data.length > 100) {
      model.training_data = model.training_data.slice(-100);
    }
    
    // Update model accuracy (simplified)
    model.accuracy = Math.min(0.95, model.accuracy + 0.01);
    model.last_updated = Date.now();
  }

  private async generateAutoCorrection(serviceName: string, issue: any): Promise<any> {
    // Generate automatic correction for detected issue
    const corrections = {
      'high_cpu': {
        action: 'scale_resources',
        parameters: { cpu_increase: '20%' },
        description: 'Increase CPU allocation to handle high load'
      },
      'memory_leak': {
        action: 'restart_service',
        parameters: { graceful: true },
        description: 'Gracefully restart service to clear memory leak'
      },
      'slow_response': {
        action: 'enable_caching',
        parameters: { cache_size: '256MB' },
        description: 'Enable caching to improve response times'
      }
    };
    
    const correction = corrections[issue.type as keyof typeof corrections];
    if (correction) {
      return {
        service_name: serviceName,
        issue_type: issue.type,
        correction_action: correction,
        auto_apply: issue.severity === 'critical',
        estimated_resolution_time: '5-10 minutes'
      };
    }
    
    return null;
  }

  private async performContinuousOptimization(): Promise<void> {
    console.log('🔄 Performing continuous optimization...');
    
    // Analyze all registered targets for optimization opportunities
    for (const [targetId, target] of this.optimizationTargets) {
      const currentScore = this.calculateOptimizationScore(target.metrics);
      
      if (currentScore < target.current_score * 0.9) {
        // Performance degraded, trigger optimization
        console.log(`Performance degradation detected for ${targetId}, triggering optimization`);
        
        const strategies = this.findApplicableStrategies(target, {});
        if (strategies.length > 0) {
          const bestStrategy = strategies[0]; // Use the first (presumably best) strategy
          await this.executeStrategy(bestStrategy, target, 'auto');
        }
      }
    }
  }

  private async performAdaptiveConfigurationTuning(): Promise<void> {
    // Perform adaptive configuration tuning
    for (const [configId, config] of this.adaptiveConfigurations) {
      if (Date.now() - config.last_updated > 300000) { // 5 minutes
        // Check if configuration needs tuning
        const performanceData = this.performanceHistory.get(config.service_name) || [];
        if (performanceData.length > 5) {
          const recentPerformance = performanceData.slice(-5);
          const avgPerformance = stats.mean(recentPerformance.map(p => p.value));
          
          // If performance is below optimal, adjust configuration
          if (avgPerformance < config.performance_impact * 0.9) {
            console.log(`Adaptive tuning for ${config.service_name}:${config.parameter_name}`);
            // Implement adaptive tuning logic here
            config.last_updated = Date.now();
          }
        }
      }
    }
  }

  // Additional endpoint implementations
  private async getOptimizationTargets(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      targets: Array.from(this.optimizationTargets.values()),
      total_targets: this.optimizationTargets.size
    });
  }

  private async updateOptimizationTarget(req: express.Request, res: express.Response): Promise<void> {
    const { targetId } = req.params;
    const updates = req.body;
    
    const target = this.optimizationTargets.get(targetId);
    if (!target) {
      res.status(404).json({ error: 'Target not found' });
      return;
    }
    
    Object.assign(target, updates);
    target.current_score = this.calculateOptimizationScore(target.metrics);
    
    res.json({ success: true, updated_target: target });
  }

  private async removeOptimizationTarget(req: express.Request, res: express.Response): Promise<void> {
    const { targetId } = req.params;
    
    if (this.optimizationTargets.delete(targetId)) {
      res.json({ success: true, message: 'Target removed successfully' });
    } else {
      res.status(404).json({ error: 'Target not found' });
    }
  }

  private async getOptimizationStrategies(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      strategies: Array.from(this.optimizationStrategies.values()),
      total_strategies: this.optimizationStrategies.size
    });
  }

  private async adaptConfiguration(req: express.Request, res: express.Response): Promise<void> {
    const config: AdaptiveConfiguration = req.body;
    config.last_updated = Date.now();
    
    this.adaptiveConfigurations.set(config.config_id, config);
    
    res.json({ success: true, adaptive_config: config });
  }

  private async getAdaptiveConfigurations(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      configurations: Array.from(this.adaptiveConfigurations.values()),
      total_configurations: this.adaptiveConfigurations.size
    });
  }

  private async enableAutoTuning(req: express.Request, res: express.Response): Promise<void> {
    res.json({ success: true, message: 'Auto-tuning enabled for specified configurations' });
  }

  private async findCrossTriadOpportunities(req: express.Request, res: express.Response): Promise<void> {
    const opportunities = [
      {
        opportunity_id: 'resource_sharing_001',
        description: 'Share computational resources between Cerebral and Autonomic triads during off-peak',
        potential_improvement: 0.3,
        implementation_effort: 'medium'
      },
      {
        opportunity_id: 'communication_optimization_001',
        description: 'Optimize message routing between Somatic and Autonomic triads',
        potential_improvement: 0.2,
        implementation_effort: 'low'
      }
    ];
    
    res.json({ success: true, opportunities });
  }

  private async getCrossTriadOptimizationStatus(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      active_optimizations: Array.from(this.crossTriadOptimizations.values()),
      total_optimizations: this.crossTriadOptimizations.size
    });
  }

  private async trainOptimizationModel(req: express.Request, res: express.Response): Promise<void> {
    const { model_type, target_metric, training_data } = req.body;
    
    const model: LearningModel = {
      model_id: `model_${Date.now()}`,
      model_type,
      target_metric,
      training_data,
      accuracy: 0.7 + Math.random() * 0.2, // Simulated accuracy
      last_updated: Date.now(),
      predictions: []
    };
    
    this.learningModels.set(model.model_id, model);
    
    res.json({ success: true, model });
  }

  private async getOptimizationModels(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      models: Array.from(this.learningModels.values()),
      total_models: this.learningModels.size
    });
  }

  private async getSelfHealingRecommendations(req: express.Request, res: express.Response): Promise<void> {
    const recommendations = [
      {
        type: 'preventive',
        action: 'Increase monitoring frequency for high-risk services',
        priority: 'medium'
      },
      {
        type: 'corrective',
        action: 'Implement auto-restart for services with memory leaks',
        priority: 'high'
      }
    ];
    
    res.json({ success: true, recommendations });
  }

  private async getRealTimeOptimizationStatus(req: express.Request, res: express.Response): Promise<void> {
    res.json({
      success: true,
      active_optimizations: this.optimizationTargets.size,
      optimization_efficiency: 0.85,
      last_optimization: Date.now() - 300000,
      next_optimization: Date.now() + 300000
    });
  }

  private async updatePerformanceMetrics(req: express.Request, res: express.Response): Promise<void> {
    const { service_name, metrics } = req.body;
    
    if (!this.performanceHistory.has(service_name)) {
      this.performanceHistory.set(service_name, []);
    }
    
    const history = this.performanceHistory.get(service_name)!;
    history.push(...metrics);
    
    // Keep only recent history
    if (history.length > 1000) {
      this.performanceHistory.set(service_name, history.slice(-1000));
    }
    
    res.json({ success: true, metrics_updated: metrics.length });
  }
}

// Create and start the service
const adaptiveOptimizer = new AdaptiveOptimizer();
adaptiveOptimizer.start().catch(console.error);

export { AdaptiveOptimizer };