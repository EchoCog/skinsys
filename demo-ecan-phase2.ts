#!/usr/bin/env ts-node
// Demo: ECAN Phase 2 - Attention Allocation & Resource Kernel
// Demonstrates economic attention allocation and activation spreading

import {
  ECANKernel,
  ECANScheduler,
  ECANTensorFactory,
  ECANSchedulingFactory,
  TaskPriority,
  TensorFragmentManager,
  TensorSignatureFactory
} from './cognitive-core/shared-libraries';

async function demonstrateECANPhase2() {
  console.log('🧠 Phase 2: ECAN Attention Allocation & Resource Kernel Demo\n');

  // Initialize ECAN system with economic parameters
  console.log('📊 Initializing ECAN System...');
  const ecanKernel = new ECANKernel({
    totalSTI: 1000,    // Short-term importance budget
    totalLTI: 800,     // Long-term importance budget
    totalVLTI: 400,    // Very long-term importance budget
    minThreshold: 10,
    decayRate: 0.05,
    spreadingRate: 0.15
  });

  const tensorManager = new TensorFragmentManager(ecanKernel);
  const scheduler = new ECANScheduler(ecanKernel, tensorManager);

  console.log('✅ ECAN System initialized');
  console.log(`   • Initial STI Budget: ${ecanKernel.getAttentionBudget().sti}`);
  console.log(`   • Initial LTI Budget: ${ecanKernel.getAttentionBudget().lti}`);
  console.log(`   • Initial VLTI Budget: ${ecanKernel.getAttentionBudget().vlti}\n`);

  // Demo 1: Economic Task Scheduling
  console.log('🎯 Demo 1: Economic Task Scheduling');
  console.log('────────────────────────────────────');

  // Create different priority tasks
  const highPriorityTask = ECANSchedulingFactory.createExecutiveTask(
    'critical_decision', 0.9, 0.8
  );
  const mediumPriorityTask = ECANSchedulingFactory.createCognitiveTask(
    'analyze_pattern', 0.6, TaskPriority.MEDIUM
  );
  const lowPriorityTask = ECANSchedulingFactory.createCognitiveTask(
    'background_learning', 0.3, TaskPriority.LOW
  );

  // Create corresponding ECAN tensor signatures
  const highPrioritySig = ECANTensorFactory.createHighPrioritySignature(4, 0.9);
  const mediumPrioritySig = ECANTensorFactory.createAttentionSignature(0.6, 0.55);
  const lowPrioritySig = ECANTensorFactory.createLowPrioritySignature(1, 0.3);

  // Schedule tasks
  console.log('📋 Scheduling tasks with different priorities...');
  
  const decision1 = await scheduler.scheduleTask('critical_decision', highPriorityTask, highPrioritySig);
  console.log(`   • Critical Decision: ${decision1.allocated ? '✅ ALLOCATED' : '❌ QUEUED'}`);
  
  const decision2 = await scheduler.scheduleTask('analyze_pattern', mediumPriorityTask, mediumPrioritySig);
  console.log(`   • Pattern Analysis: ${decision2.allocated ? '✅ ALLOCATED' : '❌ QUEUED'}`);
  
  const decision3 = await scheduler.scheduleTask('background_learning', lowPriorityTask, lowPrioritySig);
  console.log(`   • Background Learning: ${decision3.allocated ? '✅ ALLOCATED' : '❌ QUEUED'}`);

  // Check remaining budget
  const budgetAfterScheduling = ecanKernel.getAttentionBudget();
  console.log(`\n💰 Remaining Budget after scheduling:`);
  console.log(`   • STI: ${budgetAfterScheduling.sti} (${((budgetAfterScheduling.sti/1000)*100).toFixed(1)}% remaining)`);
  console.log(`   • LTI: ${budgetAfterScheduling.lti} (${((budgetAfterScheduling.lti/800)*100).toFixed(1)}% remaining)`);

  // Demo 2: Tensor Fragment Attention Allocation
  console.log('\n🔗 Demo 2: Tensor Fragment Attention Allocation');
  console.log('─────────────────────────────────────────────────');

  // Create cognitive fragments representing different processes
  console.log('🧩 Creating tensor fragments for cognitive processes...');
  
  const perceptionFragment = tensorManager.createECANFragment(
    ECANTensorFactory.createAttentionSignature(0.8, 0.7),
    new Float32Array([0.8, 0.7, 0.9, 0.6]),
    [4],
    'visual_perception'
  );

  const reasoningFragment = tensorManager.createECANFragment(
    ECANTensorFactory.createHighPrioritySignature(3, 0.9),
    new Float32Array([0.9, 0.8, 0.7]),
    [3],
    'logical_reasoning'
  );

  const memoryFragment = tensorManager.createECANFragment(
    ECANTensorFactory.createLowPrioritySignature(1, 0.4),
    new Float32Array([0.4]),
    [1],
    'long_term_memory'
  );

  console.log(`   • Perception Fragment: ${perceptionFragment.id}`);
  console.log(`   • Reasoning Fragment: ${reasoningFragment.id}`);
  console.log(`   • Memory Fragment: ${memoryFragment.id}`);

  // Allocate attention to fragments
  console.log('\n⚡ Allocating attention using ECAN principles...');
  const fragmentIds = [perceptionFragment.id, reasoningFragment.id, memoryFragment.id];
  const attentionAllocations = tensorManager.allocateECANAttention(fragmentIds);

  attentionAllocations.forEach((allocation, fragmentId) => {
    const fragment = tensorManager.getFragment(fragmentId)!;
    const source = fragment.metadata.source_primitive;
    const totalAttention = allocation.sti + allocation.lti + allocation.vlti;
    console.log(`   • ${source}: STI=${allocation.sti}, LTI=${allocation.lti}, VLTI=${allocation.vlti} (Total: ${totalAttention})`);
  });

  // Demo 3: Activation Spreading Network
  console.log('\n🌐 Demo 3: Activation Spreading Network');
  console.log('──────────────────────────────────────');

  // Connect fragments for attention spreading
  console.log('🔗 Connecting cognitive fragments for activation spreading...');
  tensorManager.spreadAttentionBetweenFragments(
    perceptionFragment.id,
    [reasoningFragment.id, memoryFragment.id],
    0.2 // spreading rate
  );

  tensorManager.spreadAttentionBetweenFragments(
    reasoningFragment.id,
    [memoryFragment.id],
    0.15
  );

  console.log('   • Perception → Reasoning & Memory (rate: 0.2)');
  console.log('   • Reasoning → Memory (rate: 0.15)');

  // Process activation spreading cycles
  console.log('\n🔄 Processing activation spreading cycles...');
  const initialStats = ecanKernel.getNetworkStats();
  console.log(`   • Initial Network: ${initialStats.totalNodes} nodes, ${initialStats.totalConnections} connections`);
  console.log(`   • Average Activation: ${initialStats.averageActivation.toFixed(2)}`);

  // Run spreading cycles
  for (let cycle = 1; cycle <= 5; cycle++) {
    ecanKernel.spreadActivation();
    scheduler.processSchedulingCycle();
    
    if (cycle % 2 === 0) {
      const stats = ecanKernel.getNetworkStats();
      console.log(`   • Cycle ${cycle}: Avg Activation = ${stats.averageActivation.toFixed(2)}`);
    }
  }

  const finalStats = ecanKernel.getNetworkStats();
  console.log(`   • Final Network: ${finalStats.totalNodes} nodes, ${finalStats.totalConnections} connections`);
  console.log(`   • Final Average Activation: ${finalStats.averageActivation.toFixed(2)}`);
  console.log(`   • Total Spreading Cycles: ${finalStats.cycleCount}`);

  // Demo 4: Real-World Integration Scenario
  console.log('\n🚀 Demo 4: Real-World Integration Scenario');
  console.log('─────────────────────────────────────────────');

  console.log('🎭 Simulating complex cognitive scenario...');
  console.log('   Scenario: Visual pattern recognition leading to decision making');

  // Step 1: Visual input processing
  const visualTask = ECANSchedulingFactory.createCognitiveTask(
    'process_visual_input', 0.7, TaskPriority.HIGH
  );
  const visualSig = ECANTensorFactory.createAttentionSignature(0.8, 0.7);
  
  const visualDecision = await scheduler.scheduleTask('process_visual_input', visualTask, visualSig);
  console.log(`   • Visual Processing: ${visualDecision.allocated ? '✅ SCHEDULED' : '❌ DEFERRED'}`);

  // Step 2: Pattern analysis
  const analysisTask = ECANSchedulingFactory.createCognitiveTask(
    'analyze_patterns', 0.6, TaskPriority.MEDIUM
  );
  const analysisSig = ECANTensorFactory.createAttentionSignature(0.6, 0.55);
  
  const analysisDecision = await scheduler.scheduleTask('analyze_patterns', analysisTask, analysisSig);
  console.log(`   • Pattern Analysis: ${analysisDecision.allocated ? '✅ SCHEDULED' : '❌ DEFERRED'}`);

  // Step 3: Decision making
  const decisionTask = ECANSchedulingFactory.createExecutiveTask(
    'make_decision', 0.9, 0.8
  );
  const decisionSig = ECANTensorFactory.createHighPrioritySignature(2, 0.9);
  
  const executiveDecision = await scheduler.scheduleTask('make_decision', decisionTask, decisionSig);
  console.log(`   • Executive Decision: ${executiveDecision.allocated ? '✅ SCHEDULED' : '❌ DEFERRED'}`);

  // Final system state
  console.log('\n📈 Final System State');
  console.log('────────────────────');
  
  const finalBudget = ecanKernel.getAttentionBudget();
  const schedulerMetrics = scheduler.getMetrics();
  const schedulingStatus = scheduler.getSchedulingStatus();

  console.log(`📊 Economic Metrics:`);
  console.log(`   • STI Utilization: ${((1000 - finalBudget.sti)/1000*100).toFixed(1)}%`);
  console.log(`   • LTI Utilization: ${((800 - finalBudget.lti)/800*100).toFixed(1)}%`);
  console.log(`   • Total Tasks Scheduled: ${schedulerMetrics.totalTasksScheduled}`);
  console.log(`   • Resource Utilization: ${(schedulerMetrics.resourceUtilization*100).toFixed(1)}%`);
  console.log(`   • Attention Efficiency: ${(schedulerMetrics.attentionEfficiency*100).toFixed(1)}%`);

  console.log(`\n🌐 Network Statistics:`);
  console.log(`   • Active Fragments: ${schedulingStatus.activeTasks}`);
  console.log(`   • Completed Tasks: ${schedulingStatus.completedTasks}`);
  console.log(`   • Network Nodes: ${schedulingStatus.networkStats.totalNodes}`);
  console.log(`   • Network Connections: ${schedulingStatus.networkStats.totalConnections}`);

  // Get prioritized fragments
  const prioritizedFragments = tensorManager.getFragmentsByAttentionPriority();
  console.log(`\n🎯 Fragment Priority Ranking:`);
  prioritizedFragments.forEach((fragment, index) => {
    const attention = tensorManager.getFragmentAttention(fragment.id);
    const total = attention ? attention.sti + attention.lti + attention.vlti : 0;
    console.log(`   ${index + 1}. ${fragment.metadata.source_primitive} (Total Attention: ${total})`);
  });

  console.log('\n✨ Phase 2 ECAN Demo Complete!');
  console.log('🎯 Key Features Demonstrated:');
  console.log('   ✅ Economic attention allocation with STI/LTI/VLTI budgets');
  console.log('   ✅ Priority-based task scheduling with resource constraints');
  console.log('   ✅ Dynamic tensor fragment attention allocation');
  console.log('   ✅ Activation spreading between cognitive elements');
  console.log('   ✅ Real-world integration scenarios');
  console.log('   ✅ Performance metrics and system monitoring');
}

// Run the demo
if (require.main === module) {
  demonstrateECANPhase2().catch(console.error);
}

export { demonstrateECANPhase2 };