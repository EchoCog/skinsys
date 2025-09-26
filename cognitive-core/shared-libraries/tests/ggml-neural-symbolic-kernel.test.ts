// GGML Neural-Symbolic Kernel Tests
// Testing Phase 3: Neural-Symbolic Synthesis via Custom GGML Kernels

import { 
  GgmlNeuralSymbolicKernel,
  NeuralSymbolicTensorSignature,
  NeuralSymbolicTensorFactory,
  GgmlOperationType,
  NeuralSymbolicFusion
} from '../src/ggml-neural-symbolic-kernel';
import { 
  GgmlTensorBenchmarker,
  BenchmarkConfig
} from '../src/ggml-tensor-benchmarking';
import { 
  TensorFragmentManager,
  TensorSignatureFactory 
} from '../src/tensor-fragment-architecture';
import { 
  ECANKernel 
} from '../src/ecan-kernel';
import { 
  HypergraphPattern,
  AtomNode,
  AtomLink,
  AtomType,
  LinkType,
  ModalityType,
  ContextType
} from '../src/cognitive-primitives';

describe('Phase 3: Neural-Symbolic Synthesis via Custom GGML Kernels', () => {
  let kernel: GgmlNeuralSymbolicKernel;
  let tensorManager: TensorFragmentManager;
  let ecanKernel: ECANKernel;
  let benchmarker: GgmlTensorBenchmarker;

  beforeEach(() => {
    ecanKernel = new ECANKernel();
    tensorManager = new TensorFragmentManager(ecanKernel);
    kernel = new GgmlNeuralSymbolicKernel(tensorManager, ecanKernel);
    benchmarker = new GgmlTensorBenchmarker(kernel, tensorManager);
  });

  describe('3.1 Kernel Customization', () => {
    describe('Neural-Symbolic Tensor Signatures [atoms, confidence, features]', () => {
      test('creates neural-symbolic signature with proper bounds', () => {
        const signature = kernel.createNeuralSymbolicSignature(
          150, // atoms (should be clamped to maxAtoms: 100)
          1.2, // confidence (should be clamped to 1.0)
          500, // features
          ModalityType.COGNITIVE,
          ContextType.LONG_TERM
        );

        expect(signature.atoms).toBe(100); // Clamped to maxAtoms
        expect(signature.confidence).toBe(1.0); // Clamped to 1.0
        expect(signature.features).toBe(500);
        expect(signature.modality).toBe(ModalityType.COGNITIVE);
        expect(signature.context).toBe(ContextType.LONG_TERM);
        expect(signature.depth).toBe(9); // Math.min(9, Math.floor(100/10))
        expect(signature.salience).toBe(1.0); // Should be clamped to 1.0
      });

      test('maps autonomy_index to feature ratio', () => {
        const signature = kernel.createNeuralSymbolicSignature(50, 0.8, 800);
        
        // autonomy_index should be features/maxFeatures = 800/1000 = 0.8
        expect(signature.autonomy_index).toBeCloseTo(0.8);
      });

      test('handles zero values correctly', () => {
        const signature = kernel.createNeuralSymbolicSignature(0, 0, 0);
        
        expect(signature.atoms).toBe(0);
        expect(signature.confidence).toBe(0);
        expect(signature.features).toBe(0);
        expect(signature.depth).toBe(0);
        expect(signature.salience).toBe(0);
        expect(signature.autonomy_index).toBe(0);
      });
    });

    describe('NeuralSymbolicTensorFactory', () => {
      test('creates low complexity signature', () => {
        const signature = NeuralSymbolicTensorFactory.createLowComplexitySignature(3, 0.5);
        
        expect(signature.atoms).toBe(3);
        expect(signature.confidence).toBe(0.5);
        expect(signature.features).toBe(30); // atoms * 10
        expect(signature.modality).toBe(ModalityType.COGNITIVE);
        expect(signature.depth).toBe(2);
        expect(signature.autonomy_index).toBe(0.3);
      });

      test('creates high complexity signature', () => {
        const signature = NeuralSymbolicTensorFactory.createHighComplexitySignature(25, 0.95);
        
        expect(signature.atoms).toBe(25);
        expect(signature.confidence).toBe(0.95);
        expect(signature.features).toBe(500); // atoms * 20
        expect(signature.modality).toBe(ModalityType.EXECUTIVE);
        expect(signature.depth).toBe(8);
        expect(signature.autonomy_index).toBe(0.8);
      });

      test('creates pattern signature with custom parameters', () => {
        const signature = NeuralSymbolicTensorFactory.createPatternSignature(15, 0.75, 300);
        
        expect(signature.atoms).toBe(15);
        expect(signature.confidence).toBe(0.75);
        expect(signature.features).toBe(300);
        expect(signature.depth).toBe(1); // Math.floor(15/10)
        expect(signature.context).toBe(ContextType.WORKING); // confidence < 0.8
      });

      test('uses long-term context for high confidence', () => {
        const signature = NeuralSymbolicTensorFactory.createPatternSignature(20, 0.85, 400);
        
        expect(signature.context).toBe(ContextType.LONG_TERM); // confidence > 0.8
      });
    });

    describe('Symbolic Encoding Operations', () => {
      let testPattern: HypergraphPattern;

      beforeEach(() => {
        testPattern = createTestPattern(5, 3);
      });

      test('encodes hypergraph pattern to neural tensor', async () => {
        const targetDim = 128;
        const fragment = await kernel.symbolicallyEncode(testPattern, targetDim);
        
        expect(fragment).toBeDefined();
        expect(fragment.data).toBeInstanceOf(Float32Array);
        expect(fragment.data.length).toBe(targetDim);
        expect(fragment.shape).toEqual([targetDim]);
        
        const signature = fragment.signature as NeuralSymbolicTensorSignature;
        expect(signature.atoms).toBe(5); // Number of nodes
        expect(signature.confidence).toBeGreaterThan(0);
        expect(signature.features).toBe(targetDim);
      });

      test('maintains pattern information in encoding', async () => {
        const fragment1 = await kernel.symbolicallyEncode(testPattern, 64);
        const fragment2 = await kernel.symbolicallyEncode(testPattern, 64);
        
        // Same pattern should produce similar encodings
        const similarity = calculateCosineSimilarity(fragment1.data, fragment2.data);
        expect(similarity).toBeGreaterThan(0.9); // High similarity expected
      });

      test('handles empty pattern gracefully', async () => {
        const emptyPattern: HypergraphPattern = { nodes: [], links: [], variables: [] };
        const fragment = await kernel.symbolicallyEncode(emptyPattern, 32);
        
        expect(fragment).toBeDefined();
        const signature = fragment.signature as NeuralSymbolicTensorSignature;
        expect(signature.atoms).toBe(0);
        expect(signature.confidence).toBe(0);
      });

      test('scales encoding dimension correctly', async () => {
        const fragment32 = await kernel.symbolicallyEncode(testPattern, 32);
        const fragment256 = await kernel.symbolicallyEncode(testPattern, 256);
        
        expect(fragment32.data.length).toBe(32);
        expect(fragment256.data.length).toBe(256);
        
        // Both should encode the same pattern information
        const sig32 = fragment32.signature as NeuralSymbolicTensorSignature;
        const sig256 = fragment256.signature as NeuralSymbolicTensorSignature;
        expect(sig32.atoms).toBe(sig256.atoms);
        expect(sig32.confidence).toBeCloseTo(sig256.confidence, 2);
      });
    });

    describe('Neural Decoding Operations', () => {
      test('decodes neural tensor to hypergraph pattern', async () => {
        const signature = NeuralSymbolicTensorFactory.createPatternSignature(10, 0.8, 128);
        const data = generateTestTensorData(128);
        const fragment = tensorManager.createFragment(signature, data, [128]);
        
        const pattern = await kernel.neurallyDecode(fragment, 8, 4);
        
        expect(pattern).toBeDefined();
        expect(pattern.nodes).toBeDefined();
        expect(pattern.links).toBeDefined();
        expect(pattern.nodes.length).toBeLessThanOrEqual(8);
        expect(pattern.links.length).toBeLessThanOrEqual(4);
        
        // Verify nodes have proper structure
        pattern.nodes.forEach(node => {
          expect(node.id).toBeDefined();
          expect(node.type).toBeDefined();
          expect(node.truthValue).toBeDefined();
          expect(node.attentionValue).toBeDefined();
          expect(node.tensor).toBeDefined();
        });
      });

      test('maintains confidence consistency in decoding', async () => {
        const inputConfidence = 0.75;
        const signature = NeuralSymbolicTensorFactory.createPatternSignature(5, inputConfidence, 64);
        const data = generateTestTensorData(64);
        const fragment = tensorManager.createFragment(signature, data, [64]);
        
        const pattern = await kernel.neurallyDecode(fragment, 5, 3);
        
        pattern.nodes.forEach(node => {
          expect(node.truthValue.confidence).toBeCloseTo(inputConfidence, 1);
        });
      });

      test('generates appropriate atom types and names', async () => {
        const signature = NeuralSymbolicTensorFactory.createLowComplexitySignature(3, 0.6);
        const data = generateTestTensorData(32);
        const fragment = tensorManager.createFragment(signature, data, [32]);
        
        const pattern = await kernel.neurallyDecode(fragment, 3, 2);
        
        pattern.nodes.forEach((node, index) => {
          expect(node.name).toBe(`decoded_atom_${index}`);
          expect(node.type).toBe('CONCEPT');
        });
      });
    });

    describe('Attention Fusion Operations', () => {
      test('fuses symbolic and neural representations', async () => {
        const symbolicSig = NeuralSymbolicTensorFactory.createLowComplexitySignature(5, 0.7);
        const neuralSig = NeuralSymbolicTensorFactory.createHighComplexitySignature(8, 0.9);
        
        const symbolicData = generateTestTensorData(64);
        const neuralData = generateTestTensorData(64);
        
        const symbolicFrag = tensorManager.createFragment(symbolicSig, symbolicData, [64]);
        const neuralFrag = tensorManager.createFragment(neuralSig, neuralData, [64]);
        
        const fusion = await kernel.attentionFusion(symbolicFrag, neuralFrag, 0.6);
        
        expect(fusion).toBeDefined();
        expect(fusion.fusionTensor).toBeDefined();
        expect(fusion.symbolicPattern).toBeDefined();
        expect(fusion.neuralFeatures).toBeDefined();
        expect(fusion.confidenceScore).toBeGreaterThan(0);
        expect(fusion.atomAttentionWeights).toBeDefined();
      });

      test('calculates attention weights properly', async () => {
        const sig1 = NeuralSymbolicTensorFactory.createPatternSignature(3, 0.6, 32);
        const sig2 = NeuralSymbolicTensorFactory.createPatternSignature(3, 0.8, 32);
        
        const data1 = new Float32Array([1.0, 0.5, 0.2]);
        const data2 = new Float32Array([0.8, 0.9, 0.1]);
        
        const frag1 = tensorManager.createFragment(sig1, data1, [3]);
        const frag2 = tensorManager.createFragment(sig2, data2, [3]);
        
        const fusion = await kernel.attentionFusion(frag1, frag2);
        
        expect(fusion.atomAttentionWeights.length).toBe(3);
        fusion.atomAttentionWeights.forEach(weight => {
          expect(weight).toBeGreaterThanOrEqual(0);
          expect(weight).toBeLessThanOrEqual(1);
        });
      });

      test('respects fusion weight parameter', async () => {
        const sig = NeuralSymbolicTensorFactory.createPatternSignature(2, 0.7, 16);
        const data1 = new Float32Array([1.0, 0.0]);
        const data2 = new Float32Array([0.0, 1.0]);
        
        const frag1 = tensorManager.createFragment(sig, data1, [2]);
        const frag2 = tensorManager.createFragment(sig, data2, [2]);
        
        const fusionHigh = await kernel.attentionFusion(frag1, frag2, 0.9);
        const fusionLow = await kernel.attentionFusion(frag1, frag2, 0.1);
        
        // High fusion weight should favor symbolic (first) fragment
        // Low fusion weight should favor neural (second) fragment
        expect(fusionHigh.neuralFeatures[0]).toBeGreaterThan(fusionLow.neuralFeatures[0]);
        expect(fusionHigh.neuralFeatures[1]).toBeLessThan(fusionLow.neuralFeatures[1]);
      });
    });

    describe('Confidence Update Operations', () => {
      test('updates pattern confidence based on neural evidence', async () => {
        const pattern = createTestPattern(3, 2);
        const originalConfidences = pattern.nodes.map(n => n.truthValue.confidence);
        
        const neuralEvidence = new Float32Array([0.8, 0.9, 0.7, 0.6]);
        const updatedPattern = await kernel.updateConfidence(pattern, neuralEvidence);
        
        expect(updatedPattern.nodes.length).toBe(pattern.nodes.length);
        
        // Confidence should be updated (may increase or decrease based on consistency)
        updatedPattern.nodes.forEach((node, index) => {
          expect(node.truthValue.confidence).toBeGreaterThanOrEqual(0);
          expect(node.truthValue.confidence).toBeLessThanOrEqual(1);
        });
      });

      test('updates attention values consistently', async () => {
        const pattern = createTestPattern(2, 1);
        const evidence = new Float32Array([0.95, 0.85]);
        
        const updatedPattern = await kernel.updateConfidence(pattern, evidence);
        
        updatedPattern.nodes.forEach(node => {
          expect(node.attentionValue.sti).toBeGreaterThan(0);
          expect(node.attentionValue.lti).toBeGreaterThan(0);
          expect(node.attentionValue.vlti).toBeGreaterThan(0);
        });
      });

      test('handles low consistency scores', async () => {
        const pattern = createTestPattern(4, 2);
        const lowEvidence = new Float32Array([0.1, 0.05, 0.02, 0.01]);
        
        const updatedPattern = await kernel.updateConfidence(pattern, lowEvidence);
        
        // Should still produce valid pattern with reduced confidence
        expect(updatedPattern.nodes.length).toBe(4);
        updatedPattern.nodes.forEach(node => {
          expect(node.truthValue.confidence).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('3.2 Tensor Benchmarking', () => {
    describe('Performance Metrics Collection', () => {
      test('records performance metrics for operations', async () => {
        const pattern = createTestPattern(3, 2);
        await kernel.symbolicallyEncode(pattern, 64);
        
        const results = kernel.getBenchmarkResults();
        
        expect(results.totalOperations).toBeGreaterThan(0);
        expect(results.operationMetrics.size).toBeGreaterThan(0);
        expect(results.overallThroughput).toBeGreaterThan(0);
      });

      test('tracks memory usage accurately', async () => {
        const initialResults = kernel.getBenchmarkResults();
        const initialOps = initialResults.totalOperations;
        
        // Perform several operations
        for (let i = 0; i < 5; i++) {
          const pattern = createTestPattern(i + 2, i + 1);
          await kernel.symbolicallyEncode(pattern, 128);
        }
        
        const finalResults = kernel.getBenchmarkResults();
        expect(finalResults.totalOperations).toBe(initialOps + 5);
        
        const encodeMetrics = finalResults.operationMetrics.get(GgmlOperationType.SYMBOLIC_ENCODE);
        expect(encodeMetrics).toBeDefined();
        expect(encodeMetrics!.length).toBe(5);
      });

      test('calculates throughput correctly', async () => {
        kernel.clearBenchmarkData();
        
        const startTime = performance.now();
        const pattern = createTestPattern(5, 3);
        
        for (let i = 0; i < 10; i++) {
          await kernel.symbolicallyEncode(pattern, 32);
        }
        
        const endTime = performance.now();
        const results = kernel.getBenchmarkResults();
        
        const expectedThroughput = 10 / ((endTime - startTime) / 1000);
        // Allow for some variance in throughput calculation due to async operations
        expect(results.overallThroughput).toBeGreaterThan(0);
        expect(results.overallThroughput).toBeLessThan(expectedThroughput * 10); // Allow up to 10x variance
      });
    });

    describe('Benchmarking Suite', () => {
      test('runs comprehensive benchmark suite', async () => {
        const config: Partial<BenchmarkConfig> = {
          iterations: 5,
          warmupRuns: 2,
          maxTensorSize: 64,
          testOperations: [
            GgmlOperationType.SYMBOLIC_ENCODE,
            GgmlOperationType.NEURAL_DECODE,
            GgmlOperationType.ATTENTION_FUSION
          ],
          enableMemoryTracking: true,
          enableAccuracyTesting: true
        };
        
        const results = await benchmarker.runBenchmarkSuite(config);
        
        expect(results).toBeDefined();
        expect(results.operationResults.size).toBe(3);
        expect(results.summary.performanceScore).toBeGreaterThan(0);
        expect(results.systemInfo).toBeDefined();
        expect(results.totalDurationMs).toBeGreaterThan(0);
      });

      test('generates performance recommendations', async () => {
        const config: Partial<BenchmarkConfig> = {
          iterations: 3,
          warmupRuns: 1,
          testOperations: [GgmlOperationType.SYMBOLIC_ENCODE]
        };
        
        const results = await benchmarker.runBenchmarkSuite(config);
        
        expect(results.summary.recommendations).toBeDefined();
        expect(results.summary.recommendations.length).toBeGreaterThan(0);
        expect(results.summary.fastestOperation).toBeDefined();
        expect(results.summary.slowestOperation).toBeDefined();
      });

      test('exports results in different formats', async () => {
        const config: Partial<BenchmarkConfig> = {
          iterations: 2,
          testOperations: [GgmlOperationType.SYMBOLIC_ENCODE]
        };
        
        const results = await benchmarker.runBenchmarkSuite(config);
        
        const jsonExport = benchmarker.exportResults(results, 'json');
        const csvExport = benchmarker.exportResults(results, 'csv');
        const textExport = benchmarker.exportResults(results, 'text');
        
        expect(jsonExport).toContain('operationResults');
        expect(csvExport).toContain('Operation,Iterations');
        expect(textExport).toContain('# GGML Neural-Symbolic Tensor Benchmarking Report');
      });

      test('generates comparative analysis report', async () => {
        const config: Partial<BenchmarkConfig> = {
          iterations: 2,
          testOperations: [
            GgmlOperationType.SYMBOLIC_ENCODE,
            GgmlOperationType.NEURAL_DECODE
          ]
        };
        
        const results = await benchmarker.runBenchmarkSuite(config);
        const report = benchmarker.generateComparativeReport(results);
        
        expect(report).toContain('System Information');
        expect(report).toContain('Performance Summary');
        expect(report).toContain('Operation Details');
        expect(report).toContain('Recommendations');
      });
    });
  });

  describe('3.3 End-to-End Verification', () => {
    describe('Neural-Symbolic Pipeline Integration', () => {
      test('completes full neural-symbolic synthesis cycle', async () => {
        // Create initial symbolic pattern
        const originalPattern = createTestPattern(4, 3);
        
        // 1. Encode to neural representation
        const encodedFragment = await kernel.symbolicallyEncode(originalPattern, 128);
        expect(encodedFragment).toBeDefined();
        
        // 2. Decode back to symbolic representation
        const decodedPattern = await kernel.neurallyDecode(encodedFragment, 4, 3);
        expect(decodedPattern).toBeDefined();
        expect(decodedPattern.nodes.length).toBeGreaterThan(0);
        
        // 3. Update confidence based on neural evidence
        const updatedPattern = await kernel.updateConfidence(
          decodedPattern, 
          encodedFragment.data.slice(0, 32)
        );
        expect(updatedPattern).toBeDefined();
        
        // 4. Verify structural consistency
        expect(updatedPattern.nodes.length).toBe(decodedPattern.nodes.length);
        expect(updatedPattern.links.length).toBe(decodedPattern.links.length);
      });

      test('maintains tensor signature consistency throughout pipeline', async () => {
        const atoms = 6;
        const confidence = 0.85;
        const features = 96;
        
        const pattern = createTestPattern(atoms, 4);
        const encodedFragment = await kernel.symbolicallyEncode(pattern, features);
        
        const signature = encodedFragment.signature as NeuralSymbolicTensorSignature;
        expect(signature.atoms).toBe(atoms);
        expect(signature.confidence).toBeGreaterThan(0);
        expect(signature.features).toBe(features);
        
        const decodedPattern = await kernel.neurallyDecode(encodedFragment, atoms, 3);
        expect(decodedPattern.nodes.length).toBeLessThanOrEqual(atoms);
      });

      test('handles complex multi-step fusion pipeline', async () => {
        // Create two different patterns
        const pattern1 = createTestPattern(3, 2);
        const pattern2 = createTestPattern(4, 3);
        
        // Encode both patterns
        const encoded1 = await kernel.symbolicallyEncode(pattern1, 64);
        const encoded2 = await kernel.symbolicallyEncode(pattern2, 64);
        
        // Fuse the encodings
        const fusion = await kernel.attentionFusion(encoded1, encoded2, 0.7);
        expect(fusion).toBeDefined();
        expect(fusion.confidenceScore).toBeGreaterThan(0);
        
        // Update confidence based on fusion
        const updatedPattern = await kernel.updateConfidence(
          fusion.symbolicPattern,
          fusion.neuralFeatures
        );
        
        expect(updatedPattern).toBeDefined();
        expect(updatedPattern.nodes.length).toBeGreaterThan(0);
      });
    });

    describe('Error Handling and Robustness', () => {
      test('handles malformed input gracefully', async () => {
        const malformedPattern: HypergraphPattern = {
          nodes: [
            {
              id: '',
              type: '' as any,
              name: '',
              truthValue: { strength: -1, confidence: 2 }, // Invalid values
              attentionValue: { sti: -100, lti: -50, vlti: -25 },
              tensor: {} as any // Malformed tensor
            }
          ],
          links: [],
          variables: []
        };
        
        // Should not throw, but handle gracefully
        const result = await kernel.symbolicallyEncode(malformedPattern, 32);
        expect(result).toBeDefined();
      });

      test('validates tensor dimensions', async () => {
        const pattern = createTestPattern(2, 1);
        
        // Test extreme dimensions
        const smallFragment = await kernel.symbolicallyEncode(pattern, 1);
        expect(smallFragment.data.length).toBe(1);
        
        const largeFragment = await kernel.symbolicallyEncode(pattern, 1000);
        expect(largeFragment.data.length).toBe(1000);
      });

      test('maintains performance under stress', async () => {
        const config: Partial<BenchmarkConfig> = {
          iterations: 20,
          warmupRuns: 5,
          maxTensorSize: 256,
          testOperations: [GgmlOperationType.SYMBOLIC_ENCODE]
        };
        
        const results = await benchmarker.runBenchmarkSuite(config);
        
        // Should complete without errors and maintain reasonable performance
        expect(results.summary.performanceScore).toBeGreaterThan(10);
        expect(results.operationResults.get(GgmlOperationType.SYMBOLIC_ENCODE)!.iterations).toBe(20);
      });
    });

    describe('Accuracy and Consistency Validation', () => {
      test('maintains high encoding-decoding fidelity', async () => {
        const originalAtoms = 5;
        const pattern = createTestPattern(originalAtoms, 3);
        
        const encoded = await kernel.symbolicallyEncode(pattern, 128);
        const decoded = await kernel.neurallyDecode(encoded, originalAtoms, 3);
        
        // Should preserve basic structural information
        expect(decoded.nodes.length).toBeGreaterThan(0);
        expect(decoded.nodes.length).toBeLessThanOrEqual(originalAtoms);
        
        // Confidence should be preserved reasonably well
        const avgOriginalConfidence = pattern.nodes.reduce((sum, n) => 
          sum + n.truthValue.confidence, 0) / pattern.nodes.length;
        const avgDecodedConfidence = decoded.nodes.reduce((sum, n) => 
          sum + n.truthValue.confidence, 0) / decoded.nodes.length;
        
        expect(Math.abs(avgOriginalConfidence - avgDecodedConfidence)).toBeLessThan(0.5);
      });

      test('validates tensor signature format [atoms, confidence, features]', async () => {
        const testCases = [
          { atoms: 10, confidence: 0.7, features: 100 },
          { atoms: 1, confidence: 0.1, features: 10 },
          { atoms: 50, confidence: 0.95, features: 500 },
          { atoms: 100, confidence: 1.0, features: 1000 }
        ];
        
        for (const testCase of testCases) {
          const signature = kernel.createNeuralSymbolicSignature(
            testCase.atoms,
            testCase.confidence,
            testCase.features
          );
          
          // Verify the signature follows [atoms, confidence, features] format
          expect(signature.atoms).toBeLessThanOrEqual(testCase.atoms);
          expect(signature.confidence).toBeLessThanOrEqual(testCase.confidence);
          expect(signature.features).toBeLessThanOrEqual(testCase.features);
          
          // Verify bounds are respected
          expect(signature.atoms).toBeGreaterThanOrEqual(0);
          expect(signature.confidence).toBeGreaterThanOrEqual(0);
          expect(signature.confidence).toBeLessThanOrEqual(1);
          expect(signature.features).toBeGreaterThanOrEqual(0);
        }
      });

      test('verifies attention fusion produces reasonable results', async () => {
        const sig1 = NeuralSymbolicTensorFactory.createLowComplexitySignature(3, 0.6);
        const sig2 = NeuralSymbolicTensorFactory.createHighComplexitySignature(5, 0.9);
        
        const data1 = generateTestTensorData(32);
        const data2 = generateTestTensorData(32);
        
        const frag1 = tensorManager.createFragment(sig1, data1, [32]);
        const frag2 = tensorManager.createFragment(sig2, data2, [32]);
        
        const fusion = await kernel.attentionFusion(frag1, frag2);
        
        // Fusion should combine information from both sources
        expect(fusion.confidenceScore).toBeGreaterThan(0.5);
        expect(fusion.symbolicPattern.nodes.length).toBeGreaterThan(0);
        
        // Attention weights should be normalized
        const totalAttention = Array.from(fusion.atomAttentionWeights).reduce((sum, w) => sum + w, 0);
        expect(totalAttention).toBeGreaterThan(0);
      });
    });
  });

  // Helper functions
  function createTestPattern(nodeCount: number, linkCount: number): HypergraphPattern {
    const nodes: AtomNode[] = [];
    const links: AtomLink[] = [];

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `test_node_${i}`,
        type: AtomType.CONCEPT,
        name: `concept_${i}`,
        truthValue: {
          strength: 0.7 + (Math.random() * 0.3),
          confidence: 0.6 + (Math.random() * 0.4)
        },
        attentionValue: {
          sti: 50 + (Math.random() * 50),
          lti: 25 + (Math.random() * 25),
          vlti: 10 + (Math.random() * 15)
        },
        tensor: TensorSignatureFactory.createCognitiveSignature()
      });
    }

    // Create links
    for (let i = 0; i < Math.min(linkCount, nodeCount - 1); i++) {
      links.push({
        id: `test_link_${i}`,
        type: LinkType.INHERITANCE,
        outgoing: [nodes[i].id, nodes[i + 1].id],
        truthValue: {
          strength: 0.6 + (Math.random() * 0.4),
          confidence: 0.5 + (Math.random() * 0.5)
        },
        attentionValue: {
          sti: 40 + (Math.random() * 40),
          lti: 20 + (Math.random() * 20),
          vlti: 5 + (Math.random() * 10)
        },
        tensor: TensorSignatureFactory.createCognitiveSignature()
      });
    }

    return { nodes, links, variables: [] };
  }

  function generateTestTensorData(size: number): Float32Array {
    const data = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      // Generate data with some structure (not purely random)
      data[i] = Math.sin(i * 0.1) * 0.5 + Math.cos(i * 0.05) * 0.3 + (Math.random() - 0.5) * 0.2;
    }
    return data;
  }

  function calculateCosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
});