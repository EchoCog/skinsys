// Tests for Cognitive Primitives & Foundational Hypergraph Encoding
// Comprehensive test suite for Phase 1 implementation

import {
  TensorSignature,
  ModalityType,
  ContextType,
  AtomType,
  LinkType,
  CognitivePrimitive,
  PrimitiveType,
  MLPrimitiveType,
  HypergraphPattern
} from '../src/cognitive-primitives';

import {
  TensorFragmentManager,
  TensorSignatureFactory
} from '../src/tensor-fragment-architecture';

import {
  SchemeCognitiveGrammar,
  CognitiveGrammarService
} from '../src/scheme-cognitive-grammar';

import {
  HypergraphTranslator
} from '../src/hypergraph-translator';

import {
  HypergraphVerifier,
  CognitiveVisualizer
} from '../src/verification-visualization';

describe('Cognitive Primitives & Foundational Hypergraph Encoding', () => {
  
  describe('TensorSignatureFactory', () => {
    test('creates valid sensory signature', () => {
      const signature = TensorSignatureFactory.createSensorySignature();
      
      expect(signature.modality).toBe(ModalityType.SENSORY);
      expect(signature.depth).toBe(1);
      expect(signature.context).toBe(ContextType.IMMEDIATE);
      expect(signature.salience).toBe(0.8);
      expect(signature.autonomy_index).toBe(0.2);
    });

    test('creates valid cognitive signature', () => {
      const signature = TensorSignatureFactory.createCognitiveSignature(4, ContextType.WORKING, 0.7);
      
      expect(signature.modality).toBe(ModalityType.COGNITIVE);
      expect(signature.depth).toBe(4);
      expect(signature.context).toBe(ContextType.WORKING);
      expect(signature.autonomy_index).toBe(0.7);
    });

    test('creates valid memory signature', () => {
      const signature = TensorSignatureFactory.createMemorySignature();
      
      expect(signature.modality).toBe(ModalityType.MEMORY);
      expect(signature.context).toBe(ContextType.LONG_TERM);
      expect(signature.autonomy_index).toBe(0.8);
    });

    test('creates valid motor signature', () => {
      const signature = TensorSignatureFactory.createMotorSignature();
      
      expect(signature.modality).toBe(ModalityType.MOTOR);
      expect(signature.context).toBe(ContextType.IMMEDIATE);
      expect(signature.salience).toBe(0.9);
    });
  });

  describe('TensorFragmentManager', () => {
    let manager: TensorFragmentManager;

    beforeEach(() => {
      manager = new TensorFragmentManager();
    });

    test('creates tensor fragment with signature', () => {
      const signature = TensorSignatureFactory.createCognitiveSignature();
      const data = new Float32Array([1, 2, 3, 4, 5]);
      const shape = [5];

      const fragment = manager.createFragment(signature, data, shape, 'test_primitive');

      expect(fragment.signature).toEqual(signature);
      expect(fragment.data).toEqual(data);
      expect(fragment.shape).toEqual(shape);
      expect(fragment.metadata.source_primitive).toBe('test_primitive');
      expect(fragment.metadata.creation_time).toBeGreaterThan(0);
    });

    test('finds fragments matching criteria', () => {
      const signature1 = TensorSignatureFactory.createSensorySignature();
      const signature2 = TensorSignatureFactory.createCognitiveSignature();
      const data = new Float32Array([1, 2, 3]);

      manager.createFragment(signature1, data, [3], 'sensory');
      manager.createFragment(signature2, data, [3], 'cognitive');

      const sensoryFragments = manager.findFragments({ modality: ModalityType.SENSORY });
      const cognitiveFragments = manager.findFragments({ modality: ModalityType.COGNITIVE });

      expect(sensoryFragments).toHaveLength(1);
      expect(cognitiveFragments).toHaveLength(1);
      expect(sensoryFragments[0].metadata.source_primitive).toBe('sensory');
      expect(cognitiveFragments[0].metadata.source_primitive).toBe('cognitive');
    });

    test('transforms fragment through ML primitive', () => {
      const signature = TensorSignatureFactory.createCognitiveSignature();
      const data = new Float32Array([1, 2, 3, 4]);
      const fragment = manager.createFragment(signature, data, [4], 'original');

      const mlPrimitive = {
        type: MLPrimitiveType.LINEAR_TRANSFORM,
        parameters: { output_dim: 3 },
        input_tensor: signature,
        output_tensor: signature,
        weights: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        bias: [0.1, 0.2, 0.3]
      };

      const transformedFragment = manager.transformFragment(fragment.id, mlPrimitive);

      expect(transformedFragment).not.toBeNull();
      expect(transformedFragment!.data.length).toBe(3);
      expect(transformedFragment!.signature.depth).toBe(signature.depth + 1);
    });

    test('merges multiple fragments', () => {
      const signature = TensorSignatureFactory.createCognitiveSignature();
      const data1 = new Float32Array([1, 2]);
      const data2 = new Float32Array([3, 4]);
      
      const fragment1 = manager.createFragment(signature, data1, [2], 'first');
      const fragment2 = manager.createFragment(signature, data2, [2], 'second');

      const mergedFragment = manager.mergeFragments([fragment1.id, fragment2.id], 'concatenate');

      expect(mergedFragment).not.toBeNull();
      expect(mergedFragment!.data).toEqual(new Float32Array([1, 2, 3, 4]));
      expect(mergedFragment!.shape).toEqual([4]);
    });
  });

  describe('SchemeCognitiveGrammar', () => {
    let grammar: SchemeCognitiveGrammar;

    beforeEach(() => {
      grammar = new SchemeCognitiveGrammar();
    });

    test('parses simple atom expression', () => {
      const expression = grammar.parse('hello');
      
      expect(expression.type).toBe('atom');
      expect((expression as any).value).toBe('hello');
    });

    test('parses number expression', () => {
      const expression = grammar.parse('42');
      
      expect(expression.type).toBe('atom');
      expect((expression as any).value).toBe(42);
    });

    test('parses boolean expression', () => {
      const expression = grammar.parse('true');
      
      expect(expression.type).toBe('atom');
      expect((expression as any).value).toBe(true);
    });

    test('parses procedure call expression', () => {
      const expression = grammar.parse('(perceive stimulus)');
      
      expect(expression.type).toBe('procedure');
      expect((expression as any).name).toBe('perceive');
      expect((expression as any).args).toHaveLength(1);
      expect((expression as any).args[0].value).toBe('stimulus');
    });

    test('parses nested procedure call', () => {
      const expression = grammar.parse('(remember (perceive stimulus) context)');
      
      expect(expression.type).toBe('procedure');
      expect((expression as any).name).toBe('remember');
      expect((expression as any).args).toHaveLength(2);
      expect((expression as any).args[0].type).toBe('procedure');
      expect((expression as any).args[0].name).toBe('perceive');
    });

    test('evaluates simple cognitive operation', () => {
      grammar.bindVariable('stimulus', 'visual_input');
      
      const result = grammar.executeCognitiveOperation('(perceive stimulus)');
      
      // Result should be processed through the perceive procedure
      expect(result).toBeDefined();
    });

    test('gets available cognitive primitives', () => {
      const primitives = grammar.getCognitivePrimitives();
      
      expect(primitives.length).toBeGreaterThan(0);
      
      const primitiveNames = primitives.map(p => p.name);
      expect(primitiveNames).toContain('perceive');
      expect(primitiveNames).toContain('attend');
      expect(primitiveNames).toContain('remember');
      expect(primitiveNames).toContain('reason');
    });

    test('retrieves specific primitive', () => {
      const primitive = grammar.getPrimitive('perceive');
      
      expect(primitive).toBeDefined();
      expect(primitive!.name).toBe('perceive');
      expect(primitive!.type).toBe(PrimitiveType.PERCEPTION);
    });
  });

  describe('CognitiveGrammarService', () => {
    let service: CognitiveGrammarService;

    beforeEach(() => {
      service = new CognitiveGrammarService();
    });

    test('starts and stops service', async () => {
      expect(service.getStatus().running).toBe(false);
      
      await service.start();
      expect(service.getStatus().running).toBe(true);
      
      await service.stop();
      expect(service.getStatus().running).toBe(false);
    });

    test('processes cognitive operation', async () => {
      await service.start();
      
      const result = await service.processCognitiveOperation(
        '(perceive visual_input)',
        { visual_input: 'test_stimulus' }
      );
      
      expect(result.result).toBeDefined();
      expect(result.primitives_used).toContain('perceive');
      expect(result.tensor_fragments).toBeDefined();
      
      await service.stop();
    });

    test('gets available primitives', async () => {
      await service.start();
      
      const primitives = service.getAvailablePrimitives();
      expect(primitives.length).toBeGreaterThan(0);
      
      await service.stop();
    });
  });

  describe('HypergraphTranslator', () => {
    let translator: HypergraphTranslator;

    beforeEach(() => {
      translator = new HypergraphTranslator();
    });

    test('translates ML primitive to hypergraph', () => {
      const mlPrimitive = {
        type: MLPrimitiveType.LINEAR_TRANSFORM,
        parameters: { output_dim: 3 },
        input_tensor: TensorSignatureFactory.createCognitiveSignature(),
        output_tensor: TensorSignatureFactory.createCognitiveSignature(),
        weights: [0.1, 0.2, 0.3],
        bias: [0.01, 0.02, 0.03]
      };

      const pattern = translator.mlPrimitiveToHypergraph(mlPrimitive);

      expect(pattern.nodes.length).toBeGreaterThan(0);
      expect(pattern.links.length).toBeGreaterThan(0);
      
      // Should have a main concept node
      const mainNode = pattern.nodes.find(node => 
        node.name.includes('ml_primitive_linear_transform')
      );
      expect(mainNode).toBeDefined();
    });

    test('translates hypergraph back to ML primitive', () => {
      const originalML = {
        type: MLPrimitiveType.ATTENTION_MECHANISM,
        parameters: { attention_dim: 64 },
        input_tensor: TensorSignatureFactory.createCognitiveSignature(),
        output_tensor: TensorSignatureFactory.createCognitiveSignature()
      };

      const pattern = translator.mlPrimitiveToHypergraph(originalML);
      const reconstructedML = translator.hypergraphToMLPrimitive(pattern);

      expect(reconstructedML.type).toBe(originalML.type);
      expect(reconstructedML.parameters.attention_dim).toBe(64);
    });

    test('translates cognitive primitive to hypergraph', () => {
      const primitive: CognitivePrimitive = {
        id: 'test_primitive',
        name: 'test_perceive',
        type: PrimitiveType.PERCEPTION,
        tensor: TensorSignatureFactory.createSensorySignature(),
        atomspace_pattern: {
          nodes: [],
          links: [],
          variables: []
        },
        ml_primitive: {
          type: MLPrimitiveType.PATTERN_MATCH,
          parameters: {},
          input_tensor: TensorSignatureFactory.createSensorySignature(),
          output_tensor: TensorSignatureFactory.createSensorySignature()
        }
      };

      const pattern = translator.cognitivePrimitiveToHypergraph(primitive);

      expect(pattern.nodes.length).toBeGreaterThan(0);
      expect(pattern.links.length).toBeGreaterThan(0);
      
      // Should have cognitive concept node
      const cognitiveNode = pattern.nodes.find(node => 
        node.name.includes('cognitive_test_perceive')
      );
      expect(cognitiveNode).toBeDefined();
    });

    test('validates pattern consistency', () => {
      const pattern: HypergraphPattern = {
        nodes: [
          {
            id: 'node1',
            type: AtomType.CONCEPT,
            name: 'test_concept',
            truthValue: { strength: 0.8, confidence: 0.9 },
            attentionValue: { sti: 100, lti: 50, vlti: 10 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          }
        ],
        links: [
          {
            id: 'link1',
            type: LinkType.INHERITANCE,
            outgoing: ['node1', 'nonexistent'],
            truthValue: { strength: 0.7, confidence: 0.8 },
            attentionValue: { sti: 80, lti: 40, vlti: 5 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          }
        ],
        variables: []
      };

      const validation = translator.validatePattern(pattern);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('nonexistent');
    });
  });

  describe('HypergraphVerifier', () => {
    let verifier: HypergraphVerifier;

    beforeEach(() => {
      verifier = new HypergraphVerifier();
    });

    test('verifies valid pattern', () => {
      const pattern: HypergraphPattern = {
        nodes: [
          {
            id: 'node1',
            type: AtomType.CONCEPT,
            name: 'test_concept',
            truthValue: { strength: 0.8, confidence: 0.9 },
            attentionValue: { sti: 100, lti: 50, vlti: 10 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          },
          {
            id: 'node2',
            type: AtomType.CONCEPT,
            name: 'parent_concept',
            truthValue: { strength: 0.9, confidence: 0.8 },
            attentionValue: { sti: 120, lti: 60, vlti: 15 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          }
        ],
        links: [
          {
            id: 'link1',
            type: LinkType.INHERITANCE,
            outgoing: ['node1', 'node2'],
            truthValue: { strength: 0.85, confidence: 0.9 },
            attentionValue: { sti: 90, lti: 45, vlti: 8 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          }
        ],
        variables: []
      };

      const result = verifier.verifyPattern(pattern);

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.nodeCount).toBe(2);
      expect(result.metrics.linkCount).toBe(1);
    });

    test('detects invalid truth values', () => {
      const pattern: HypergraphPattern = {
        nodes: [
          {
            id: 'node1',
            type: AtomType.CONCEPT,
            name: 'test_concept',
            truthValue: { strength: 1.5, confidence: 0.9 }, // Invalid strength
            attentionValue: { sti: 100, lti: 50, vlti: 10 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          }
        ],
        links: [],
        variables: []
      };

      const result = verifier.verifyPattern(pattern);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid truth value strength');
    });

    test('verifies cognitive primitive', () => {
      const primitive: CognitivePrimitive = {
        id: 'test_primitive',
        name: 'test_perceive',
        type: PrimitiveType.PERCEPTION,
        tensor: TensorSignatureFactory.createSensorySignature(),
        atomspace_pattern: {
          nodes: [{
            id: 'node1',
            type: AtomType.CONCEPT,
            name: 'cognitive_test_perceive',
            truthValue: { strength: 0.8, confidence: 0.9 },
            attentionValue: { sti: 100, lti: 50, vlti: 10 },
            tensor: TensorSignatureFactory.createSensorySignature()
          }],
          links: [],
          variables: []
        },
        ml_primitive: {
          type: MLPrimitiveType.PATTERN_MATCH,
          parameters: {},
          input_tensor: TensorSignatureFactory.createSensorySignature(),
          output_tensor: TensorSignatureFactory.createSensorySignature()
        }
      };

      const result = verifier.verifyCognitivePrimitive(primitive);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    test('verifies bidirectional translation', () => {
      const originalML = {
        type: MLPrimitiveType.LINEAR_TRANSFORM,
        parameters: { output_dim: 3 },
        input_tensor: TensorSignatureFactory.createCognitiveSignature(),
        output_tensor: TensorSignatureFactory.createCognitiveSignature(),
        weights: [0.1, 0.2, 0.3]
      };

      const translator = new HypergraphTranslator();
      const pattern = translator.mlPrimitiveToHypergraph(originalML);
      const reconstructedML = translator.hypergraphToMLPrimitive(pattern);

      const result = verifier.verifyBidirectionalTranslation(
        originalML,
        pattern,
        reconstructedML
      );

      expect(result.valid).toBe(true);
      expect(result.fidelity).toBeGreaterThan(0);
      expect(result.translationAccuracy).toBeGreaterThan(0);
    });
  });

  describe('CognitiveVisualizer', () => {
    let visualizer: CognitiveVisualizer;

    beforeEach(() => {
      visualizer = new CognitiveVisualizer();
    });

    test('visualizes hypergraph pattern', () => {
      const pattern: HypergraphPattern = {
        nodes: [
          {
            id: 'node1',
            type: AtomType.CONCEPT,
            name: 'test_concept',
            truthValue: { strength: 0.8, confidence: 0.9 },
            attentionValue: { sti: 100, lti: 50, vlti: 10 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          }
        ],
        links: [
          {
            id: 'link1',
            type: LinkType.INHERITANCE,
            outgoing: ['node1'],
            truthValue: { strength: 0.7, confidence: 0.8 },
            attentionValue: { sti: 80, lti: 40, vlti: 5 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          }
        ],
        variables: []
      };

      const visualization = visualizer.visualizeHypergraphPattern(pattern);

      expect(visualization).toContain('Hypergraph Pattern Visualization');
      expect(visualization).toContain('NODES:');
      expect(visualization).toContain('LINKS:');
      expect(visualization).toContain('test_concept');
      expect(visualization).toContain('InheritanceLink');
    });

    test('visualizes cognitive primitive', () => {
      const primitive: CognitivePrimitive = {
        id: 'test_primitive',
        name: 'test_perceive',
        type: PrimitiveType.PERCEPTION,
        tensor: TensorSignatureFactory.createSensorySignature(),
        atomspace_pattern: {
          nodes: [],
          links: [],
          variables: []
        },
        ml_primitive: {
          type: MLPrimitiveType.PATTERN_MATCH,
          parameters: { threshold: 0.5 },
          input_tensor: TensorSignatureFactory.createSensorySignature(),
          output_tensor: TensorSignatureFactory.createSensorySignature()
        }
      };

      const visualization = visualizer.visualizeCognitivePrimitive(primitive);

      expect(visualization).toContain('Cognitive Primitive: test_perceive');
      expect(visualization).toContain('Type: perception');
      expect(visualization).toContain('Tensor Signature:');
      expect(visualization).toContain('ML Primitive:');
    });

    test('visualizes tensor fragment', () => {
      const manager = new TensorFragmentManager();
      const signature = TensorSignatureFactory.createCognitiveSignature();
      const data = new Float32Array([1, 2, 3, 4, 5]);
      const fragment = manager.createFragment(signature, data, [5], 'test');

      const visualization = visualizer.visualizeTensorFragment(fragment);

      expect(visualization).toContain(`Tensor Fragment: ${fragment.id}`);
      expect(visualization).toContain('Signature:');
      expect(visualization).toContain('Shape: [5]');
      expect(visualization).toContain('Data Size: 5 elements');
      expect(visualization).toContain('Source: test');
    });
  });

  describe('Integration Tests', () => {
    test('end-to-end cognitive operation processing', async () => {
      // Create integrated system
      const tensorManager = new TensorFragmentManager();
      const grammarService = new CognitiveGrammarService(tensorManager);
      const translator = new HypergraphTranslator(tensorManager);
      const verifier = new HypergraphVerifier();
      
      await grammarService.start();

      try {
        // Process cognitive operation
        const result = await grammarService.processCognitiveOperation(
          '(reason (perceive visual_input) conclusion)',
          { visual_input: 'test_stimulus', conclusion: 'result' }
        );

        expect(result.result).toBeDefined();
        expect(result.primitives_used.length).toBeGreaterThan(0);

        // Get primitive and translate to hypergraph
        const primitives = grammarService.getAvailablePrimitives();
        const reasonPrimitive = primitives.find(p => p.name === 'reason');
        
        if (reasonPrimitive) {
          const pattern = translator.cognitivePrimitiveToHypergraph(reasonPrimitive);
          const verification = verifier.verifyPattern(pattern);
          
          expect(verification.valid).toBe(true);
          expect(pattern.nodes.length).toBeGreaterThan(0);
        }

      } finally {
        await grammarService.stop();
      }
    });

    test('bidirectional translation fidelity', () => {
      const translator = new HypergraphTranslator();
      const verifier = new HypergraphVerifier();
      
      // Create original ML primitive
      const originalML = {
        type: MLPrimitiveType.ATTENTION_MECHANISM,
        parameters: { 
          attention_dim: 64,
          num_heads: 8,
          dropout: 0.1 
        },
        input_tensor: TensorSignatureFactory.createCognitiveSignature(3, ContextType.WORKING, 0.7),
        output_tensor: TensorSignatureFactory.createCognitiveSignature(4, ContextType.WORKING, 0.8),
        weights: Array.from({length: 32}, (_, i) => Math.random()),
        bias: Array.from({length: 8}, (_, i) => Math.random() * 0.1)
      };

      // Translate to hypergraph and back
      const pattern = translator.mlPrimitiveToHypergraph(originalML);
      const reconstructedML = translator.hypergraphToMLPrimitive(pattern);

      // Verify translation quality
      const translationResult = verifier.verifyBidirectionalTranslation(
        originalML,
        pattern,
        reconstructedML
      );

      expect(translationResult.valid).toBe(true);
      expect(translationResult.fidelity).toBeGreaterThan(0.5);
      expect(translationResult.informationLoss).toBeLessThan(0.5);
    });

    test('tensor fragment lifecycle with hypergraph patterns', () => {
      const manager = new TensorFragmentManager();
      const translator = new HypergraphTranslator(manager);
      
      // Create cognitive primitive
      const primitive: CognitivePrimitive = {
        id: 'lifecycle_test',
        name: 'test_learning',
        type: PrimitiveType.LEARNING,
        tensor: TensorSignatureFactory.createCognitiveSignature(),
        atomspace_pattern: {
          nodes: [],
          links: [],
          variables: []
        },
        ml_primitive: {
          type: MLPrimitiveType.EMBEDDING,
          parameters: { embedding_dim: 128 },
          input_tensor: TensorSignatureFactory.createCognitiveSignature(),
          output_tensor: TensorSignatureFactory.createCognitiveSignature()
        }
      };

      // Translate to hypergraph
      const pattern = translator.cognitivePrimitiveToHypergraph(primitive);
      
      // Create tensor fragment from pattern
      const fragment = translator.createTensorFragmentFromPattern(pattern, manager);
      
      expect(fragment).toBeDefined();
      expect(fragment.data.length).toBeGreaterThan(0);
      expect(fragment.signature).toBeDefined();

      // Reconstruct pattern from tensor
      const reconstructedPattern = translator.reconstructPatternFromTensor(fragment);
      
      expect(reconstructedPattern.nodes.length).toBeGreaterThan(0);
      expect(reconstructedPattern.links.length).toBeGreaterThan(0);

      // Verify reconstruction quality
      const verifier = new HypergraphVerifier();
      const verification = verifier.verifyPattern(reconstructedPattern);
      
      expect(verification.valid).toBe(true);
    });
  });
});