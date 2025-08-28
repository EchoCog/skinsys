// Triadic polarity configurations for the Cognitive Cities system
// Implementing C-S-A [3-6-9] Potential-Commitment-Performance Topology

export interface DimensionalMetadata {
  primary: 'potential' | 'commitment' | 'performance';
  flow: '[2-7]' | '[5-4]' | '[8-9]';
  position: 'development' | 'treasury' | 'production' | 'organization' | 'sales' | 'market';
  shared: boolean;
  characteristics: DimensionalCharacteristics;
}

export interface DimensionalCharacteristics {
  energyLevel: 'high' | 'medium' | 'low';
  responseTime: 'immediate' | 'near-realtime' | 'background';
  processingMode: 'creative' | 'analytical' | 'maintenance' | 'reactive';
  coordination: 'autonomous' | 'collaborative' | 'dependent';
  flowDirection: 'input' | 'output' | 'bidirectional';
}

export interface ServiceDimensionalConfig {
  serviceId: string;
  serviceName: string;
  triad: 'cerebral' | 'somatic' | 'autonomic';
  triadLevel: '[3]' | '[6]' | '[9]';
  dimension: DimensionalMetadata;
  interactions: DimensionalInteraction[];
}

export interface DimensionalInteraction {
  targetService: string;
  interactionType: 'flow' | 'coordination' | 'feedback' | 'sharing';
  flowPattern: 'development→treasury' | 'production→organization' | 'sales→market' | 'cross-dimensional';
  conditions: string[];
}

// Cerebral Triad [3] - Potential Focus Service Configurations
export const cerebralTriadDimensions: ServiceDimensionalConfig[] = [
  {
    serviceId: 'T-7',
    serviceName: 'Thought Service',
    triad: 'cerebral',
    triadLevel: '[3]',
    dimension: {
      primary: 'potential',
      flow: '[2-7]',
      position: 'treasury',
      shared: false,
      characteristics: {
        energyLevel: 'high',
        responseTime: 'immediate',
        processingMode: 'creative',
        coordination: 'autonomous',
        flowDirection: 'output'
      }
    },
    interactions: [
      {
        targetService: 'PD-2',
        interactionType: 'flow',
        flowPattern: 'development→treasury',
        conditions: ['coordination_enabled', 'creative_insight_generated']
      }
    ]
  },
  {
    serviceId: 'PD-2',
    serviceName: 'Processing Director',
    triad: 'cerebral',
    triadLevel: '[3]',
    dimension: {
      primary: 'potential',
      flow: '[2-7]',
      position: 'development',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'background',
        processingMode: 'analytical',
        coordination: 'collaborative',
        flowDirection: 'bidirectional'
      }
    },
    interactions: [
      {
        targetService: 'T-7',
        interactionType: 'flow',
        flowPattern: 'development→treasury',
        conditions: ['resource_available', 'coordination_required']
      },
      {
        targetService: 'P-5',
        interactionType: 'coordination',
        flowPattern: 'cross-dimensional',
        conditions: ['processing_required']
      }
    ]
  },
  {
    serviceId: 'P-5',
    serviceName: 'Processing Service',
    triad: 'cerebral',
    triadLevel: '[3]',
    dimension: {
      primary: 'commitment',
      flow: '[5-4]',
      position: 'production',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'near-realtime',
        processingMode: 'analytical',
        coordination: 'dependent',
        flowDirection: 'bidirectional'
      }
    },
    interactions: [
      {
        targetService: 'O-4',
        interactionType: 'flow',
        flowPattern: 'production→organization',
        conditions: ['analysis_complete', 'output_required']
      }
    ]
  },
  {
    serviceId: 'O-4',
    serviceName: 'Output Service',
    triad: 'cerebral',
    triadLevel: '[3]',
    dimension: {
      primary: 'commitment',
      flow: '[5-4]',
      position: 'organization',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'immediate',
        processingMode: 'analytical',
        coordination: 'dependent',
        flowDirection: 'output'
      }
    },
    interactions: []
  }
];

// Somatic Triad [6] - Commitment Focus Service Configurations
export const somaticTriadDimensions: ServiceDimensionalConfig[] = [
  {
    serviceId: 'M-1',
    serviceName: 'Motor Control Service',
    triad: 'somatic',
    triadLevel: '[6]',
    dimension: {
      primary: 'commitment',
      flow: '[5-4]',
      position: 'production',
      shared: false,
      characteristics: {
        energyLevel: 'high',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'autonomous',
        flowDirection: 'output'
      }
    },
    interactions: [
      {
        targetService: 'P-5',
        interactionType: 'coordination',
        flowPattern: 'production→organization',
        conditions: ['motor_command_received', 'action_required']
      }
    ]
  },
  {
    serviceId: 'S-8',
    serviceName: 'Sensory Service',
    triad: 'somatic',
    triadLevel: '[6]',
    dimension: {
      primary: 'performance',
      flow: '[8-9]',
      position: 'sales',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'autonomous',
        flowDirection: 'input'
      }
    },
    interactions: [
      {
        targetService: 'M-1',
        interactionType: 'feedback',
        flowPattern: 'sales→market',
        conditions: ['sensory_input_processed', 'environmental_change']
      }
    ]
  },
  {
    serviceId: 'P-5',
    serviceName: 'Processing Service',
    triad: 'somatic',
    triadLevel: '[6]',
    dimension: {
      primary: 'commitment',
      flow: '[5-4]',
      position: 'production',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'near-realtime',
        processingMode: 'analytical',
        coordination: 'collaborative',
        flowDirection: 'bidirectional'
      }
    },
    interactions: [
      {
        targetService: 'O-4',
        interactionType: 'flow',
        flowPattern: 'production→organization',
        conditions: ['behavioral_technique_processed']
      }
    ]
  },
  {
    serviceId: 'O-4',
    serviceName: 'Output Service',
    triad: 'somatic',
    triadLevel: '[6]',
    dimension: {
      primary: 'commitment',
      flow: '[5-4]',
      position: 'organization',
      shared: false,
      characteristics: {
        energyLevel: 'high',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'autonomous',
        flowDirection: 'output'
      }
    },
    interactions: []
  }
];

// Autonomic Triad [9] - Performance Focus Service Configurations
export const autonomicTriadDimensions: ServiceDimensionalConfig[] = [
  {
    serviceId: 'M-1',
    serviceName: 'Monitoring Service',
    triad: 'autonomic',
    triadLevel: '[9]',
    dimension: {
      primary: 'performance',
      flow: '[8-9]',
      position: 'market',
      shared: false,
      characteristics: {
        energyLevel: 'low',
        responseTime: 'background',
        processingMode: 'maintenance',
        coordination: 'collaborative',
        flowDirection: 'input'
      }
    },
    interactions: [
      {
        targetService: 'S-8',
        interactionType: 'coordination',
        flowPattern: 'sales→market',
        conditions: ['system_health_update', 'state_change_required']
      }
    ]
  },
  {
    serviceId: 'S-8',
    serviceName: 'State Management Service',
    triad: 'autonomic',
    triadLevel: '[9]',
    dimension: {
      primary: 'performance',
      flow: '[8-9]',
      position: 'sales',
      shared: false,
      characteristics: {
        energyLevel: 'low',
        responseTime: 'background',
        processingMode: 'maintenance',
        coordination: 'collaborative',
        flowDirection: 'bidirectional'
      }
    },
    interactions: [
      {
        targetService: 'PD-2',
        interactionType: 'coordination',
        flowPattern: 'cross-dimensional',
        conditions: ['state_updated', 'process_adjustment_needed']
      }
    ]
  },
  {
    serviceId: 'PD-2',
    serviceName: 'Process Director',
    triad: 'autonomic',
    triadLevel: '[9]',
    dimension: {
      primary: 'potential',
      flow: '[2-7]',
      position: 'development',
      shared: true, // Also serves somatic triad
      characteristics: {
        energyLevel: 'low',
        responseTime: 'background',
        processingMode: 'maintenance',
        coordination: 'collaborative',
        flowDirection: 'bidirectional'
      }
    },
    interactions: [
      {
        targetService: 'P-5',
        interactionType: 'coordination',
        flowPattern: 'development→treasury',
        conditions: ['background_process_required']
      },
      {
        targetService: 'somatic-triad',
        interactionType: 'sharing',
        flowPattern: 'development→treasury',
        conditions: ['motor_development_required', 'behavioral_optimization']
      }
    ]
  },
  {
    serviceId: 'P-5',
    serviceName: 'Processing Service',
    triad: 'autonomic',
    triadLevel: '[9]',
    dimension: {
      primary: 'commitment',
      flow: '[5-4]',
      position: 'production',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'near-realtime',
        processingMode: 'analytical',
        coordination: 'collaborative',
        flowDirection: 'bidirectional'
      }
    },
    interactions: [
      {
        targetService: 'T-7',
        interactionType: 'coordination',
        flowPattern: 'production→organization',
        conditions: ['emotive_response_required', 'trigger_condition_met']
      }
    ]
  },
  {
    serviceId: 'T-7',
    serviceName: 'Trigger Service',
    triad: 'autonomic',
    triadLevel: '[9]',
    dimension: {
      primary: 'potential',
      flow: '[2-7]',
      position: 'treasury',
      shared: false,
      characteristics: {
        energyLevel: 'high',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'autonomous',
        flowDirection: 'output'
      }
    },
    interactions: []
  }
];

// Complete system dimensional configuration
export const systemDimensionalConfig = {
  cerebral: cerebralTriadDimensions,
  somatic: somaticTriadDimensions,
  autonomic: autonomicTriadDimensions
};

// Dimensional balance analysis functions
export function analyzeDimensionalBalance(triad: 'cerebral' | 'somatic' | 'autonomic') {
  const services = systemDimensionalConfig[triad];
  const dimensionCounts = services.reduce((acc, service) => {
    acc[service.dimension.primary]++;
    return acc;
  }, { potential: 0, commitment: 0, performance: 0 });
  
  const flowCounts = services.reduce((acc, service) => {
    acc[service.dimension.flow]++;
    return acc;
  }, { '[2-7]': 0, '[5-4]': 0, '[8-9]': 0 });
  
  return {
    triad,
    triadLevel: services[0]?.triadLevel || 'unknown',
    totalServices: services.length,
    dimensionDistribution: dimensionCounts,
    flowDistribution: flowCounts,
    sharedFunctions: services.filter(s => s.dimension.shared).length
  };
}

export function getSharedDevelopmentServices() {
  return autonomicTriadDimensions.filter(service => 
    service.dimension.position === 'development' && service.dimension.shared
  );
}

export function validateTriadicStructure() {
  const cerebralBalance = analyzeDimensionalBalance('cerebral');
  const somaticBalance = analyzeDimensionalBalance('somatic');
  const autonomicBalance = analyzeDimensionalBalance('autonomic');
  
  const totalFunctions = cerebralBalance.totalServices + 
                        somaticBalance.totalServices + 
                        autonomicBalance.totalServices;
  
  const sharedFunctions = getSharedDevelopmentServices().length;
  
  return {
    expectedFunctions: 18, // 3 triads × 3 dimensions × 2 positions
    actualFunctions: totalFunctions,
    uniqueFunctions: totalFunctions - sharedFunctions, // Should be 16
    sharedDevelopment: sharedFunctions,
    topology: 'C-S-A [3-6-9] Potential-Commitment-Performance',
    dimensionalFlows: ['[2-7] Development→Treasury', '[5-4] Production→Organization', '[8-9] Sales→Market'],
    explanation: `${totalFunctions} total functions - ${sharedFunctions} shared development = ${totalFunctions - sharedFunctions} unique implementations`
  };
}

export function getDimensionalFlowPatterns() {
  return {
    potentialFlow: {
      pattern: '[2-7] Development → Treasury',
      description: 'Development/Ideation process flows through Treasury/Memory structure',
      services: ['PD-2', 'T-7']
    },
    commitmentFlow: {
      pattern: '[5-4] Production → Organization', 
      description: 'Production/Motor process flows through Organization/Sensory structure',
      services: ['P-5', 'O-4']
    },
    performanceFlow: {
      pattern: '[8-9] Sales → Market',
      description: 'Sales/Promotion process flows through Market/Perception structure', 
      services: ['S-8', 'M-1']
    }
  };
}