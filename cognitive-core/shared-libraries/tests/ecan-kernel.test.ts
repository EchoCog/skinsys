// ECAN Kernel Tests
// Testing economic attention allocation and activation spreading

import { 
  ECANKernel, 
  ECANTensorSignature, 
  ECANTensorFactory,
  TaskResource,
  EconomicAllocation 
} from '../src/ecan-kernel';
import { 
  ECANScheduler, 
  TaskPriority,
  ECANSchedulingFactory 
} from '../src/ecan-scheduler';
import { 
  TensorFragmentManager,
  TensorSignatureFactory 
} from '../src/tensor-fragment-architecture';
import { 
  ModalityType, 
  ContextType,
  HypergraphPattern,
  AtomType,
  LinkType 
} from '../src/cognitive-primitives';

describe('ECAN Kernel & Economic Attention Allocation', () => {
  let ecanKernel: ECANKernel;
  let scheduler: ECANScheduler;
  let tensorManager: TensorFragmentManager;

  beforeEach(() => {
    const economicParams: Partial<EconomicAllocation> = {
      totalSTI: 1000,
      totalLTI: 800,
      totalVLTI: 400,
      minThreshold: 10,
      decayRate: 0.05,
      spreadingRate: 0.1
    };
    
    ecanKernel = new ECANKernel(economicParams);
    tensorManager = new TensorFragmentManager(ecanKernel);
    scheduler = new ECANScheduler(ecanKernel, tensorManager, economicParams);
  });

  describe('ECANTensorFactory', () => {
    test('creates low priority ECAN signature', () => {
      const signature = ECANTensorFactory.createLowPrioritySignature(2, 0.4);
      
      expect(signature.tasks).toBe(2);
      expect(signature.attention).toBeCloseTo(0.3);
      expect(signature.priority).toBeCloseTo(0.2);
      expect(signature.resources).toBeCloseTo(0.4);
      expect(signature.modality).toBe(ModalityType.COGNITIVE);
      expect(signature.context).toBe(ContextType.WORKING);
    });

    test('creates high priority ECAN signature', () => {
      const signature = ECANTensorFactory.createHighPrioritySignature(5, 0.9);
      
      expect(signature.tasks).toBe(5);
      expect(signature.attention).toBeCloseTo(0.9);
      expect(signature.priority).toBeCloseTo(0.9);
      expect(signature.resources).toBeCloseTo(0.9);
      expect(signature.modality).toBe(ModalityType.EXECUTIVE);
      expect(signature.context).toBe(ContextType.IMMEDIATE);
    });

    test('creates attention-focused signature', () => {
      const signature = ECANTensorFactory.createAttentionSignature(0.7, 0.6);
      
      expect(signature.attention).toBeCloseTo(0.7);
      expect(signature.priority).toBeCloseTo(0.6);
      expect(signature.modality).toBe(ModalityType.ATTENTION);
      expect(signature.tasks).toBe(4); // ceil(0.7 * 5)
      expect(signature.resources).toBeCloseTo(0.9); // 0.7 + 0.2
    });
  });

  describe('ECANKernel Core Functionality', () => {
    test('initializes with correct economic parameters', () => {
      const budget = ecanKernel.getAttentionBudget();
      
      expect(budget.sti).toBe(1000);
      expect(budget.lti).toBe(800);
      expect(budget.vlti).toBe(400);
    });

    test('creates ECAN tensor signature with proper bounds', () => {
      const signature = ecanKernel.createECANTensorSignature(
        12, // tasks (should be clamped to 10)
        1.5, // attention (should be clamped to 1.0)
        -0.1, // priority (should be clamped to 0.0)
        0.8   // resources
      );
      
      expect(signature.tasks).toBe(10);
      expect(signature.attention).toBe(1.0);
      expect(signature.priority).toBe(0.0);
      expect(signature.resources).toBe(0.8);
      expect(signature.depth).toBe(9); // Max depth based on tasks
    });

    test('adds and connects activation nodes', () => {
      ecanKernel.addActivationNode('node1', 100);
      ecanKernel.addActivationNode('node2', 80);
      ecanKernel.connectActivationNodes('node1', 'node2', 0.5, 0.8);
      
      const stats = ecanKernel.getNetworkStats();
      expect(stats.totalNodes).toBe(2);
      expect(stats.totalConnections).toBe(1);
      expect(stats.averageActivation).toBeCloseTo(90); // (100 + 80) / 2
    });

    test('processes activation spreading', () => {
      ecanKernel.addActivationNode('source', 100);
      ecanKernel.addActivationNode('target', 20);
      ecanKernel.connectActivationNodes('source', 'target', 0.8, 0.5);
      
      const initialStats = ecanKernel.getNetworkStats();
      expect(initialStats.averageActivation).toBeCloseTo(60);
      
      // Process one spreading cycle
      ecanKernel.spreadActivation();
      
      const finalStats = ecanKernel.getNetworkStats();
      expect(finalStats.cycleCount).toBe(1);
      // Target should receive some activation, source should lose some
    });

    test('allocates attention to hypergraph pattern', () => {
      const pattern: HypergraphPattern = {
        nodes: [
          {
            id: 'node1',
            type: AtomType.CONCEPT,
            name: 'test_concept',
            truthValue: { strength: 0.8, confidence: 0.9 },
            attentionValue: { sti: 50, lti: 30, vlti: 10 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          }
        ],
        links: [
          {
            id: 'link1',
            type: LinkType.INHERITANCE,
            outgoing: ['node1'],
            truthValue: { strength: 0.7, confidence: 0.8 },
            attentionValue: { sti: 40, lti: 20, vlti: 5 },
            tensor: TensorSignatureFactory.createCognitiveSignature()
          }
        ],
        variables: []
      };

      const updatedPattern = ecanKernel.allocateAttention(pattern, 100);
      
      expect(updatedPattern.nodes.length).toBe(1);
      expect(updatedPattern.links.length).toBe(1);
      
      // Attention values should be updated based on salience
      const node = updatedPattern.nodes[0];
      const link = updatedPattern.links[0];
      
      expect(node.attentionValue.sti).toBeGreaterThanOrEqual(10);
      expect(link.attentionValue.sti).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Task Scheduling', () => {
    test('schedules task with available resources', () => {
      const task: TaskResource = {
        taskId: 'test_task_1',
        requiredSTI: 100,
        requiredLTI: 50,
        priority: 0.7,
        dependencies: [],
        estimatedDuration: 5000,
        resourceType: 'cognitive'
      };

      const scheduled = ecanKernel.scheduleTask(task);
      expect(scheduled).toBe(true);

      const budget = ecanKernel.getAttentionBudget();
      expect(budget.sti).toBe(900); // 1000 - 100
      expect(budget.lti).toBe(750); // 800 - 50
    });

    test('queues task when resources insufficient', () => {
      // Exhaust most resources
      const bigTask: TaskResource = {
        taskId: 'big_task',
        requiredSTI: 950,
        requiredLTI: 750,
        priority: 0.8,
        dependencies: [],
        estimatedDuration: 10000,
        resourceType: 'executive'
      };

      expect(ecanKernel.scheduleTask(bigTask)).toBe(true);

      // Try to schedule another task that should be queued
      const smallTask: TaskResource = {
        taskId: 'small_task',
        requiredSTI: 100,
        requiredLTI: 100,
        priority: 0.5,
        dependencies: [],
        estimatedDuration: 2000,
        resourceType: 'cognitive'
      };

      expect(ecanKernel.scheduleTask(smallTask)).toBe(false);
    });
  });

  describe('ECANScheduler Integration', () => {
    test('schedules cognitive task with ECAN signature', async () => {
      const taskResource = ECANSchedulingFactory.createCognitiveTask(
        'cognitive_task_1',
        0.6,
        TaskPriority.MEDIUM
      );

      const ecanSignature = ECANTensorFactory.createAttentionSignature(0.6, 0.55);

      const decision = await scheduler.scheduleTask(
        'cognitive_task_1',
        taskResource,
        ecanSignature
      );

      expect(decision.allocated).toBe(true);
      expect(decision.taskId).toBe('cognitive_task_1');
      expect(decision.reason).toContain('scheduled immediately');
    });

    test('creates service message with ECAN priority', () => {
      const message = scheduler.createECANServiceMessage(
        'PROCESS_COGNITIVE',
        { content: 'test data' },
        TaskPriority.HIGH
      );

      expect(message.type).toBe('PROCESS_COGNITIVE');
      expect(message.data.ecan_priority).toBeCloseTo(0.8);
      expect(message.data.attention_required).toBeCloseTo(80);
      expect(message.source).toBe('ecan-scheduler');
    });

    test('processes scheduling cycle', () => {
      scheduler.processSchedulingCycle();
      
      const metrics = scheduler.getMetrics();
      expect(metrics.activationSpreadCycles).toBe(1);
      
      const status = scheduler.getSchedulingStatus();
      expect(status.attentionBudget).toBeDefined();
      expect(status.networkStats).toBeDefined();
    });

    test('gets task priority classification', () => {
      expect(scheduler.getTaskPriorityClass(0.95)).toBe(TaskPriority.CRITICAL);
      expect(scheduler.getTaskPriorityClass(0.8)).toBe(TaskPriority.HIGH);
      expect(scheduler.getTaskPriorityClass(0.55)).toBe(TaskPriority.MEDIUM);
      expect(scheduler.getTaskPriorityClass(0.2)).toBe(TaskPriority.LOW);
    });
  });

  describe('Tensor Fragment ECAN Integration', () => {
    test('creates ECAN-enabled tensor fragment', () => {
      const signature = ECANTensorFactory.createHighPrioritySignature(3, 0.8);
      const data = new Float32Array([0.8, 0.6, 0.9, 0.7]);
      
      const fragment = tensorManager.createECANFragment(
        signature,
        data,
        [4],
        'ecan_test'
      );

      const ecanSignature = fragment.signature as ECANTensorSignature;
      expect(ecanSignature.tasks).toBe(3);
      expect(ecanSignature.priority).toBeCloseTo(0.9);
      expect(fragment.metadata.source_primitive).toBe('ecan_test');
    });

    test('allocates ECAN attention to fragments', () => {
      const signature1 = ECANTensorFactory.createHighPrioritySignature(2, 0.8);
      const signature2 = ECANTensorFactory.createLowPrioritySignature(1, 0.3);
      
      const fragment1 = tensorManager.createECANFragment(
        signature1,
        new Float32Array([0.8, 0.9]),
        [2],
        'high_priority'
      );
      
      const fragment2 = tensorManager.createECANFragment(
        signature2,
        new Float32Array([0.3]),
        [1],
        'low_priority'
      );

      const allocations = tensorManager.allocateECANAttention([fragment1.id, fragment2.id]);
      
      expect(allocations.size).toBe(2);
      
      const highAttention = allocations.get(fragment1.id)!;
      const lowAttention = allocations.get(fragment2.id)!;
      
      // High priority fragment should get more attention
      expect(highAttention.sti).toBeGreaterThan(lowAttention.sti);
      expect(highAttention.lti).toBeGreaterThan(lowAttention.lti);
    });

    test('finds fragments by ECAN criteria', () => {
      const highPrioritySignature = ECANTensorFactory.createHighPrioritySignature(4, 0.9);
      const lowPrioritySignature = ECANTensorFactory.createLowPrioritySignature(1, 0.2);
      
      tensorManager.createECANFragment(
        highPrioritySignature,
        new Float32Array([1, 2, 3, 4]),
        [4],
        'high'
      );
      
      tensorManager.createECANFragment(
        lowPrioritySignature,
        new Float32Array([1]),
        [1],
        'low'
      );

      const highTaskFragments = tensorManager.findECANFragments({
        minTasks: 3,
        minPriority: 0.8
      });

      const lowResourceFragments = tensorManager.findECANFragments({
        minResources: 0.5
      });

      expect(highTaskFragments.length).toBe(1);
      expect(lowResourceFragments.length).toBe(1);
    });

    test('spreads attention between related fragments', () => {
      const signature1 = ECANTensorFactory.createAttentionSignature(0.8, 0.7);
      const signature2 = ECANTensorFactory.createAttentionSignature(0.6, 0.5);
      
      const fragment1 = tensorManager.createECANFragment(
        signature1,
        new Float32Array([0.8]),
        [1],
        'source'
      );
      
      const fragment2 = tensorManager.createECANFragment(
        signature2,
        new Float32Array([0.6]),
        [1],
        'target'
      );

      tensorManager.spreadAttentionBetweenFragments(
        fragment1.id,
        [fragment2.id],
        0.2
      );

      // Should connect nodes in the activation network
      const networkStats = ecanKernel.getNetworkStats();
      expect(networkStats.totalNodes).toBe(2);
      expect(networkStats.totalConnections).toBe(1);
    });

    test('sorts fragments by attention priority', () => {
      const highSig = ECANTensorFactory.createHighPrioritySignature(3, 0.9);
      const medSig = ECANTensorFactory.createAttentionSignature(0.6, 0.5);
      const lowSig = ECANTensorFactory.createLowPrioritySignature(1, 0.2);
      
      const frag1 = tensorManager.createECANFragment(highSig, new Float32Array([1]), [1]);
      const frag2 = tensorManager.createECANFragment(medSig, new Float32Array([1]), [1]);  
      const frag3 = tensorManager.createECANFragment(lowSig, new Float32Array([1]), [1]);

      tensorManager.allocateECANAttention([frag1.id, frag2.id, frag3.id]);
      const sortedFragments = tensorManager.getFragmentsByAttentionPriority();
      
      expect(sortedFragments.length).toBe(3);
      // Should be sorted by total attention value (descending)
      const firstAttention = tensorManager.getFragmentAttention(sortedFragments[0].id)!;
      const lastAttention = tensorManager.getFragmentAttention(sortedFragments[2].id)!;
      
      const firstTotal = firstAttention.sti + firstAttention.lti + firstAttention.vlti;
      const lastTotal = lastAttention.sti + lastAttention.lti + lastAttention.vlti;
      
      expect(firstTotal).toBeGreaterThanOrEqual(lastTotal);
    });
  });

  describe('Real-World Integration Scenarios', () => {
    test('handles concurrent cognitive and executive tasks', async () => {
      // Schedule multiple tasks of different types
      const cognitiveTask = ECANSchedulingFactory.createCognitiveTask(
        'analyze_pattern',
        0.6,
        TaskPriority.MEDIUM
      );

      const executiveTask = ECANSchedulingFactory.createExecutiveTask(
        'make_decision',
        0.9,
        0.8
      );

      const cogSignature = ECANTensorFactory.createAttentionSignature(0.6, 0.55);
      const execSignature = ECANTensorFactory.createHighPrioritySignature(2, 0.8);

      const cogDecision = await scheduler.scheduleTask('analyze_pattern', cognitiveTask, cogSignature);
      const execDecision = await scheduler.scheduleTask('make_decision', executiveTask, execSignature);

      expect(cogDecision.allocated).toBe(true);
      expect(execDecision.allocated).toBe(true);

      // Process a few scheduling cycles
      scheduler.processSchedulingCycle();
      scheduler.processSchedulingCycle();

      const metrics = scheduler.getMetrics();
      expect(metrics.totalTasksScheduled).toBe(2);
      expect(metrics.activationSpreadCycles).toBe(2);
    });

    test('demonstrates activation spreading between related cognitive elements', () => {
      // Create a network of related cognitive fragments
      const perceptionSig = ECANTensorFactory.createAttentionSignature(0.7, 0.6);
      const reasoningSig = ECANTensorFactory.createHighPrioritySignature(3, 0.8);
      const memorySig = ECANTensorFactory.createLowPrioritySignature(1, 0.4);

      const perceptionFrag = tensorManager.createECANFragment(
        perceptionSig, new Float32Array([0.7, 0.8]), [2], 'perception'
      );
      const reasoningFrag = tensorManager.createECANFragment(
        reasoningSig, new Float32Array([0.8, 0.9, 0.7]), [3], 'reasoning'
      );
      const memoryFrag = tensorManager.createECANFragment(
        memorySig, new Float32Array([0.4]), [1], 'memory'
      );

      // Connect related fragments for activation spreading
      tensorManager.spreadAttentionBetweenFragments(
        perceptionFrag.id,
        [reasoningFrag.id, memoryFrag.id],
        0.15
      );

      tensorManager.spreadAttentionBetweenFragments(
        reasoningFrag.id,
        [memoryFrag.id],
        0.1
      );

      // Process multiple spreading cycles
      for (let i = 0; i < 5; i++) {
        ecanKernel.spreadActivation();
      }

      const networkStats = ecanKernel.getNetworkStats();
      expect(networkStats.totalNodes).toBe(3);
      expect(networkStats.totalConnections).toBe(3);
      expect(networkStats.cycleCount).toBe(5);
    });
  });
});