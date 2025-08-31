#!/usr/bin/env ts-node

// Cognitive Primitives Demonstration Script
// Shows Phase 1 implementation in action

import {
  TensorSignatureFactory,
  TensorFragmentManager,
  SchemeCognitiveGrammar,
  HypergraphTranslator,
  HypergraphVerifier,
  CognitiveVisualizer,
  MLPrimitiveType,
  PrimitiveType,
  ContextType
} from './cognitive-core/shared-libraries';

console.log('🧬 Phase 1: Cognitive Primitives & Foundational Hypergraph Encoding');
console.log('====================================================================\n');

async function demonstrateCognitivePrimitives() {
  // 1. Create tensor signatures
  console.log('1. Creating Tensor Signatures [modality, depth, context, salience, autonomy_index]');
  console.log('--------------------------------------------------------------------------------');
  
  const sensorySignature = TensorSignatureFactory.createSensorySignature();
  const cognitiveSignature = TensorSignatureFactory.createCognitiveSignature(4, ContextType.WORKING, 0.7);
  const memorySignature = TensorSignatureFactory.createMemorySignature();
  
  console.log('Sensory Signature:', JSON.stringify(sensorySignature, null, 2));
  console.log('Cognitive Signature:', JSON.stringify(cognitiveSignature, null, 2));
  console.log('Memory Signature:', JSON.stringify(memorySignature, null, 2));
  console.log('');

  // 2. Create tensor fragments
  console.log('2. Creating Tensor Fragments');
  console.log('-----------------------------');
  
  const tensorManager = new TensorFragmentManager();
  
  const sensorData = new Float32Array([0.8, 0.6, 0.9, 0.7, 0.5]);
  const sensoryFragment = tensorManager.createFragment(
    sensorySignature,
    sensorData,
    [5],
    'environmental_sensor'
  );
  
  console.log(`Created sensory fragment: ${sensoryFragment.id}`);
  console.log(`Data: [${Array.from(sensorData).join(', ')}]`);
  console.log(`Dimensional Flow: ${sensoryFragment.metadata.dimensional_flow.triad} -> ${sensoryFragment.metadata.dimensional_flow.dimension}`);
  console.log('');

  // 3. Cognitive Grammar Operations
  console.log('3. Scheme Cognitive Grammar Operations');
  console.log('--------------------------------------');
  
  const grammar = new SchemeCognitiveGrammar(tensorManager);
  
  console.log('Available Cognitive Primitives:');
  const primitives = grammar.getCognitivePrimitives();
  primitives.slice(0, 4).forEach((primitive: any) => {
    console.log(`  - ${primitive.name} (${primitive.type}): ${primitive.tensor.modality} modality, depth ${primitive.tensor.depth}`);
  });
  console.log('');

  // 4. Hypergraph Translation
  console.log('4. ML Primitive to Hypergraph Translation');
  console.log('-----------------------------------------');
  
  const translator = new HypergraphTranslator(tensorManager);
  
  const mlPrimitive = {
    type: MLPrimitiveType.ATTENTION_MECHANISM,
    parameters: { attention_dim: 64, num_heads: 4 },
    input_tensor: cognitiveSignature,
    output_tensor: cognitiveSignature,
    weights: [0.1, 0.2, 0.3, 0.4],
    bias: [0.01, 0.02]
  };
  
  console.log('Original ML Primitive:', JSON.stringify(mlPrimitive, null, 2));
  
  const hypergraphPattern = translator.mlPrimitiveToHypergraph(mlPrimitive);
  console.log(`\nTranslated to Hypergraph: ${hypergraphPattern.nodes.length} nodes, ${hypergraphPattern.links.length} links`);
  
  // Translate back
  const reconstructedML = translator.hypergraphToMLPrimitive(hypergraphPattern);
  console.log('Reconstructed ML Primitive type:', reconstructedML.type);
  console.log('Parameters preserved:', Object.keys(reconstructedML.parameters).join(', '));
  console.log('');

  // 5. Verification and Visualization
  console.log('5. Pattern Verification');
  console.log('-----------------------');
  
  const verifier = new HypergraphVerifier();
  const verificationResult = verifier.verifyPattern(hypergraphPattern);
  
  console.log(`Pattern Valid: ${verificationResult.valid}`);
  console.log(`Overall Score: ${verificationResult.score.toFixed(3)}`);
  console.log(`Metrics:`);
  console.log(`  - Nodes: ${verificationResult.metrics.nodeCount}`);
  console.log(`  - Links: ${verificationResult.metrics.linkCount}`);
  console.log(`  - Tensor Consistency: ${verificationResult.metrics.tensorConsistency.toFixed(3)}`);
  console.log(`  - Structural Integrity: ${verificationResult.metrics.structuralIntegrity.toFixed(3)}`);
  
  if (verificationResult.warnings.length > 0) {
    console.log('Warnings:', verificationResult.warnings);
  }
  console.log('');

  // 6. Cognitive Primitive with Hypergraph
  console.log('6. Complete Cognitive Primitive Example');
  console.log('---------------------------------------');
  
  const perceptionPrimitive = grammar.getPrimitive('perceive');
  if (perceptionPrimitive) {
    const primitivePattern = translator.cognitivePrimitiveToHypergraph(perceptionPrimitive);
    const primitiveVerification = verifier.verifyCognitivePrimitive(perceptionPrimitive);
    
    console.log(`Cognitive Primitive: ${perceptionPrimitive.name}`);
    console.log(`Type: ${perceptionPrimitive.type}`);
    console.log(`Tensor: [${perceptionPrimitive.tensor.modality}, ${perceptionPrimitive.tensor.depth}, ${perceptionPrimitive.tensor.context}, ${perceptionPrimitive.tensor.salience.toFixed(2)}, ${perceptionPrimitive.tensor.autonomy_index.toFixed(2)}]`);
    console.log(`ML Mapping: ${perceptionPrimitive.ml_primitive.type}`);
    console.log(`Verification Score: ${primitiveVerification.overallScore.toFixed(3)}`);
    console.log(`Hypergraph Elements: ${primitivePattern.nodes.length} nodes, ${primitivePattern.links.length} links`);
  }
  console.log('');

  // 7. Tensor Fragment Operations
  console.log('7. Tensor Fragment Operations');
  console.log('-----------------------------');
  
  const cognitiveData = new Float32Array([0.9, 0.8, 0.7, 0.6]);
  const cognitiveFragment = tensorManager.createFragment(
    cognitiveSignature,
    cognitiveData,
    [4],
    'cognitive_processing'
  );

  // Transform through ML primitive
  const transformedFragment = tensorManager.transformFragment(cognitiveFragment.id, mlPrimitive);
  if (transformedFragment) {
    console.log(`Original fragment: ${cognitiveFragment.data.length} elements`);
    console.log(`Transformed fragment: ${transformedFragment.data.length} elements`);
    console.log(`Depth increased from ${cognitiveFragment.signature.depth} to ${transformedFragment.signature.depth}`);
    console.log(`Autonomy changed from ${cognitiveFragment.signature.autonomy_index.toFixed(3)} to ${transformedFragment.signature.autonomy_index.toFixed(3)}`);
  }

  // Merge fragments
  const mergedFragment = tensorManager.mergeFragments(
    [sensoryFragment.id, cognitiveFragment.id],
    'concatenate'
  );
  if (mergedFragment) {
    console.log(`Merged fragment: ${mergedFragment.data.length} elements (${sensoryFragment.data.length} + ${cognitiveFragment.data.length})`);
  }
  console.log('');

  // 8. Visualization
  console.log('8. Pattern Visualization (First 3 Nodes)');
  console.log('----------------------------------------');
  
  const visualizer = new CognitiveVisualizer();
  if (hypergraphPattern.nodes.length > 0) {
    const limitedPattern = {
      nodes: hypergraphPattern.nodes.slice(0, 3),
      links: hypergraphPattern.links.slice(0, 2),
      variables: []
    };
    const visualization = visualizer.visualizeHypergraphPattern(limitedPattern);
    console.log(visualization.substring(0, 800) + '...\n');
  }

  console.log('🎉 Phase 1 Demonstration Complete!');
  console.log('===================================');
  console.log('Key Achievements:');
  console.log('✅ Tensor signatures with 5-dimensional encoding');
  console.log('✅ Cognitive primitives with ML mappings');
  console.log('✅ Bidirectional hypergraph translation'); 
  console.log('✅ Pattern verification and quality metrics');
  console.log('✅ Tensor fragment processing pipeline');
  console.log('✅ Integration with triadic dimensional flows');
}

// Run the demonstration
demonstrateCognitivePrimitives().catch(console.error);