// ECAN (Economic Attention-based Cognitive Architecture Network) Kernel
// Implements dynamic attention allocation and activation spreading

import { 
  TensorSignature, 
  AttentionValue, 
  TensorFragment,
  AtomNode,
  AtomLink,
  HypergraphPattern,
  ModalityType,
  ContextType
} from './cognitive-primitives';

/**
 * ECAN-specific tensor signature for resource allocation
 * Following specification: [tasks, attention, priority, resources]
 */
export interface ECANTensorSignature extends TensorSignature {
  tasks: number;        // Number of concurrent tasks (0-10)
  attention: number;    // Attention allocation weight (0.0-1.0) 
  priority: number;     // Task priority level (0.0-1.0)
  resources: number;    // Available resource units (0.0-1.0)
}

/**
 * Economic attention allocation parameters
 */
export interface EconomicAllocation {
  totalSTI: number;           // Total short-term importance budget
  totalLTI: number;           // Total long-term importance budget  
  totalVLTI: number;          // Total very long-term importance budget
  minThreshold: number;       // Minimum attention threshold
  decayRate: number;          // Attention decay per cycle
  spreadingRate: number;      // Activation spreading coefficient
}

/**
 * Task resource requirement specification
 */
export interface TaskResource {
  taskId: string;
  requiredSTI: number;
  requiredLTI: number;
  priority: number;
  dependencies: string[];
  estimatedDuration: number;
  resourceType: 'cognitive' | 'motor' | 'sensory' | 'executive';
  startTime?: Date;
}

/**
 * Activation spreading node in the attention network
 */
export interface ActivationNode {
  id: string;
  currentActivation: number;
  baseActivation: number;
  connections: ActivationConnection[];
  lastUpdate: number;
}

/**
 * Connection between activation nodes for spreading
 */
export interface ActivationConnection {
  targetId: string;
  weight: number;
  spreadingCoefficient: number;
}

/**
 * ECAN Kernel for economic attention allocation and resource management
 */
export class ECANKernel {
  private economicParams: EconomicAllocation;
  private activationNetwork: Map<string, ActivationNode> = new Map();
  private taskQueue: TaskResource[] = [];
  private runningTasks: Map<string, TaskResource> = new Map();
  private attentionBudget: AttentionValue;
  private cycleCount: number = 0;

  constructor(economicParams?: Partial<EconomicAllocation>) {
    this.economicParams = {
      totalSTI: 1000,
      totalLTI: 1000,
      totalVLTI: 500,
      minThreshold: 10,
      decayRate: 0.05,
      spreadingRate: 0.1,
      ...economicParams
    };

    this.attentionBudget = {
      sti: this.economicParams.totalSTI,
      lti: this.economicParams.totalLTI,
      vlti: this.economicParams.totalVLTI
    };
  }

  /**
   * Allocate attention resources to hypergraph elements
   */
  allocateAttention(pattern: HypergraphPattern, requestedResources: number): HypergraphPattern {
    const totalElements = pattern.nodes.length + pattern.links.length;
    if (totalElements === 0) return pattern;

    // Calculate available attention budget
    const availableSTI = Math.max(0, this.attentionBudget.sti - this.getReservedSTI());
    const availableLTI = Math.max(0, this.attentionBudget.lti - this.getReservedLTI());

    // Distribute attention based on current salience and priority
    const updatedNodes = pattern.nodes.map(node => ({
      ...node,
      attentionValue: this.calculateNewAttentionValue(
        node.attentionValue,
        node.tensor.salience,
        availableSTI / totalElements,
        availableLTI / totalElements
      )
    }));

    const updatedLinks = pattern.links.map(link => ({
      ...link,
      attentionValue: this.calculateNewAttentionValue(
        link.attentionValue,
        link.tensor.salience,
        availableSTI / totalElements,
        availableLTI / totalElements
      )
    }));

    return {
      nodes: updatedNodes,
      links: updatedLinks,
      variables: pattern.variables
    };
  }

  /**
   * Schedule task based on economic attention principles
   */
  scheduleTask(task: TaskResource): boolean {
    // Check if resources are available
    if (!this.canAllocateResources(task)) {
      this.taskQueue.push(task);
      this.taskQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
      return false;
    }

    // Allocate resources and start task
    this.allocateTaskResources(task);
    this.runningTasks.set(task.taskId, task);
    return true;
  }

  /**
   * Process activation spreading across the attention network
   */
  spreadActivation(): void {
    const activationDeltas = new Map<string, number>();

    // Calculate activation spreading for each node
    this.activationNetwork.forEach((node, nodeId) => {
      let totalSpread = 0;
      
      node.connections.forEach(connection => {
        const targetNode = this.activationNetwork.get(connection.targetId);
        if (targetNode) {
          const spread = node.currentActivation * connection.weight * 
                        connection.spreadingCoefficient * this.economicParams.spreadingRate;
          totalSpread += spread;
          
          activationDeltas.set(connection.targetId, 
            (activationDeltas.get(connection.targetId) || 0) + spread);
        }
      });

      // Apply decay to source node
      const decay = node.currentActivation * this.economicParams.decayRate;
      activationDeltas.set(nodeId, 
        (activationDeltas.get(nodeId) || 0) - totalSpread - decay);
    });

    // Apply activation changes
    activationDeltas.forEach((delta, nodeId) => {
      const node = this.activationNetwork.get(nodeId);
      if (node) {
        node.currentActivation = Math.max(0, node.currentActivation + delta);
        node.lastUpdate = Date.now();
      }
    });

    this.cycleCount++;
  }

  /**
   * Create ECAN tensor signature for resource allocation
   */
  createECANTensorSignature(
    tasks: number,
    attention: number,
    priority: number,
    resources: number,
    modality: ModalityType = ModalityType.ATTENTION,
    context: ContextType = ContextType.WORKING
  ): ECANTensorSignature {
    return {
      modality,
      depth: Math.min(9, Math.max(0, Math.floor(tasks))),
      context,
      salience: Math.min(1.0, Math.max(0.0, attention)),
      autonomy_index: Math.min(1.0, Math.max(0.0, resources)),
      tasks: Math.min(10, Math.max(0, tasks)),
      attention: Math.min(1.0, Math.max(0.0, attention)),
      priority: Math.min(1.0, Math.max(0.0, priority)),
      resources: Math.min(1.0, Math.max(0.0, resources))
    };
  }

  /**
   * Add activation node to the network
   */
  addActivationNode(id: string, baseActivation: number = 50): void {
    this.activationNetwork.set(id, {
      id,
      currentActivation: baseActivation,
      baseActivation,
      connections: [],
      lastUpdate: Date.now()
    });
  }

  /**
   * Connect two activation nodes
   */
  connectActivationNodes(sourceId: string, targetId: string, weight: number, spreadingCoeff: number = 1.0): void {
    const sourceNode = this.activationNetwork.get(sourceId);
    if (sourceNode) {
      sourceNode.connections.push({
        targetId,
        weight: Math.min(1.0, Math.max(0.0, weight)),
        spreadingCoefficient: Math.min(1.0, Math.max(0.0, spreadingCoeff))
      });
    }
  }

  /**
   * Get current attention budget status
   */
  getAttentionBudget(): AttentionValue {
    return { ...this.attentionBudget };
  }

  /**
   * Get activation network statistics
   */
  getNetworkStats(): {
    totalNodes: number;
    totalConnections: number;
    averageActivation: number;
    cycleCount: number;
  } {
    const totalNodes = this.activationNetwork.size;
    let totalConnections = 0;
    let totalActivation = 0;

    this.activationNetwork.forEach(node => {
      totalConnections += node.connections.length;
      totalActivation += node.currentActivation;
    });

    return {
      totalNodes,
      totalConnections,
      averageActivation: totalNodes > 0 ? totalActivation / totalNodes : 0,
      cycleCount: this.cycleCount
    };
  }

  // Private helper methods

  private calculateNewAttentionValue(
    current: AttentionValue,
    salience: number,
    allocatedSTI: number,
    allocatedLTI: number
  ): AttentionValue {
    const salienceMultiplier = Math.max(0.1, salience);
    
    return {
      sti: Math.max(this.economicParams.minThreshold, 
           current.sti + (allocatedSTI * salienceMultiplier)),
      lti: Math.max(this.economicParams.minThreshold / 2,
           current.lti + (allocatedLTI * salienceMultiplier)),
      vlti: Math.max(0, current.vlti * (1 - this.economicParams.decayRate))
    };
  }

  private canAllocateResources(task: TaskResource): boolean {
    return this.attentionBudget.sti >= task.requiredSTI &&
           this.attentionBudget.lti >= task.requiredLTI &&
           this.runningTasks.size < 5; // Max concurrent tasks
  }

  private allocateTaskResources(task: TaskResource): void {
    this.attentionBudget.sti -= task.requiredSTI;
    this.attentionBudget.lti -= task.requiredLTI;
  }

  private getReservedSTI(): number {
    let reserved = 0;
    this.runningTasks.forEach(task => {
      reserved += task.requiredSTI;
    });
    return reserved;
  }

  private getReservedLTI(): number {
    let reserved = 0;
    this.runningTasks.forEach(task => {
      reserved += task.requiredLTI;
    });
    return reserved;
  }
}

/**
 * Factory for creating ECAN tensor signatures
 */
export class ECANTensorFactory {
  static createLowPrioritySignature(tasks: number = 1, resources: number = 0.3): ECANTensorSignature {
    return {
      modality: ModalityType.COGNITIVE,
      depth: 2,
      context: ContextType.WORKING,
      salience: 0.3,
      autonomy_index: resources,
      tasks,
      attention: 0.3,
      priority: 0.2,
      resources
    };
  }

  static createHighPrioritySignature(tasks: number = 3, resources: number = 0.8): ECANTensorSignature {
    return {
      modality: ModalityType.EXECUTIVE,
      depth: 7,
      context: ContextType.IMMEDIATE,
      salience: 0.9,
      autonomy_index: resources,
      tasks,
      attention: 0.9,
      priority: 0.9,
      resources
    };
  }

  static createAttentionSignature(attention: number, priority: number = 0.5): ECANTensorSignature {
    return {
      modality: ModalityType.ATTENTION,
      depth: Math.floor(attention * 9),
      context: ContextType.IMMEDIATE,
      salience: attention,
      autonomy_index: priority,
      tasks: Math.ceil(attention * 5),
      attention,
      priority,
      resources: Math.min(1.0, attention + 0.2)
    };
  }
}