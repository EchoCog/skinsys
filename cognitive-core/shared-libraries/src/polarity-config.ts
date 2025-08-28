// Polarity-aware service configurations for the Cognitive Cities system
// This demonstrates how to implement polarity metadata in service configurations

export interface PolarityMetadata {
  primary: 'sympathetic' | 'parasympathetic' | 'somatic';
  secondary?: 'sympathetic' | 'parasympathetic' | 'somatic';
  shared: boolean;
  characteristics: PolarityCharacteristics;
}

export interface PolarityCharacteristics {
  energyLevel: 'high' | 'medium' | 'low';
  responseTime: 'immediate' | 'near-realtime' | 'background';
  processingMode: 'reactive' | 'proactive' | 'maintenance';
  coordination: 'autonomous' | 'collaborative' | 'dependent';
}

export interface ServicePolarityConfig {
  serviceId: string;
  serviceName: string;
  triad: 'cerebral' | 'somatic' | 'autonomic';
  polarity: PolarityMetadata;
  interactions: PolarityInteraction[];
}

export interface PolarityInteraction {
  targetService: string;
  interactionType: 'activation' | 'coordination' | 'feedback' | 'inhibition';
  conditions: string[];
}

// Cerebral Triad Service Configurations
export const cerebralTriadPolarities: ServicePolarityConfig[] = [
  {
    serviceId: 'T-7',
    serviceName: 'Thought Service',
    triad: 'cerebral',
    polarity: {
      primary: 'sympathetic',
      shared: false,
      characteristics: {
        energyLevel: 'high',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'autonomous'
      }
    },
    interactions: [
      {
        targetService: 'PD-2',
        interactionType: 'activation',
        conditions: ['idea_generated', 'creative_insight']
      }
    ]
  },
  {
    serviceId: 'PD-2',
    serviceName: 'Processing Director',
    triad: 'cerebral',
    polarity: {
      primary: 'parasympathetic',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'near-realtime',
        processingMode: 'proactive',
        coordination: 'collaborative'
      }
    },
    interactions: [
      {
        targetService: 'P-5',
        interactionType: 'coordination',
        conditions: ['processing_required', 'resource_available']
      }
    ]
  },
  {
    serviceId: 'P-5',
    serviceName: 'Processing Service',
    triad: 'cerebral',
    polarity: {
      primary: 'somatic',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'near-realtime',
        processingMode: 'proactive',
        coordination: 'dependent'
      }
    },
    interactions: [
      {
        targetService: 'O-4',
        interactionType: 'activation',
        conditions: ['analysis_complete', 'output_required']
      }
    ]
  },
  {
    serviceId: 'O-4',
    serviceName: 'Output Service',
    triad: 'cerebral',
    polarity: {
      primary: 'somatic',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'dependent'
      }
    },
    interactions: []
  }
];

// Somatic Triad Service Configurations
export const somaticTriadPolarities: ServicePolarityConfig[] = [
  {
    serviceId: 'M-1',
    serviceName: 'Motor Control Service',
    triad: 'somatic',
    polarity: {
      primary: 'sympathetic',
      shared: false,
      characteristics: {
        energyLevel: 'high',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'autonomous'
      }
    },
    interactions: [
      {
        targetService: 'P-5',
        interactionType: 'activation',
        conditions: ['motor_command_received', 'action_required']
      }
    ]
  },
  {
    serviceId: 'S-8',
    serviceName: 'Sensory Service',
    triad: 'somatic',
    polarity: {
      primary: 'somatic',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'autonomous'
      }
    },
    interactions: [
      {
        targetService: 'M-1',
        interactionType: 'feedback',
        conditions: ['sensory_input_processed', 'environmental_change']
      }
    ]
  },
  {
    serviceId: 'P-5',
    serviceName: 'Processing Service',
    triad: 'somatic',
    polarity: {
      primary: 'somatic',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'near-realtime',
        processingMode: 'proactive',
        coordination: 'collaborative'
      }
    },
    interactions: [
      {
        targetService: 'O-4',
        interactionType: 'activation',
        conditions: ['behavioral_technique_processed']
      }
    ]
  },
  {
    serviceId: 'O-4',
    serviceName: 'Output Service',
    triad: 'somatic',
    polarity: {
      primary: 'sympathetic',
      shared: false,
      characteristics: {
        energyLevel: 'high',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'autonomous'
      }
    },
    interactions: []
  }
];

// Autonomic Triad Service Configurations
export const autonomicTriadPolarities: ServicePolarityConfig[] = [
  {
    serviceId: 'M-1',
    serviceName: 'Monitoring Service',
    triad: 'autonomic',
    polarity: {
      primary: 'parasympathetic',
      secondary: 'somatic', // Also serves somatic triad
      shared: true,
      characteristics: {
        energyLevel: 'low',
        responseTime: 'background',
        processingMode: 'maintenance',
        coordination: 'collaborative'
      }
    },
    interactions: [
      {
        targetService: 'S-8',
        interactionType: 'coordination',
        conditions: ['system_health_update', 'state_change_required']
      }
    ]
  },
  {
    serviceId: 'S-8',
    serviceName: 'State Management Service',
    triad: 'autonomic',
    polarity: {
      primary: 'parasympathetic',
      secondary: 'somatic', // Also serves somatic triad
      shared: true,
      characteristics: {
        energyLevel: 'low',
        responseTime: 'background',
        processingMode: 'maintenance',
        coordination: 'collaborative'
      }
    },
    interactions: [
      {
        targetService: 'PD-2',
        interactionType: 'coordination',
        conditions: ['state_updated', 'process_adjustment_needed']
      }
    ]
  },
  {
    serviceId: 'PD-2',
    serviceName: 'Process Director',
    triad: 'autonomic',
    polarity: {
      primary: 'parasympathetic',
      secondary: 'somatic', // Also serves somatic triad
      shared: true,
      characteristics: {
        energyLevel: 'low',
        responseTime: 'background',
        processingMode: 'maintenance',
        coordination: 'collaborative'
      }
    },
    interactions: [
      {
        targetService: 'P-5',
        interactionType: 'coordination',
        conditions: ['background_process_required']
      }
    ]
  },
  {
    serviceId: 'P-5',
    serviceName: 'Processing Service',
    triad: 'autonomic',
    polarity: {
      primary: 'somatic',
      shared: false,
      characteristics: {
        energyLevel: 'medium',
        responseTime: 'near-realtime',
        processingMode: 'proactive',
        coordination: 'collaborative'
      }
    },
    interactions: [
      {
        targetService: 'T-7',
        interactionType: 'activation',
        conditions: ['emotive_response_required', 'trigger_condition_met']
      }
    ]
  },
  {
    serviceId: 'T-7',
    serviceName: 'Trigger Service',
    triad: 'autonomic',
    polarity: {
      primary: 'sympathetic',
      shared: false,
      characteristics: {
        energyLevel: 'high',
        responseTime: 'immediate',
        processingMode: 'reactive',
        coordination: 'autonomous'
      }
    },
    interactions: []
  }
];

// Complete system polarity configuration
export const systemPolarityConfig = {
  cerebral: cerebralTriadPolarities,
  somatic: somaticTriadPolarities,
  autonomic: autonomicTriadPolarities
};

// Polarity balance analysis functions
export function analyzePolarityBalance(triad: 'cerebral' | 'somatic' | 'autonomic') {
  const services = systemPolarityConfig[triad];
  const polarityCounts = services.reduce((acc, service) => {
    acc[service.polarity.primary]++;
    if (service.polarity.secondary) {
      acc[service.polarity.secondary]++;
    }
    return acc;
  }, { sympathetic: 0, parasympathetic: 0, somatic: 0 });
  
  return {
    triad,
    totalServices: services.length,
    polarityDistribution: polarityCounts,
    sharedFunctions: services.filter(s => s.polarity.shared).length
  };
}

export function getSharedParasympatheticServices() {
  return autonomicTriadPolarities.filter(service => 
    service.polarity.primary === 'parasympathetic' && service.polarity.shared
  );
}

export function validateEnneadStructure() {
  const cerebralBalance = analyzePolarityBalance('cerebral');
  const somaticBalance = analyzePolarityBalance('somatic');
  const autonomicBalance = analyzePolarityBalance('autonomic');
  
  const totalFunctions = cerebralBalance.totalServices + 
                        somaticBalance.totalServices + 
                        autonomicBalance.totalServices;
  
  const sharedFunctions = getSharedParasympatheticServices().length;
  
  return {
    expectedFunctions: 18, // 3 triads × 6 functions
    actualFunctions: totalFunctions,
    uniqueFunctions: totalFunctions - sharedFunctions, // Should be 16
    sharedParasympathetic: sharedFunctions,
    explanation: `${totalFunctions} total functions - ${sharedFunctions} shared parasympathetic = ${totalFunctions - sharedFunctions} unique implementations`
  };
}