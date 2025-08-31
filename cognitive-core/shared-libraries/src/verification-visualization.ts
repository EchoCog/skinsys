// Verification & Visualization Tools
// Tools to verify hypergraph patterns and visualize cognitive primitives

import {
  HypergraphPattern,
  AtomNode,
  AtomLink,
  CognitivePrimitive,
  TensorSignature,
  MLPrimitive,
  TruthValue,
  AttentionValue
} from './cognitive-primitives';
import { TensorFragment, TensorFragmentManager } from './tensor-fragment-architecture';
import { HypergraphTranslator } from './hypergraph-translator';

/**
 * Hypergraph Pattern Verifier
 */
export class HypergraphVerifier {
  private translator: HypergraphTranslator;

  constructor() {
    this.translator = new HypergraphTranslator();
  }

  /**
   * Comprehensive verification of hypergraph pattern
   */
  verifyPattern(pattern: HypergraphPattern): VerificationResult {
    const result: VerificationResult = {
      valid: true,
      score: 0,
      errors: [],
      warnings: [],
      metrics: {
        nodeCount: pattern.nodes.length,
        linkCount: pattern.links.length,
        variableCount: pattern.variables.length,
        avgTruthValue: 0,
        avgAttentionValue: 0,
        tensorConsistency: 0,
        semanticCoherence: 0,
        structuralIntegrity: 0
      }
    };

    // Basic structural verification
    this.verifyStructure(pattern, result);
    
    // Semantic verification
    this.verifySemantics(pattern, result);
    
    // Tensor consistency verification
    this.verifyTensorConsistency(pattern, result);
    
    // Truth value verification
    this.verifyTruthValues(pattern, result);
    
    // Attention value verification
    this.verifyAttentionValues(pattern, result);
    
    // Calculate overall score
    this.calculateOverallScore(result);

    return result;
  }

  /**
   * Verify cognitive primitive consistency
   */
  verifyCognitivePrimitive(primitive: CognitivePrimitive): PrimitiveVerificationResult {
    const result: PrimitiveVerificationResult = {
      valid: true,
      errors: [],
      warnings: [],
      tensorConsistency: 0,
      mlMappingAccuracy: 0,
      hypergraphIntegrity: 0,
      overallScore: 0
    };

    // Verify tensor signature
    this.verifyTensorSignature(primitive.tensor, result);
    
    // Verify ML primitive mapping
    this.verifyMLPrimitiveMapping(primitive, result);
    
    // Verify hypergraph pattern
    if (primitive.atomspace_pattern) {
      const patternResult = this.verifyPattern(primitive.atomspace_pattern);
      result.hypergraphIntegrity = patternResult.score;
      
      // Check consistency between primitive and pattern
      this.verifyPrimitivePatternConsistency(primitive, result);
    }

    // Calculate scores
    result.tensorConsistency = this.calculateTensorConsistencyScore(primitive.tensor);
    result.mlMappingAccuracy = this.calculateMLMappingScore(primitive);
    result.overallScore = (result.tensorConsistency + result.mlMappingAccuracy + result.hypergraphIntegrity) / 3;
    result.valid = result.errors.length === 0 && result.overallScore > 0.5;

    return result;
  }

  /**
   * Verify bidirectional translation consistency
   */
  verifyBidirectionalTranslation(
    originalML: MLPrimitive,
    translatedPattern: HypergraphPattern,
    reconstructedML: MLPrimitive
  ): TranslationVerificationResult {
    const result: TranslationVerificationResult = {
      valid: true,
      errors: [],
      warnings: [],
      fidelity: 0,
      informationLoss: 0,
      translationAccuracy: 0
    };

    // Compare original and reconstructed ML primitives
    this.compareMLPrimitives(originalML, reconstructedML, result);
    
    // Verify pattern validity
    const patternResult = this.verifyPattern(translatedPattern);
    if (!patternResult.valid) {
      result.errors.push('Translated hypergraph pattern is invalid');
      result.valid = false;
    }

    // Calculate metrics
    result.fidelity = this.calculateTranslationFidelity(originalML, reconstructedML);
    result.informationLoss = 1 - result.fidelity;
    result.translationAccuracy = patternResult.score;

    return result;
  }

  // Private verification methods

  private verifyStructure(pattern: HypergraphPattern, result: VerificationResult): void {
    // Check node uniqueness
    const nodeIds = new Set<string>();
    pattern.nodes.forEach((node, index) => {
      if (nodeIds.has(node.id)) {
        result.errors.push(`Duplicate node ID: ${node.id} at index ${index}`);
        result.valid = false;
      }
      nodeIds.add(node.id);
    });

    // Check link connectivity
    pattern.links.forEach((link, index) => {
      if (link.outgoing.length === 0) {
        result.warnings.push(`Link ${link.id} at index ${index} has no outgoing connections`);
      }

      link.outgoing.forEach(nodeId => {
        if (!nodeIds.has(nodeId)) {
          result.errors.push(`Link ${link.id} references non-existent node: ${nodeId}`);
          result.valid = false;
        }
      });
    });

    // Calculate structural integrity
    const totalConnections = pattern.links.reduce((sum, link) => sum + link.outgoing.length, 0);
    const avgConnections = totalConnections / Math.max(pattern.nodes.length, 1);
    result.metrics.structuralIntegrity = Math.min(1.0, avgConnections / 3.0); // Normalize assuming 3 is good connectivity
  }

  private verifySemantics(pattern: HypergraphPattern, result: VerificationResult): void {
    // Check for semantic consistency
    let semanticScore = 0;
    let totalChecks = 0;

    // Verify inheritance relationships
    const inheritanceLinks = pattern.links.filter(link => link.type === 'InheritanceLink');
    inheritanceLinks.forEach(link => {
      if (link.outgoing.length >= 2) {
        const childNode = pattern.nodes.find(n => n.id === link.outgoing[0]);
        const parentNode = pattern.nodes.find(n => n.id === link.outgoing[1]);
        
        if (childNode && parentNode) {
          // Check if inheritance makes semantic sense
          if (this.isValidInheritance(childNode, parentNode)) {
            semanticScore += 1;
          }
          totalChecks += 1;
        }
      }
    });

    result.metrics.semanticCoherence = totalChecks > 0 ? semanticScore / totalChecks : 0.5;
  }

  private verifyTensorConsistency(pattern: HypergraphPattern, result: VerificationResult): void {
    if (pattern.nodes.length === 0) {
      result.metrics.tensorConsistency = 0;
      return;
    }

    const signatures = [...pattern.nodes, ...pattern.links].map(item => item.tensor);
    
    // Check modality consistency
    const modalities = signatures.map(sig => sig.modality);
    const uniqueModalities = new Set(modalities);
    const modalityConsistency = 1 - (uniqueModalities.size - 1) / modalities.length;

    // Check depth consistency
    const depths = signatures.map(sig => sig.depth);
    const avgDepth = depths.reduce((sum, d) => sum + d, 0) / depths.length;
    const depthVariance = depths.reduce((sum, d) => sum + Math.pow(d - avgDepth, 2), 0) / depths.length;
    const depthConsistency = Math.max(0, 1 - depthVariance / 10); // Normalize variance

    // Check salience and autonomy consistency
    const saliences = signatures.map(sig => sig.salience);
    const autonomies = signatures.map(sig => sig.autonomy_index);
    
    const salienceStd = this.calculateStandardDeviation(saliences);
    const autonomyStd = this.calculateStandardDeviation(autonomies);
    
    const salienceConsistency = Math.max(0, 1 - salienceStd * 2);
    const autonomyConsistency = Math.max(0, 1 - autonomyStd * 2);

    result.metrics.tensorConsistency = (modalityConsistency + depthConsistency + salienceConsistency + autonomyConsistency) / 4;

    if (result.metrics.tensorConsistency < 0.3) {
      result.warnings.push('Low tensor signature consistency across pattern elements');
    }
  }

  private verifyTruthValues(pattern: HypergraphPattern, result: VerificationResult): void {
    const allElements = [...pattern.nodes, ...pattern.links];
    let totalTruthValue = 0;
    let invalidCount = 0;

    allElements.forEach((element, index) => {
      const tv = element.truthValue;
      
      if (tv.strength < 0 || tv.strength > 1) {
        result.errors.push(`Invalid truth value strength ${tv.strength} for element ${index}`);
        result.valid = false;
        invalidCount++;
      }
      
      if (tv.confidence < 0 || tv.confidence > 1) {
        result.errors.push(`Invalid truth value confidence ${tv.confidence} for element ${index}`);
        result.valid = false;
        invalidCount++;
      }
      
      if (tv.strength >= 0 && tv.strength <= 1 && tv.confidence >= 0 && tv.confidence <= 1) {
        totalTruthValue += tv.strength * tv.confidence;
      }
    });

    result.metrics.avgTruthValue = allElements.length > 0 ? totalTruthValue / allElements.length : 0;
  }

  private verifyAttentionValues(pattern: HypergraphPattern, result: VerificationResult): void {
    const allElements = [...pattern.nodes, ...pattern.links];
    let totalAttention = 0;

    allElements.forEach(element => {
      const av = element.attentionValue;
      totalAttention += Math.max(0, av.sti) + Math.max(0, av.lti) + Math.max(0, av.vlti);
    });

    result.metrics.avgAttentionValue = allElements.length > 0 ? totalAttention / (allElements.length * 3) : 0;
  }

  private calculateOverallScore(result: VerificationResult): void {
    const metrics = result.metrics;
    const weights = {
      structural: 0.25,
      semantic: 0.20,
      tensor: 0.20,
      truth: 0.15,
      attention: 0.10,
      size: 0.10
    };

    const sizeScore = Math.min(1.0, (metrics.nodeCount + metrics.linkCount) / 20); // Normalize to reasonable size
    
    result.score = (
      metrics.structuralIntegrity * weights.structural +
      metrics.semanticCoherence * weights.semantic +
      metrics.tensorConsistency * weights.tensor +
      metrics.avgTruthValue * weights.truth +
      (metrics.avgAttentionValue / 100) * weights.attention +
      sizeScore * weights.size
    );

    if (result.errors.length > 0) {
      result.score *= 0.5; // Penalize errors
    }
  }

  private verifyTensorSignature(tensor: TensorSignature, result: PrimitiveVerificationResult): void {
    if (tensor.depth < 0 || tensor.depth > 9) {
      result.errors.push(`Invalid tensor depth: ${tensor.depth} (must be 0-9)`);
      result.valid = false;
    }

    if (tensor.salience < 0 || tensor.salience > 1) {
      result.errors.push(`Invalid salience: ${tensor.salience} (must be 0.0-1.0)`);
      result.valid = false;
    }

    if (tensor.autonomy_index < 0 || tensor.autonomy_index > 1) {
      result.errors.push(`Invalid autonomy index: ${tensor.autonomy_index} (must be 0.0-1.0)`);
      result.valid = false;
    }
  }

  private verifyMLPrimitiveMapping(primitive: CognitivePrimitive, result: PrimitiveVerificationResult): void {
    const ml = primitive.ml_primitive;
    
    // Check input/output tensor compatibility
    if (!this.tensorsCompatible(ml.input_tensor, primitive.tensor)) {
      result.warnings.push('Input tensor not compatible with primitive tensor signature');
    }

    // Check parameter consistency
    if (ml.type === 'linear_transform' && (!ml.weights || ml.weights.length === 0)) {
      result.warnings.push('Linear transform primitive missing weights');
    }

    if (ml.type === 'attention_mechanism' && !ml.parameters.attention_weights) {
      result.warnings.push('Attention mechanism primitive missing attention weights');
    }
  }

  private verifyPrimitivePatternConsistency(primitive: CognitivePrimitive, result: PrimitiveVerificationResult): void {
    if (!primitive.atomspace_pattern) return;

    // Check if pattern contains nodes referencing the primitive
    const primitiveNodes = primitive.atomspace_pattern.nodes.filter(node => 
      node.name.includes(primitive.name) || node.name.includes(primitive.type)
    );

    if (primitiveNodes.length === 0) {
      result.warnings.push('Hypergraph pattern does not reference the cognitive primitive');
    }

    // Check tensor consistency between primitive and pattern
    const patternTensors = primitive.atomspace_pattern.nodes.map(n => n.tensor);
    const avgPatternTensor = this.averageTensorSignatures(patternTensors);
    
    if (!this.tensorsCompatible(primitive.tensor, avgPatternTensor)) {
      result.warnings.push('Tensor signature inconsistent between primitive and pattern');
    }
  }

  private compareMLPrimitives(original: MLPrimitive, reconstructed: MLPrimitive, result: TranslationVerificationResult): void {
    if (original.type !== reconstructed.type) {
      result.errors.push(`ML primitive type mismatch: ${original.type} vs ${reconstructed.type}`);
      result.valid = false;
    }

    // Compare parameters
    const originalParams = Object.keys(original.parameters);
    const reconstructedParams = Object.keys(reconstructed.parameters);
    
    const missingParams = originalParams.filter(p => !reconstructedParams.includes(p));
    const extraParams = reconstructedParams.filter(p => !originalParams.includes(p));
    
    if (missingParams.length > 0) {
      result.warnings.push(`Missing parameters in reconstruction: ${missingParams.join(', ')}`);
    }
    
    if (extraParams.length > 0) {
      result.warnings.push(`Extra parameters in reconstruction: ${extraParams.join(', ')}`);
    }

    // Compare weights and bias
    if (original.weights && !reconstructed.weights) {
      result.errors.push('Weights lost in translation');
      result.valid = false;
    }
    
    if (original.bias && !reconstructed.bias) {
      result.errors.push('Bias lost in translation');
      result.valid = false;
    }
  }

  private calculateTranslationFidelity(original: MLPrimitive, reconstructed: MLPrimitive): number {
    let fidelity = 0;
    let totalChecks = 0;

    // Type fidelity
    fidelity += original.type === reconstructed.type ? 1 : 0;
    totalChecks += 1;

    // Parameter fidelity
    const originalParams = Object.keys(original.parameters);
    const reconstructedParams = Object.keys(reconstructed.parameters);
    
    if (originalParams.length > 0) {
      const commonParams = originalParams.filter(p => reconstructedParams.includes(p));
      fidelity += commonParams.length / originalParams.length;
      totalChecks += 1;
    }

    // Weights fidelity
    if (original.weights && reconstructed.weights) {
      const minLength = Math.min(original.weights.length, reconstructed.weights.length);
      let weightSimilarity = 0;
      for (let i = 0; i < minLength; i++) {
        const diff = Math.abs(original.weights[i] - reconstructed.weights[i]);
        weightSimilarity += Math.max(0, 1 - diff);
      }
      fidelity += minLength > 0 ? weightSimilarity / minLength : 0;
      totalChecks += 1;
    } else if (!original.weights && !reconstructed.weights) {
      fidelity += 1; // Both have no weights
      totalChecks += 1;
    } else {
      totalChecks += 1; // One has weights, other doesn't - 0 contribution
    }

    return totalChecks > 0 ? fidelity / totalChecks : 0;
  }

  private calculateTensorConsistencyScore(tensor: TensorSignature): number {
    let score = 0;
    let checks = 0;

    // Depth appropriateness
    if (tensor.depth >= 0 && tensor.depth <= 9) {
      score += 1;
    }
    checks += 1;

    // Salience range
    if (tensor.salience >= 0 && tensor.salience <= 1) {
      score += 1;
    }
    checks += 1;

    // Autonomy range
    if (tensor.autonomy_index >= 0 && tensor.autonomy_index <= 1) {
      score += 1;
    }
    checks += 1;

    // Modality-context consistency
    if (this.isModalityContextConsistent(tensor.modality, tensor.context)) {
      score += 1;
    }
    checks += 1;

    return checks > 0 ? score / checks : 0;
  }

  private calculateMLMappingScore(primitive: CognitivePrimitive): number {
    const ml = primitive.ml_primitive;
    let score = 0;
    let checks = 0;

    // Type appropriateness
    if (this.isMLTypeAppropriate(primitive.type, ml.type)) {
      score += 1;
    }
    checks += 1;

    // Parameter completeness
    if (this.hasRequiredParameters(ml)) {
      score += 1;
    }
    checks += 1;

    // Tensor compatibility
    if (this.tensorsCompatible(ml.input_tensor, primitive.tensor)) {
      score += 1;
    }
    checks += 1;

    return checks > 0 ? score / checks : 0;
  }

  // Helper methods

  private isValidInheritance(child: AtomNode, parent: AtomNode): boolean {
    // Simple heuristic: names should have some relationship
    return child.name.includes(parent.name) || parent.name.includes('type') || parent.name.includes('concept');
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private tensorsCompatible(tensor1: TensorSignature, tensor2: TensorSignature): boolean {
    return (
      tensor1.modality === tensor2.modality &&
      Math.abs(tensor1.depth - tensor2.depth) <= 2 &&
      tensor1.context === tensor2.context
    );
  }

  private averageTensorSignatures(signatures: TensorSignature[]): TensorSignature {
    if (signatures.length === 0) {
      throw new Error('Cannot average empty signature list');
    }
    
    const avgDepth = signatures.reduce((sum, sig) => sum + sig.depth, 0) / signatures.length;
    const avgSalience = signatures.reduce((sum, sig) => sum + sig.salience, 0) / signatures.length;
    const avgAutonomy = signatures.reduce((sum, sig) => sum + sig.autonomy_index, 0) / signatures.length;

    return {
      modality: signatures[0].modality,
      depth: Math.round(avgDepth),
      context: signatures[0].context,
      salience: avgSalience,
      autonomy_index: avgAutonomy
    };
  }

  private isModalityContextConsistent(modality: any, context: any): boolean {
    // Heuristic rules for modality-context consistency
    if (modality === 'sensory' && context === 'immediate') return true;
    if (modality === 'memory' && (context === 'long_term' || context === 'episodic')) return true;
    if (modality === 'cognitive' && context === 'working') return true;
    return false; // Default to requiring explicit consistency
  }

  private isMLTypeAppropriate(primitiveType: any, mlType: any): boolean {
    const mapping: Record<string, string[]> = {
      'perception': ['pattern_match', 'convolution'],
      'attention': ['attention_mechanism'],
      'memory': ['memory_access', 'embedding'],
      'reasoning': ['linear_transform'],
      'planning': ['temporal_sequence'],
      'execution': ['activation'],
      'learning': ['embedding', 'linear_transform'],
      'evaluation': ['linear_transform', 'activation']
    };

    return mapping[primitiveType]?.includes(mlType) || false;
  }

  private hasRequiredParameters(ml: MLPrimitive): boolean {
    switch (ml.type) {
      case 'linear_transform':
        return ml.weights !== undefined;
      case 'attention_mechanism':
        return ml.parameters.attention_weights !== undefined;
      case 'convolution':
        return ml.parameters.kernel_size !== undefined;
      default:
        return true; // No specific requirements for other types
    }
  }
}

/**
 * Cognitive Primitive Visualizer
 */
export class CognitiveVisualizer {
  /**
   * Generate text-based visualization of hypergraph pattern
   */
  visualizeHypergraphPattern(pattern: HypergraphPattern): string {
    let output = 'Hypergraph Pattern Visualization\n';
    output += '=====================================\n\n';

    // Nodes section
    output += 'NODES:\n';
    output += '------\n';
    pattern.nodes.forEach((node, index) => {
      output += `${index + 1}. [${node.type}] ${node.name} (${node.id})\n`;
      output += `   Truth: (${node.truthValue.strength.toFixed(2)}, ${node.truthValue.confidence.toFixed(2)})\n`;
      output += `   Attention: STI=${node.attentionValue.sti}, LTI=${node.attentionValue.lti}\n`;
      output += `   Tensor: ${this.formatTensorSignature(node.tensor)}\n\n`;
    });

    // Links section
    output += 'LINKS:\n';
    output += '------\n';
    pattern.links.forEach((link, index) => {
      output += `${index + 1}. [${link.type}] ${link.id}\n`;
      output += `   Connects: ${link.outgoing.join(' -> ')}\n`;
      output += `   Truth: (${link.truthValue.strength.toFixed(2)}, ${link.truthValue.confidence.toFixed(2)})\n`;
      output += `   Tensor: ${this.formatTensorSignature(link.tensor)}\n\n`;
    });

    // Variables section
    if (pattern.variables.length > 0) {
      output += 'VARIABLES:\n';
      output += '----------\n';
      pattern.variables.forEach((variable, index) => {
        output += `${index + 1}. ${variable.variable} : ${variable.type}\n`;
        output += `   Constraints: ${variable.constraints.map(c => `${c.type} ${c.operator} ${c.value}`).join(', ')}\n\n`;
      });
    }

    return output;
  }

  /**
   * Generate ASCII art diagram of hypergraph pattern
   */
  generateASCIIDiagram(pattern: HypergraphPattern): string {
    let output = 'Hypergraph ASCII Diagram\n';
    output += '========================\n\n';

    // Simple node representation
    const nodeReprs = pattern.nodes.map(node => {
      const shortName = node.name.length > 8 ? node.name.substring(0, 8) + '...' : node.name;
      return `[${shortName}]`;
    });

    // Layout nodes in a grid
    const nodesPerRow = Math.ceil(Math.sqrt(pattern.nodes.length));
    for (let i = 0; i < pattern.nodes.length; i += nodesPerRow) {
      const row = nodeReprs.slice(i, i + nodesPerRow);
      output += row.join('  ') + '\n';
      
      // Add connection indicators for links
      if (i + nodesPerRow < pattern.nodes.length) {
        output += '    |    '.repeat(row.length) + '\n';
      }
    }

    output += '\nConnections:\n';
    pattern.links.forEach((link, index) => {
      const sourceNames = link.outgoing.map(id => {
        const node = pattern.nodes.find(n => n.id === id);
        return node ? node.name : 'unknown';
      });
      output += `${index + 1}. ${link.type}: ${sourceNames.join(' -> ')}\n`;
    });

    return output;
  }

  /**
   * Generate visualization of cognitive primitive
   */
  visualizeCognitivePrimitive(primitive: CognitivePrimitive): string {
    let output = `Cognitive Primitive: ${primitive.name}\n`;
    output += '=====================================\n\n';

    output += `Type: ${primitive.type}\n`;
    output += `ID: ${primitive.id}\n\n`;

    output += 'Tensor Signature:\n';
    output += '-----------------\n';
    output += this.formatTensorSignature(primitive.tensor, true) + '\n\n';

    output += 'ML Primitive:\n';
    output += '-------------\n';
    output += this.formatMLPrimitive(primitive.ml_primitive) + '\n\n';

    if (primitive.atomspace_pattern) {
      output += 'AtomSpace Pattern:\n';
      output += '------------------\n';
      output += this.visualizeHypergraphPattern(primitive.atomspace_pattern);
    }

    return output;
  }

  /**
   * Generate tensor fragment visualization
   */
  visualizeTensorFragment(fragment: TensorFragment): string {
    let output = `Tensor Fragment: ${fragment.id}\n`;
    output += '================================\n\n';

    output += 'Signature:\n';
    output += '----------\n';
    output += this.formatTensorSignature(fragment.signature, true) + '\n\n';

    output += 'Shape: [' + fragment.shape.join(', ') + ']\n';
    output += `Data Size: ${fragment.data.length} elements\n\n`;

    output += 'Metadata:\n';
    output += '---------\n';
    output += `Created: ${new Date(fragment.metadata.creation_time).toISOString()}\n`;
    output += `Updated: ${new Date(fragment.metadata.last_updated).toISOString()}\n`;
    output += `Source: ${fragment.metadata.source_primitive}\n`;
    output += `Related Atoms: ${fragment.metadata.related_atoms.length}\n`;
    output += 'Dimensional Flow:\n';
    output += `  Triad: ${fragment.metadata.dimensional_flow.triad}\n`;
    output += `  Dimension: ${fragment.metadata.dimensional_flow.dimension}\n`;
    output += `  Flow Pattern: ${fragment.metadata.dimensional_flow.flow_pattern}\n`;
    output += `  Position: ${fragment.metadata.dimensional_flow.position}\n\n`;

    // Data preview
    output += 'Data Preview (first 10 elements):\n';
    output += '----------------------------------\n';
    const preview = fragment.data.slice(0, 10);
    output += '[' + Array.from(preview).map((v: number) => v.toFixed(4)).join(', ') + ']\n';
    if (fragment.data.length > 10) {
      output += `... and ${fragment.data.length - 10} more elements\n`;
    }

    return output;
  }

  /**
   * Generate verification result visualization
   */
  visualizeVerificationResult(result: VerificationResult): string {
    let output = 'Verification Result\n';
    output += '==================\n\n';

    output += `Overall Score: ${result.score.toFixed(3)}\n`;
    output += `Valid: ${result.valid ? '✓' : '✗'}\n\n`;

    if (result.errors.length > 0) {
      output += 'ERRORS:\n';
      output += '-------\n';
      result.errors.forEach((error, index) => {
        output += `${index + 1}. ❌ ${error}\n`;
      });
      output += '\n';
    }

    if (result.warnings.length > 0) {
      output += 'WARNINGS:\n';
      output += '---------\n';
      result.warnings.forEach((warning, index) => {
        output += `${index + 1}. ⚠️  ${warning}\n`;
      });
      output += '\n';
    }

    output += 'METRICS:\n';
    output += '--------\n';
    output += `Node Count: ${result.metrics.nodeCount}\n`;
    output += `Link Count: ${result.metrics.linkCount}\n`;
    output += `Variable Count: ${result.metrics.variableCount}\n`;
    output += `Avg Truth Value: ${result.metrics.avgTruthValue.toFixed(3)}\n`;
    output += `Avg Attention: ${result.metrics.avgAttentionValue.toFixed(3)}\n`;
    output += `Tensor Consistency: ${result.metrics.tensorConsistency.toFixed(3)}\n`;
    output += `Semantic Coherence: ${result.metrics.semanticCoherence.toFixed(3)}\n`;
    output += `Structural Integrity: ${result.metrics.structuralIntegrity.toFixed(3)}\n`;

    return output;
  }

  // Helper methods

  private formatTensorSignature(tensor: TensorSignature, detailed: boolean = false): string {
    if (detailed) {
      return `Modality: ${tensor.modality}\n` +
             `Depth: ${tensor.depth}\n` +
             `Context: ${tensor.context}\n` +
             `Salience: ${tensor.salience.toFixed(3)}\n` +
             `Autonomy: ${tensor.autonomy_index.toFixed(3)}`;
    }
    return `[${tensor.modality}, ${tensor.depth}, ${tensor.context}, ${tensor.salience.toFixed(2)}, ${tensor.autonomy_index.toFixed(2)}]`;
  }

  private formatMLPrimitive(ml: MLPrimitive): string {
    let output = `Type: ${ml.type}\n`;
    
    if (Object.keys(ml.parameters).length > 0) {
      output += 'Parameters:\n';
      Object.entries(ml.parameters).forEach(([key, value]) => {
        output += `  ${key}: ${JSON.stringify(value)}\n`;
      });
    }
    
    output += `Input Tensor: ${this.formatTensorSignature(ml.input_tensor)}\n`;
    output += `Output Tensor: ${this.formatTensorSignature(ml.output_tensor)}\n`;
    
    if (ml.weights) {
      output += `Weights: ${ml.weights.length} elements\n`;
    }
    
    if (ml.bias) {
      output += `Bias: ${ml.bias.length} elements\n`;
    }
    
    return output;
  }
}

// Type definitions for verification results

export interface VerificationResult {
  valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  metrics: {
    nodeCount: number;
    linkCount: number;
    variableCount: number;
    avgTruthValue: number;
    avgAttentionValue: number;
    tensorConsistency: number;
    semanticCoherence: number;
    structuralIntegrity: number;
  };
}

export interface PrimitiveVerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  tensorConsistency: number;
  mlMappingAccuracy: number;
  hypergraphIntegrity: number;
  overallScore: number;
}

export interface TranslationVerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fidelity: number;
  informationLoss: number;
  translationAccuracy: number;
}