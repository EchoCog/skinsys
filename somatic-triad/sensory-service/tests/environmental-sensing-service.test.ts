import { ServiceConfig } from '@cosmos/cognitive-core-shared-libraries';
import { EnvironmentalSensingService } from '../src/environmental-sensing-service';

describe('Environmental Sensing Service', () => {
  let service: EnvironmentalSensingService;
  let config: ServiceConfig;

  beforeEach(() => {
    config = {
      port: 3012,
      serviceName: 'environmental-sensing-service',
      triadType: 'somatic',
      serviceType: 'sensory',
      environment: 'development'
    };
    service = new EnvironmentalSensingService(config);
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      expect(service).toBeDefined();
    });
  });

  describe('Stimulus Processing', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    afterEach(async () => {
      await service.shutdown();
    });

    it('should process temperature stimulus', async () => {
      const temperatureMessage = {
        id: 'temp-001',
        type: 'ENVIRONMENTAL_STIMULUS',
        payload: {
          stimuli: [{
            id: 'temp-stimulus-001',
            type: 'temperature',
            intensity: 0.8, // high intensity heat
            location: { x: 10, y: 10, z: 0 },
            duration: 5000, // 5 seconds
            onset: new Date(),
            properties: {
              temperature: 45 // °C - hot but not burning
            }
          }],
          processing: {
            spatialResolution: 100, // μm
            temporalResolution: 10, // ms
            sensitivityThreshold: 0.1,
            adaptationRate: 0.05
          },
          responseRequired: true
        },
        timestamp: new Date(),
        source: 'test-client'
      };

      const response = await service.process(temperatureMessage);
      
      expect(response).toBeDefined();
      expect(response?.type).toBe('STIMULUS_PROCESSED');
      expect(response?.payload.processedStimuli).toHaveLength(1);
      
      const processedStimulus = response?.payload.processedStimuli[0];
      expect(processedStimulus.sensorResponse.receptorType).toBe('thermoreceptor');
      expect(processedStimulus.sensorResponse.activation).toBeGreaterThan(0);
      expect(processedStimulus.neuralSignal.fiberType).toBe('A-delta');
      expect(processedStimulus.cellularResponse.length).toBeGreaterThan(0);
    });

    it('should process mechanical pressure stimulus', async () => {
      const pressureMessage = {
        id: 'pressure-001',
        type: 'ENVIRONMENTAL_STIMULUS',
        payload: {
          stimuli: [{
            id: 'pressure-stimulus-001',
            type: 'pressure',
            intensity: 0.6,
            location: { x: 20, y: 15, z: 0 },
            duration: 2000,
            onset: new Date(),
            properties: {
              mechanical: {
                force: 8, // N
                strain: 15, // percentage deformation
                frequency: 0 // static pressure
              }
            }
          }],
          processing: {
            spatialResolution: 50,
            temporalResolution: 5,
            sensitivityThreshold: 0.05,
            adaptationRate: 0.1
          },
          responseRequired: true
        },
        timestamp: new Date(),
        source: 'test-client'
      };

      const response = await service.process(pressureMessage);
      
      expect(response).toBeDefined();
      expect(response?.type).toBe('STIMULUS_PROCESSED');
      
      const processedStimulus = response?.payload.processedStimuli[0];
      expect(processedStimulus.sensorResponse.receptorType).toBe('mechanoreceptor');
      expect(processedStimulus.neuralSignal.fiberType).toBe('A-beta');
      expect(processedStimulus.tissueResponse.mechanicalResponse.deformation).toBeGreaterThan(0);
    });

    it('should handle high-intensity pain stimulus', async () => {
      const painMessage = {
        id: 'pain-001',
        type: 'ENVIRONMENTAL_STIMULUS',
        payload: {
          stimuli: [{
            id: 'pain-stimulus-001',
            type: 'pain',
            intensity: 0.9, // very high intensity
            location: { x: 5, y: 5, z: 0 },
            duration: 1000,
            onset: new Date(),
            properties: {
              temperature: 50, // °C - burning temperature
              mechanical: {
                force: 15, // N - high force
                strain: 25
              }
            }
          }],
          processing: {
            spatialResolution: 25,
            temporalResolution: 1,
            sensitivityThreshold: 0.3, // higher threshold for pain
            adaptationRate: 0.02 // slow adaptation for pain
          },
          responseRequired: true
        },
        timestamp: new Date(),
        source: 'test-client'
      };

      const response = await service.process(painMessage);
      
      expect(response).toBeDefined();
      
      const processedStimulus = response?.payload.processedStimuli[0];
      expect(processedStimulus.sensorResponse.receptorType).toBe('nociceptor');
      expect(processedStimulus.sensorResponse.activation).toBeGreaterThan(0.7);
      expect(processedStimulus.neuralSignal.fiberType).toBe('A-delta'); // fast pain
      expect(processedStimulus.tissueResponse.physiologicalResponse.inflammatoryResponse).toBeGreaterThan(0.3);
    });

    it('should demonstrate sensor adaptation', async () => {
      // First stimulus
      const firstStimulus = {
        id: 'adapt-001',
        type: 'ENVIRONMENTAL_STIMULUS',
        payload: {
          stimuli: [{
            id: 'adapt-stimulus-001',
            type: 'touch',
            intensity: 0.5,
            location: { x: 0, y: 0, z: 0 },
            duration: 10000, // 10 seconds
            onset: new Date(),
            properties: {}
          }],
          processing: {
            spatialResolution: 100,
            temporalResolution: 10,
            sensitivityThreshold: 0.05,
            adaptationRate: 0.1
          },
          responseRequired: true
        },
        timestamp: new Date(),
        source: 'test-client'
      };

      const firstResponse = await service.process(firstStimulus);
      const firstActivation = firstResponse?.payload.processedStimuli[0].sensorResponse.activation;

      // Wait for adaptation to occur (simulate time passage)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second identical stimulus at same location
      const secondStimulus = {
        ...firstStimulus,
        id: 'adapt-002',
        payload: {
          ...firstStimulus.payload,
          stimuli: [{
            ...firstStimulus.payload.stimuli[0],
            id: 'adapt-stimulus-002'
          }]
        }
      };

      const secondResponse = await service.process(secondStimulus);
      const secondActivation = secondResponse?.payload.processedStimuli[0].sensorResponse.activation;

      // Second response should show adaptation (lower activation for same stimulus)
      expect(secondActivation).toBeLessThan(firstActivation);
      expect(secondResponse?.payload.processedStimuli[0].sensorResponse.adaptation).toBeGreaterThan(0);
    });
  });

  describe('Service Status', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    afterEach(async () => {
      await service.shutdown();
    });

    it('should return sensor status', async () => {
      const statusMessage = {
        id: 'status-001',
        type: 'GET_SENSOR_STATUS',
        payload: {},
        timestamp: new Date(),
        source: 'test-client'
      };

      const response = await service.process(statusMessage);
      
      expect(response).toBeDefined();
      expect(response?.type).toBe('SENSOR_STATUS');
      expect(response?.payload.status).toBeDefined();
      expect(response?.payload.status.calibration).toBeDefined();
      expect(response?.payload.status.calibration.touch).toBe(0.05);
      expect(response?.payload.status.calibration.temperature).toBe(0.15);
    });
  });

  describe('Cellular Response Simulation', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    afterEach(async () => {
      await service.shutdown();
    });

    it('should simulate keratinocyte response to thermal stress', async () => {
      const thermalStress = {
        id: 'thermal-001',
        type: 'ENVIRONMENTAL_STIMULUS',
        payload: {
          stimuli: [{
            id: 'thermal-stimulus-001',
            type: 'temperature',
            intensity: 0.8,
            location: { x: 0, y: 0, z: 0 },
            duration: 3000,
            onset: new Date(),
            properties: {
              temperature: 47 // °C - heat shock temperature
            }
          }],
          processing: {
            spatialResolution: 10,
            temporalResolution: 1,
            sensitivityThreshold: 0.1,
            adaptationRate: 0.05
          },
          responseRequired: true
        },
        timestamp: new Date(),
        source: 'test-client'
      };

      const response = await service.process(thermalStress);
      const cellularResponse = response?.payload.processedStimuli[0].cellularResponse;
      
      expect(cellularResponse).toBeDefined();
      expect(cellularResponse.length).toBeGreaterThan(0);
      
      const keratinocyteResponse = cellularResponse.find(
        (cell: any) => cell.cellType === 'keratinocyte_basal'
      );
      
      expect(keratinocyteResponse).toBeDefined();
      expect(keratinocyteResponse.response.proteinExpression.heat_shock_protein).toBe(2.0);
      expect(keratinocyteResponse.response.metabolicChange).toBeGreaterThan(1.0);
    });
  });

  describe('Realistic Parameter Validation', () => {
    it('should use biologically realistic thresholds', async () => {
      await service.initialize();
      
      const statusMessage = {
        id: 'validation-001',
        type: 'GET_SENSOR_STATUS',
        payload: {},
        timestamp: new Date(),
        source: 'test-client'
      };

      const response = await service.process(statusMessage);
      const calibration = response?.payload.status.calibration;
      
      // Verify realistic sensory thresholds
      expect(calibration.touch).toBe(0.05); // 5% threshold for touch
      expect(calibration.pressure).toBe(0.1); // 10% threshold for pressure  
      expect(calibration.temperature).toBe(0.15); // 15% threshold for temperature
      expect(calibration.pain).toBe(0.3); // 30% threshold for pain
      expect(calibration.itch).toBe(0.08); // 8% threshold for itch

      await service.shutdown();
    });
  });
});