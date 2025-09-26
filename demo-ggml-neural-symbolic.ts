// Demo: Phase 3 Neural-Symbolic Synthesis via Custom GGML Kernels
// Demonstrates tensor signature [atoms, confidence, features] processing

import { 
  GgmlNeuralSymbolicKernel,
  NeuralSymbolicTensorFactory,
  GgmlOperationType 
} from './cognitive-core/shared-libraries/src/ggml-neural-symbolic-kernel';
import { 
  GgmlTensorBenchmarker
} from './cognitive-core/shared-libraries/src/ggml-tensor-benchmarking';
import { 
  TensorFragmentManager,
  TensorSignatureFactory 
} from './cognitive-core/shared-libraries/src/tensor-fragment-architecture';
import { 
  ECANKernel 
} from './cognitive-core/shared-libraries/src/ecan-kernel';
import { 
  HypergraphPattern,
  AtomNode,
  AtomLink,
  AtomType,
  LinkType,
  ModalityType,
  ContextType
} from './cognitive-core/shared-libraries/src/cognitive-primitives';

async function demonstrateNeuralSymbolicSynthesis() {
  console.log('🧠 Phase 3: Neural-Symbolic Synthesis via Custom GGML Kernels Demo');
  console.log('=================================================================');
  console.log('');

  // Initialize the system
  const ecanKernel = new ECANKernel();
  const tensorManager = new TensorFragmentManager(ecanKernel);
  const kernel = new GgmlNeuralSymbolicKernel(tensorManager, ecanKernel);
  const benchmarker = new GgmlTensorBenchmarker(kernel, tensorManager);

  // 1. Tensor Signature [atoms, confidence, features] Demonstration
  console.log('1. Neural-Symbolic Tensor Signatures [atoms, confidence, features]');
  console.log('-------------------------------------------------------------------');
  
  const signatures = [
    kernel.createNeuralSymbolicSignature(15, 0.85, 256, ModalityType.COGNITIVE, ContextType.WORKING),
    NeuralSymbolicTensorFactory.createLowComplexitySignature(5, 0.6),
    NeuralSymbolicTensorFactory.createHighComplexitySignature(30, 0.95),
    NeuralSymbolicTensorFactory.createPatternSignature(20, 0.75, 400)
  ];
  
  signatures.forEach((sig, index) => {
    console.log(`Signature ${index + 1}: [${sig.atoms} atoms, ${sig.confidence.toFixed(2)} confidence, ${sig.features} features]`);
    console.log(`  - Modality: ${sig.modality}, Context: ${sig.context}, Depth: ${sig.depth}`);
    console.log(`  - Salience: ${sig.salience.toFixed(2)}, Autonomy: ${sig.autonomy_index.toFixed(2)}`);
  });
  console.log('');

  // 2. Create a complex hypergraph pattern for testing
  console.log('2. Creating Test Hypergraph Pattern');
  console.log('----------------------------------');
  
  const testPattern = createComplexPattern();
  console.log(`Created hypergraph with ${testPattern.nodes.length} nodes and ${testPattern.links.length} links`);
  console.log('Pattern contents:');
  testPattern.nodes.forEach((node, i) => {
    console.log(`  Node ${i}: ${node.name} (${node.type}, confidence: ${node.truthValue.confidence.toFixed(2)})`);
  });
  testPattern.links.forEach((link, i) => {
    console.log(`  Link ${i}: ${link.type} connecting ${link.outgoing.join(' -> ')}`);
  });
  console.log('');

  // 3. Symbolic Encoding to Neural Representation
  console.log('3. Symbolic Encoding: Hypergraph → Neural Tensor');
  console.log('-----------------------------------------------');
  
  const encodingDimensions = [64, 128, 256];
  const encodedFragments = [];
  
  for (const dim of encodingDimensions) {
    const fragment = await kernel.symbolicallyEncode(testPattern, dim);
    encodedFragments.push(fragment);
    
    const sig = fragment.signature as any; // Type assertion for demo
    console.log(`Encoded to ${dim}D tensor: [${sig.atoms} atoms, ${sig.confidence.toFixed(2)} confidence, ${sig.features} features]`);
    console.log(`  Data range: [${Math.min(...fragment.data).toFixed(3)}, ${Math.max(...fragment.data).toFixed(3)}]`);
    console.log(`  Data mean: ${(Array.from(fragment.data).reduce((sum, val) => sum + val, 0) / fragment.data.length).toFixed(3)}`);
  }
  console.log('');

  // 4. Neural Decoding: Tensor → Hypergraph
  console.log('4. Neural Decoding: Neural Tensor → Hypergraph');
  console.log('---------------------------------------------');
  
  const decodedPatterns = [];
  for (const fragment of encodedFragments) {
    const decoded = await kernel.neurallyDecode(fragment, 8, 4);
    decodedPatterns.push(decoded);
    
    console.log(`Decoded from ${fragment.data.length}D tensor:`);
    console.log(`  Nodes: ${decoded.nodes.length}, Links: ${decoded.links.length}`);
    console.log(`  Average node confidence: ${(decoded.nodes.reduce((sum, n) => sum + n.truthValue.confidence, 0) / decoded.nodes.length).toFixed(3)}`);
  }
  console.log('');

  // 5. Attention Fusion Demo
  console.log('5. Attention Fusion: Combining Neural-Symbolic Representations');
  console.log('-----------------------------------------------------------');
  
  if (encodedFragments.length >= 2) {
    const fusion = await kernel.attentionFusion(encodedFragments[0], encodedFragments[1], 0.7);
    
    console.log('Fusion Results:');
    console.log(`  Fusion confidence: ${fusion.confidenceScore.toFixed(3)}`);
    console.log(`  Symbolic pattern: ${fusion.symbolicPattern.nodes.length} nodes, ${fusion.symbolicPattern.links.length} links`);
    console.log(`  Neural features: ${fusion.neuralFeatures.length} dimensions`);
    console.log(`  Attention weights range: [${Math.min(...fusion.atomAttentionWeights).toFixed(3)}, ${Math.max(...fusion.atomAttentionWeights).toFixed(3)}]`);
    
    // Show top attention weights
    const topAttentionIndices = Array.from(fusion.atomAttentionWeights)
      .map((weight, index) => ({ weight, index }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
    
    console.log('  Top 5 attention weights:');
    topAttentionIndices.forEach(({ weight, index }, i) => {
      console.log(`    ${i + 1}. Index ${index}: ${weight.toFixed(3)}`);
    });
  }
  console.log('');

  // 6. Confidence Update Demo
  console.log('6. Confidence Update: Neural Evidence → Symbolic Refinement');
  console.log('---------------------------------------------------------');
  
  const originalPattern = testPattern;
  const neuralEvidence = new Float32Array([0.9, 0.8, 0.95, 0.7, 0.85, 0.6, 0.92, 0.75]);
  const updatedPattern = await kernel.updateConfidence(originalPattern, neuralEvidence);
  
  console.log('Confidence updates:');
  for (let i = 0; i < Math.min(originalPattern.nodes.length, updatedPattern.nodes.length); i++) {
    const orig = originalPattern.nodes[i].truthValue.confidence;
    const updated = updatedPattern.nodes[i].truthValue.confidence;
    const change = updated - orig;
    console.log(`  ${originalPattern.nodes[i].name}: ${orig.toFixed(3)} → ${updated.toFixed(3)} (${change >= 0 ? '+' : ''}${change.toFixed(3)})`);
  }
  console.log('');

  // 7. Performance Benchmarking
  console.log('7. Performance Benchmarking Suite');
  console.log('---------------------------------');
  
  const benchmarkConfig = {
    iterations: 20,
    warmupRuns: 5,
    maxTensorSize: 128,
    testOperations: [
      GgmlOperationType.SYMBOLIC_ENCODE,
      GgmlOperationType.NEURAL_DECODE,
      GgmlOperationType.ATTENTION_FUSION,
      GgmlOperationType.CONFIDENCE_UPDATE
    ],
    enableMemoryTracking: true,
    enableAccuracyTesting: true
  };
  
  console.log(`Running benchmark with ${benchmarkConfig.iterations} iterations...`);
  const benchmarkResults = await benchmarker.runBenchmarkSuite(benchmarkConfig);
  
  console.log('\nBenchmark Results:');
  console.log(`  Overall Performance Score: ${benchmarkResults.summary.performanceScore.toFixed(1)}/100`);
  console.log(`  Overall Throughput: ${benchmarkResults.summary.overallThroughput.toFixed(2)} ops/sec`);
  console.log(`  Fastest Operation: ${benchmarkResults.summary.fastestOperation}`);
  console.log(`  Most Accurate: ${benchmarkResults.summary.mostAccurateOperation}`);
  console.log(`  Most Memory Efficient: ${benchmarkResults.summary.mostMemoryEfficient}`);
  
  console.log('\nDetailed Performance Metrics:');
  benchmarkResults.operationResults.forEach((result, operation) => {
    console.log(`  ${operation}:`);
    console.log(`    Average Time: ${result.averageTimeMs.toFixed(2)}ms`);
    console.log(`    Throughput: ${result.throughputOpsPerSec.toFixed(2)} ops/sec`);
    console.log(`    Memory Usage: ${result.memoryUsageMB.toFixed(2)}MB`);
    console.log(`    Accuracy: ${(result.accuracyScore * 100).toFixed(1)}%`);
  });
  
  console.log('\nRecommendations:');
  benchmarkResults.summary.recommendations.forEach(rec => {
    console.log(`  - ${rec}`);
  });
  console.log('');

  // 8. End-to-End Pipeline Demo
  console.log('8. End-to-End Neural-Symbolic Pipeline');
  console.log('-------------------------------------');
  
  console.log('Pipeline: Symbolic Pattern → Neural Encoding → Fusion → Decoding → Confidence Update');
  
  // Create two different patterns
  const pattern1 = createSimplePattern('visual', 3);
  const pattern2 = createSimplePattern('auditory', 4);
  
  console.log(`Input patterns: ${pattern1.nodes.length} + ${pattern2.nodes.length} nodes`);
  
  // Encode both
  const encoded1 = await kernel.symbolicallyEncode(pattern1, 64);
  const encoded2 = await kernel.symbolicallyEncode(pattern2, 64);
  
  // Fuse them
  const pipelineFusion = await kernel.attentionFusion(encoded1, encoded2, 0.6);
  
  // Update confidence
  const finalPattern = await kernel.updateConfidence(
    pipelineFusion.symbolicPattern,
    pipelineFusion.neuralFeatures.slice(0, 16)
  );
  
  console.log('Pipeline Results:');
  console.log(`  Final pattern: ${finalPattern.nodes.length} nodes, ${finalPattern.links.length} links`);
  console.log(`  Average confidence: ${(finalPattern.nodes.reduce((sum, n) => sum + n.truthValue.confidence, 0) / finalPattern.nodes.length).toFixed(3)}`);
  console.log(`  Average attention STI: ${(finalPattern.nodes.reduce((sum, n) => sum + n.attentionValue.sti, 0) / finalPattern.nodes.length).toFixed(1)}`);
  console.log('');

  // 9. Export Benchmark Report
  console.log('9. Exporting Benchmark Report');
  console.log('-----------------------------');
  
  const reportFormats = ['text', 'json'] as const;
  
  for (const format of reportFormats) {
    const report = benchmarker.exportResults(benchmarkResults, format);
    console.log(`Generated ${format.toUpperCase()} report (${report.length} characters)`);
    
    if (format === 'text') {
      console.log('\nText Report Preview (first 500 characters):');
      console.log(report.substring(0, 500) + '...');
    }
  }
  console.log('');

  // 10. Final System Status
  console.log('10. System Status & Metrics');
  console.log('---------------------------');
  
  const kernelResults = kernel.getBenchmarkResults();
  console.log(`Total operations performed: ${kernelResults.totalOperations}`);
  console.log(`Operation types tracked: ${kernelResults.operationMetrics.size}`);
  console.log(`System throughput: ${kernelResults.overallThroughput.toFixed(2)} ops/sec`);
  
  console.log('\nPhase 3 Demo Complete! ✅');
  console.log('');
  console.log('Summary of Achievements:');
  console.log('  ✅ 3.1 Kernel Customization - Custom GGML kernels for [atoms, confidence, features]');
  console.log('  ✅ 3.2 Tensor Benchmarking - Comprehensive performance analysis');
  console.log('  ✅ 3.3 End-to-End Verification - Complete neural-symbolic synthesis pipeline');
  console.log('');
  console.log('Neural-symbolic synthesis via custom GGML kernels is fully operational! 🚀');
}

// Helper functions
function createComplexPattern(): HypergraphPattern {
  const nodes: AtomNode[] = [
    {
      id: 'perception_node',
      type: AtomType.CONCEPT,
      name: 'visual_perception',
      truthValue: { strength: 0.9, confidence: 0.85 },
      attentionValue: { sti: 95, lti: 75, vlti: 25 },
      tensor: TensorSignatureFactory.createSensorySignature()
    },
    {
      id: 'reasoning_node',
      type: AtomType.CONCEPT,
      name: 'logical_reasoning',
      truthValue: { strength: 0.8, confidence: 0.92 },
      attentionValue: { sti: 88, lti: 85, vlti: 30 },
      tensor: TensorSignatureFactory.createCognitiveSignature()
    },
    {
      id: 'memory_node',
      type: AtomType.CONCEPT,
      name: 'episodic_memory',
      truthValue: { strength: 0.75, confidence: 0.78 },
      attentionValue: { sti: 70, lti: 90, vlti: 45 },
      tensor: TensorSignatureFactory.createMemorySignature()
    },
    {
      id: 'attention_node',
      type: AtomType.CONCEPT,
      name: 'selective_attention',
      truthValue: { strength: 0.95, confidence: 0.88 },
      attentionValue: { sti: 100, lti: 60, vlti: 20 },
      tensor: TensorSignatureFactory.createCognitiveSignature()
    },
    {
      id: 'decision_node',
      type: AtomType.CONCEPT,
      name: 'decision_making',
      truthValue: { strength: 0.82, confidence: 0.90 },
      attentionValue: { sti: 85, lti: 80, vlti: 35 },
      tensor: TensorSignatureFactory.createCognitiveSignature()
    }
  ];

  const links: AtomLink[] = [
    {
      id: 'perception_reasoning_link',
      type: LinkType.INHERITANCE,
      outgoing: ['perception_node', 'reasoning_node'],
      truthValue: { strength: 0.85, confidence: 0.80 },
      attentionValue: { sti: 75, lti: 65, vlti: 15 },
      tensor: TensorSignatureFactory.createCognitiveSignature()
    },
    {
      id: 'reasoning_memory_link',
      type: LinkType.SIMILARITY,
      outgoing: ['reasoning_node', 'memory_node'],
      truthValue: { strength: 0.70, confidence: 0.85 },
      attentionValue: { sti: 65, lti: 70, vlti: 25 },
      tensor: TensorSignatureFactory.createCognitiveSignature()
    },
    {
      id: 'attention_decision_link',
      type: LinkType.EVALUATION,
      outgoing: ['attention_node', 'decision_node'],
      truthValue: { strength: 0.90, confidence: 0.87 },
      attentionValue: { sti: 80, lti: 55, vlti: 20 },
      tensor: TensorSignatureFactory.createCognitiveSignature()
    },
    {
      id: 'memory_attention_link',
      type: LinkType.IMPLICATION,
      outgoing: ['memory_node', 'attention_node'],
      truthValue: { strength: 0.78, confidence: 0.75 },
      attentionValue: { sti: 60, lti: 75, vlti: 30 },
      tensor: TensorSignatureFactory.createCognitiveSignature()
    }
  ];

  return { nodes, links, variables: [] };
}

function createSimplePattern(modality: string, nodeCount: number): HypergraphPattern {
  const nodes: AtomNode[] = [];
  const links: AtomLink[] = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `${modality}_node_${i}`,
      type: AtomType.CONCEPT,
      name: `${modality}_concept_${i}`,
      truthValue: { 
        strength: 0.6 + (Math.random() * 0.4), 
        confidence: 0.5 + (Math.random() * 0.5) 
      },
      attentionValue: { 
        sti: 40 + (Math.random() * 60), 
        lti: 30 + (Math.random() * 50), 
        vlti: 10 + (Math.random() * 20) 
      },
      tensor: TensorSignatureFactory.createCognitiveSignature()
    });
  }

  for (let i = 0; i < nodeCount - 1; i++) {
    links.push({
      id: `${modality}_link_${i}`,
      type: LinkType.INHERITANCE,
      outgoing: [`${modality}_node_${i}`, `${modality}_node_${i + 1}`],
      truthValue: { 
        strength: 0.5 + (Math.random() * 0.5), 
        confidence: 0.4 + (Math.random() * 0.6) 
      },
      attentionValue: { 
        sti: 30 + (Math.random() * 50), 
        lti: 25 + (Math.random() * 40), 
        vlti: 5 + (Math.random() * 15) 
      },
      tensor: TensorSignatureFactory.createCognitiveSignature()
    });
  }

  return { nodes, links, variables: [] };
}

// Run the demonstration
if (require.main === module) {
  demonstrateNeuralSymbolicSynthesis().catch(console.error);
}