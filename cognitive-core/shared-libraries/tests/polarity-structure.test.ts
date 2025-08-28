import { 
  systemDimensionalConfig, 
  analyzeDimensionalBalance, 
  getSharedDevelopmentServices, 
  validateTriadicStructure,
  getDimensionalFlowPatterns
} from '../src/polarity-config';

describe('Triadic Polarity Structure and C-S-A [3-6-9] Framework', () => {
  
  describe('Basic Dimensional Configuration', () => {
    test('should have correct number of triads', () => {
      expect(Object.keys(systemDimensionalConfig)).toHaveLength(3);
      expect(systemDimensionalConfig).toHaveProperty('cerebral');
      expect(systemDimensionalConfig).toHaveProperty('somatic');
      expect(systemDimensionalConfig).toHaveProperty('autonomic');
    });

    test('cerebral triad should have 4 services with [3] potential focus', () => {
      expect(systemDimensionalConfig.cerebral).toHaveLength(4);
      const serviceIds = systemDimensionalConfig.cerebral.map(s => s.serviceId);
      expect(serviceIds).toEqual(['T-7', 'PD-2', 'P-5', 'O-4']);
      
      // Should be [3] Cerebral level
      systemDimensionalConfig.cerebral.forEach(service => {
        expect(service.triadLevel).toBe('[3]');
      });
    });

    test('somatic triad should have 4 services with [6] commitment focus', () => {
      expect(systemDimensionalConfig.somatic).toHaveLength(4);
      const serviceIds = systemDimensionalConfig.somatic.map(s => s.serviceId);
      expect(serviceIds).toEqual(['M-1', 'S-8', 'P-5', 'O-4']);
      
      // Should be [6] Somatic level
      systemDimensionalConfig.somatic.forEach(service => {
        expect(service.triadLevel).toBe('[6]');
      });
    });

    test('autonomic triad should have 5 services with [9] performance focus', () => {
      expect(systemDimensionalConfig.autonomic).toHaveLength(5);
      const serviceIds = systemDimensionalConfig.autonomic.map(s => s.serviceId);
      expect(serviceIds).toEqual(['M-1', 'S-8', 'PD-2', 'P-5', 'T-7']);
      
      // Should be [9] Autonomic level
      systemDimensionalConfig.autonomic.forEach(service => {
        expect(service.triadLevel).toBe('[9]');
      });
    });
  });

  describe('Dimensional Distribution', () => {
    test('cerebral triad dimensional distribution - potential focus', () => {
      const balance = analyzeDimensionalBalance('cerebral');
      expect(balance.totalServices).toBe(4);
      expect(balance.triadLevel).toBe('[3]');
      expect(balance.dimensionDistribution.potential).toBe(2); // PD-2, T-7
      expect(balance.dimensionDistribution.commitment).toBe(2); // P-5, O-4
      expect(balance.dimensionDistribution.performance).toBe(0); // None
      expect(balance.sharedFunctions).toBe(0); // No shared functions in cerebral
    });

    test('somatic triad dimensional distribution - commitment focus', () => {
      const balance = analyzeDimensionalBalance('somatic');
      expect(balance.totalServices).toBe(4);
      expect(balance.triadLevel).toBe('[6]');
      expect(balance.dimensionDistribution.potential).toBe(0); // Shared from autonomic
      expect(balance.dimensionDistribution.commitment).toBe(3); // M-1, P-5, O-4
      expect(balance.dimensionDistribution.performance).toBe(1); // S-8
      expect(balance.sharedFunctions).toBe(0); // Shared services are in autonomic triad
    });

    test('autonomic triad dimensional distribution - performance focus', () => {
      const balance = analyzeDimensionalBalance('autonomic');
      expect(balance.totalServices).toBe(5);
      expect(balance.triadLevel).toBe('[9]');
      expect(balance.dimensionDistribution.potential).toBe(2); // PD-2, T-7
      expect(balance.dimensionDistribution.commitment).toBe(1); // P-5
      expect(balance.dimensionDistribution.performance).toBe(2); // S-8, M-1
      expect(balance.sharedFunctions).toBe(1); // PD-2 shared with somatic
    });
  });

  describe('Dimensional Flow Patterns', () => {
    test('should define correct dimensional flow patterns', () => {
      const flows = getDimensionalFlowPatterns();
      
      expect(flows.potentialFlow.pattern).toBe('[2-7] Development → Treasury');
      expect(flows.potentialFlow.services).toEqual(['PD-2', 'T-7']);
      
      expect(flows.commitmentFlow.pattern).toBe('[5-4] Production → Organization');
      expect(flows.commitmentFlow.services).toEqual(['P-5', 'O-4']);
      
      expect(flows.performanceFlow.pattern).toBe('[8-1] Sales → Market');
      expect(flows.performanceFlow.services).toEqual(['S-8', 'M-1']);
    });

    test('potential flow services should have correct characteristics', () => {
      const allServices = [
        ...systemDimensionalConfig.cerebral,
        ...systemDimensionalConfig.somatic,
        ...systemDimensionalConfig.autonomic
      ];
      
      const potentialServices = allServices.filter(s => s.dimension.primary === 'potential');
      
      potentialServices.forEach(service => {
        expect(service.dimension.flow).toBe('[2-7]');
        expect(['development', 'treasury']).toContain(service.dimension.position);
      });
    });

    test('commitment flow services should have correct characteristics', () => {
      const allServices = [
        ...systemDimensionalConfig.cerebral,
        ...systemDimensionalConfig.somatic,
        ...systemDimensionalConfig.autonomic
      ];
      
      const commitmentServices = allServices.filter(s => s.dimension.primary === 'commitment');
      
      commitmentServices.forEach(service => {
        expect(service.dimension.flow).toBe('[5-4]');
        expect(['production', 'organization']).toContain(service.dimension.position);
      });
    });
  });

  describe('Shared Development Functions', () => {
    test('should identify exactly 1 shared development service', () => {
      const sharedServices = getSharedDevelopmentServices();
      expect(sharedServices).toHaveLength(1);
      
      const sharedIds = sharedServices.map(s => s.serviceId);
      expect(sharedIds).toEqual(['PD-2']);
    });

    test('shared development service should serve both autonomic and somatic triads', () => {
      const sharedServices = getSharedDevelopmentServices();
      
      sharedServices.forEach(service => {
        expect(service.dimension.primary).toBe('potential');
        expect(service.dimension.position).toBe('development');
        expect(service.dimension.shared).toBe(true);
        expect(service.triad).toBe('autonomic'); // Primary triad
      });
    });

    test('shared development service should have maintenance characteristics', () => {
      const sharedServices = getSharedDevelopmentServices();
      
      sharedServices.forEach(service => {
        expect(service.dimension.characteristics.energyLevel).toBe('low');
        expect(service.dimension.characteristics.responseTime).toBe('background');
        expect(service.dimension.characteristics.processingMode).toBe('maintenance');
        expect(service.dimension.characteristics.coordination).toBe('collaborative');
      });
    });
  });

  describe('16 vs 18 Function Validation', () => {
    test('should validate the triadic structure explains 16 vs 18 functions', () => {
      const validation = validateTriadicStructure();
      
      expect(validation.expectedFunctions).toBe(18); // 3 triads × 3 dimensions × 2 positions
      expect(validation.actualFunctions).toBe(13); // 4 + 4 + 5 services
      expect(validation.sharedDevelopment).toBe(1); // 1 shared development service
      expect(validation.uniqueFunctions).toBe(16); // 13 + 3 shared implementations
      expect(validation.topology).toBe('C-S-A [3-6-9] Potential-Commitment-Performance');
      
      // The explanation should show why we have 16 functional implementations
      expect(validation.explanation).toContain('13 total functions');
      expect(validation.explanation).toContain('1 shared development');
      expect(validation.explanation).toContain('16 unique implementations');
    });

    test('should correctly count unique functional implementations', () => {
      // Each service represents a functional implementation
      // Shared development service provides additional implementations for both triads
      const cerebralServices = systemDimensionalConfig.cerebral.length; // 4
      const somaticServices = systemDimensionalConfig.somatic.length; // 4  
      const autonomicServices = systemDimensionalConfig.autonomic.length; // 5
      const totalServices = cerebralServices + somaticServices + autonomicServices; // 13
      
      const sharedDevelopmentServices = getSharedDevelopmentServices().length; // 1
      const additionalSharedImplementations = 3; // M-1, S-8, PD-2 shared access
      
      // Functional implementations = services + additional shared implementations
      const totalImplementations = totalServices + additionalSharedImplementations;
      
      expect(totalImplementations).toBe(16); // This is why we have 16 functions, not 18
    });

    test('should validate dimensional flow patterns', () => {
      const validation = validateTriadicStructure();
      
      expect(validation.dimensionalFlows).toEqual([
        '[2-7] Development→Treasury',
        '[5-4] Production→Organization', 
        '[8-1] Sales→Market'
      ]);
    });
  });

  describe('Service Dimensional Mappings', () => {
    test('potential services should have development→treasury flow characteristics', () => {
      const allServices = [
        ...systemDimensionalConfig.cerebral,
        ...systemDimensionalConfig.somatic,
        ...systemDimensionalConfig.autonomic
      ];
      
      const potentialServices = allServices.filter(s => s.dimension.primary === 'potential');
      
      potentialServices.forEach(service => {
        expect(service.dimension.flow).toBe('[2-7]');
        expect(['development', 'treasury']).toContain(service.dimension.position);
        expect(['creative', 'reactive']).toContain(service.dimension.characteristics.processingMode);
      });
    });

    test('commitment services should have production→organization flow characteristics', () => {
      const allServices = [
        ...systemDimensionalConfig.cerebral,
        ...systemDimensionalConfig.somatic,
        ...systemDimensionalConfig.autonomic
      ];
      
      const commitmentServices = allServices.filter(s => s.dimension.primary === 'commitment');
      
      commitmentServices.forEach(service => {
        expect(service.dimension.flow).toBe('[5-4]');
        expect(['production', 'organization']).toContain(service.dimension.position);
        expect(['analytical', 'reactive']).toContain(service.dimension.characteristics.processingMode);
      });
    });

    test('performance services should have sales→market flow characteristics', () => {
      const allServices = [
        ...systemDimensionalConfig.cerebral,
        ...systemDimensionalConfig.somatic,
        ...systemDimensionalConfig.autonomic
      ];
      
      const performanceServices = allServices.filter(s => s.dimension.primary === 'performance');
      
      performanceServices.forEach(service => {
        expect(service.dimension.flow).toBe('[8-1]');
        expect(['sales', 'market']).toContain(service.dimension.position);
        expect(['maintenance', 'reactive']).toContain(service.dimension.characteristics.processingMode);
      });
    });

    test('each triad should have appropriate dimensional representation', () => {
      // Cerebral [3]: Should focus on potential with some commitment
      const cerebralDimensions = systemDimensionalConfig.cerebral.map(s => s.dimension.primary);
      expect(cerebralDimensions.filter(d => d === 'potential')).toHaveLength(2);
      expect(cerebralDimensions.filter(d => d === 'commitment')).toHaveLength(2);
      expect(cerebralDimensions.filter(d => d === 'performance')).toHaveLength(0);

      // Somatic [6]: Should focus on commitment with some performance
      const somaticDimensions = systemDimensionalConfig.somatic.map(s => s.dimension.primary);
      expect(somaticDimensions.filter(d => d === 'commitment')).toHaveLength(3);
      expect(somaticDimensions.filter(d => d === 'performance')).toHaveLength(1);
      expect(somaticDimensions.filter(d => d === 'potential')).toHaveLength(0); // Shared from autonomic

      // Autonomic [9]: Should focus on performance with potential and commitment
      const autonomicDimensions = systemDimensionalConfig.autonomic.map(s => s.dimension.primary);
      expect(autonomicDimensions.filter(d => d === 'performance')).toHaveLength(2);
      expect(autonomicDimensions.filter(d => d === 'potential')).toHaveLength(2);
      expect(autonomicDimensions.filter(d => d === 'commitment')).toHaveLength(1);
    });
  });

  describe('Neurobiological Accuracy', () => {
    test('development sharing reflects neurobiological reality', () => {
      // In real nervous systems, development functions (background coordination)
      // do indeed span both somatic and autonomic systems
      const sharedServices = getSharedDevelopmentServices();
      const serviceNames = sharedServices.map(s => s.serviceName);
      
      // This should be development-related function
      expect(serviceNames).toContain('Process Director'); // Background development coordination
    });

    test('triadic levels should reflect C-S-A [3-6-9] hierarchy', () => {
      // Cerebral [3] - Potential focus (higher-order cognitive)
      systemDimensionalConfig.cerebral.forEach(service => {
        expect(service.triadLevel).toBe('[3]');
      });

      // Somatic [6] - Commitment focus (motor implementation)  
      systemDimensionalConfig.somatic.forEach(service => {
        expect(service.triadLevel).toBe('[6]');
      });

      // Autonomic [9] - Performance focus (background optimization)
      systemDimensionalConfig.autonomic.forEach(service => {
        expect(service.triadLevel).toBe('[9]');
      });
    });

    test('dimensional flows should create proper topology', () => {
      const validation = validateTriadicStructure();
      
      expect(validation.topology).toBe('C-S-A [3-6-9] Potential-Commitment-Performance');
      
      // Should have all three dimensional flows
      expect(validation.dimensionalFlows).toHaveLength(3);
      expect(validation.dimensionalFlows).toContain('[2-7] Development→Treasury');
      expect(validation.dimensionalFlows).toContain('[5-4] Production→Organization');
      expect(validation.dimensionalFlows).toContain('[8-1] Sales→Market');
    });
  });
});