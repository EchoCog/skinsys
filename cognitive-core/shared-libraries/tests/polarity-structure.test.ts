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

    test('cerebral triad should have 6 services with [3] potential focus following [[D-T]-[P-O]-[S-M]] pattern', () => {
      expect(systemDimensionalConfig.cerebral).toHaveLength(6);
      const serviceIds = systemDimensionalConfig.cerebral.map(s => s.serviceId);
      expect(serviceIds).toEqual(['PD-2', 'T-7', 'P-5', 'O-4', 'S-8', 'M-1']);
      
      // Should be [3] Cerebral level
      systemDimensionalConfig.cerebral.forEach(service => {
        expect(service.triadLevel).toBe('[3]');
      });
    });

    test('somatic triad should have 6 services with [6] commitment focus following [[D-T]-[P-O]-[S-M]] pattern', () => {
      expect(systemDimensionalConfig.somatic).toHaveLength(6);
      const serviceIds = systemDimensionalConfig.somatic.map(s => s.serviceId);
      expect(serviceIds).toEqual(['PD-2', 'T-7', 'P-5', 'O-4', 'S-8', 'M-1']);
      
      // Should be [6] Somatic level
      systemDimensionalConfig.somatic.forEach(service => {
        expect(service.triadLevel).toBe('[6]');
      });
    });

    test('autonomic triad should have 6 services with [9] performance focus following [[D-T]-[P-O]-[S-M]] pattern', () => {
      expect(systemDimensionalConfig.autonomic).toHaveLength(6);
      const serviceIds = systemDimensionalConfig.autonomic.map(s => s.serviceId);
      expect(serviceIds).toEqual(['PD-2', 'T-7', 'P-5', 'O-4', 'S-8', 'M-1']);
      
      // Should be [9] Autonomic level
      systemDimensionalConfig.autonomic.forEach(service => {
        expect(service.triadLevel).toBe('[9]');
      });
    });
  });

  describe('Dimensional Distribution', () => {
    test('cerebral triad dimensional distribution - potential focus with [[D-T]-[P-O]-[S-M]] pattern', () => {
      const balance = analyzeDimensionalBalance('cerebral');
      expect(balance.totalServices).toBe(6);
      expect(balance.triadLevel).toBe('[3]');
      expect(balance.dimensionDistribution.potential).toBe(2); // PD-2, T-7
      expect(balance.dimensionDistribution.commitment).toBe(2); // P-5, O-4
      expect(balance.dimensionDistribution.performance).toBe(2); // S-8, M-1
      expect(balance.sharedFunctions).toBe(0); // No shared functions in cerebral
    });

    test('somatic triad dimensional distribution - commitment focus with [[D-T]-[P-O]-[S-M]] pattern', () => {
      const balance = analyzeDimensionalBalance('somatic');
      expect(balance.totalServices).toBe(6);
      expect(balance.triadLevel).toBe('[6]');
      expect(balance.dimensionDistribution.potential).toBe(2); // PD-2, T-7 (Parasympathetic shared)
      expect(balance.dimensionDistribution.commitment).toBe(2); // P-5, O-4
      expect(balance.dimensionDistribution.performance).toBe(2); // S-8, M-1
      expect(balance.sharedFunctions).toBe(2); // PD-2, T-7 shared with autonomic
    });

    test('autonomic triad dimensional distribution - performance focus with [[D-T]-[P-O]-[S-M]] pattern', () => {
      const balance = analyzeDimensionalBalance('autonomic');
      expect(balance.totalServices).toBe(6);
      expect(balance.triadLevel).toBe('[9]');
      expect(balance.dimensionDistribution.potential).toBe(2); // PD-2, T-7 (Parasympathetic shared)
      expect(balance.dimensionDistribution.commitment).toBe(2); // P-5, O-4
      expect(balance.dimensionDistribution.performance).toBe(2); // S-8, M-1
      expect(balance.sharedFunctions).toBe(2); // PD-2, T-7 shared with somatic
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

  describe('18-Service [[D-T]-[P-O]-[S-M]] Pattern Validation', () => {
    test('should validate the triadic structure implements 18-service [[D-T]-[P-O]-[S-M]] pattern', () => {
      const validation = validateTriadicStructure();
      
      expect(validation.expectedFunctions).toBe(18); // 3 triads × 6 services = 18 total
      expect(validation.actualFunctions).toBe(18); // 6 + 6 + 6 services
      expect(validation.uniqueFunctions).toBe(18); // 18 with parasympathetic polarity sharing
      expect(validation.sharedParasympatheticPolarity).toBe(2); // 2 services shared between Somatic & Autonomic
      expect(validation.topology).toBe('C-S-A [3-6-9] Potential-Commitment-Performance');
      
      // The explanation should show the 18-service pattern
      expect(validation.explanation).toContain('18 total functions');
      expect(validation.explanation).toContain('[[D-T]-[P-O]-[S-M]] pattern');
      expect(validation.parasympatheticSharing).toBe('Somatic & Autonomic share Parasympathetic Polarity [D-T] (2-7)');
      expect(validation.basalLimbicBalance).toBe('3 sets of S-M (8-1) form core of Basal-vs-Limbic System Balance');
    });

    test('should correctly count 18 functional implementations with [[D-T]-[P-O]-[S-M]] pattern', () => {
      // Each triad has 6 services following [[D-T]-[P-O]-[S-M]] pattern
      const cerebralServices = systemDimensionalConfig.cerebral.length; // 6
      const somaticServices = systemDimensionalConfig.somatic.length; // 6  
      const autonomicServices = systemDimensionalConfig.autonomic.length; // 6
      const totalServices = cerebralServices + somaticServices + autonomicServices; // 18
      
      expect(totalServices).toBe(18); // This is the 18-service [[D-T]-[P-O]-[S-M]] pattern
      expect(cerebralServices).toBe(6);
      expect(somaticServices).toBe(6);
      expect(autonomicServices).toBe(6);
    });

    test('should validate dimensional flow patterns', () => {
      const validation = validateTriadicStructure();
      
      expect(validation.dimensionalFlows).toEqual([
        '[2-7] Development→Treasury',
        '[5-4] Production→Organization', 
        '[8-1] Sales→Market'
      ]);
    });

    test('should validate parasympathetic polarity sharing between Somatic & Autonomic', () => {
      // Check that PD-2 and T-7 are shared between Somatic and Autonomic
      const somaticDTServices = systemDimensionalConfig.somatic.filter(s => 
        s.dimension.primary === 'potential' && s.dimension.shared
      );
      const autonomicDTServices = systemDimensionalConfig.autonomic.filter(s => 
        s.dimension.primary === 'potential' && s.dimension.shared
      );
      
      expect(somaticDTServices).toHaveLength(2); // PD-2, T-7
      expect(autonomicDTServices).toHaveLength(2); // PD-2, T-7
      
      const somaticDTIds = somaticDTServices.map(s => s.serviceId).sort();
      const autonomicDTIds = autonomicDTServices.map(s => s.serviceId).sort();
      
      expect(somaticDTIds).toEqual(['PD-2', 'T-7']);
      expect(autonomicDTIds).toEqual(['PD-2', 'T-7']);
    });

    test('should validate Basal-Limbic System Balance through 3 sets of S-M services', () => {
      const allServices = [
        ...systemDimensionalConfig.cerebral,
        ...systemDimensionalConfig.somatic,
        ...systemDimensionalConfig.autonomic
      ];
      
      const salesServices = allServices.filter(s => s.dimension.position === 'sales');
      const marketServices = allServices.filter(s => s.dimension.position === 'market');
      
      expect(salesServices).toHaveLength(3); // One S-8 per triad
      expect(marketServices).toHaveLength(3); // One M-1 per triad
      
      // Validate each triad has S-M pair
      ['cerebral', 'somatic', 'autonomic'].forEach(triad => {
        const triadServices = systemDimensionalConfig[triad];
        const triadSales = triadServices.filter(s => s.dimension.position === 'sales');
        const triadMarket = triadServices.filter(s => s.dimension.position === 'market');
        
        expect(triadSales).toHaveLength(1);
        expect(triadMarket).toHaveLength(1);
        expect(triadSales[0].serviceId).toBe('S-8');
        expect(triadMarket[0].serviceId).toBe('M-1');
      });
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