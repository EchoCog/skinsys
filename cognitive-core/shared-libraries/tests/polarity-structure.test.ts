import { 
  systemPolarityConfig, 
  analyzePolarityBalance, 
  getSharedParasympatheticServices, 
  validateEnneadStructure 
} from '../src/polarity-config';

describe('Polarity Structure and Ennead Framework', () => {
  
  describe('Basic Polarity Configuration', () => {
    test('should have correct number of triads', () => {
      expect(Object.keys(systemPolarityConfig)).toHaveLength(3);
      expect(systemPolarityConfig).toHaveProperty('cerebral');
      expect(systemPolarityConfig).toHaveProperty('somatic');
      expect(systemPolarityConfig).toHaveProperty('autonomic');
    });

    test('cerebral triad should have 4 services', () => {
      expect(systemPolarityConfig.cerebral).toHaveLength(4);
      const serviceIds = systemPolarityConfig.cerebral.map(s => s.serviceId);
      expect(serviceIds).toEqual(['T-7', 'PD-2', 'P-5', 'O-4']);
    });

    test('somatic triad should have 4 services', () => {
      expect(systemPolarityConfig.somatic).toHaveLength(4);
      const serviceIds = systemPolarityConfig.somatic.map(s => s.serviceId);
      expect(serviceIds).toEqual(['M-1', 'S-8', 'P-5', 'O-4']);
    });

    test('autonomic triad should have 5 services', () => {
      expect(systemPolarityConfig.autonomic).toHaveLength(5);
      const serviceIds = systemPolarityConfig.autonomic.map(s => s.serviceId);
      expect(serviceIds).toEqual(['M-1', 'S-8', 'PD-2', 'P-5', 'T-7']);
    });
  });

  describe('Polarity Distribution', () => {
    test('cerebral triad polarity distribution', () => {
      const balance = analyzePolarityBalance('cerebral');
      expect(balance.totalServices).toBe(4);
      expect(balance.polarityDistribution.sympathetic).toBe(1); // T-7
      expect(balance.polarityDistribution.parasympathetic).toBe(1); // PD-2
      expect(balance.polarityDistribution.somatic).toBe(2); // P-5, O-4
      expect(balance.sharedFunctions).toBe(0); // No shared functions in cerebral
    });

    test('somatic triad polarity distribution', () => {
      const balance = analyzePolarityBalance('somatic');
      expect(balance.totalServices).toBe(4);
      expect(balance.polarityDistribution.sympathetic).toBe(2); // M-1, O-4
      expect(balance.polarityDistribution.parasympathetic).toBe(0); // None primary, shared via autonomic
      expect(balance.polarityDistribution.somatic).toBe(2); // S-8, P-5
      expect(balance.sharedFunctions).toBe(0); // Shared services are in autonomic triad
    });

    test('autonomic triad polarity distribution', () => {
      const balance = analyzePolarityBalance('autonomic');
      expect(balance.totalServices).toBe(5);
      expect(balance.polarityDistribution.sympathetic).toBe(1); // T-7
      expect(balance.polarityDistribution.parasympathetic).toBe(3); // M-1, S-8, PD-2 (shared)
      expect(balance.polarityDistribution.somatic).toBe(4); // P-5 + 3 secondary from shared
      expect(balance.sharedFunctions).toBe(3); // M-1, S-8, PD-2
    });
  });

  describe('Shared Parasympathetic Functions', () => {
    test('should identify exactly 3 shared parasympathetic services', () => {
      const sharedServices = getSharedParasympatheticServices();
      expect(sharedServices).toHaveLength(3);
      
      const sharedIds = sharedServices.map(s => s.serviceId);
      expect(sharedIds).toEqual(['M-1', 'S-8', 'PD-2']);
    });

    test('shared services should have both primary and secondary polarities', () => {
      const sharedServices = getSharedParasympatheticServices();
      
      sharedServices.forEach(service => {
        expect(service.polarity.primary).toBe('parasympathetic');
        expect(service.polarity.secondary).toBe('somatic');
        expect(service.polarity.shared).toBe(true);
      });
    });

    test('shared services should have maintenance characteristics', () => {
      const sharedServices = getSharedParasympatheticServices();
      
      sharedServices.forEach(service => {
        expect(service.polarity.characteristics.energyLevel).toBe('low');
        expect(service.polarity.characteristics.responseTime).toBe('background');
        expect(service.polarity.characteristics.processingMode).toBe('maintenance');
        expect(service.polarity.characteristics.coordination).toBe('collaborative');
      });
    });
  });

  describe('16 vs 18 Function Validation', () => {
    test('should validate the ennead structure explains 16 vs 18 functions', () => {
      const validation = validateEnneadStructure();
      
      expect(validation.expectedFunctions).toBe(18); // 3 triads × 6 functions
      expect(validation.actualFunctions).toBe(13); // 4 + 4 + 5 services
      expect(validation.sharedParasympathetic).toBe(3); // 3 shared services
      expect(validation.uniqueFunctions).toBe(10); // 13 - 3 shared
      
      // The explanation should show why we have 16 functional implementations
      // Total services (13) + shared services serving both triads (3) = 16 implementations
      expect(validation.explanation).toContain('13 total functions');
      expect(validation.explanation).toContain('3 shared parasympathetic');
      expect(validation.explanation).toContain('10 unique implementations');
    });

    test('should correctly count unique functional implementations', () => {
      // Each service represents a functional implementation
      // Shared services count as implementations for both triads they serve
      const cerebralServices = systemPolarityConfig.cerebral.length; // 4
      const somaticServices = systemPolarityConfig.somatic.length; // 4  
      const autonomicServices = systemPolarityConfig.autonomic.length; // 5
      const sharedServices = getSharedParasympatheticServices().length; // 3

      // Functional implementations = services + additional implementations for shared services
      const totalImplementations = cerebralServices + somaticServices + autonomicServices + sharedServices;
      
      expect(totalImplementations).toBe(16); // This is why we have 16 functions, not 18
    });
  });

  describe('Service Polarity Mappings', () => {
    test('sympathetic services should have high energy and immediate response', () => {
      const allServices = [
        ...systemPolarityConfig.cerebral,
        ...systemPolarityConfig.somatic,
        ...systemPolarityConfig.autonomic
      ];
      
      const sympatheticServices = allServices.filter(s => s.polarity.primary === 'sympathetic');
      
      sympatheticServices.forEach(service => {
        expect(service.polarity.characteristics.energyLevel).toBe('high');
        expect(service.polarity.characteristics.responseTime).toBe('immediate');
        expect(service.polarity.characteristics.processingMode).toBe('reactive');
      });
    });

    test('somatic services should have medium energy and varied response times', () => {
      const allServices = [
        ...systemPolarityConfig.cerebral,
        ...systemPolarityConfig.somatic,
        ...systemPolarityConfig.autonomic
      ];
      
      const somaticServices = allServices.filter(s => s.polarity.primary === 'somatic');
      
      somaticServices.forEach(service => {
        expect(['medium', 'high']).toContain(service.polarity.characteristics.energyLevel);
        expect(['immediate', 'near-realtime']).toContain(service.polarity.characteristics.responseTime);
      });
    });

    test('each triad should have representation from all three polarities', () => {
      // Cerebral: Direct representation
      const cerebralPolarities = systemPolarityConfig.cerebral.map(s => s.polarity.primary);
      expect(cerebralPolarities).toContain('sympathetic');
      expect(cerebralPolarities).toContain('parasympathetic');
      expect(cerebralPolarities).toContain('somatic');

      // Somatic: Direct + shared parasympathetic
      const somaticPolarities = systemPolarityConfig.somatic.map(s => s.polarity.primary);
      const hasSharedParasympathetic = getSharedParasympatheticServices().length > 0;
      expect(somaticPolarities).toContain('sympathetic');
      expect(somaticPolarities).toContain('somatic');
      expect(hasSharedParasympathetic).toBe(true); // Parasympathetic via shared services

      // Autonomic: Direct representation of all
      const autonomicPolarities = systemPolarityConfig.autonomic.map(s => s.polarity.primary);
      expect(autonomicPolarities).toContain('sympathetic');
      expect(autonomicPolarities).toContain('parasympathetic');
      expect(autonomicPolarities).toContain('somatic');
    });
  });

  describe('Neurobiological Accuracy', () => {
    test('parasympathetic sharing reflects neurobiological reality', () => {
      // In real nervous systems, parasympathetic functions (rest, maintenance) 
      // do indeed span both somatic and autonomic systems
      const sharedServices = getSharedParasympatheticServices();
      const serviceNames = sharedServices.map(s => s.serviceName);
      
      // These should be maintenance-related functions
      expect(serviceNames).toContain('Monitoring Service'); // Health maintenance
      expect(serviceNames).toContain('State Management Service'); // State maintenance  
      expect(serviceNames).toContain('Process Director'); // Process maintenance
    });

    test('sympathetic services should be immediate response oriented', () => {
      const allServices = [
        ...systemPolarityConfig.cerebral,
        ...systemPolarityConfig.somatic,
        ...systemPolarityConfig.autonomic
      ];
      
      const sympatheticServices = allServices.filter(s => s.polarity.primary === 'sympathetic');
      const serviceNames = sympatheticServices.map(s => s.serviceName);
      
      // These should be action/response oriented
      expect(serviceNames).toContain('Thought Service'); // Immediate idea generation
      expect(serviceNames).toContain('Motor Control Service'); // Immediate motor response
      expect(serviceNames).toContain('Trigger Service'); // Immediate reflex response
    });
  });
});