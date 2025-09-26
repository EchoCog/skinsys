// GGML Tensor Benchmarking Utilities
// Performance benchmarking and comparative analysis for neural-symbolic operations

import { 
  GgmlNeuralSymbolicKernel,
  NeuralSymbolicTensorSignature,
  GgmlOperationType,
  GgmlPerformanceMetrics,
  NeuralSymbolicTensorFactory
} from './ggml-neural-symbolic-kernel';
import { 
  TensorFragmentManager,
  TensorSignatureFactory 
} from './tensor-fragment-architecture';
import { 
  HypergraphPattern,
  AtomNode,
  AtomLink,
  AtomType,
  LinkType 
} from './cognitive-primitives';

/**
 * Benchmarking configuration
 */
export interface BenchmarkConfig {
  iterations: number;
  warmupRuns: number;
  maxTensorSize: number;
  testOperations: GgmlOperationType[];
  enableMemoryTracking: boolean;
  enableAccuracyTesting: boolean;
  outputFormat: 'json' | 'csv' | 'text';
}

/**
 * Comparative performance results
 */
export interface BenchmarkResults {
  configuration: BenchmarkConfig;
  timestamp: number;
  totalDurationMs: number;
  operationResults: Map<GgmlOperationType, OperationBenchmarkResult>;
  systemInfo: SystemInfo;
  summary: BenchmarkSummary;
}

/**
 * Individual operation benchmark results
 */
export interface OperationBenchmarkResult {
  operation: GgmlOperationType;
  iterations: number;
  totalTimeMs: number;
  averageTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  throughputOpsPerSec: number;
  memoryUsageMB: number;
  accuracyScore: number;
  standardDeviation: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

/**
 * System information for benchmarking context
 */
export interface SystemInfo {
  nodeVersion: string;
  platform: string;
  architecture: string;
  totalMemoryMB: number;
  availableMemoryMB: number;
  cpuCores: number;
}

/**
 * Benchmark summary and insights
 */
export interface BenchmarkSummary {
  fastestOperation: GgmlOperationType;
  slowestOperation: GgmlOperationType;
  mostAccurateOperation: GgmlOperationType;
  mostMemoryEfficient: GgmlOperationType;
  overallThroughput: number;
  performanceScore: number;
  recommendations: string[];
}

/**
 * GGML Tensor Benchmarking Suite
 */
export class GgmlTensorBenchmarker {
  private kernel: GgmlNeuralSymbolicKernel;
  private tensorManager: TensorFragmentManager;
  private testPatterns: HypergraphPattern[] = [];
  private testSignatures: NeuralSymbolicTensorSignature[] = [];

  constructor(kernel: GgmlNeuralSymbolicKernel, tensorManager: TensorFragmentManager) {
    this.kernel = kernel;
    this.tensorManager = tensorManager;
    this.initializeTestData();
  }

  /**
   * Run comprehensive benchmark suite
   */
  async runBenchmarkSuite(config?: Partial<BenchmarkConfig>): Promise<BenchmarkResults> {
    const fullConfig: BenchmarkConfig = {
      iterations: 100,
      warmupRuns: 10,
      maxTensorSize: 1000,
      testOperations: Object.values(GgmlOperationType),
      enableMemoryTracking: true,
      enableAccuracyTesting: true,
      outputFormat: 'json',
      ...config
    };

    console.log('🚀 Starting GGML Neural-Symbolic Tensor Benchmarking...');
    const startTime = performance.now();

    // Clear previous benchmark data
    this.kernel.clearBenchmarkData();

    // Warm up the kernel
    await this.warmupKernel(fullConfig.warmupRuns);

    // Run benchmarks for each operation
    const operationResults = new Map<GgmlOperationType, OperationBenchmarkResult>();
    
    for (const operation of fullConfig.testOperations) {
      console.log(`  📊 Benchmarking ${operation}...`);
      const result = await this.benchmarkOperation(operation, fullConfig);
      operationResults.set(operation, result);
    }

    const totalDurationMs = performance.now() - startTime;
    const systemInfo = this.getSystemInfo();
    const summary = this.generateSummary(operationResults);

    const results: BenchmarkResults = {
      configuration: fullConfig,
      timestamp: Date.now(),
      totalDurationMs,
      operationResults,
      systemInfo,
      summary
    };

    console.log('✅ Benchmarking completed!');
    console.log(`📈 Overall Performance Score: ${summary.performanceScore.toFixed(2)}`);
    console.log(`⚡ Overall Throughput: ${summary.overallThroughput.toFixed(2)} ops/sec`);

    return results;
  }

  /**
   * Benchmark specific operation type
   */
  async benchmarkOperation(
    operation: GgmlOperationType,
    config: BenchmarkConfig
  ): Promise<OperationBenchmarkResult> {
    const timings: number[] = [];
    const memoryUsages: number[] = [];
    const accuracyScores: number[] = [];

    for (let i = 0; i < config.iterations; i++) {
      const startTime = performance.now();
      let memoryBefore = 0;
      let memoryAfter = 0;
      let accuracy = 0;

      if (config.enableMemoryTracking) {
        memoryBefore = this.getMemoryUsage();
      }

      try {
        accuracy = await this.executeOperation(operation, config);
      } catch (error) {
        console.warn(`Operation ${operation} failed in iteration ${i}: ${error}`);
        continue;
      }

      const endTime = performance.now();
      
      if (config.enableMemoryTracking) {
        memoryAfter = this.getMemoryUsage();
        memoryUsages.push(memoryAfter - memoryBefore);
      }

      timings.push(endTime - startTime);
      if (config.enableAccuracyTesting) {
        accuracyScores.push(accuracy);
      }
    }

    return this.calculateOperationResult(operation, timings, memoryUsages, accuracyScores);
  }

  /**
   * Execute specific operation for benchmarking
   */
  private async executeOperation(
    operation: GgmlOperationType,
    config: BenchmarkConfig
  ): Promise<number> {
    let accuracy = 0;

    switch (operation) {
      case GgmlOperationType.SYMBOLIC_ENCODE:
        {
          const pattern = this.getRandomTestPattern();
          const targetDim = Math.min(config.maxTensorSize, 256);
          const fragment = await this.kernel.symbolicallyEncode(pattern, targetDim);
          accuracy = this.validateSymbolicEncoding(pattern, fragment);
        }
        break;

      case GgmlOperationType.NEURAL_DECODE:
        {
          const signature = this.getRandomTestSignature();
          const data = this.generateRandomTensorData(Math.min(config.maxTensorSize, 256));
          const fragment = this.tensorManager.createFragment(signature, data, [data.length]);
          const pattern = await this.kernel.neurallyDecode(fragment, 10, 5);
          accuracy = this.validateNeuralDecoding(fragment, pattern);
        }
        break;

      case GgmlOperationType.ATTENTION_FUSION:
        {
          const sig1 = this.getRandomTestSignature();
          const sig2 = this.getRandomTestSignature();
          const data1 = this.generateRandomTensorData(128);
          const data2 = this.generateRandomTensorData(128);
          const frag1 = this.tensorManager.createFragment(sig1, data1, [data1.length]);
          const frag2 = this.tensorManager.createFragment(sig2, data2, [data2.length]);
          const fusion = await this.kernel.attentionFusion(frag1, frag2);
          accuracy = fusion.confidenceScore;
        }
        break;

      case GgmlOperationType.CONFIDENCE_UPDATE:
        {
          const pattern = this.getRandomTestPattern();
          const evidence = this.generateRandomTensorData(64);
          const updatedPattern = await this.kernel.updateConfidence(pattern, evidence);
          accuracy = this.validateConfidenceUpdate(pattern, updatedPattern);
        }
        break;

      default:
        // For other operations, create a simple test
        const testPattern = this.getRandomTestPattern();
        const testFragment = await this.kernel.symbolicallyEncode(testPattern, 128);
        const nsSignature = testFragment.signature as NeuralSymbolicTensorSignature;
        accuracy = nsSignature.confidence || 0.5;
        break;
    }

    return accuracy;
  }

  /**
   * Generate comparative analysis report
   */
  generateComparativeReport(results: BenchmarkResults): string {
    const report: string[] = [];
    
    report.push('# GGML Neural-Symbolic Tensor Benchmarking Report');
    report.push('');
    report.push(`**Generated:** ${new Date(results.timestamp).toISOString()}`);
    report.push(`**Total Duration:** ${(results.totalDurationMs / 1000).toFixed(2)} seconds`);
    report.push(`**Configuration:** ${results.configuration.iterations} iterations, ${results.configuration.warmupRuns} warmup runs`);
    report.push('');
    
    report.push('## System Information');
    report.push(`- **Platform:** ${results.systemInfo.platform} (${results.systemInfo.architecture})`);
    report.push(`- **Node.js:** ${results.systemInfo.nodeVersion}`);
    report.push(`- **Memory:** ${results.systemInfo.availableMemoryMB}MB available / ${results.systemInfo.totalMemoryMB}MB total`);
    report.push(`- **CPU Cores:** ${results.systemInfo.cpuCores}`);
    report.push('');
    
    report.push('## Performance Summary');
    report.push(`- **Overall Performance Score:** ${results.summary.performanceScore.toFixed(2)}/100`);
    report.push(`- **Overall Throughput:** ${results.summary.overallThroughput.toFixed(2)} ops/sec`);
    report.push(`- **Fastest Operation:** ${results.summary.fastestOperation}`);
    report.push(`- **Slowest Operation:** ${results.summary.slowestOperation}`);
    report.push(`- **Most Accurate:** ${results.summary.mostAccurateOperation}`);
    report.push(`- **Most Memory Efficient:** ${results.summary.mostMemoryEfficient}`);
    report.push('');
    
    report.push('## Operation Details');
    report.push('');
    
    Array.from(results.operationResults.entries())
      .sort((a, b) => a[1].averageTimeMs - b[1].averageTimeMs)
      .forEach(([operation, result]) => {
        report.push(`### ${operation}`);
        report.push(`- **Average Time:** ${result.averageTimeMs.toFixed(3)}ms`);
        report.push(`- **Throughput:** ${result.throughputOpsPerSec.toFixed(2)} ops/sec`);
        report.push(`- **Memory Usage:** ${result.memoryUsageMB.toFixed(2)}MB`);
        report.push(`- **Accuracy:** ${(result.accuracyScore * 100).toFixed(1)}%`);
        report.push(`- **Std Deviation:** ${result.standardDeviation.toFixed(3)}ms`);
        report.push(`- **P95 Latency:** ${result.percentiles.p95.toFixed(3)}ms`);
        report.push('');
      });
    
    report.push('## Recommendations');
    results.summary.recommendations.forEach(rec => {
      report.push(`- ${rec}`);
    });
    
    return report.join('\n');
  }

  /**
   * Export results to various formats
   */
  exportResults(results: BenchmarkResults, format: 'json' | 'csv' | 'text' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, this.mapReplacer, 2);
      
      case 'csv':
        return this.generateCSV(results);
      
      case 'text':
        return this.generateComparativeReport(results);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private helper methods

  private initializeTestData(): void {
    // Create test patterns of varying complexity
    for (let i = 0; i < 10; i++) {
      this.testPatterns.push(this.generateTestPattern(i * 2 + 1, i + 1));
      this.testSignatures.push(NeuralSymbolicTensorFactory.createPatternSignature(
        i * 5 + 5,
        0.5 + (i * 0.05),
        (i * 10 + 10) * 5
      ));
    }
  }

  private generateTestPattern(nodeCount: number, linkCount: number): HypergraphPattern {
    const nodes: AtomNode[] = [];
    const links: AtomLink[] = [];

    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `test_node_${i}`,
        type: AtomType.CONCEPT,
        name: `test_concept_${i}`,
        truthValue: { strength: Math.random(), confidence: Math.random() },
        attentionValue: { sti: Math.random() * 100, lti: Math.random() * 50, vlti: Math.random() * 25 },
        tensor: TensorSignatureFactory.createCognitiveSignature()
      });
    }

    // Generate links
    for (let i = 0; i < Math.min(linkCount, nodes.length - 1); i++) {
      links.push({
        id: `test_link_${i}`,
        type: LinkType.INHERITANCE,
        outgoing: [nodes[i].id, nodes[(i + 1) % nodes.length].id],
        truthValue: { strength: Math.random(), confidence: Math.random() },
        attentionValue: { sti: Math.random() * 80, lti: Math.random() * 40, vlti: Math.random() * 20 },
        tensor: TensorSignatureFactory.createCognitiveSignature()
      });
    }

    return { nodes, links, variables: [] };
  }

  private getRandomTestPattern(): HypergraphPattern {
    return this.testPatterns[Math.floor(Math.random() * this.testPatterns.length)];
  }

  private getRandomTestSignature(): NeuralSymbolicTensorSignature {
    return this.testSignatures[Math.floor(Math.random() * this.testSignatures.length)];
  }

  private generateRandomTensorData(size: number): Float32Array {
    const data = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() - 0.5) * 2; // Range [-1, 1]
    }
    return data;
  }

  private async warmupKernel(warmupRuns: number): Promise<void> {
    console.log(`🔥 Warming up kernel with ${warmupRuns} runs...`);
    
    for (let i = 0; i < warmupRuns; i++) {
      try {
        const pattern = this.getRandomTestPattern();
        await this.kernel.symbolicallyEncode(pattern, 64);
      } catch (error) {
        // Ignore warmup errors
      }
    }
  }

  private validateSymbolicEncoding(pattern: HypergraphPattern, fragment: any): number {
    // Simple validation: check if fragment has expected properties
    if (!fragment || !fragment.data || !fragment.signature) return 0;
    
    const expectedAtoms = pattern.nodes.length;
    const actualAtoms = (fragment.signature as NeuralSymbolicTensorSignature).atoms;
    
    return Math.min(1.0, actualAtoms / Math.max(1, expectedAtoms));
  }

  private validateNeuralDecoding(fragment: any, pattern: HypergraphPattern): number {
    // Simple validation: check if pattern has reasonable structure
    if (!pattern || !pattern.nodes) return 0;
    
    const expectedFeatures = fragment.data.length;
    const actualNodes = pattern.nodes.length;
    
    return Math.min(1.0, actualNodes / Math.max(1, expectedFeatures / 10));
  }

  private validateConfidenceUpdate(original: HypergraphPattern, updated: HypergraphPattern): number {
    if (original.nodes.length !== updated.nodes.length) return 0;
    
    let avgImprovement = 0;
    for (let i = 0; i < original.nodes.length; i++) {
      const originalConf = original.nodes[i].truthValue.confidence;
      const updatedConf = updated.nodes[i].truthValue.confidence;
      avgImprovement += Math.max(0, updatedConf - originalConf);
    }
    
    return avgImprovement / original.nodes.length;
  }

  private calculateOperationResult(
    operation: GgmlOperationType,
    timings: number[],
    memoryUsages: number[],
    accuracyScores: number[]
  ): OperationBenchmarkResult {
    if (timings.length === 0) {
      throw new Error(`No valid timings collected for operation ${operation}`);
    }

    const sortedTimings = [...timings].sort((a, b) => a - b);
    const totalTime = timings.reduce((sum, t) => sum + t, 0);
    const averageTime = totalTime / timings.length;
    const minTime = Math.min(...timings);
    const maxTime = Math.max(...timings);
    
    // Calculate standard deviation
    const variance = timings.reduce((sum, t) => sum + Math.pow(t - averageTime, 2), 0) / timings.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate percentiles
    const p50 = sortedTimings[Math.floor(sortedTimings.length * 0.5)];
    const p90 = sortedTimings[Math.floor(sortedTimings.length * 0.9)];
    const p95 = sortedTimings[Math.floor(sortedTimings.length * 0.95)];
    const p99 = sortedTimings[Math.floor(sortedTimings.length * 0.99)];
    
    const throughput = timings.length / (totalTime / 1000); // ops per second
    const avgMemory = memoryUsages.length > 0 
      ? memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length 
      : 0;
    const avgAccuracy = accuracyScores.length > 0
      ? accuracyScores.reduce((sum, a) => sum + a, 0) / accuracyScores.length
      : 0;

    return {
      operation,
      iterations: timings.length,
      totalTimeMs: totalTime,
      averageTimeMs: averageTime,
      minTimeMs: minTime,
      maxTimeMs: maxTime,
      throughputOpsPerSec: throughput,
      memoryUsageMB: avgMemory,
      accuracyScore: avgAccuracy,
      standardDeviation,
      percentiles: { p50, p90, p95, p99 }
    };
  }

  private getSystemInfo(): SystemInfo {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      totalMemoryMB: Math.round((process.memoryUsage().rss + process.memoryUsage().heapTotal) / 1024 / 1024),
      availableMemoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cpuCores: require('os').cpus().length
    };
  }

  private getMemoryUsage(): number {
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }

  private generateSummary(results: Map<GgmlOperationType, OperationBenchmarkResult>): BenchmarkSummary {
    const operations = Array.from(results.values());
    
    if (operations.length === 0) {
      return {
        fastestOperation: GgmlOperationType.SYMBOLIC_ENCODE,
        slowestOperation: GgmlOperationType.SYMBOLIC_ENCODE,
        mostAccurateOperation: GgmlOperationType.SYMBOLIC_ENCODE,
        mostMemoryEfficient: GgmlOperationType.SYMBOLIC_ENCODE,
        overallThroughput: 0,
        performanceScore: 0,
        recommendations: ['No operations benchmarked']
      };
    }

    const fastest = operations.reduce((prev, curr) => 
      prev.averageTimeMs < curr.averageTimeMs ? prev : curr);
    const slowest = operations.reduce((prev, curr) => 
      prev.averageTimeMs > curr.averageTimeMs ? prev : curr);
    const mostAccurate = operations.reduce((prev, curr) => 
      prev.accuracyScore > curr.accuracyScore ? prev : curr);
    const mostMemoryEfficient = operations.reduce((prev, curr) => 
      prev.memoryUsageMB < curr.memoryUsageMB ? prev : curr);
    
    const overallThroughput = operations.reduce((sum, op) => sum + op.throughputOpsPerSec, 0) / operations.length;
    
    // Calculate performance score (0-100)
    const avgLatency = operations.reduce((sum, op) => sum + op.averageTimeMs, 0) / operations.length;
    const avgAccuracy = operations.reduce((sum, op) => sum + op.accuracyScore, 0) / operations.length;
    const performanceScore = Math.min(100, 
      (overallThroughput / 10) * 0.4 + 
      (1000 / avgLatency) * 0.3 + 
      (avgAccuracy * 100) * 0.3
    );

    const recommendations = this.generateRecommendations(operations, performanceScore);

    return {
      fastestOperation: fastest.operation,
      slowestOperation: slowest.operation,
      mostAccurateOperation: mostAccurate.operation,
      mostMemoryEfficient: mostMemoryEfficient.operation,
      overallThroughput,
      performanceScore,
      recommendations
    };
  }

  private generateRecommendations(operations: OperationBenchmarkResult[], performanceScore: number): string[] {
    const recommendations: string[] = [];
    
    if (performanceScore < 50) {
      recommendations.push('Overall performance is below optimal. Consider optimizing tensor operations.');
    }
    
    const slowOperations = operations.filter(op => op.averageTimeMs > 100);
    if (slowOperations.length > 0) {
      recommendations.push(`Slow operations detected: ${slowOperations.map(op => op.operation).join(', ')}. Consider optimization.`);
    }
    
    const memoryIntensive = operations.filter(op => op.memoryUsageMB > 10);
    if (memoryIntensive.length > 0) {
      recommendations.push(`Memory-intensive operations: ${memoryIntensive.map(op => op.operation).join(', ')}. Monitor memory usage.`);
    }
    
    const lowAccuracy = operations.filter(op => op.accuracyScore < 0.7);
    if (lowAccuracy.length > 0) {
      recommendations.push(`Low accuracy operations: ${lowAccuracy.map(op => op.operation).join(', ')}. Review algorithms.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges. Consider scaling for production workloads.');
    }
    
    return recommendations;
  }

  private generateCSV(results: BenchmarkResults): string {
    const headers = [
      'Operation',
      'Iterations',
      'AvgTimeMs',
      'MinTimeMs', 
      'MaxTimeMs',
      'ThroughputOpsPerSec',
      'MemoryUsageMB',
      'AccuracyScore',
      'StdDeviation'
    ];
    
    const rows = [headers.join(',')];
    
    Array.from(results.operationResults.values()).forEach(result => {
      const row = [
        result.operation,
        result.iterations.toString(),
        result.averageTimeMs.toFixed(3),
        result.minTimeMs.toFixed(3),
        result.maxTimeMs.toFixed(3),
        result.throughputOpsPerSec.toFixed(2),
        result.memoryUsageMB.toFixed(2),
        result.accuracyScore.toFixed(3),
        result.standardDeviation.toFixed(3)
      ];
      rows.push(row.join(','));
    });
    
    return rows.join('\n');
  }

  private mapReplacer(key: string, value: any): any {
    if (value instanceof Map) {
      return Object.fromEntries(value);
    }
    return value;
  }
}