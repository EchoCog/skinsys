// ECAN Scheduler - Economic Resource Allocation and Task Scheduling
// Integrates with existing process management and tensor fragment architecture

import { 
  ECANKernel, 
  ECANTensorSignature, 
  TaskResource, 
  EconomicAllocation,
  ActivationNode
} from './ecan-kernel';
import { 
  TensorFragment, 
  TensorFragmentManager
} from './tensor-fragment-architecture';
import { 
  TensorSignature,
  AttentionValue,
  HypergraphPattern
} from './cognitive-primitives';

/**
 * Service message interface for ECAN integration
 */
export interface ServiceMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  source: string;
  priority: number;
}

/**
 * Resource allocation decision result
 */
export interface AllocationDecision {
  taskId: string;
  allocated: boolean;
  reason: string;
  estimatedWaitTime?: number;
  alternativeResources?: TaskResource[];
}

/**
 * Scheduler performance metrics
 */
export interface SchedulerMetrics {
  totalTasksScheduled: number;
  averageWaitTime: number;
  resourceUtilization: number;
  attentionEfficiency: number;
  activationSpreadCycles: number;
}

/**
 * Priority-based task classification
 */
export enum TaskPriority {
  CRITICAL = 'critical',     // 0.9-1.0 priority
  HIGH = 'high',            // 0.7-0.9 priority  
  MEDIUM = 'medium',        // 0.4-0.7 priority
  LOW = 'low'               // 0.0-0.4 priority
}

/**
 * ECAN-based resource scheduler with economic attention allocation
 */
export class ECANScheduler {
  private ecanKernel: ECANKernel;
  private tensorManager: TensorFragmentManager;
  
  // Scheduling state
  private scheduledTasks: Map<string, TaskResource> = new Map();
  private completedTasks: Map<string, TaskResource> = new Map();
  private metrics: SchedulerMetrics;
  private lastSchedulingCycle: number = 0;

  // Performance tracking
  private totalWaitTime: number = 0;
  private schedulingHistory: Array<{
    timestamp: number;
    tasksScheduled: number;
    resourcesUsed: number;
  }> = [];

  constructor(
    ecanKernel?: ECANKernel,
    tensorManager?: TensorFragmentManager,
    economicParams?: Partial<EconomicAllocation>
  ) {
    this.ecanKernel = ecanKernel || new ECANKernel(economicParams);
    this.tensorManager = tensorManager || new TensorFragmentManager();
    
    this.metrics = {
      totalTasksScheduled: 0,
      averageWaitTime: 0,
      resourceUtilization: 0,
      attentionEfficiency: 0,
      activationSpreadCycles: 0
    };
  }

  /**
   * Schedule a cognitive task with ECAN resource allocation
   */
  async scheduleTask(
    taskId: string,
    requiredResources: Partial<TaskResource>,
    tensorSignature?: ECANTensorSignature
  ): Promise<AllocationDecision> {
    const task: TaskResource = {
      taskId,
      requiredSTI: requiredResources.requiredSTI || 50,
      requiredLTI: requiredResources.requiredLTI || 25,
      priority: requiredResources.priority || 0.5,
      dependencies: requiredResources.dependencies || [],
      estimatedDuration: requiredResources.estimatedDuration || 1000,
      resourceType: requiredResources.resourceType || 'cognitive'
    };

    // Create tensor fragment for task tracking
    if (tensorSignature) {
      const taskData = new Float32Array([
        task.requiredSTI / 100,
        task.requiredLTI / 100,
        task.priority,
        task.estimatedDuration / 10000
      ]);
      
      const fragment = this.tensorManager.createFragment(
        tensorSignature,
        taskData,
        [4],
        `ecan_task_${taskId}`
      );

      // Add to activation network
      this.ecanKernel.addActivationNode(taskId, task.priority * 100);
    }

    // Attempt to schedule immediately
    const canSchedule = this.ecanKernel.scheduleTask(task);
    
    if (canSchedule) {
      this.scheduledTasks.set(taskId, task);
      this.metrics.totalTasksScheduled++;
      
      return {
        taskId,
        allocated: true,
        reason: 'Resources available, scheduled immediately'
      };
    }

    // Calculate wait time and alternatives
    const waitTime = this.estimateWaitTime(task);
    const alternatives = this.findAlternativeResources(task);

    return {
      taskId,
      allocated: false,
      reason: 'Insufficient resources, queued for later allocation',
      estimatedWaitTime: waitTime,
      alternativeResources: alternatives
    };
  }

  /**
   * Process one scheduling cycle with activation spreading
   */
  processSchedulingCycle(): void {
    this.lastSchedulingCycle = Date.now();

    // Spread activation across the network
    this.ecanKernel.spreadActivation();
    this.metrics.activationSpreadCycles++;

    // Attempt to schedule queued tasks
    this.processQueuedTasks();

    // Update performance metrics
    this.updateMetrics();

    // Clean up completed tasks
    this.cleanupCompletedTasks();
  }

  /**
   * Allocate attention to tensor fragments based on ECAN principles
   */
  allocateAttentionToFragments(fragmentIds: string[]): Map<string, AttentionValue> {
    const allocations = new Map<string, AttentionValue>();
    const budget = this.ecanKernel.getAttentionBudget();
    
    if (fragmentIds.length === 0) return allocations;

    const availableSTI = budget.sti * 0.1; // Use 10% of budget per cycle
    const availableLTI = budget.lti * 0.05; // Use 5% of budget per cycle
    
    fragmentIds.forEach(fragmentId => {
      const fragment = this.tensorManager.getFragment(fragmentId);
      if (fragment) {
        const salience = fragment.signature.salience;
        const priority = this.calculateFragmentPriority(fragment);
        
        const allocation: AttentionValue = {
          sti: Math.floor(availableSTI * salience * priority / fragmentIds.length),
          lti: Math.floor(availableLTI * salience * priority / fragmentIds.length),
          vlti: Math.floor(budget.vlti * 0.01 * priority / fragmentIds.length)
        };
        
        allocations.set(fragmentId, allocation);
      }
    });

    return allocations;
  }

  /**
   * Get task priority classification
   */
  getTaskPriorityClass(priority: number): TaskPriority {
    if (priority >= 0.9) return TaskPriority.CRITICAL;
    if (priority >= 0.7) return TaskPriority.HIGH;
    if (priority >= 0.4) return TaskPriority.MEDIUM;
    return TaskPriority.LOW;
  }

  /**
   * Create service message for integration with existing architecture
   */
  createECANServiceMessage(
    type: string,
    data: any,
    priority: TaskPriority = TaskPriority.MEDIUM
  ): ServiceMessage {
    const priorityValue = this.priorityToNumber(priority);
    
    return {
      id: `ecan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data: {
        ...data,
        ecan_priority: priorityValue,
        attention_required: priorityValue * 100,
        resource_estimate: this.estimateResourceRequirement(data)
      },
      timestamp: Date.now(),
      source: 'ecan-scheduler',
      priority: priorityValue
    };
  }

  /**
   * Get current scheduler performance metrics
   */
  getMetrics(): SchedulerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detailed scheduling status
   */
  getSchedulingStatus(): {
    activeTasks: number;
    queuedTasks: number;
    completedTasks: number;
    attentionBudget: AttentionValue;
    networkStats: any;
  } {
    return {
      activeTasks: this.scheduledTasks.size,
      queuedTasks: 0, // Would need access to kernel's internal queue
      completedTasks: this.completedTasks.size,
      attentionBudget: this.ecanKernel.getAttentionBudget(),
      networkStats: this.ecanKernel.getNetworkStats()
    };
  }

  /**
   * Connect task nodes in activation network for spreading
   */
  connectTaskNodes(sourceTaskId: string, targetTaskId: string, weight: number): void {
    this.ecanKernel.connectActivationNodes(sourceTaskId, targetTaskId, weight);
  }

  // Private helper methods

  private processQueuedTasks(): void {
    // This would integrate with the kernel's internal queue
    // For now, just update metrics
    this.updateResourceUtilization();
  }

  private estimateWaitTime(task: TaskResource): number {
    const currentUtilization = this.calculateCurrentUtilization();
    const taskComplexity = (task.requiredSTI + task.requiredLTI) / 200;
    
    return Math.max(1000, taskComplexity * currentUtilization * 5000);
  }

  private findAlternativeResources(task: TaskResource): TaskResource[] {
    // Generate alternatives with lower resource requirements
    return [
      {
        ...task,
        taskId: `${task.taskId}_alternative_1`,
        requiredSTI: task.requiredSTI * 0.7,
        requiredLTI: task.requiredLTI * 0.7,
        priority: task.priority * 0.8
      },
      {
        ...task,
        taskId: `${task.taskId}_alternative_2`,
        requiredSTI: task.requiredSTI * 0.5,
        requiredLTI: task.requiredLTI * 0.5,
        priority: task.priority * 0.6,
        estimatedDuration: task.estimatedDuration * 1.5
      }
    ];
  }

  private calculateFragmentPriority(fragment: TensorFragment): number {
    // Calculate priority based on tensor signature
    const salience = fragment.signature.salience;
    const autonomy = fragment.signature.autonomy_index;
    const depth = fragment.signature.depth / 9; // Normalize depth
    
    return (salience * 0.5) + (autonomy * 0.3) + (depth * 0.2);
  }

  private calculateCurrentUtilization(): number {
    const budget = this.ecanKernel.getAttentionBudget();
    const totalBudget = 1000 + 1000 + 500; // Default total budget
    const availableBudget = budget.sti + budget.lti + budget.vlti;
    
    return Math.max(0, Math.min(1, 1 - (availableBudget / totalBudget)));
  }

  private updateMetrics(): void {
    this.metrics.resourceUtilization = this.calculateCurrentUtilization();
    
    if (this.metrics.totalTasksScheduled > 0) {
      this.metrics.averageWaitTime = this.totalWaitTime / this.metrics.totalTasksScheduled;
    }

    const networkStats = this.ecanKernel.getNetworkStats();
    this.metrics.attentionEfficiency = networkStats.averageActivation / 100;
  }

  private updateResourceUtilization(): void {
    const currentTime = Date.now();
    const tasksScheduled = this.scheduledTasks.size;
    const resourcesUsed = this.calculateCurrentUtilization();

    this.schedulingHistory.push({
      timestamp: currentTime,
      tasksScheduled,
      resourcesUsed
    });

    // Keep only recent history (last 100 entries)
    if (this.schedulingHistory.length > 100) {
      this.schedulingHistory.shift();
    }
  }

  private cleanupCompletedTasks(): void {
    const currentTime = Date.now();
    const maxAge = 300000; // 5 minutes

    this.completedTasks.forEach((task, taskId) => {
      if (task.startTime && (currentTime - task.startTime.getTime()) > maxAge) {
        this.completedTasks.delete(taskId);
      }
    });
  }

  private priorityToNumber(priority: TaskPriority): number {
    switch (priority) {
      case TaskPriority.CRITICAL: return 0.95;
      case TaskPriority.HIGH: return 0.8;
      case TaskPriority.MEDIUM: return 0.55;
      case TaskPriority.LOW: return 0.25;
      default: return 0.5;
    }
  }

  private estimateResourceRequirement(data: any): number {
    // Simple heuristic based on data complexity
    const dataSize = JSON.stringify(data).length;
    return Math.min(1.0, dataSize / 10000);
  }
}

/**
 * Factory for creating common ECAN scheduling scenarios
 */
export class ECANSchedulingFactory {
  static createCognitiveTask(
    taskId: string, 
    complexity: number = 0.5,
    priority: TaskPriority = TaskPriority.MEDIUM
  ): Partial<TaskResource> {
    const priorityValue = ECANSchedulingFactory.priorityToNumber(priority);
    
    return {
      requiredSTI: Math.floor(complexity * 100),
      requiredLTI: Math.floor(complexity * 50),
      priority: priorityValue,
      estimatedDuration: complexity * 5000,
      resourceType: 'cognitive'
    };
  }

  static createExecutiveTask(
    taskId: string,
    urgency: number = 0.8,
    resources: number = 0.7
  ): Partial<TaskResource> {
    return {
      requiredSTI: Math.floor(urgency * 150),
      requiredLTI: Math.floor(resources * 100),
      priority: Math.max(0.7, urgency),
      estimatedDuration: (1 - urgency) * 10000,
      resourceType: 'executive'
    };
  }

  private static priorityToNumber(priority: TaskPriority): number {
    switch (priority) {
      case TaskPriority.CRITICAL: return 0.95;
      case TaskPriority.HIGH: return 0.8;
      case TaskPriority.MEDIUM: return 0.55;
      case TaskPriority.LOW: return 0.25;
      default: return 0.5;
    }
  }
}