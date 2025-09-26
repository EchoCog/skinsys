// Tensor Fragment Architecture
// Implements tensor signature [modality, depth, context, salience, autonomy_index]

import { 
  TensorSignature, 
  TensorFragment, 
  TensorMetadata, 
  MLPrimitive, 
  MLPrimitiveType, 
  DimensionalFlow,
  ModalityType,
  ContextType,
  AttentionValue
} from './cognitive-primitives';
import { 
  ECANTensorSignature, 
  ECANKernel,
  ActivationNode 
} from './ecan-kernel';

// Re-export TensorFragment for use in other modules
export { TensorFragment, TensorMetadata } from './cognitive-primitives';

/**
 * Tensor Fragment Manager for cognitive state processing with ECAN integration
 */
export class TensorFragmentManager {
  private fragments: Map<string, TensorFragment> = new Map();
  private fragmentHistory: Map<string, TensorFragment[]> = new Map();
  private ecanKernel?: ECANKernel;
  private attentionAllocations: Map<string, AttentionValue> = new Map();

  constructor(ecanKernel?: ECANKernel) {
    this.ecanKernel = ecanKernel;
  }

  /**
   * Create a new tensor fragment with the specified signature
   */
  createFragment(
    signature: TensorSignature, 
    data: Float32Array, 
    shape: number[],
    sourcePrimitive: string = 'unknown',
    dimensionalFlow?: DimensionalFlow
  ): TensorFragment {
    const id = this.generateFragmentId(signature);
    
    const metadata: TensorMetadata = {
      creation_time: Date.now(),
      last_updated: Date.now(),
      source_primitive: sourcePrimitive,
      related_atoms: [],
      dimensional_flow: dimensionalFlow || this.inferDimensionalFlow(signature)
    };

    const fragment: TensorFragment = {
      id,
      signature,
      data,
      shape,
      metadata
    };

    this.fragments.set(id, fragment);
    this.addToHistory(id, fragment);

    return fragment;
  }

  /**
   * Update an existing tensor fragment
   */
  updateFragment(id: string, newData: Float32Array, relatedAtoms?: string[]): TensorFragment | null {
    const fragment = this.fragments.get(id);
    if (!fragment) return null;

    const updatedFragment: TensorFragment = {
      ...fragment,
      data: newData,
      metadata: {
        ...fragment.metadata,
        last_updated: Date.now(),
        related_atoms: relatedAtoms || fragment.metadata.related_atoms
      }
    };

    this.fragments.set(id, updatedFragment);
    this.addToHistory(id, updatedFragment);

    return updatedFragment;
  }

  /**
   * Retrieve tensor fragment by ID
   */
  getFragment(id: string): TensorFragment | null {
    return this.fragments.get(id) || null;
  }

  /**
   * Find fragments matching tensor signature criteria
   */
  findFragments(criteria: Partial<TensorSignature>): TensorFragment[] {
    return Array.from(this.fragments.values()).filter(fragment => 
      this.matchesSignatureCriteria(fragment.signature, criteria)
    );
  }

  /**
   * Transform tensor fragment through ML primitive
   */
  transformFragment(
    fragmentId: string, 
    mlPrimitive: MLPrimitive
  ): TensorFragment | null {
    const sourceFragment = this.fragments.get(fragmentId);
    if (!sourceFragment) return null;

    const transformedData = this.applyMLTransform(sourceFragment.data, mlPrimitive);
    const transformedShape = this.computeTransformedShape(sourceFragment.shape, mlPrimitive);
    
    // Create new tensor signature based on transformation
    const transformedSignature: TensorSignature = {
      ...mlPrimitive.output_tensor,
      depth: Math.min(9, sourceFragment.signature.depth + 1), // Increment processing depth
      autonomy_index: this.computeAutonomyIndex(sourceFragment.signature, mlPrimitive)
    };

    return this.createFragment(
      transformedSignature,
      transformedData,
      transformedShape,
      mlPrimitive.type,
      sourceFragment.metadata.dimensional_flow
    );
  }

  /**
   * Merge multiple tensor fragments
   */
  mergeFragments(fragmentIds: string[], mergeStrategy: MergeStrategy = 'concatenate'): TensorFragment | null {
    const fragments = fragmentIds.map(id => this.fragments.get(id)).filter(f => f !== undefined) as TensorFragment[];
    if (fragments.length === 0) return null;

    const mergedData = this.mergeFragmentData(fragments, mergeStrategy);
    const mergedShape = this.computeMergedShape(fragments, mergeStrategy);
    const mergedSignature = this.computeMergedSignature(fragments);

    return this.createFragment(
      mergedSignature,
      mergedData,
      mergedShape,
      'merge_operation',
      fragments[0].metadata.dimensional_flow
    );
  }

  /**
   * Generate unique ID for tensor fragment based on signature
   */
  private generateFragmentId(signature: TensorSignature): string {
    const timestamp = Date.now().toString(36);
    const modalityCode = signature.modality.slice(0, 3).toUpperCase();
    const depthCode = signature.depth.toString();
    const contextCode = signature.context.slice(0, 3).toUpperCase();
    const salienceCode = Math.floor(signature.salience * 100).toString();
    const autonomyCode = Math.floor(signature.autonomy_index * 100).toString();
    
    return `${modalityCode}-${depthCode}-${contextCode}-${salienceCode}-${autonomyCode}-${timestamp}`;
  }

  /**
   * Infer dimensional flow from tensor signature
   */
  private inferDimensionalFlow(signature: TensorSignature): DimensionalFlow {
    let triad: 'cerebral' | 'somatic' | 'autonomic';
    let dimension: 'potential' | 'commitment' | 'performance';
    let flow_pattern: '[2-7]' | '[5-4]' | '[8-1]';
    let position: 'development' | 'treasury' | 'production' | 'organization' | 'sales' | 'market';

    // Infer triad based on modality and autonomy
    if (signature.modality === ModalityType.COGNITIVE || signature.modality === ModalityType.EXECUTIVE) {
      triad = 'cerebral';
    } else if (signature.modality === ModalityType.MOTOR || signature.modality === ModalityType.SENSORY) {
      triad = 'somatic';
    } else {
      triad = 'autonomic';
    }

    // Infer dimension based on context and depth
    if (signature.context === ContextType.WORKING || signature.context === ContextType.IMMEDIATE) {
      dimension = 'commitment';
      flow_pattern = '[5-4]';
      position = signature.salience > 0.5 ? 'production' : 'organization';
    } else if (signature.context === ContextType.LONG_TERM || signature.context === ContextType.SEMANTIC) {
      dimension = 'potential';
      flow_pattern = '[2-7]';
      position = signature.autonomy_index > 0.5 ? 'treasury' : 'development';
    } else {
      dimension = 'performance';
      flow_pattern = '[8-1]';
      position = signature.salience > 0.5 ? 'sales' : 'market';
    }

    return { triad, dimension, flow_pattern, position };
  }

  /**
   * Check if tensor signature matches criteria
   */
  private matchesSignatureCriteria(signature: TensorSignature, criteria: Partial<TensorSignature>): boolean {
    return Object.entries(criteria).every(([key, value]) => {
      if (value === undefined) return true;
      if (key === 'depth' || key === 'salience' || key === 'autonomy_index') {
        return Math.abs(signature[key as keyof TensorSignature] as number - (value as number)) < 0.1;
      }
      return signature[key as keyof TensorSignature] === value;
    });
  }

  /**
   * Apply ML transformation to tensor data
   */
  private applyMLTransform(data: Float32Array, mlPrimitive: MLPrimitive): Float32Array {
    switch (mlPrimitive.type) {
      case MLPrimitiveType.LINEAR_TRANSFORM:
        return this.applyLinearTransform(data, mlPrimitive);
      case MLPrimitiveType.ACTIVATION:
        return this.applyActivation(data, mlPrimitive);
      case MLPrimitiveType.ATTENTION_MECHANISM:
        return this.applyAttention(data, mlPrimitive);
      default:
        return new Float32Array(data); // Copy unchanged for unknown transforms
    }
  }

  /**
   * Apply linear transformation
   */
  private applyLinearTransform(data: Float32Array, mlPrimitive: MLPrimitive): Float32Array {
    const weights = mlPrimitive.weights || [];
    const bias = mlPrimitive.bias || [];
    
    if (weights.length === 0) return new Float32Array(data);
    
    const result = new Float32Array(bias.length || data.length);
    for (let i = 0; i < result.length; i++) {
      result[i] = (bias[i] || 0);
      for (let j = 0; j < data.length; j++) {
        const weightIndex = i * data.length + j;
        if (weightIndex < weights.length) {
          result[i] += data[j] * weights[weightIndex];
        }
      }
    }
    
    return result;
  }

  /**
   * Apply activation function
   */
  private applyActivation(data: Float32Array, mlPrimitive: MLPrimitive): Float32Array {
    const activationType = mlPrimitive.parameters.activation || 'relu';
    const result = new Float32Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      switch (activationType) {
        case 'relu':
          result[i] = Math.max(0, data[i]);
          break;
        case 'sigmoid':
          result[i] = 1 / (1 + Math.exp(-data[i]));
          break;
        case 'tanh':
          result[i] = Math.tanh(data[i]);
          break;
        default:
          result[i] = data[i];
      }
    }
    
    return result;
  }

  /**
   * Apply attention mechanism
   */
  private applyAttention(data: Float32Array, mlPrimitive: MLPrimitive): Float32Array {
    // Simple attention: weighted sum based on salience values
    const attentionWeights = mlPrimitive.parameters.attention_weights || [];
    const result = new Float32Array(data.length);
    
    const sum = attentionWeights.reduce((a: number, b: number) => a + b, 0) || data.length;
    
    for (let i = 0; i < data.length; i++) {
      const weight = attentionWeights[i] || 1;
      result[i] = data[i] * (weight / sum);
    }
    
    return result;
  }

  /**
   * Compute transformed tensor shape
   */
  private computeTransformedShape(originalShape: number[], mlPrimitive: MLPrimitive): number[] {
    switch (mlPrimitive.type) {
      case MLPrimitiveType.LINEAR_TRANSFORM:
        const outputDim = mlPrimitive.parameters.output_dim || originalShape[originalShape.length - 1];
        return [...originalShape.slice(0, -1), outputDim];
      case MLPrimitiveType.CONVOLUTION:
        // Simplified convolution shape calculation
        const kernelSize = mlPrimitive.parameters.kernel_size || 3;
        const stride = mlPrimitive.parameters.stride || 1;
        return originalShape.map(dim => Math.floor((dim - kernelSize) / stride) + 1);
      default:
        return [...originalShape];
    }
  }

  /**
   * Compute autonomy index after transformation
   */
  private computeAutonomyIndex(originalSignature: TensorSignature, mlPrimitive: MLPrimitive): number {
    // Autonomy increases with processing complexity and decreases with external control
    const baseAutonomy = originalSignature.autonomy_index;
    const complexityBonus = mlPrimitive.type === MLPrimitiveType.ATTENTION_MECHANISM ? 0.1 : 0.05;
    const externalControl = mlPrimitive.parameters.external_control || 0;
    
    return Math.min(1.0, Math.max(0.0, baseAutonomy + complexityBonus - externalControl));
  }

  /**
   * Merge tensor fragment data
   */
  private mergeFragmentData(fragments: TensorFragment[], strategy: MergeStrategy): Float32Array {
    if (fragments.length === 0) return new Float32Array(0);
    if (fragments.length === 1) return new Float32Array(fragments[0].data);

    switch (strategy) {
      case 'concatenate':
        const totalLength = fragments.reduce((sum, f) => sum + f.data.length, 0);
        const result = new Float32Array(totalLength);
        let offset = 0;
        fragments.forEach(f => {
          result.set(f.data, offset);
          offset += f.data.length;
        });
        return result;
      
      case 'average':
        const maxLength = Math.max(...fragments.map(f => f.data.length));
        const avgResult = new Float32Array(maxLength);
        for (let i = 0; i < maxLength; i++) {
          let sum = 0;
          let count = 0;
          fragments.forEach(f => {
            if (i < f.data.length) {
              sum += f.data[i];
              count++;
            }
          });
          avgResult[i] = count > 0 ? sum / count : 0;
        }
        return avgResult;

      default:
        return new Float32Array(fragments[0].data);
    }
  }

  /**
   * Compute merged tensor shape
   */
  private computeMergedShape(fragments: TensorFragment[], strategy: MergeStrategy): number[] {
    if (fragments.length === 0) return [];
    if (fragments.length === 1) return [...fragments[0].shape];

    switch (strategy) {
      case 'concatenate':
        const baseShape = fragments[0].shape;
        const totalSize = fragments.reduce((sum, f) => sum + f.data.length, 0);
        return [totalSize];
      
      case 'average':
        return [...fragments[0].shape];

      default:
        return [...fragments[0].shape];
    }
  }

  /**
   * Compute merged tensor signature
   */
  private computeMergedSignature(fragments: TensorFragment[]): TensorSignature {
    if (fragments.length === 0) throw new Error('Cannot merge empty fragment list');
    if (fragments.length === 1) return { ...fragments[0].signature };

    // Take weighted average of numerical values, mode of categorical values
    const signatures = fragments.map(f => f.signature);
    
    return {
      modality: this.getMostCommonModality(signatures),
      depth: Math.round(signatures.reduce((sum, s) => sum + s.depth, 0) / signatures.length),
      context: this.getMostCommonContext(signatures),
      salience: signatures.reduce((sum, s) => sum + s.salience, 0) / signatures.length,
      autonomy_index: signatures.reduce((sum, s) => sum + s.autonomy_index, 0) / signatures.length
    };
  }

  /**
   * Get most common modality from signatures
   */
  private getMostCommonModality(signatures: TensorSignature[]): ModalityType {
    const counts = new Map<ModalityType, number>();
    signatures.forEach(s => {
      counts.set(s.modality, (counts.get(s.modality) || 0) + 1);
    });
    
    let maxCount = 0;
    let mostCommon = ModalityType.COGNITIVE;
    counts.forEach((count, modality) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = modality;
      }
    });
    
    return mostCommon;
  }

  /**
   * Get most common context from signatures
   */
  private getMostCommonContext(signatures: TensorSignature[]): ContextType {
    const counts = new Map<ContextType, number>();
    signatures.forEach(s => {
      counts.set(s.context, (counts.get(s.context) || 0) + 1);
    });
    
    let maxCount = 0;
    let mostCommon = ContextType.WORKING;
    counts.forEach((count, context) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = context;
      }
    });
    
    return mostCommon;
  }

  /**
   * Add fragment to history
   */
  private addToHistory(id: string, fragment: TensorFragment): void {
    if (!this.fragmentHistory.has(id)) {
      this.fragmentHistory.set(id, []);
    }
    
    const history = this.fragmentHistory.get(id)!;
    history.push({ ...fragment });
    
    // Keep only last 10 versions
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Get fragment history
   */
  getFragmentHistory(id: string): TensorFragment[] {
    return this.fragmentHistory.get(id) || [];
  }

  /**
   * Clear old fragments based on age
   */
  cleanup(maxAge: number = 3600000): number { // Default 1 hour
    const now = Date.now();
    let removed = 0;
    
    for (const [id, fragment] of this.fragments.entries()) {
      if (now - fragment.metadata.creation_time > maxAge) {
        this.fragments.delete(id);
        this.fragmentHistory.delete(id);
        this.attentionAllocations.delete(id);
        removed++;
      }
    }
    
    return removed;
  }

  /**
   * Set ECAN kernel for attention-based processing
   */
  setECANKernel(ecanKernel: ECANKernel): void {
    this.ecanKernel = ecanKernel;
  }

  /**
   * Allocate attention to fragments using ECAN principles
   */
  allocateECANAttention(fragmentIds?: string[]): Map<string, AttentionValue> {
    if (!this.ecanKernel) {
      throw new Error('ECAN kernel not initialized. Call setECANKernel() first.');
    }

    const targetFragments = fragmentIds ? 
      fragmentIds.map(id => this.fragments.get(id)).filter(f => f) as TensorFragment[] :
      Array.from(this.fragments.values());

    const allocations = new Map<string, AttentionValue>();

    targetFragments.forEach(fragment => {
      const signature = fragment.signature;
      
      // Calculate attention allocation based on ECAN principles
      const baseAttention = this.calculateBaseAttention(signature);
      const priorityMultiplier = this.calculatePriorityMultiplier(fragment);
      
      const allocation: AttentionValue = {
        sti: Math.floor(baseAttention.sti * priorityMultiplier),
        lti: Math.floor(baseAttention.lti * priorityMultiplier),
        vlti: Math.floor(baseAttention.vlti * priorityMultiplier)
      };

      allocations.set(fragment.id, allocation);
      this.attentionAllocations.set(fragment.id, allocation);
    });

    return allocations;
  }

  /**
   * Create ECAN-enabled tensor fragment
   */
  createECANFragment(
    signature: ECANTensorSignature,
    data: Float32Array,
    shape: number[],
    sourcePrimitive: string = 'ecan_source',
    dimensionalFlow?: DimensionalFlow
  ): TensorFragment {
    const fragment = this.createFragment(signature, data, shape, sourcePrimitive, dimensionalFlow);
    
    // Add to ECAN activation network if available
    if (this.ecanKernel) {
      const activationLevel = signature.attention * signature.priority * 100;
      this.ecanKernel.addActivationNode(fragment.id, activationLevel);
    }

    return fragment;
  }

  /**
   * Find fragments by ECAN criteria
   */
  findECANFragments(criteria: {
    minTasks?: number;
    minAttention?: number;
    minPriority?: number;
    minResources?: number;
  }): TensorFragment[] {
    return Array.from(this.fragments.values()).filter(fragment => {
      const sig = fragment.signature as ECANTensorSignature;
      
      if (criteria.minTasks && (!sig.tasks || sig.tasks < criteria.minTasks)) return false;
      if (criteria.minAttention && (!sig.attention || sig.attention < criteria.minAttention)) return false;
      if (criteria.minPriority && (!sig.priority || sig.priority < criteria.minPriority)) return false;
      if (criteria.minResources && (!sig.resources || sig.resources < criteria.minResources)) return false;
      
      return true;
    });
  }

  /**
   * Get attention allocation for a fragment
   */
  getFragmentAttention(fragmentId: string): AttentionValue | null {
    return this.attentionAllocations.get(fragmentId) || null;
  }

  /**
   * Process attention spreading between related fragments
   */
  spreadAttentionBetweenFragments(sourceId: string, targetIds: string[], spreadingRate: number = 0.1): void {
    if (!this.ecanKernel) return;

    const sourceFragment = this.fragments.get(sourceId);
    if (!sourceFragment) return;

    targetIds.forEach(targetId => {
      const targetFragment = this.fragments.get(targetId);
      if (targetFragment) {
        // Calculate connection weight based on signature similarity
        const weight = this.calculateSignatureSimilarity(
          sourceFragment.signature,
          targetFragment.signature
        );
        
        if (this.ecanKernel) {
          this.ecanKernel.connectActivationNodes(sourceId, targetId, weight, spreadingRate);
        }
      }
    });
  }

  /**
   * Get fragments sorted by attention priority
   */
  getFragmentsByAttentionPriority(): TensorFragment[] {
    return Array.from(this.fragments.values()).sort((a, b) => {
      const aAttention = this.attentionAllocations.get(a.id) || { sti: 0, lti: 0, vlti: 0 };
      const bAttention = this.attentionAllocations.get(b.id) || { sti: 0, lti: 0, vlti: 0 };
      
      const aTotal = aAttention.sti + aAttention.lti + aAttention.vlti;
      const bTotal = bAttention.sti + bAttention.lti + bAttention.vlti;
      
      return bTotal - aTotal; // Descending order
    });
  }

  // Private ECAN helper methods

  private calculateBaseAttention(signature: TensorSignature): AttentionValue {
    const salienceMultiplier = signature.salience;
    const depthMultiplier = signature.depth / 9;
    const autonomyMultiplier = signature.autonomy_index;
    
    return {
      sti: Math.floor(50 * salienceMultiplier * (1 + depthMultiplier)),
      lti: Math.floor(25 * salienceMultiplier * autonomyMultiplier),
      vlti: Math.floor(10 * autonomyMultiplier)
    };
  }

  private calculatePriorityMultiplier(fragment: TensorFragment): number {
    const signature = fragment.signature as ECANTensorSignature;
    
    // Base multiplier from priority if ECAN signature
    let multiplier = signature.priority || 0.5;
    
    // Adjust based on modality importance
    switch (signature.modality) {
      case ModalityType.EXECUTIVE:
        multiplier *= 1.5;
        break;
      case ModalityType.ATTENTION:
        multiplier *= 1.3;
        break;
      case ModalityType.COGNITIVE:
        multiplier *= 1.1;
        break;
      default:
        multiplier *= 1.0;
    }
    
    // Adjust based on context urgency
    switch (signature.context) {
      case ContextType.IMMEDIATE:
        multiplier *= 1.4;
        break;
      case ContextType.WORKING:
        multiplier *= 1.2;
        break;
      case ContextType.SHORT_TERM:
        multiplier *= 1.1;
        break;
      default:
        multiplier *= 1.0;
    }
    
    return Math.min(2.0, Math.max(0.1, multiplier));
  }

  private calculateSignatureSimilarity(sig1: TensorSignature, sig2: TensorSignature): number {
    let similarity = 0;
    let factors = 0;
    
    // Modality similarity
    if (sig1.modality === sig2.modality) similarity += 0.3;
    factors++;
    
    // Context similarity  
    if (sig1.context === sig2.context) similarity += 0.2;
    factors++;
    
    // Depth similarity (normalized difference)
    const depthSim = 1 - Math.abs(sig1.depth - sig2.depth) / 9;
    similarity += depthSim * 0.2;
    factors++;
    
    // Salience similarity
    const salienceSim = 1 - Math.abs(sig1.salience - sig2.salience);
    similarity += salienceSim * 0.2;
    factors++;
    
    // Autonomy similarity
    const autonomySim = 1 - Math.abs(sig1.autonomy_index - sig2.autonomy_index);
    similarity += autonomySim * 0.1;
    factors++;
    
    return similarity / factors;
  }
}

/**
 * Merge strategies for tensor fragments
 */
export type MergeStrategy = 'concatenate' | 'average' | 'max' | 'min';

/**
 * Factory for creating common tensor signatures
 */
export class TensorSignatureFactory {
  /**
   * Create a sensory input tensor signature
   */
  static createSensorySignature(
    context: ContextType = ContextType.IMMEDIATE,
    salience: number = 0.8
  ): TensorSignature {
    return {
      modality: ModalityType.SENSORY,
      depth: 1,
      context,
      salience: Math.max(0, Math.min(1, salience)),
      autonomy_index: 0.2
    };
  }

  /**
   * Create a cognitive processing tensor signature
   */
  static createCognitiveSignature(
    depth: number = 3,
    context: ContextType = ContextType.WORKING,
    autonomy: number = 0.6
  ): TensorSignature {
    return {
      modality: ModalityType.COGNITIVE,
      depth: Math.max(0, Math.min(9, depth)),
      context,
      salience: 0.7,
      autonomy_index: Math.max(0, Math.min(1, autonomy))
    };
  }

  /**
   * Create a memory tensor signature
   */
  static createMemorySignature(
    context: ContextType = ContextType.LONG_TERM,
    salience: number = 0.4
  ): TensorSignature {
    return {
      modality: ModalityType.MEMORY,
      depth: 2,
      context,
      salience: Math.max(0, Math.min(1, salience)),
      autonomy_index: 0.8
    };
  }

  /**
   * Create a motor output tensor signature
   */
  static createMotorSignature(
    salience: number = 0.9,
    autonomy: number = 0.3
  ): TensorSignature {
    return {
      modality: ModalityType.MOTOR,
      depth: 1,
      context: ContextType.IMMEDIATE,
      salience: Math.max(0, Math.min(1, salience)),
      autonomy_index: Math.max(0, Math.min(1, autonomy))
    };
  }
}