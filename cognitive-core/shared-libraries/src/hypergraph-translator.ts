// Hypergraph Translation Layer
// Bidirectional translation between ML primitives and AtomSpace hypergraph patterns

import {
  AtomNode,
  AtomLink,
  AtomType,
  LinkType,
  HypergraphPattern,
  TruthValue,
  AttentionValue,
  MLPrimitive,
  MLPrimitiveType,
  TensorSignature,
  CognitivePrimitive,
  VariableBinding,
  PatternConstraint
} from './cognitive-primitives';
import { TensorFragment, TensorFragmentManager } from './tensor-fragment-architecture';

/**
 * Hypergraph Translation Engine
 * Provides bidirectional translation between ML primitives and AtomSpace patterns
 */
export class HypergraphTranslator {
  private atomIdCounter: number = 0;
  private tensorManager: TensorFragmentManager;

  constructor(tensorManager?: TensorFragmentManager) {
    this.tensorManager = tensorManager || new TensorFragmentManager();
  }

  /**
   * Translate ML primitive to AtomSpace hypergraph pattern
   */
  mlPrimitiveToHypergraph(mlPrimitive: MLPrimitive): HypergraphPattern {
    const nodes: AtomNode[] = [];
    const links: AtomLink[] = [];

    // Create main concept node for the ML primitive
    const mainNode = this.createAtomNode(
      AtomType.CONCEPT,
      `ml_primitive_${mlPrimitive.type}`,
      mlPrimitive.input_tensor,
      { strength: 0.9, confidence: 0.8 },
      { sti: 150, lti: 75, vlti: 15 }
    );
    nodes.push(mainNode);

    // Create parameter nodes
    Object.entries(mlPrimitive.parameters).forEach(([key, value]) => {
      const paramNode = this.createAtomNode(
        AtomType.CONCEPT,
        `param_${key}`,
        mlPrimitive.input_tensor,
        { strength: 0.7, confidence: 0.9 }
      );
      nodes.push(paramNode);

      const valueNode = this.createAtomNode(
        this.inferAtomTypeFromValue(value),
        `value_${JSON.stringify(value)}`,
        mlPrimitive.input_tensor,
        { strength: 0.8, confidence: 0.95 }
      );
      nodes.push(valueNode);

      // Create evaluation link for parameter-value relationship
      const evalLink = this.createAtomLink(
        LinkType.EVALUATION,
        [paramNode.id, mainNode.id, valueNode.id],
        mlPrimitive.input_tensor,
        { strength: 0.85, confidence: 0.9 }
      );
      links.push(evalLink);
    });

    // Create input/output tensor representation
    if (mlPrimitive.weights) {
      const weightsNode = this.createWeightsTensorNode(
        mlPrimitive.weights,
        mlPrimitive.input_tensor
      );
      nodes.push(weightsNode);

      const weightsLink = this.createAtomLink(
        LinkType.EVALUATION,
        [this.createAtomNode(AtomType.PREDICATE, 'has_weights', mlPrimitive.input_tensor).id, mainNode.id, weightsNode.id],
        mlPrimitive.input_tensor
      );
      links.push(weightsLink);
    }

    if (mlPrimitive.bias) {
      const biasNode = this.createBiasTensorNode(
        mlPrimitive.bias,
        mlPrimitive.input_tensor
      );
      nodes.push(biasNode);

      const biasLink = this.createAtomLink(
        LinkType.EVALUATION,
        [this.createAtomNode(AtomType.PREDICATE, 'has_bias', mlPrimitive.input_tensor).id, mainNode.id, biasNode.id],
        mlPrimitive.input_tensor
      );
      links.push(biasLink);
    }

    // Create type inheritance link
    const typeNode = this.createAtomNode(
      AtomType.CONCEPT,
      `ml_primitive_type`,
      mlPrimitive.input_tensor
    );
    nodes.push(typeNode);

    const inheritanceLink = this.createAtomLink(
      LinkType.INHERITANCE,
      [mainNode.id, typeNode.id],
      mlPrimitive.input_tensor,
      { strength: 0.95, confidence: 0.9 }
    );
    links.push(inheritanceLink);

    return {
      nodes: this.deduplicateNodes(nodes),
      links,
      variables: this.extractVariableBindings(mlPrimitive)
    };
  }

  /**
   * Translate AtomSpace hypergraph pattern to ML primitive
   */
  hypergraphToMLPrimitive(pattern: HypergraphPattern): MLPrimitive {
    // Find the main ML primitive concept node
    const mainNode = pattern.nodes.find(node => 
      node.name.startsWith('ml_primitive_') && node.type === AtomType.CONCEPT
    );

    if (!mainNode) {
      throw new Error('No ML primitive concept node found in hypergraph pattern');
    }

    // Extract ML primitive type
    const typeMatch = mainNode.name.match(/ml_primitive_(.+)/);
    const mlType = typeMatch ? typeMatch[1] as MLPrimitiveType : MLPrimitiveType.LINEAR_TRANSFORM;

    // Extract parameters from evaluation links
    const parameters: Record<string, any> = {};
    const evaluationLinks = pattern.links.filter(link => link.type === LinkType.EVALUATION);

    evaluationLinks.forEach(link => {
      if (link.outgoing.length >= 3) {
        const predicateNode = pattern.nodes.find(n => n.id === link.outgoing[0]);
        const valueNode = pattern.nodes.find(n => n.id === link.outgoing[2]);
        
        if (predicateNode && valueNode && predicateNode.name.startsWith('param_')) {
          const paramName = predicateNode.name.replace('param_', '');
          parameters[paramName] = this.parseValueFromNode(valueNode);
        }
      }
    });

    // Extract weights and bias
    let weights: number[] | undefined;
    let bias: number[] | undefined;

    const weightsNode = pattern.nodes.find(n => n.name.startsWith('weights_tensor_'));
    if (weightsNode) {
      weights = this.extractTensorDataFromNode(weightsNode);
    }

    const biasNode = pattern.nodes.find(n => n.name.startsWith('bias_tensor_'));
    if (biasNode) {
      bias = this.extractTensorDataFromNode(biasNode);
    }

    // Use tensor signature from main node
    const inputTensor = mainNode.tensor;
    const outputTensor = this.inferOutputTensor(inputTensor, mlType, parameters);

    return {
      type: mlType,
      parameters,
      input_tensor: inputTensor,
      output_tensor: outputTensor,
      weights,
      bias
    };
  }

  /**
   * Translate cognitive primitive to hypergraph pattern
   */
  cognitivePrimitiveToHypergraph(primitive: CognitivePrimitive): HypergraphPattern {
    // Use existing pattern if available
    if (primitive.atomspace_pattern) {
      return primitive.atomspace_pattern;
    }

    // Create pattern from ML primitive
    const mlPattern = this.mlPrimitiveToHypergraph(primitive.ml_primitive);
    
    // Add cognitive-specific nodes and links
    const cognitiveNode = this.createAtomNode(
      AtomType.CONCEPT,
      `cognitive_${primitive.name}`,
      primitive.tensor,
      { strength: 0.9, confidence: 0.85 },
      { sti: 200, lti: 100, vlti: 20 }
    );

    const typeNode = this.createAtomNode(
      AtomType.CONCEPT,
      `primitive_type_${primitive.type}`,
      primitive.tensor
    );

    // Create inheritance relationship
    const inheritanceLink = this.createAtomLink(
      LinkType.INHERITANCE,
      [cognitiveNode.id, typeNode.id],
      primitive.tensor,
      { strength: 0.95, confidence: 0.9 }
    );

    // Link cognitive primitive to ML primitive
    const mlNode = mlPattern.nodes[0];
    const implementationLink = this.createAtomLink(
      LinkType.EVALUATION,
      [
        this.createAtomNode(AtomType.PREDICATE, 'implements', primitive.tensor).id,
        cognitiveNode.id,
        mlNode.id
      ],
      primitive.tensor,
      { strength: 0.9, confidence: 0.8 }
    );

    return {
      nodes: [cognitiveNode, typeNode, ...mlPattern.nodes],
      links: [inheritanceLink, implementationLink, ...mlPattern.links],
      variables: mlPattern.variables
    };
  }

  /**
   * Translate hypergraph pattern back to cognitive primitive
   */
  hypergraphToCognitivePrimitive(pattern: HypergraphPattern): CognitivePrimitive {
    // Find cognitive concept node
    const cognitiveNode = pattern.nodes.find(node => 
      node.name.startsWith('cognitive_') && node.type === AtomType.CONCEPT
    );

    if (!cognitiveNode) {
      throw new Error('No cognitive concept node found in hypergraph pattern');
    }

    const name = cognitiveNode.name.replace('cognitive_', '');
    
    // Find type node through inheritance link
    const inheritanceLink = pattern.links.find(link => 
      link.type === LinkType.INHERITANCE && link.outgoing[0] === cognitiveNode.id
    );

    let primitiveType = 'reasoning'; // default
    if (inheritanceLink) {
      const typeNode = pattern.nodes.find(n => n.id === inheritanceLink.outgoing[1]);
      if (typeNode) {
        const typeMatch = typeNode.name.match(/primitive_type_(.+)/);
        if (typeMatch) {
          primitiveType = typeMatch[1];
        }
      }
    }

    // Find implementation link to ML primitive
    const implementationLink = pattern.links.find(link =>
      link.type === LinkType.EVALUATION && 
      link.outgoing.length >= 3 &&
      link.outgoing[1] === cognitiveNode.id
    );

    let mlPrimitive: MLPrimitive;
    if (implementationLink) {
      const mlNode = pattern.nodes.find(n => n.id === implementationLink.outgoing[2]);
      if (mlNode) {
        // Extract ML primitive from the pattern
        const mlPattern = this.extractMLPatternFromNode(mlNode, pattern);
        mlPrimitive = this.hypergraphToMLPrimitive(mlPattern);
      } else {
        mlPrimitive = this.createDefaultMLPrimitive(cognitiveNode.tensor);
      }
    } else {
      mlPrimitive = this.createDefaultMLPrimitive(cognitiveNode.tensor);
    }

    return {
      id: `primitive_${name}_${Date.now()}`,
      name,
      type: primitiveType as any,
      tensor: cognitiveNode.tensor,
      atomspace_pattern: pattern,
      ml_primitive: mlPrimitive
    };
  }

  /**
   * Create tensor fragment from hypergraph pattern
   */
  createTensorFragmentFromPattern(
    pattern: HypergraphPattern,
    fragmentManager?: TensorFragmentManager
  ): TensorFragment {
    const manager = fragmentManager || this.tensorManager;
    
    // Extract tensor signatures from nodes
    const signatures = pattern.nodes.map(node => node.tensor);
    
    // Create averaged tensor signature
    const avgSignature = this.averageTensorSignatures(signatures);
    
    // Encode pattern as tensor data
    const patternData = this.encodePatternAsTensor(pattern);
    
    return manager.createFragment(
      avgSignature,
      patternData,
      [patternData.length],
      'hypergraph_pattern'
    );
  }

  /**
   * Reconstruct hypergraph pattern from tensor fragment
   */
  reconstructPatternFromTensor(
    fragment: TensorFragment,
    nodeCount: number = 5,
    linkCount: number = 5
  ): HypergraphPattern {
    const data = fragment.data;
    const signature = fragment.signature;
    
    // Decode nodes from tensor data
    const nodes: AtomNode[] = [];
    const nodeDataSize = Math.floor(data.length / (nodeCount + linkCount));
    
    for (let i = 0; i < nodeCount; i++) {
      const start = i * nodeDataSize;
      const nodeData = data.slice(start, start + nodeDataSize);
      
      const node = this.decodeTensorDataToNode(nodeData, signature, i);
      nodes.push(node);
    }
    
    // Decode links from tensor data
    const links: AtomLink[] = [];
    const linkDataSize = nodeDataSize;
    
    for (let i = 0; i < linkCount; i++) {
      const start = (nodeCount + i) * linkDataSize;
      const linkData = data.slice(start, start + linkDataSize);
      
      const link = this.decodeTensorDataToLink(linkData, signature, nodes, i);
      links.push(link);
    }
    
    return {
      nodes: nodes.filter(n => n.name !== 'empty'),
      links: links.filter(l => l.outgoing.length > 0),
      variables: []
    };
  }

  /**
   * Validate hypergraph pattern consistency
   */
  validatePattern(pattern: HypergraphPattern): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check node uniqueness
    const nodeIds = new Set();
    pattern.nodes.forEach(node => {
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);
    });

    // Check link validity
    pattern.links.forEach((link, index) => {
      if (link.outgoing.length === 0) {
        warnings.push(`Link ${index} has no outgoing connections`);
      }
      
      link.outgoing.forEach(nodeId => {
        if (!nodeIds.has(nodeId)) {
          errors.push(`Link ${link.id} references non-existent node: ${nodeId}`);
        }
      });
    });

    // Check tensor signature consistency
    const signatures = [...pattern.nodes, ...pattern.links].map(item => item.tensor);
    if (signatures.length > 1) {
      const firstSig = signatures[0];
      const inconsistent = signatures.some(sig => 
        sig.modality !== firstSig.modality || 
        Math.abs(sig.depth - firstSig.depth) > 2
      );
      
      if (inconsistent) {
        warnings.push('Tensor signatures are inconsistent across pattern elements');
      }
    }

    // Check truth values
    [...pattern.nodes, ...pattern.links].forEach((item, index) => {
      const tv = item.truthValue;
      if (tv.strength < 0 || tv.strength > 1 || tv.confidence < 0 || tv.confidence > 1) {
        errors.push(`Invalid truth value range for item ${index}: strength=${tv.strength}, confidence=${tv.confidence}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Helper methods

  private createAtomNode(
    type: AtomType,
    name: string,
    tensor: TensorSignature,
    truthValue: TruthValue = { strength: 0.8, confidence: 0.7 },
    attentionValue: AttentionValue = { sti: 100, lti: 50, vlti: 10 }
  ): AtomNode {
    return {
      id: `atom_${this.atomIdCounter++}`,
      type,
      name,
      truthValue,
      attentionValue,
      tensor
    };
  }

  private createAtomLink(
    type: LinkType,
    outgoing: string[],
    tensor: TensorSignature,
    truthValue: TruthValue = { strength: 0.8, confidence: 0.7 },
    attentionValue: AttentionValue = { sti: 80, lti: 40, vlti: 5 }
  ): AtomLink {
    return {
      id: `link_${this.atomIdCounter++}`,
      type,
      outgoing,
      truthValue,
      attentionValue,
      tensor
    };
  }

  private inferAtomTypeFromValue(value: any): AtomType {
    if (typeof value === 'number') return AtomType.NUMBER;
    if (typeof value === 'string') return AtomType.CONCEPT;
    return AtomType.CONCEPT;
  }

  private createWeightsTensorNode(weights: number[], tensor: TensorSignature): AtomNode {
    return this.createAtomNode(
      AtomType.CONCEPT,
      `weights_tensor_${weights.length}`,
      tensor,
      { strength: 0.9, confidence: 0.95 }
    );
  }

  private createBiasTensorNode(bias: number[], tensor: TensorSignature): AtomNode {
    return this.createAtomNode(
      AtomType.CONCEPT,
      `bias_tensor_${bias.length}`,
      tensor,
      { strength: 0.9, confidence: 0.95 }
    );
  }

  private deduplicateNodes(nodes: AtomNode[]): AtomNode[] {
    const unique = new Map<string, AtomNode>();
    nodes.forEach(node => {
      const key = `${node.type}_${node.name}`;
      if (!unique.has(key)) {
        unique.set(key, node);
      }
    });
    return Array.from(unique.values());
  }

  private extractVariableBindings(mlPrimitive: MLPrimitive): VariableBinding[] {
    const bindings: VariableBinding[] = [];
    
    // Create variable bindings for dynamic parameters
    Object.keys(mlPrimitive.parameters).forEach(param => {
      bindings.push({
        variable: `?${param}`,
        type: AtomType.VARIABLE,
        constraints: [{
          type: 'type',
          operator: 'equals',
          value: this.inferAtomTypeFromValue(mlPrimitive.parameters[param])
        }]
      });
    });
    
    return bindings;
  }

  private parseValueFromNode(node: AtomNode): any {
    if (node.type === AtomType.NUMBER) {
      const match = node.name.match(/value_(.+)/);
      return match ? JSON.parse(match[1]) : 0;
    }
    return node.name.replace('value_', '');
  }

  private extractTensorDataFromNode(node: AtomNode): number[] {
    // This would extract actual tensor data from the node
    // For now, return empty array as placeholder
    return [];
  }

  private inferOutputTensor(
    inputTensor: TensorSignature, 
    mlType: MLPrimitiveType, 
    parameters: Record<string, any>
  ): TensorSignature {
    // Create output tensor based on transformation
    return {
      ...inputTensor,
      depth: Math.min(9, inputTensor.depth + 1)
    };
  }

  private extractMLPatternFromNode(mlNode: AtomNode, pattern: HypergraphPattern): HypergraphPattern {
    // Extract sub-pattern containing only ML-related nodes and links
    const mlNodes = pattern.nodes.filter(node => 
      node.name.includes('ml_primitive') || 
      node.name.includes('param_') ||
      node.name.includes('value_') ||
      node.name.includes('tensor_')
    );
    
    const mlNodeIds = new Set(mlNodes.map(n => n.id));
    const mlLinks = pattern.links.filter(link => 
      link.outgoing.some(id => mlNodeIds.has(id))
    );
    
    return {
      nodes: mlNodes,
      links: mlLinks,
      variables: pattern.variables
    };
  }

  private createDefaultMLPrimitive(tensor: TensorSignature): MLPrimitive {
    return {
      type: MLPrimitiveType.LINEAR_TRANSFORM,
      parameters: {},
      input_tensor: tensor,
      output_tensor: tensor
    };
  }

  private averageTensorSignatures(signatures: TensorSignature[]): TensorSignature {
    if (signatures.length === 0) {
      throw new Error('Cannot average empty signature list');
    }
    
    if (signatures.length === 1) {
      return signatures[0];
    }

    const avgDepth = signatures.reduce((sum, sig) => sum + sig.depth, 0) / signatures.length;
    const avgSalience = signatures.reduce((sum, sig) => sum + sig.salience, 0) / signatures.length;
    const avgAutonomy = signatures.reduce((sum, sig) => sum + sig.autonomy_index, 0) / signatures.length;

    return {
      modality: signatures[0].modality, // Use first modality
      depth: Math.round(avgDepth),
      context: signatures[0].context, // Use first context
      salience: avgSalience,
      autonomy_index: avgAutonomy
    };
  }

  private encodePatternAsTensor(pattern: HypergraphPattern): Float32Array {
    // Encode nodes and links as numerical tensor data
    const nodeCount = pattern.nodes.length;
    const linkCount = pattern.links.length;
    const totalSize = (nodeCount + linkCount) * 8; // 8 values per element
    
    const data = new Float32Array(totalSize);
    let offset = 0;

    // Encode nodes
    pattern.nodes.forEach(node => {
      data[offset++] = this.encodeAtomType(node.type);
      data[offset++] = this.hashString(node.name);
      data[offset++] = node.truthValue.strength;
      data[offset++] = node.truthValue.confidence;
      data[offset++] = node.tensor.depth;
      data[offset++] = node.tensor.salience;
      data[offset++] = node.tensor.autonomy_index;
      data[offset++] = this.encodeModality(node.tensor.modality);
    });

    // Encode links
    pattern.links.forEach(link => {
      data[offset++] = this.encodeLinkType(link.type);
      data[offset++] = link.outgoing.length;
      data[offset++] = link.truthValue.strength;
      data[offset++] = link.truthValue.confidence;
      data[offset++] = link.tensor.depth;
      data[offset++] = link.tensor.salience;
      data[offset++] = link.tensor.autonomy_index;
      data[offset++] = this.encodeModality(link.tensor.modality);
    });

    return data;
  }

  private decodeTensorDataToNode(data: Float32Array, signature: TensorSignature, index: number): AtomNode {
    if (data.length < 8) {
      return this.createAtomNode(AtomType.CONCEPT, 'empty', signature);
    }

    const type = this.decodeAtomType(data[0]);
    const nameHash = data[1];
    const strength = data[2];
    const confidence = data[3];
    const depth = data[4];
    const salience = data[5];
    const autonomy = data[6];
    const modality = this.decodeModality(data[7]);

    const nodeSignature: TensorSignature = {
      ...signature,
      depth: Math.round(depth),
      salience,
      autonomy_index: autonomy,
      modality
    };

    return this.createAtomNode(
      type,
      `decoded_node_${index}_${nameHash.toFixed(0)}`,
      nodeSignature,
      { strength, confidence }
    );
  }

  private decodeTensorDataToLink(
    data: Float32Array, 
    signature: TensorSignature, 
    nodes: AtomNode[], 
    index: number
  ): AtomLink {
    if (data.length < 8) {
      return this.createAtomLink(LinkType.LIST, [], signature);
    }

    const type = this.decodeLinkType(data[0]);
    const outgoingCount = Math.round(data[1]);
    const strength = data[2];
    const confidence = data[3];

    // Create outgoing connections to available nodes
    const outgoing = nodes.slice(0, Math.min(outgoingCount, nodes.length)).map(n => n.id);

    return this.createAtomLink(
      type,
      outgoing,
      signature,
      { strength, confidence }
    );
  }

  private encodeAtomType(type: AtomType): number {
    const mapping = {
      [AtomType.CONCEPT]: 1,
      [AtomType.PREDICATE]: 2,
      [AtomType.SCHEMA]: 3,
      [AtomType.NUMBER]: 4,
      [AtomType.VARIABLE]: 5,
      [AtomType.GROUNDED_SCHEMA]: 6
    };
    return mapping[type] || 1;
  }

  private decodeAtomType(value: number): AtomType {
    const mapping: { [key: number]: AtomType } = {
      1: AtomType.CONCEPT,
      2: AtomType.PREDICATE,
      3: AtomType.SCHEMA,
      4: AtomType.NUMBER,
      5: AtomType.VARIABLE,
      6: AtomType.GROUNDED_SCHEMA
    };
    return mapping[Math.round(value)] || AtomType.CONCEPT;
  }

  private encodeLinkType(type: LinkType): number {
    const mapping = {
      [LinkType.INHERITANCE]: 1,
      [LinkType.SIMILARITY]: 2,
      [LinkType.EVALUATION]: 3,
      [LinkType.IMPLICATION]: 4,
      [LinkType.LIST]: 5,
      [LinkType.AND]: 6,
      [LinkType.OR]: 7,
      [LinkType.EXECUTION]: 8
    };
    return mapping[type] || 5;
  }

  private decodeLinkType(value: number): LinkType {
    const mapping: { [key: number]: LinkType } = {
      1: LinkType.INHERITANCE,
      2: LinkType.SIMILARITY,
      3: LinkType.EVALUATION,
      4: LinkType.IMPLICATION,
      5: LinkType.LIST,
      6: LinkType.AND,
      7: LinkType.OR,
      8: LinkType.EXECUTION
    };
    return mapping[Math.round(value)] || LinkType.LIST;
  }

  private encodeModality(modality: any): number {
    // Simple hash for modality string
    return this.hashString(modality.toString()) % 256;
  }

  private decodeModality(value: number): any {
    // This is a simplification - in reality would need reverse mapping
    return 'cognitive';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 1000000; // Normalize to reasonable range
  }
}